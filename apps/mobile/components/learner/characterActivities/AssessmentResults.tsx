import {RewardCelebration,EarnedStars} from '../rewards/RewardCelebration';
import {performanceRating} from '../../../modules/rewards/policy';
import {readWallet,type Wallet} from '../../../modules/rewards/wallet';
import {approvedCurriculum} from '../../../content/approvedCurriculum';
import React, { useState,useEffect } from 'react';
import { Text, View,useWindowDimensions } from 'react-native';
import { type CharacterActivity, type CharacterSet } from '../../../content/characterActivities';
import { getAssessmentSet, findCheckpoint } from '../../../content/characterActivities/checkpoints';
import { matchingPair } from '../../../content/characterActivities/matching';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { attemptedCount, score, type SetAttempt } from '../../../modules/characterActivities/assessment';
import { completionTotals } from '../../../modules/characterActivities/completion';
import { CompletionDialog, type CompletionMetric } from '../../ui/CompletionDialog';
import { Glyph, s } from './QuestionParts';
import { presentation } from './ActivityPresentation';
import { useCharacterCopy } from './copy';

export function AttemptReview({attempts,history,wallet}: {wallet?:Wallet|null;attempts: readonly SetAttempt[];history: readonly SetAttempt[]}) {
  const copy=useCharacterCopy();
  const { language } = useLocalization();
  return <View testID="completion-review" style={{gap:8}}>{attempts.map(attempt=><View key={attempt.id} testID={`review-attempt-${attempt.id}`} style={{gap:8}}>
    <Text style={s.heading}>{findCheckpoint(attempt.setId)?.title[language === 'tl' ? 'tl' : 'en'] ?? `${copy.set} ${getAssessmentSet(attempt.setId).set.number}`} · {score(attempt)} / {attemptedCount(attempt)} {copy.scored}</Text>
    <Text>{new Date(attempt.updatedAt).toLocaleString()} · {approvedCurriculum.flatMap(m=>m.topics).find(t=>t.id===findCheckpoint(attempt.setId)?.topicId)?.title}</Text>
    {attempt.responses.map((r, index)=>{
      const q=getAssessmentSet(attempt.setId).set.questions.find(q=>q.id===r.questionId)!;
      const label=(r.answer.kind==='matching-v2'||r.answer.kind==='mascot-match-v3') ? `${matchingPair(r.questionId).reading} → ${matchingPair(r.answer.targetQuestionId).glyph}` : r.answer.kind==='choice'&&q.type==='multiple-choice' ? q.options.find(o=>r.answer.kind==='choice'&&o.id===r.answer.optionId)?.label : r.answer.kind==='writing' ? r.answer.prediction.label.replace(/_/g,'/').toUpperCase() : '';
      const hint=wallet?.rows.find(row=>row.kind==='hint' && row.source_id===attempt.id+':'+r.questionId);
      const expected=q.type==='handwriting'?q.expectedGlyph:q.options.find(o=>o.letter===q.correctLetter)?.label;
      const pair=q.type==='multiple-choice'?matchingPair(q.id):null;
      return <View key={r.questionId} style={[presentation.reviewRow,{flexDirection:'row',alignItems:'center',gap:8}]}>{pair&&<Glyph glyph={pair.glyph} label={pair.reading} size={34}/>}<Text style={[s.body,{flex:1}]}>{copy.question} {findCheckpoint(attempt.setId) ? index + 1 : q.number}: {q.prompt} · {label} · {language==='tl'?'Tamang sagot':'Expected'} {expected} · {hint?.assistance==='answer-revealed'?(language==='tl'?'Ipinakita ang sagot':'Answer revealed'):hint?(language==='tl'?'May pahiwatig':'Hint used'):(language==='tl'?'Walang pahiwatig':'Unaided')} · {r.correct===null?copy.deferred:r.correct?copy.correctCount:copy.incorrectCount}</Text></View>;
    })}
    <Text style={s.eyebrow}>{copy.history}: {history.filter(a=>a.setId===attempt.setId&&a.cursor===getAssessmentSet(a.setId).set.questions.length).map(a=>`${score(a)}/${attemptedCount(a)} ${copy.scored}`).join(' · ')}</Text>
  </View>)}</View>;
}
function AssessmentCompletion({activity,selected,onBack,set,busy,error,onNext,onRetry}: {
  activity: CharacterActivity; selected: readonly SetAttempt[]; onBack:()=>void; set?: CharacterSet;
  busy:boolean; error?:string;onNext:()=>void;onRetry:()=>void;
}) {
  const copy=useCharacterCopy();
  const { language } = useLocalization();
  const checkpoint=findCheckpoint(activity.id);
  const name=checkpoint ? checkpoint.title[language === 'tl' ? 'tl' : 'en'] : copy.names[activity.number-1];
  const totals=completionTotals(selected);
  const tl=language==='tl', {height,width}=useWindowDimensions();
  const account=selected[0]?.profileId, attemptKey=selected.map(a=>a.id).join(',');
  const [wallet,setWallet]=useState<Wallet|null>(null),[walletError,setWalletError]=useState(false);
  useEffect(()=>{let live=true;if(account)void readWallet(account).then(w=>{if(live)setWallet(w)}).catch(()=>{if(live)setWalletError(true)});return()=>{live=false}},[account,attemptKey]);
  const rows=wallet?.rows.filter(r=>selected.some(a=>a.id===r.attempt_id))??[];
  const earned=rows.reduce((n,r)=>n+Math.max(0,r.amount),0);
  const rating=performanceRating(totals.correct,totals.scored);
  const label=language === 'tl' ? 'Iskor' : 'Score';
  const overall = set?.questions.length ?? selected.reduce((sum, attempt) => sum + getAssessmentSet(attempt.setId).set.questions.length, 0);
  const metrics: CompletionMetric[]=[
    {label,value:`${totals.correct} / ${overall - totals.pending}`,icon:'check',tone:'green'},
    ...(totals.pending?[{label:copy.pendingValidation,value:String(totals.pending),icon:'help' as const,tone:'blue' as const}]:[]),
    {label:set?(totals.pending?copy.questionsVisited:activity.number===4?copy.writingCompleted:copy.questionsCompleted):(totals.pending?copy.setsReviewed:copy.setsCompleted),value:set?`${totals.visited} / ${set.questions.length}`:`${totals.sets} / 5`,icon:'checkboxChecked',tone:'blue'},
    {label:tl?'Gantimpala':'Reward',value:<EarnedStars earned={wallet?earned:null} tl={tl}/>,icon:'star',tone:'orange'},
  ];
  return <View testID={set?'set-result':'activity-result'}>
    <CompletionDialog badge={checkpoint ? (language === 'tl' ? 'NATAPOS ANG PAGSASANAY' : 'PRACTICE COMPLETE') : totals.pending?copy.reviewedBadge:set?copy.setBadge:copy.activityBadge}
      title={totals.practice===0&&totals.pending===0?copy.greatJob:copy.keepPracticing}
      description={checkpoint ? name : set?copy.setDescription(set.number,name):copy.activityDescription(name)}
      celebration={<RewardCelebration rating={rating} compact={height<600||width<600} tl={tl}/>} metrics={metrics} busy={busy} error={error || (walletError?(tl?'Hindi mabasa ang pitaka.':'Wallet unavailable.'):undefined)}
      back={{label:copy.completionReturn,onPress:onBack}} next={{label:copy.completionNext,onPress:onNext}} retry={{label:copy.completionRetry,onPress:onRetry}} />
  </View>;
}
export function SetResultStage({attempt,set,onBack,busy,error,onRepeat,onNext}: {
  attempt:SetAttempt;set:CharacterSet;onBack:()=>void;busy:boolean;error?:string;onRepeat:()=>void;onNext:()=>void;
}) {
  return <AssessmentCompletion activity={getAssessmentSet(set.id).activity} selected={[attempt]} onBack={onBack} set={set} busy={busy} error={error} onNext={onNext} onRetry={onRepeat}/>;
}
export function ActivityFinishStage({activity,latest,busy,error,onRetry,onHub}: {
  activity:CharacterActivity;latest:SetAttempt[];attempts:SetAttempt[];busy:boolean;error?:string;onRetry:()=>void;onHub:()=>void;
}) {
  return <AssessmentCompletion activity={activity} selected={latest} onBack={onHub} busy={busy} error={error} onNext={onHub} onRetry={onRetry}/>;
}
