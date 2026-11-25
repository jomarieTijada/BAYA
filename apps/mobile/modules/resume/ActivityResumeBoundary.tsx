import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { curriculumService } from '../../database/services/curriculumService';
import { localLearnerService } from '../../database/services/localLearnerService';
import { activityResumeService } from '../../database/services/activityResumeService';
import { APPROVED_CONTENT_VERSION_ID } from '../../content/approvedCurriculum';
import { initialDraft, type ActivityDraft, type Checkpoint } from './checkpoint';
import { getWritingTopic } from '../../content/writingLessonData';
import { AppButton } from '../../components/ui/AppButton';
import { Text } from '../../localization/components';

type ResumeContext = { initial: Checkpoint; counts: Record<string, number>; update: (draft: ActivityDraft, immediate?: boolean) => void; flush: () => Promise<void>; isActive: () => boolean };
const Context = createContext<ResumeContext | null>(null);
export const useActivityResume = () => useContext(Context);

/** Scope one mounted activity instance to the selected local learner. */
export function ActivityResumeBoundary({ topicId, children, initialPage, initialWritingIndex }: React.PropsWithChildren<{ topicId: string; initialPage?: string; initialWritingIndex?: string }>) {
  const router = useRouter();
  const [state, setState] = useState<{ initial: Checkpoint; counts: Record<string, number> } | null>(null);
  const [failed, setFailed] = useState(false);
  const latest = useRef<Checkpoint | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focused = useRef(false);
  const focusEpoch = useRef(0);
  const epoch = focusEpoch.current;
  const lastSaved = useRef('');
  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const value = latest.current;
    if (!value) return;
    const serialized = JSON.stringify(value);
    if (lastSaved.current === serialized) return;
    try { await activityResumeService.save(value); lastSaved.current = serialized; setFailed(false); }
    catch { setFailed(true); }
  }, []);
  const update = useCallback((draft: ActivityDraft, immediate = false) => {
    if (!focused.current || !latest.current) return;
    latest.current = { ...latest.current, draft, savedAt: new Date().toISOString() };
    if (timer.current) clearTimeout(timer.current);
    if (immediate) void flush();
    else timer.current = setTimeout(() => { void flush(); }, 250);
  }, [flush]);
  useFocusEffect(useCallback(() => {
    let current = true;
    focused.current = true;
    focusEpoch.current += 1;
    void (async () => {
      let profile = await localLearnerService.getActiveLearner();
      if (!profile) profile = await localLearnerService.saveProfile('Learner');
      if (!current) return;
      if (topicId.startsWith('topic-kudlit-')) {
        const topic = await curriculumService.getTopicById(topicId);
        if (!topic || topic.status === 'locked') { if (current) router.replace('/learner/lessons'); return; }
      }
      await activityResumeService.rememberOpened(profile.profile_id, topicId);
      if (!current) return;
      if (latest.current?.profileId === profile.profile_id && latest.current.topicId === topicId) { setState(previous => previous ? { ...previous } : previous); return; }
      const saved = await activityResumeService.read(profile.profile_id, topicId);
      const draft = initialDraft(topicId);
      if (draft?.kind === 'story' && initialPage === 'content') draft.page = 'content';
      const requestedIndex = Number(initialWritingIndex);
      const requestedTarget = Number.isInteger(requestedIndex) && requestedIndex >= 0 ? getWritingTopic(topicId)?.exercises[requestedIndex] : undefined;
      if (draft?.kind === 'writing' && requestedTarget) { draft.index = requestedIndex; draft.characterId = requestedTarget.characterId; }
      if (!draft || !current) return;
      const now = new Date().toISOString();
      const initial: Checkpoint = saved ?? { version: 1, contentVersion: APPROVED_CONTENT_VERSION_ID, profileId: profile.profile_id, topicId, startedAt: now, savedAt: now, draft };
      const counts = await activityResumeService.acceptedCounts(initial);
      if (!current) return;
      latest.current = initial;
      setState({ initial, counts });
      void flush();
    })().catch(() => { if (current) setFailed(true); });
    return () => { current = false; focused.current = false; focusEpoch.current += 1; void flush(); };
  }, [topicId, initialPage, initialWritingIndex, flush, router]));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => { if (status !== 'active') void flush(); });
    const hidden = () => { if (document.visibilityState === 'hidden') void flush(); };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', hidden);
    return () => { subscription.remove(); if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', hidden); };
  }, [flush]);
  if (!initialDraft(topicId)) return <>{children}</>;
  if (!state) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>{failed ? 'Your activity could not be opened. Please go back and try again.' : 'Opening your activity…'}</Text>{failed && <AppButton accessibilityLabel="Back" label="Back" onPress={() => router.dismissTo('/learner/lessons')} />}</View>;
  return <Context.Provider value={{ ...state, update, flush, isActive: () => focused.current && focusEpoch.current === epoch }}>
    <View key={`${state.initial.profileId}:${state.initial.startedAt}`} style={{ flex: 1 }}>
      {failed && <View><Text accessibilityLiveRegion="polite">Your work could not be saved. Keep this page open and try again.</Text><AppButton accessibilityLabel="Try again" label="Try again" onPress={() => { void flush(); }} /></View>}
      {children}
    </View>
  </Context.Provider>;
}
