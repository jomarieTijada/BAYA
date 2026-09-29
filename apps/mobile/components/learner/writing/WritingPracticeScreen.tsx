import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { approvedCurriculum } from '../../../content/approvedCurriculum';
import { type StrokeData, type WritingAttempt } from '../../../content/writingEngine';
import { localWritingRecognitionService } from '../../../content/writingRecognitionService';
import { recognizeWriting } from '../../../ml/writingRecognition';
import { BAYA_RECOGNITION_MODEL_URL } from '../../../ml/bayaModelConfig';
import { getBayaRuntimeDiagnostics } from '../../../ml/bayaRuntimeDiagnostics';
import { getWritingTopic, writingTopics } from '../../../content/writingLessonData';
import { Colors, Radius, ResponsiveLayout, Spacing } from '../../../constants/theme';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { LearnerAppShell } from '../LearnerAppShell';
import { ActivityHeader } from '../activity/ActivityHeader';
import { BayaWritingGuide } from './BayaWritingGuide';
import { downloadBayaCapture, isBayaCaptureEnabled, type BayaCaptureDownload } from './bayaCapture';
import { CharacterReferenceCard } from './CharacterReferenceCard';
import { ConfidenceCard } from './ConfidenceCard';
import { WritingCanvas, type WritingCanvasSize } from './WritingCanvas';
import { WritingNavigation } from './WritingNavigation';
import { WritingToolbar } from './WritingToolbar';
import { getWritingLayout } from './writingLayout';
import { rankPredictions, type RecognitionState } from './recognitionPresentation';

const module = approvedCurriculum.find(item => item.id === 'module-3')!;
const totalExercises = writingTopics.reduce((sum, topic) => sum + topic.exercises.length, 0);

function initialSelection(topicId: 'topic-3-1' | 'topic-3-2') {
  const requestedClass = isBayaCaptureEnabled() ? new URLSearchParams(window.location.search).get('bayaTarget') : null;
  const requestedIndex = writingTopics.find(topic => topic.id === topicId)?.exercises.findIndex(exercise => exercise.characterId === requestedClass) ?? -1;
  return { topicId, index: Math.max(0, requestedIndex) };
}

