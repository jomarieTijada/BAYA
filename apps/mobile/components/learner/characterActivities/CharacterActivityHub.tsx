import { matchingBoards } from '../../../content/characterActivities/matching';
import { MatchingChallenge } from './MatchingChallenge';
import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { curriculumService } from '../../../database/services/curriculumService';
import { nextInstructionAfter } from '../../../modules/characterActivities/curriculum';
import { characterActivities } from '../../../content/characterActivities';
import { getAssessmentSet, type TopicCheckpoint } from '../../../content/characterActivities/checkpoints';
import { characterActivityService as service } from '../../../database/services/characterActivityService';
import type { SetAttempt } from '../../../modules/characterActivities/assessment';
import { LearnerAppShell } from '../LearnerAppShell';
import { AppButton } from '../../ui/AppButton';
import { QuestionScreen } from './QuestionScreen';
import { SetResultStage } from './AssessmentResults';
import { AssessmentHeader } from './AssessmentSlide';
import { useCharacterCopy } from './copy';
import { useLocalization } from '../../../localization/LocalizationProvider';

/** Reuses the existing question controller and completion stage for one topic sequence. */
export function CharacterActivityHub({ checkpoint }: { checkpoint: TopicCheckpoint }) {
  const router = useRouter(), copy = useCharacterCopy(), { language } = useLocalization();
  const [attempt, setAttempt] = useState<SetAttempt | null>(null);
  const [attempts, setAttempts] = useState<SetAttempt[]>([]);
  const [busy, setBusy] = useState(true), [error, setError] = useState(false);
  const title = checkpoint.title[language === 'tl' ? 'tl' : 'en'];
  const back = () => router.replace({ pathname: '/learner/lessons', params: { moduleId: checkpoint.moduleId, assessmentId: checkpoint.id } });
  const continueLesson = async () => {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      const next = nextInstructionAfter(checkpoint.topicId, await curriculumService.getCurriculumModules());
      if (next) router.replace({ pathname: '/learner/activities/[topicId]', params: { topicId: next.id } });
      else back();
    } catch { setError(true); }
    finally { setBusy(false); }
  };
  const open = useCallback(async (repeat = false) => {
    setBusy(true); setError(false);
    try {
      let saved = await service.begin(checkpoint.id, repeat);
      if (saved.responses[saved.cursor]?.answer.kind === 'choice') saved = await service.advance(saved);
      setAttempt(saved); setAttempts(await service.list());
    } catch { setError(true); }
    finally { setBusy(false); }
  }, [checkpoint.id]);
  useFocusEffect(useCallback(() => { void open(); }, [open]));
  const total = checkpoint.questions.length;
  const cursor = Math.min(attempt?.cursor ?? 0, total - 1);
  const question = checkpoint.questions[cursor];
  const bank = characterActivities.find(a => a.sets.some(s => s.questions.some(q => q.id === question.id)))!;
  // Old submitted answers remain legacy. Resume remaining source questions as matching.
  const firstMatch = attempt?.responses.findIndex(r => r.answer.kind === 'matching-v2' || r.answer.kind === 'mascot-match-v3') ?? -1;
  const offset = firstMatch >= 0 ? firstMatch : attempt?.cursor ?? 0;
  const boards = matchingBoards(checkpoint.id, offset);
  const board = boards.find(b => b.start <= cursor && cursor < b.start + b.pairs.length) ?? boards.at(-1);
  const matching = question.type === 'multiple-choice' && !!board;
  const change = (saved: SetAttempt) => { setAttempt(saved); setAttempts(previous => [...previous.filter(a => a.id !== saved.id), saved]); };
  return <LearnerAppShell activeRoute="/learner/lessons" backgroundColor="#FFFDF7" showBottomNavigation={false}
    header={<AssessmentHeader title={title} context={copy.names[bank.number - 1]} position={cursor + 1} total={total} progressLabel={copy.setProgress} onBack={back} />} testID="character-activity-root">
    {attempt && matching && attempt.cursor < total ? <MatchingChallenge key={`${attempt.id}:${cursor}`} board={board} attempt={attempt} onChange={change} /> : attempt && question.type === 'handwriting' ? <QuestionScreen key={`${attempt.id}:${cursor}`} activity={bank} question={question} attempt={{ ...attempt, cursor }}
      total={total} context={title} onChange={change} /> :
      <View style={{ padding: 24 }}><Text>{error ? copy.error : copy.loading}</Text>{error && <AppButton label={copy.retry} accessibilityLabel={copy.retry} onPress={() => void open()} />}</View>}
    {attempt?.cursor === total && <SetResultStage attempt={attempt} set={getAssessmentSet(checkpoint.id).set} attempts={attempts}
      busy={busy} error={error ? copy.error : undefined} onRepeat={() => void open(true)} onNext={() => void continueLesson()} />}
  </LearnerAppShell>;
}
