import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Module } from '../../../content/modules/catalog';
import { topicCheckpoints, findCheckpoint } from '../../../content/characterActivities/checkpoints';
import { checkpointEligibility } from '../../../modules/characterActivities/curriculum';
import type { SetAttempt } from '../../../modules/characterActivities/assessment';
import { completionTotals } from '../../../modules/characterActivities/completion';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { AppIcon } from '../../ui/AppIcon';
import { CompletionDialog } from '../../ui/CompletionDialog';
import { AttemptReview } from './AssessmentResults';
import { useCharacterCopy } from './copy';

const checkpointLabels: Record<string, { en: string; tl: string }> = {
  'topic-2-1': { en: 'Quiz: Vowels', tl: 'Pagsusulit: Mga Patinig' },
  'topic-2-2': { en: 'Quiz: Basic Consonants', tl: 'Pagsusulit: Batayang Katinig' },
  'topic-kudlit-upper': { en: 'Quiz: Upper Kudlit', tl: 'Pagsusulit: Kudlit sa Itaas' },
  'topic-kudlit-lower': { en: 'Quiz: Lower Kudlit', tl: 'Pagsusulit: Kudlit sa Ibaba' },
  'topic-3-2': { en: 'Activity: Consonant Writing', tl: 'Gawain: Pagsulat ng Katinig' },
};

export function ModuleAssessments({ topicId, modules, attempts }: { topicId: string; modules: readonly Module[]; attempts: readonly SetAttempt[] }) {
  const { width, height } = useWindowDimensions();
  const compact = width > height && height < 600;
  const router = useRouter(), copy = useCharacterCopy(), { language, text } = useLocalization();
  const { assessmentId } = useLocalSearchParams<{ assessmentId?: string }>();
  const row = useRef<View>(null), [history, setHistory] = useState(false);
  const c = topicCheckpoints.find(c => c.topicId === topicId);
  useEffect(() => {
    if (!c || assessmentId !== c.id) return;
    const frame = requestAnimationFrame(() => {
      row.current?.focus();
      (row.current as unknown as { scrollIntoView?: (options: object) => void })?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [assessmentId, attempts, c]);
  if (!c) return null;
  const tl = language === 'tl', title = c.title[tl ? 'tl' : 'en'];
  const label = checkpointLabels[c.topicId][tl ? 'tl' : 'en'];
  const access = checkpointEligibility(c.id, modules);
  const own = attempts.filter(a => a.setId === c.id).sort((a,b) => b.startedAt.localeCompare(a.startedAt));
  const current = own.find(a => a.cursor < c.questions.length) ?? own[0];
  const complete = own.some(a => a.cursor === c.questions.length);
  const state = !access.eligible ? (tl ? 'Naka-lock' : 'Locked') : current?.cursor !== undefined && current.cursor < c.questions.length ? copy.resume : complete ? copy.review : copy.start;
  const missing = access.missingTopicIds.map(id => text(modules.flatMap(m => m.topics).find(t => t.id === id)?.title ?? id));
  const legacy = attempts.filter(a => !findCheckpoint(a.setId) && c.questions.some(q => q.setId === a.setId));
  const totals = completionTotals(legacy);
  const start = () => router.push({ pathname: '/learner/character-activities', params: { checkpointId: c.id } });
  return <View style={[styles.section, compact && { marginTop: 4 }]}>
    <Pressable ref={row} testID={`checkpoint-${c.topicId}`} accessibilityRole="button" accessibilityState={{ disabled: !access.eligible }} disabled={!access.eligible}
      accessibilityLabel={`${label}. ${state}${missing.length ? '. '+missing.join(', ') : ''}`} onPress={start}
      style={({ pressed }) => [styles.row, compact && { minHeight: 30, paddingVertical: 4 }, !access.eligible && styles.locked, pressed && { opacity: .75 }]}>
      <AppIcon name={!access.eligible ? 'lock' : complete ? 'check' : 'pencil'} size={16} />
      <Text style={[styles.heading, { flex: 1 }]}>{label}</Text>
    </Pressable>
    {!!legacy.length && <Pressable accessibilityRole="button" onPress={() => setHistory(true)} style={{ minHeight: 28, justifyContent: 'center' }}><Text style={styles.detail}>{tl ? 'Mga dating resulta' : 'Previous source-set results'}</Text></Pressable>}
    {history && <CompletionDialog badge={tl ? 'MGA DATING RESULTA' : 'SOURCE-SET HISTORY'} title={title}
      description={tl ? 'Orihinal na mga pangkat; hiwalay sa pagsasanay na ito.' : 'Original source sets; separate from this topic checkpoint.'}
      metrics={[{ label: copy.correctAnswers, value: `${totals.correct}/${totals.scored}`, icon: 'check', tone: 'green' }, { label: copy.pendingValidation, value: String(totals.pending), icon: 'help', tone: 'blue' }, { label: copy.questionsVisited, value: String(totals.visited), icon: 'checkboxChecked', tone: 'orange' }]}
      reviewTitle={copy.history} review={<AttemptReview attempts={legacy} history={legacy} />}
      back={{ label: copy.back, onPress: () => setHistory(false) }} next={{ label: copy.completionNext, onPress: () => setHistory(false) }}
      retry={{ label: access.eligible ? copy.start : copy.back, onPress: () => { setHistory(false); if (access.eligible) start(); } }} />}
  </View>;
}
const styles = StyleSheet.create({
  section: { width: '100%', marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF8EA', borderRadius: 12, padding: 7, minHeight: 44, borderWidth: 1, borderColor: '#E7DCC8' },
  locked: { backgroundColor: '#F4F0F5' }, heading: { fontSize: 12, fontWeight: '700', color: '#433A2D' }, detail: { fontSize: 11, color: '#655B50' },
});
