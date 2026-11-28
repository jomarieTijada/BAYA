import type {DatabaseConnection} from '../../database/types';
import {getReadyDatabase} from '../../database/lifecycle';
import {rewardPolicy} from './policy';
import {findCheckpoint} from '../../content/characterActivities/checkpoints';
import {complete, type SetAttempt} from '../characterActivities/assessment';

export type Earning = keyof typeof rewardPolicy.earnings;
export type LedgerRow = {assistance?:string;id:number;kind:Earning|'achievement'|'hint';source_id:string;amount:number;created_at:string;attempt_id:string|null;checkpoint_id:string|null};
export async function requireOwner(db:DatabaseConnection, id:string) {
  const owner=await db.getFirstAsync<{state_value:string}>("SELECT state_value FROM local_app_state WHERE state_key='active_learner_profile_id'");
  if(!id || owner?.state_value!==id) throw Error('Active learner changed');
}
export function grant(db:DatabaseConnection, learner:string, kind:Earning, source:string, attempt?:SetAttempt) {
  return db.runAsync(`INSERT INTO learner_star_transactions(learner_id,kind,source_id,amount,attempt_id,checkpoint_id,policy_version)
    VALUES(?,?,?,?,?,?,?) ON CONFLICT(learner_id,kind,source_id) DO NOTHING`,
    [learner,kind,source,rewardPolicy.earnings[kind],attempt?.id??null,attempt?.setId??null,rewardPolicy.version]);
}
export async function rewardResponses(db:DatabaseConnection,a:SetAttempt,from:number) {
  if(!findCheckpoint(a.setId))return;
  for(const r of a.responses.slice(from)) {
    if(!r.correct || r.answer.kind==='choice' || r.answer.kind==='unavailable')continue;
    const hint=await db.getFirstAsync<{level:string}>('SELECT level FROM learner_hint_usage WHERE learner_id=? AND attempt_id=? AND question_id=?',[a.profileId,a.id,r.questionId]);
    if(hint?.level!=='answer-revealed')await grant(db,a.profileId,r.answer.kind==='writing'?'writing':'matching',r.questionId,a);
  }
}
export async function rewardCheckpoint(db:DatabaseConnection,a:SetAttempt){
  if(findCheckpoint(a.setId)&&a.cursor===a.responses.length&&complete(a))await grant(db,a.profileId,'checkpoint',a.setId,a);
}
export async function readWallet(learner:string, override?:DatabaseConnection){
  const db=override??await getReadyDatabase();await requireOwner(db,learner);
  const rows=await db.getAllAsync<LedgerRow>('SELECT t.*, h.level AS assistance FROM learner_star_transactions t LEFT JOIN learner_hint_usage h ON h.transaction_id=t.id WHERE t.learner_id=? ORDER BY t.id DESC',[learner]);
  const earned=rows.reduce((sum,r)=>sum+Math.max(0,r.amount),0);
  const spent=rows.reduce((sum,r)=>sum-Math.min(0,r.amount),0);
  return {balance:earned-spent,earned,spent,rows};
}
export type Wallet = Awaited<ReturnType<typeof readWallet>>;
