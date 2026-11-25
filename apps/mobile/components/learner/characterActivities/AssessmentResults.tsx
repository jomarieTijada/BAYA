import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { type CharacterActivity, type CharacterSet } from '../../../content/characterActivities';
import { getAssessmentSet, findCheckpoint } from '../../../content/characterActivities/checkpoints';
import { matchingPair } from '../../../content/characterActivities/matching';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { attemptedCount, score, type SetAttempt } from '../../../modules/characterActivities/assessment';
import { completionTotals } from '../../../modules/characterActivities/completion';
import { CompletionDialog, type CompletionMetric } from '../../ui/CompletionDialog';
import { s } from './QuestionParts';
import { presentation } from './ActivityPresentation';
import { useCharacterCopy } from './copy';

export function AttemptReview({attempts,history}: {attempts: readonly SetAttempt[];history: readonly SetAttempt[]}) {
  const copy=useCharacterCopy();
  const { language } = useLocalization();
  return <View testID="completion-review" style={{gap:8}}>{attempts.map(attempt=><View key={attempt.id} testID={`review-attempt-${attempt.id}`} style={{gap:8}}>
    <Text style={s.heading}>{findCheckpoint(attempt.setId)?.title[language === 'tl' ? 'tl' : 'en'] ?? `${copy.set} ${getAssessmentSet(attempt.setId).set.number}`} · {score(attempt)} / {attemptedCount(attempt)} {copy.scored}</Text>
    {attempt.responses.map((r, index)=>{
      const q=getAssessmentSet(attempt.setId).set.questions.find(q=>q.id===r.questionId)!;
      const label=(r.answer.kind==='matching-v2'||r.answer.kind==='mascot-match-v3') ? `${matchingPair(r.questionId).reading} → ${matchingPair(r.answer.targetQuestionId).reading}` : r.answer.kind==='choice'&&q.type==='multiple-choice' ? q.options.find(o=>r.answer.kind==='choice'&&o.id===r.answer.optionId)?.letter : r.answer.kind==='writing' ? r.answer.prediction.label.replace(/_/g,'/').toUpperCase() : '';
      return <Text key={r.questionId} style={[s.body,presentation.reviewRow]}>{copy.question} {findCheckpoint(attempt.setId) ? index + 1 : q.number}: {label} · {r.correct===null?copy.deferred:r.correct?copy.correctCount:copy.incorrectCount}</Text>;
    })}
    <Text style={s.eyebrow}>{copy.history}: {history.filter(a=>a.setId===attempt.setId&&a.cursor===getAssessmentSet(a.setId).set.questions.length).map(a=>`${score(a)}/${attemptedCount(a)} ${copy.scored}`).join(' · ')}</Text>
  </View>)}</View>;
}
function AssessmentCompletion({activity,selected,history,set,busy,error,onNext,onRetry}: {
  activity: CharacterActivity; selected: readonly SetAttempt[]; history: readonly SetAttempt[]; set?: CharacterSet;
  busy:boolean; error?:string;onNext:()=>void;onRetry:()=>void;
}) {
  const copy=useCharacterCopy(),[review,setReview]=useState(false);
  const { language } = useLocalization();
  const checkpoint=findCheckpoint(activity.id);
  const name=checkpoint ? checkpoint.title[language === 'tl' ? 'tl' : 'en'] : copy.names[activity.number-1];
  const totals=completionTotals(selected);
  const label=language === 'tl' ? 'Iskor' : 'Score';
  const overall = set?.questions.length ?? selected.reduce((sum, attempt) => sum + getAssessmentSet(attempt.setId).set.questions.length, 0);
  const metrics: CompletionMetric[]=[
    {label,value:`${totals.correct} / ${overall - totals.pending}`,icon:'check',tone:'green'},
    {label:totals.pending?copy.pendingValidation:copy.needsPractice,value:String(totals.pending||totals.practice),icon:totals.pending?'help':'pencil',tone:'blue'},
    {label:set?(totals.pending?copy.questionsVisited:activity.number===4?copy.writingCompleted:copy.questionsCompleted):(totals.pending?copy.setsReviewed:copy.setsCompleted),value:set?`${totals.visited} / ${set.questions.length}`:`${totals.sets} / 5`,icon:'checkboxChecked',tone:'orange'},
  ];
  return <View testID={set?'set-result':'activity-result'}>
    <CompletionDialog badge={checkpoint ? (language === 'tl' ? 'NATAPOS ANG PAGSASANAY' : 'PRACTICE COMPLETE') : totals.pending?copy.reviewedBadge:set?copy.setBadge:copy.activityBadge}
      title={totals.practice===0&&totals.pending===0?copy.greatJob:copy.keepPracticing}
      description={checkpoint ? name : set?copy.setDescription(set.number,name):copy.activityDescription(name)}
      metrics={metrics} busy={busy} error={error} note={`${copy.saved}${totals.pending?` · ${copy.needsPractice}: ${totals.practice}`:''}. ${copy.noMastery}`}
      summary={{label:review?copy.completionReturn:copy.completionSummary,onPress:()=>setReview(!review)}} next={{label:copy.completionNext,onPress:onNext}} retry={{label:copy.completionRetry,onPress:onRetry}}
      reviewTitle={copy.reviewAnswers} review={review?<AttemptReview attempts={checkpoint ? history.filter(a => a.setId === checkpoint.id) : selected} history={history}/>:undefined} />
  </View>;
}
export function SetResultStage({attempt,set,attempts,busy,error,onRepeat,onNext}: {
  attempt:SetAttempt;set:CharacterSet;attempts:SetAttempt[];busy:boolean;error?:string;onRepeat:()=>void;onNext:()=>void;
}) {
  return <AssessmentCompletion activity={getAssessmentSet(set.id).activity} selected={[attempt]} history={attempts} set={set} busy={busy} error={error} onNext={onNext} onRetry={onRepeat}/>;
}
export function ActivityFinishStage({activity,latest,attempts,busy,error,onRetry,onHub}: {
  activity:CharacterActivity;latest:SetAttempt[];attempts:SetAttempt[];busy:boolean;error?:string;onRetry:()=>void;onHub:()=>void;
}) {
  return <AssessmentCompletion activity={activity} selected={latest} history={attempts} busy={busy} error={error} onNext={onHub} onRetry={onRetry}/>;
}
