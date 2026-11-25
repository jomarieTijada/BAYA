import { openLearnerSettings } from '../settings/LearnerSettingsOverlay';
import { topicCheckpoints } from '../../../content/characterActivities/checkpoints';
import { WritingPracticeLayout } from './WritingPracticeLayout';
import { useActivityResume } from '../../../modules/resume/ActivityResumeBoundary';
import { useLocalizedAlert } from '../../../localization/useLocalizedAlert';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import { approvedCurriculum } from '../../../content/approvedCurriculum';
import { type StrokeData } from '../../../content/writingEngine';
import { BAYA_WRITING_MASTERY_POLICY, isValidWritingResult, nextValidCount, validPredictions, type ModelWritingAttempt } from '../../../content/writingMastery';
import { validWritingCanvas } from '../../../content/writingCanvasValidation';
import { BAYA_CLASS_LABELS } from '../../../ml/bayaClassLabels';
import { WritingMasteryIndicator } from './WritingMasteryIndicator';
import { recognizeWriting } from '../../../ml/writingRecognition';
import { assessRecognition, canAwardWritingMastery } from '../../../ml/recognitionReliability';
import { BayaModelError } from '../../../ml/BayaModelError';
import { preloadBayaModel } from '../../../ml/bayaModel';
import { BAYA_MODEL_CONFIG, BAYA_RECOGNITION_MODEL_NAME, BAYA_RECOGNITION_MODEL_VERSION, BAYA_RECOGNITION_MODEL_URL } from '../../../ml/bayaModelConfig';
import { getBayaRuntimeDiagnostics } from '../../../ml/bayaRuntimeDiagnostics';
import { getWritingTopic, writingTopics } from '../../../content/writingLessonData';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { LearnerAppShell } from '../LearnerAppShell';
import { ActivityHeader } from '../activity/ActivityHeader';
import { downloadBayaCapture, isBayaCaptureEnabled, type BayaCaptureDownload } from './bayaCapture';
import { type WritingCanvasSize } from './WritingCanvas';
import { WritingNavigation } from './WritingNavigation';
import { presentTopPrediction, rankPredictions, type RecognitionState } from './recognitionPresentation';

const module = approvedCurriculum.find(item => item.id === 'module-3')!;
const totalExercises = writingTopics.reduce((sum, topic) => sum + topic.exercises.length, 0);

function initialSelection(topicId: 'topic-3-1' | 'topic-3-2') {
  let requestedClass;
  if (isBayaCaptureEnabled()) {
    requestedClass = new URLSearchParams(window.location.search).get('bayaTarget');
  } else {
    requestedClass = null;
  }
  const requestedIndex = writingTopics.find(topic => topic.id === topicId)?.exercises.findIndex(exercise => exercise.characterId === requestedClass) ?? -1;
  return { topicId, index: Math.max(0, requestedIndex) };
}

export function WritingPracticeScreen({ topicId }: { topicId: 'topic-3-1' | 'topic-3-2' }) {
  const resume = useActivityResume();
  useEffect(() => {
    if (Platform.OS === 'web') {
      void preloadBayaModel().catch(error => {
        if (__DEV__) console.warn('[BAYA ML] Preload failed; recognition can retry.', error);
      });
    }
  }, []);
  // Preserve the explicit previous/next character selection across topic routes,
  // while remounting transient capture and mastery state for the new activity.
  const [selection, setSelection] = useState(() => ({ ...initialSelection(topicId), ...(resume?.initial.draft.kind === 'writing' ? { index: resume.initial.draft.index } : {}) }));
  const masteredCharacters = useRef(new Set<string>(Object.entries(resume?.counts ?? {}).filter(([, count]) => count >= BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts).map(([id]) => `${topicId}:${id}`)));
  return <WritingPracticeSession key={topicId} topicId={topicId} selection={selection} setSelection={setSelection} masteredCharacters={masteredCharacters} />;
}