/** Data-driven Module 3 practice; the same screen renders vowels and consonants. */
export function WritingPracticeScreen({ topicId }: { topicId: 'topic-3-1' | 'topic-3-2' }) {
  const router = useRouter();
  const { width, height } = useResponsiveLayout();
  const [available, setAvailable] = useState({ width, height });
  const { columns, compact, dense } = getWritingLayout(available.width, available.height);
  const [selection, setSelection] = useState(() => initialSelection(topicId));
  const [strokes, setStrokes] = useState<StrokeData>([]);
  const [canvasSize, setCanvasSize] = useState<WritingCanvasSize>({ width: 1, height: 1 });
  const [attempt, setAttempt] = useState<WritingAttempt | null>(null);
  const [recognition, setRecognition] = useState<RecognitionState>({ status: 'idle' });
  const [captureDownload, setCaptureDownload] = useState<BayaCaptureDownload | null>(null);
  useEffect(() => () => { if (captureDownload) URL.revokeObjectURL(captureDownload.url); }, [captureDownload]);
  const mascotSize = dense
    ? available.height < 500
      ? Math.min(108, available.width * 0.2, Math.max(100, (available.height - 80) * 0.6))
      : Math.min(210, available.width * 0.23, (available.height - 80) * 0.78)
    : columns === 3
      ? Math.min(360, available.width * 0.25, available.height * 0.5)
      : compact ? 150 : 200;
  const [busy, setBusy] = useState(false);
  const advancing = useRef(false);
  const checking = useRef(false);
  const drawingVersion = useRef(0);
  const topic = getWritingTopic(topicId);
  const topicIndex = writingTopics.findIndex(item => item.id === topicId);
  const selectedIndex = selection.topicId === topicId ? selection.index : 0;
  const exercise = topic?.exercises[selectedIndex];
  const lastExercise = selectedIndex === (topic?.exercises.length ?? 1) - 1;
  const lastTopic = topicIndex === writingTopics.length - 1;

  const resetWriting = () => { drawingVersion.current += 1; setStrokes([]); setAttempt(null); setRecognition({ status: 'idle' }); setCaptureDownload(null); };
  const switchTopic = (nextId: 'topic-3-1' | 'topic-3-2', index = 0) => {
    resetWriting();
    setSelection({ topicId: nextId, index });
    router.setParams({ topicId: nextId });
  };
  const backToLessons = () => router.dismissTo('/learner/lessons');
  const onChangeStrokes = (nextStrokes: StrokeData) => { drawingVersion.current += 1; setStrokes(nextStrokes); setAttempt(null); setRecognition({ status: 'idle' }); setCaptureDownload(null); };
  const onUndo = () => { drawingVersion.current += 1; setStrokes(current => current.slice(0, -1)); setAttempt(null); setRecognition({ status: 'idle' }); setCaptureDownload(null); };
  const onBackToWriting = () => {
    if (selectedIndex > 0) { resetWriting(); setSelection({ topicId, index: selectedIndex - 1 }); return; }
    if (topicIndex > 0) {
      const previousTopic = writingTopics[topicIndex - 1];
      switchTopic(previousTopic.id, previousTopic.exercises.length - 1);
      return;
    }
    backToLessons();
  };
  const onCheck = async () => {
    if (!exercise || checking.current || busy) return;
    checking.current = true;
    const version = drawingVersion.current;
    const submittedStrokes = strokes;
    const submittedSize = canvasSize;
    const diagnostic = {
      ...getBayaRuntimeDiagnostics(),
      modelUrl: BAYA_RECOGNITION_MODEL_URL,
      wasmPath: '/ort/ort-wasm-simd-threaded.wasm',
      target: exercise.characterId,
      strokeCount: submittedStrokes.length,
      pointCount: submittedStrokes.reduce((count, stroke) => count + stroke.length, 0),
    };
    const phases = { captureStarted: false, captureCompleted: false, inferenceStarted: false, inferenceCompleted: false };
    if (__DEV__) console.info('[BAYA Recognition] Suriin', JSON.stringify({ ...diagnostic, ...phases }));
    setBusy(true);
    setRecognition({ status: 'analyzing' });
    try {
      const result = await localWritingRecognitionService.assess(exercise.characterId, submittedStrokes);
      if (version !== drawingVersion.current) return;
      if (!result) { setRecognition({ status: 'empty' }); return; }

      const captureEnabled = Platform.OS === 'web' && isBayaCaptureEnabled();
      const modelRequest = recognizeWriting(submittedStrokes, submittedSize, 3, {
        onCaptureStarted: () => {
          phases.captureStarted = true;
          if (__DEV__) console.info('[BAYA Recognition] Capture started', JSON.stringify({ ...diagnostic, ...phases }));
        },
        onCaptureCompleted: shapes => {
          phases.captureCompleted = true;
          if (__DEV__) console.info('[BAYA Recognition] Capture completed', JSON.stringify({ ...diagnostic, ...phases, ...shapes }));
        },
        onInferenceStarted: () => {
          phases.inferenceStarted = true;
          if (__DEV__) console.info('[BAYA Recognition] Inference started', JSON.stringify({ ...diagnostic, ...phases }));
        },
        onInferenceCompleted: () => { phases.inferenceCompleted = true; },
      });
      const [modelOutcome, saveOutcome] = await Promise.allSettled([
        modelRequest,
        localLearnerService.recordWritingAttempt(topicId, result),
      ]);
      if (version !== drawingVersion.current) return;

      if (saveOutcome.status === 'fulfilled') setAttempt(result);
      else {
        if (__DEV__) console.warn('[BAYA WRITING] Could not save attempt', saveOutcome.reason);
        Alert.alert('Hindi naitala ang pagsasanay', 'Subukan muli.');
      }

      if (modelOutcome.status === 'rejected') throw modelOutcome.reason;
      const ranked = rankPredictions(modelOutcome.value);
      const top = ranked[0];
      if (!top || ranked.some(prediction => !Number.isFinite(prediction.probability) || prediction.probability < 0 || prediction.probability > 1)) {
        throw new Error('BAYA recognition returned no valid top prediction.');
      }
      setRecognition({ status: 'success', predictions: ranked });
      if (__DEV__) console.info('[BAYA Recognition] Result', JSON.stringify({ ...diagnostic, ...phases, top1: top.label, top1Confidence: top.probability, top3: ranked.map(prediction => prediction.label), isCorrect: top.label === exercise.characterId, stateUpdated: true }));
      if (captureEnabled) {
        try { setCaptureDownload(downloadBayaCapture(exercise.characterId, submittedStrokes, submittedSize, ranked)); }
        catch (captureError) { if (__DEV__) console.warn('[BAYA CAPTURE] Could not download diagnostic JSON', captureError); }
      }
    } catch (error) {
      const stateUpdated = version === drawingVersion.current;
      if (__DEV__) console.warn('[BAYA Recognition] Failed', JSON.stringify({ ...diagnostic, ...phases, stateUpdated, error: error instanceof Error ? error.message : String(error) }));
      if (stateUpdated) setRecognition({ status: 'error' });
    } finally { checking.current = false; setBusy(false); }
  };
  const onNext = async () => {
    if (!attempt || recognition.status !== 'success' || busy || advancing.current || !topic) return;
    if (!lastExercise) { resetWriting(); setSelection({ topicId, index: selectedIndex + 1 }); return; }
    advancing.current = true;
    setBusy(true);
    const target = !lastTopic ? writingTopics[topicIndex + 1].id : '/learner/lessons';
    try {
      if (__DEV__) console.info('[BAYA Progress] request topicId=%s source=writing_next target=%s', topicId, target);
      await localLearnerService.completeTopic(topicId);
      if (__DEV__) console.info('[BAYA Progress] navigate topicId=%s target=%s', topicId, target);
      if (!lastTopic) switchTopic(writingTopics[topicIndex + 1].id);
      else backToLessons();
    } catch (error) {
      if (__DEV__) console.warn('[BAYA Progress] request topicId=%s status=failed', topicId, { error });
      Alert.alert('Could not save progress', 'Please try again.');
    } finally { advancing.current = false; setBusy(false); }
  };

  if (!topic || !exercise) return null;
  const previousCount = writingTopics.slice(0, topicIndex).reduce((sum, item) => sum + item.exercises.length, 0);
  return <LearnerAppShell
    activeRoute="/learner/lessons"
    backgroundColor="#FFFDF7"
    header={<ActivityHeader currentStep={previousCount + selectedIndex + 1} totalSteps={totalExercises} onBack={backToLessons} onOpenSettings={() => router.push('/learner/settings')} subtitle={topic.title} title={module.title} />}
    showBottomNavigation={false}
    testID={`writing-practice-screen-${topicId}`}
  >
    <ScrollView contentContainerStyle={[styles.scrollContent, dense && styles.denseScrollContent, { paddingHorizontal: available.width < 700 || dense ? ResponsiveLayout.pagePadding.phone : ResponsiveLayout.pagePadding.desktop }]} keyboardShouldPersistTaps="handled" onLayout={event => { const { width: measuredWidth, height: measuredHeight } = event.nativeEvent.layout; if (measuredWidth !== available.width || measuredHeight !== available.height) setAvailable({ width: measuredWidth, height: measuredHeight }); }} style={styles.scroll}>
      <View style={[styles.columns, dense && styles.denseColumns, columns === 1 && styles.stack, columns === 3 && styles.desktopColumns, columns === 3 && { minHeight: Math.max(0, available.height - (dense ? Spacing.sm * 2 : Spacing.md + Spacing.lg)) }]}>
        <View style={[styles.referenceColumn, columns === 1 && styles.stackColumn, columns === 2 && styles.twoColumn]}>
          <CharacterReferenceCard compact={compact} dense={dense} exercise={exercise} fullHeight={columns === 3} />
        </View>
        <View style={[styles.canvasColumn, columns === 1 && styles.stackColumn, columns === 2 && styles.twoColumn]}>
          <View style={[styles.canvasCard, dense && styles.denseCanvasCard, columns === 3 && styles.tallCard]}>
            <WritingToolbar canEdit={strokes.length > 0} dense={dense} onClear={resetWriting} onUndo={onUndo} />
            <WritingCanvas compact={compact} dense={dense} fillHeight={columns === 3} hintImage={exercise.referenceImage} onChange={onChangeStrokes} onSizeChange={setCanvasSize} strokes={strokes} />
          </View>
        </View>
        <View style={[styles.feedbackColumn, dense && styles.denseFeedbackColumn, columns === 1 && styles.stackColumn, columns === 2 && styles.rowFullColumn]}>
          <ConfidenceCard dense={dense} embedded />
          <BayaWritingGuide dense={dense} fillHeight={columns === 3} mascotSize={mascotSize} recognition={recognition} targetClass={exercise.characterId} />
          {captureDownload && <a download={captureDownload.filename} href={captureDownload.url}>Download diagnostic JSON</a>}
          <WritingNavigation analyzing={recognition.status === 'analyzing'} canAdvance={Boolean(attempt) && recognition.status === 'success' && !busy} canCheck={!busy} compact={compact} dense={dense} hasAttempt={Boolean(attempt) && recognition.status === 'success'} isLast={lastTopic && lastExercise} isResult={recognition.status === 'success'} onBackToWriting={onBackToWriting} onCheck={() => { void onCheck(); }} onNext={() => { void onNext(); }} onRetry={resetWriting} />
        </View>
      </View>
    </ScrollView>
  </LearnerAppShell>;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, minHeight: 0, width: '100%' },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.lg, paddingTop: Spacing.md, width: '100%' },
  denseScrollContent: { paddingBottom: Spacing.sm, paddingTop: Spacing.sm },
  columns: { alignItems: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, width: '100%' },
  denseColumns: { gap: Spacing.sm },
  desktopColumns: { flexWrap: 'nowrap' },
  stack: { flexDirection: 'column', flexWrap: 'nowrap' },
  referenceColumn: { flex: 0.9, minWidth: 0 },
  canvasColumn: { flex: 2.1, minWidth: 0 },
  feedbackColumn: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, flex: 1.05, gap: Spacing.sm, justifyContent: 'space-between', minWidth: 0, padding: Spacing.md },
  denseFeedbackColumn: { gap: Spacing.xs, padding: Spacing.sm },
  twoColumn: { flexBasis: '46%', flexGrow: 1 },
  stackColumn: { flexBasis: 'auto', flexGrow: 0, flexShrink: 0, width: '100%' },
  rowFullColumn: { flexBasis: '100%', flexGrow: 0, width: '100%' },
  canvasCard: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.md, minWidth: 0, padding: Spacing.md, width: '100%' },
  denseCanvasCard: { gap: Spacing.xs, padding: Spacing.sm },
  tallCard: { flex: 1 },
});
