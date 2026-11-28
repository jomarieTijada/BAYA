import {getReadyDatabase} from '../../database/lifecycle';
import type {DatabaseConnection} from '../../database/types';
import {matchingPair} from '../../content/characterActivities/matching';
import {baybayinCharacters} from '../../content/baybayinCharactersData';
import {findCheckpoint} from '../../content/characterActivities/checkpoints';
import type {CharacterQuestion} from '../../content/characterActivities';
import {parseAttempt,type SetAttempt} from '../characterActivities/assessment';
import {rewardPolicy} from './policy';
import {requireOwner} from './wallet';

export type Hint = {level:'clue'|'answer-revealed';en:string;tl:string};
export function resolveHint(q:CharacterQuestion):Hint|null {
  if (!rewardPolicy.hintsEnabled) return null;
  if(q.type==='multiple-choice'){
    const pair=matchingPair(q.id);
    if(pair.pending)return null;
    const link=pair.reading+' → '+pair.glyph;
    return {level:'answer-revealed',en:'Look for this pair: '+link,tl:'Hanapin ang pares na ito: '+link};
  }
  const glyph=q.expectedGlyph;
  if(glyph.endsWith('ᜒ')||glyph.endsWith('ᜓ')){
    const upper=glyph.endsWith('ᜒ');
    return {level:'clue',en:upper?'Start with the base character. The kudlit above changes its vowel to E/I.':'Start with the base character. The kudlit below changes its vowel to O/U.',
      tl:upper?'Isulat ang batayang titik. Ang kudlit sa itaas ay para sa E/I.':'Isulat ang batayang titik. Ang kudlit sa ibaba ay para sa O/U.'};
  }
  const example=baybayinCharacters.find(c=>c.unicodeSymbol===glyph)?.example;
  if(!example||example.word.toLowerCase()===q.prompt.toLowerCase())return null;
  return {level:'clue',en:'Think of '+example.highlightedSyllable+' in '+example.word+' ('+example.baybayinWord+'). Write that syllable for this word.',
    tl:'Isipin ang '+example.highlightedSyllable+' sa '+example.word+' ('+example.baybayinWord+'). Isulat ang pantig na iyon.'};
}
export async function savedHint(db:DatabaseConnection,a:SetAttempt,q:string){
  const row=await db.getFirstAsync<{payload:string}>('SELECT payload FROM learner_hint_usage WHERE learner_id=? AND attempt_id=? AND question_id=?',[a.profileId,a.id,q]);
  return row?JSON.parse(row.payload) as Hint:null;
}
export async function redeemHint(attempt:SetAttempt,questionId:string,override?:DatabaseConnection){
  const db=override??await getReadyDatabase();
  if(!db.withTransactionAsync)throw Error('Transactions required');
  return db.withTransactionAsync(async tx=>{
    await requireOwner(tx,attempt.profileId);
    const row=await tx.getFirstAsync<{state_value:string}>('SELECT state_value FROM local_app_state WHERE state_key=?',['character_assessment:v1:'+attempt.profileId+':'+attempt.id]);
    if(!row||!rewardPolicy.hintsEnabled)throw Error('Hint unavailable');
    const a=parseAttempt(row.state_value,attempt.profileId);
    const checkpoint=findCheckpoint(a.setId),q=checkpoint?.questions[a.cursor];
    if(!q||q.id!==questionId||a.responses.some(r=>r.questionId===questionId))throw Error('Question already submitted or changed');
    const existing=await savedHint(tx,a,questionId);
    if(existing)return existing;
    const hint=resolveHint(q);
    if(!hint)throw Error('Hint unavailable');
    const debit=await tx.runAsync("INSERT INTO learner_star_transactions(learner_id,kind,source_id,amount,attempt_id,checkpoint_id,policy_version) VALUES(?,'hint',?,?,?,?,?)",
      [a.profileId,a.id+':'+q.id,-rewardPolicy.hintCost,a.id,a.setId,rewardPolicy.version]);
    await tx.runAsync('INSERT INTO learner_hint_usage(transaction_id,learner_id,attempt_id,question_id,level,payload) VALUES(?,?,?,?,?,?)',
      [debit.lastInsertRowId,a.profileId,a.id,q.id,hint.level,JSON.stringify(hint)]);
    return hint;
  });
}