function WritingPracticeSession({ topicId, selection, setSelection, masteredCharacters }: {
  topicId: 'topic-3-1' | 'topic-3-2';
  selection: ReturnType<typeof initialSelection>;
  setSelection: React.Dispatch<React.SetStateAction<ReturnType<typeof initialSelection>>>;
  masteredCharacters: React.RefObject<Set<string>>;
}) {
  const resume = useActivityResume();
  const restored = resume?.initial.draft.kind === 'writing' ? resume.initial.draft : null;
  const initialCount = restored ? resume?.counts[restored.characterId] ?? 0 : 0;
  const localizedAlert = useLocalizedAlert();
  const router = useRouter();
  const referenceTarget = useRef<View>(null);
  const canvasTarget = useRef<View>(null);
  const starsTarget = useRef<View>(null);
  const actionTarget = useRef<View>(null);
  const guideTargets = { reference: referenceTarget, canvas: canvasTarget, stars: starsTarget, action: actionTarget };
  const [strokes, setStrokes] = useState<StrokeData>(() => restored?.strokes ?? []);
  const [canvasSize, setCanvasSize] = useState<WritingCanvasSize>({ width: restored?.width ?? 1, height: restored?.height ?? 1 });
  const currentStrokes = useRef(strokes);
  const currentSize = useRef(canvasSize);
  const [requiresRedraw, setRequiresRedraw] = useState(restored?.submitted ?? false);
  const [validCount, setValidCount] = useState(initialCount);
  const mastery = useRef(initialCount);
  const needsRedraw = useRef(restored?.submitted ?? false);
  const evaluatedVersion = useRef(-1);
  const [recognition, setRecognition] = useState<RecognitionState>({ status: 'idle' });
  const [captureDownload, setCaptureDownload] = useState<BayaCaptureDownload | null>(null);
  useEffect(() => () => { if (captureDownload) URL.revokeObjectURL(captureDownload.url); }, [captureDownload]);
  const [busy, setBusy] = useState(false);
  const advancing = useRef(false);
  const completed = useRef(false);
  const checking = useRef(false);
  const drawingVersion = useRef(0);
  const topic = getWritingTopic(topicId);
  const topicIndex = writingTopics.findIndex(item => item.id === topicId);
  let selectedIndex;
  if (selection.topicId === topicId) {
    selectedIndex = selection.index;
  } else {
    selectedIndex = 0;
  }
  const exercise = topic?.exercises[selectedIndex];
  const updateResume = resume?.update;
  useEffect(() => {
    if (exercise) updateResume?.({ kind: 'writing', index: selectedIndex, characterId: exercise.characterId, strokes, width: canvasSize.width, height: canvasSize.height, submitted: requiresRedraw }, requiresRedraw || strokes.length === 0);
  }, [selectedIndex, exercise, strokes, canvasSize, requiresRedraw, updateResume]);
  const lastExercise = selectedIndex === (topic?.exercises.length ?? 1) - 1;
  const lastTopic = topicIndex === writingTopics.length - 1;

  const targetKey = `${topicId}:${exercise?.characterId}`;
  const activeTarget = useRef(targetKey);
  useLayoutEffect(() => { activeTarget.current = targetKey; }, [targetKey]);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; drawingVersion.current += 1; }; }, []);
  const resetWriting = useCallback(() => { drawingVersion.current += 1; needsRedraw.current = false; setRequiresRedraw(false); currentStrokes.current = []; setStrokes(currentStrokes.current); setRecognition({ status: 'idle' }); setCaptureDownload(null); }, [setRequiresRedraw, setStrokes, setRecognition, setCaptureDownload]);
  const resetCharacter = useCallback(() => { mastery.current = 0; setValidCount(0); resetWriting(); }, [resetWriting]);
  const canProceed = validCount >= BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts;
  const onRetry = () => { if (!checking.current && !advancing.current && mastery.current < BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts) resetWriting(); };
  const onClear = () => {
    if (checking.current || advancing.current || needsRedraw.current || mastery.current >= BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts) return;
    resetWriting();
  };

  const switchTopic = (nextId: 'topic-3-1' | 'topic-3-2', index = 0) => {
    resetCharacter();
    setSelection({ topicId: nextId, index });
    router.setParams({ topicId: nextId, writingIndex: String(index) });
  };
  const backToLessons = () => { drawingVersion.current += 1; router.dismissTo('/learner/lessons'); };
  const onChangeStrokes = (nextStrokes: StrokeData) => { if (checking.current || needsRedraw.current || mastery.current >= BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts) return; drawingVersion.current += 1; currentStrokes.current = nextStrokes; setStrokes(nextStrokes); setRecognition({ status: 'idle' }); setCaptureDownload(null); };
  const onUndo = () => { if (checking.current || advancing.current || needsRedraw.current || mastery.current >= BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts) return; drawingVersion.current += 1; currentStrokes.current = currentStrokes.current.slice(0, -1); setStrokes(currentStrokes.current); setRecognition({ status: 'idle' }); setCaptureDownload(null); };
  const onBackToWriting = () => {
    if (advancing.current || checking.current) return;
    if (selectedIndex > 0) { resetCharacter(); setSelection({ topicId, index: selectedIndex - 1 }); return; }
    if (topicIndex > 0) {
      const previousTopic = writingTopics[topicIndex - 1];
      switchTopic(previousTopic.id, previousTopic.exercises.length - 1);
      return;
    }
    backToLessons();
  };
  const onCheck = async () => {
    if (!mounted.current || strokes !== currentStrokes.current || canvasSize !== currentSize.current || targetKey !== activeTarget.current || !exercise || checking.current || busy || needsRedraw.current || mastery.current >= BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts || evaluatedVersion.current === drawingVersion.current) return;
    if (!validWritingCanvas(strokes, canvasSize)) { setRecognition({ status: 'empty' }); return; }
    checking.current = true;
    const version = drawingVersion.current;
    const submittedTarget = targetKey;
    const isCurrent = () => (!resume || resume.isActive()) && mounted.current && version === drawingVersion.current && submittedTarget === activeTarget.current;
    evaluatedVersion.current = version;
    needsRedraw.current = true;
    setRequiresRedraw(true);
    resume?.update({ kind: 'writing', index: selectedIndex, characterId: exercise.characterId, strokes, width: canvasSize.width, height: canvasSize.height, submitted: true }, true);
    const submittedStrokes = strokes;
    const submittedSize = canvasSize;
    const diagnostic = {
      ...getBayaRuntimeDiagnostics(),
      modelName: BAYA_RECOGNITION_MODEL_NAME,
      modelVersion: BAYA_RECOGNITION_MODEL_VERSION,
      modelUrl: BAYA_RECOGNITION_MODEL_URL,
      wasmPath: BAYA_MODEL_CONFIG.runtimeBaseUrl,
      target: exercise.characterId,
      strokeCount: submittedStrokes.length,
      pointCount: submittedStrokes.reduce((count, stroke) => count + stroke.length, 0),
    };
    const phases = { captureStarted: false, captureCompleted: false, inferenceStarted: false, inferenceCompleted: false };
    if (__DEV__) console.info('[BAYA Recognition] Suriin', JSON.stringify({ ...diagnostic, ...phases }));
    setBusy(true);
    setRecognition({ status: 'analyzing' });
    try {
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
      const predictions = await modelRequest;
      if (!isCurrent()) return;
      if (!validPredictions(predictions)) throw new Error('BAYA recognition returned malformed predictions.');
      const ranked = rankPredictions(predictions);
      const decision = assessRecognition(ranked);
      // All non-recognized outcomes stop before presentation, persistence and mastery.
      if (decision.status !== 'recognized') {
        setRecognition({ status: decision.status === 'insufficient-input' ? 'empty' : decision.status });
        return;
      }
      const top = decision.prediction;
      const presentation = presentTopPrediction(top);
      const valid = canAwardWritingMastery({ strokes: submittedStrokes, geometry: submittedSize, target: exercise.characterId, decision });
      const result: ModelWritingAttempt = {
        characterId: exercise.characterId, strokeData: submittedStrokes, imageData: null,
        recognizedClassId: BAYA_CLASS_LABELS[top.classIndex], confidence: top.probability,
        result: (() => {
          if (valid) {
            return 'valid';
          } else {
            return 'invalid';
          }
        })(), attemptedAt: new Date().toISOString(),
      };
      try {
        if (resume) await localLearnerService.recordWritingAttempt(topicId, result, undefined, resume.initial.profileId);
        else await localLearnerService.recordWritingAttempt(topicId, result);
      }
      catch (error) {
        if (isCurrent()) localizedAlert('Hindi naitala ang pagsasanay', 'Subukan muli.');
        throw error;
      }
      if (!isCurrent()) return;
      mastery.current = nextValidCount(mastery.current, valid);
      setValidCount(mastery.current);
      if (mastery.current === BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts) masteredCharacters.current.add(submittedTarget);
      setRecognition({ status: 'success', prediction: presentation });
      if (__DEV__) console.info('[BAYA Recognition] Result', JSON.stringify({ ...diagnostic, ...phases, top1: top.label, top1Confidence: top.probability, top3: ranked.map(prediction => prediction.label), isCorrect: valid, stateUpdated: true }));
      if (captureEnabled) {
        try { setCaptureDownload(downloadBayaCapture(exercise.characterId, submittedStrokes, submittedSize, ranked)); }
        catch (captureError) { if (__DEV__) console.warn('[BAYA CAPTURE] Could not download diagnostic JSON', captureError); }
      }
    } catch (error) {
      const stateUpdated = isCurrent();
      if (__DEV__) console.warn('[BAYA Recognition] Failed', JSON.stringify({ ...diagnostic, ...phases, stateUpdated, error: (() => {
        if (error instanceof Error) {
          return error.message;
        } else {
          return String(error);
        }
      })() }));
      if (stateUpdated) setRecognition({ status: error instanceof BayaModelError && error.code === 'INSUFFICIENT_INPUT' ? 'empty' : 'error' });
    } finally { checking.current = false; if (mounted.current) setBusy(false); }
  };
  const onNext = async () => {
    if (!mounted.current || completed.current || targetKey !== activeTarget.current || mastery.current < BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts || checking.current || busy || advancing.current || !topic) return;
    if (!lastExercise) { resetCharacter(); setSelection({ topicId, index: selectedIndex + 1 }); return; }
    if (!topic.exercises.every(item => masteredCharacters.current.has(`${topicId}:${item.characterId}`))) return;
    advancing.current = true;
    setBusy(true);
    const completionTarget = targetKey;
    let target;
    if (!lastTopic) {
      target = writingTopics[topicIndex + 1].id;
    } else {
      target = '/learner/lessons';
    }
    try {
      if (__DEV__) console.info('[BAYA Progress] request topicId=%s source=writing_next target=%s', topicId, target);
      if (resume) await localLearnerService.completeTopic(topicId, undefined, resume.initial.profileId);
      else await localLearnerService.completeTopic(topicId);
      completed.current = true;
      if (!mounted.current || (resume && !resume.isActive()) || completionTarget !== activeTarget.current) return;
      if (__DEV__) console.info('[BAYA Progress] navigate topicId=%s target=%s', topicId, target);
      const checkpoint = topicCheckpoints.find(c => c.topicId === topicId);
      if (checkpoint) router.push({ pathname: '/learner/character-activities', params: { checkpointId: checkpoint.id } });
      else if (!lastTopic) switchTopic(writingTopics[topicIndex + 1].id);
      else backToLessons();
    } catch (error) {
      if (__DEV__) console.warn('[BAYA Progress] request topicId=%s status=failed', topicId, { error });
      localizedAlert('Could not save progress', 'Please try again.');
    } finally { advancing.current = false; if (mounted.current) setBusy(false); }
  };

  if (!topic || !exercise) return null;
  const previousCount = writingTopics.slice(0, topicIndex).reduce((sum, item) => sum + item.exercises.length, 0);
  const unsuccessful = recognition.status === 'error' || recognition.status === 'uncertain' || recognition.status === 'rejected' || (recognition.status === 'success' && !isValidWritingResult(exercise.characterId, [recognition.prediction]));
  let actionPhase: 'complete' | 'checking' | 'retry' | 'ready';
  if (canProceed) {
    actionPhase = 'complete';
  } else {
    if (busy) {
      actionPhase = 'checking';
    } else {
      if (requiresRedraw) {
        actionPhase = 'retry';
      } else {
        actionPhase = 'ready';
      }
    }
  }
  return <LearnerAppShell
    activeRoute="/learner/lessons"
    backgroundColor="#FFFDF7"
    header={<ActivityHeader currentStep={previousCount + selectedIndex + 1} totalSteps={totalExercises} onBack={onBackToWriting} onOpenSettings={() => openLearnerSettings()} subtitle={topic.title} title={module.title} />}
    showBottomNavigation={false}

    testID={`writing-practice-screen-${topicId}`}
  >
    <WritingPracticeLayout exercise={exercise} targetKey={targetKey}
      instruction={{ count: validCount, unsuccessful }}
      toolbar={{ canEdit: strokes.length > 0 && !busy && !requiresRedraw && !canProceed, onClear, onUndo }}
      canvas={{ strokes, disabled: busy || requiresRedraw || canProceed, onChange: onChangeStrokes,
        onStrokeEnd: draft => { if (exercise) resume?.update({ kind: 'writing', index: selectedIndex, characterId: exercise.characterId, strokes: draft, width: currentSize.current.width, height: currentSize.current.height, submitted: needsRedraw.current }, true); },
        onSizeChange: size => { if (size.width !== canvasSize.width || size.height !== canvasSize.height) { drawingVersion.current += 1; currentSize.current = size; setCanvasSize(size); if (checking.current) setRecognition({ status: 'idle' }); } } }}
      recognition={recognition} phase={actionPhase} guideTargets={guideTargets}
      action={({ compact }) => <WritingNavigation phase={actionPhase} busy={busy} canAdvance={canProceed && !busy} canCheck={strokes.some(stroke => stroke.length > 0) && !busy && !requiresRedraw && !canProceed} canEdit={!busy} compact={compact} isLast={lastTopic && lastExercise && !topicCheckpoints.some(c => c.topicId === topicId)} targetRef={actionTarget} onCheck={() => { void onCheck(); }} onNext={() => { void onNext(); }} onRetry={onRetry} />}
      progress={({ dense }) => <WritingMasteryIndicator targetRef={starsTarget} key={targetKey} count={validCount} required={BAYA_WRITING_MASTERY_POLICY.requiredValidAttempts} compact={dense} />}
      diagnostic={captureDownload && <a download={captureDownload.filename} href={captureDownload.url}>Download diagnostic JSON</a>}
    />
  </LearnerAppShell>;
}
