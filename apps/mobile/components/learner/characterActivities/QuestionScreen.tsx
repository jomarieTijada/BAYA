import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { questionRecording, type CharacterActivity, type CharacterQuestion } from '../../../content/characterActivities';
import { type Answer, type SetAttempt } from '../../../modules/characterActivities/assessment';
import { characterActivityService as service } from '../../../database/services/characterActivityService';
import { validWritingCanvas } from '../../../content/writingCanvasValidation';
import type { StrokeData } from '../../../content/writingEngine';
import { recognizeWriting } from '../../../ml/writingRecognition';
import { assessRecognition } from '../../../ml/recognitionReliability';
import { presentTopPrediction, type RecognitionState } from '../writing/recognitionPresentation';
import { AppButton } from '../../ui/AppButton';
import { AudioPrompt, ChoiceOptions, Glyph, s } from './QuestionParts';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { useCharacterCopy } from './copy';
import { AssessmentSlide } from './AssessmentSlide';
import { WritingActivityPresentation } from './WritingActivityPresentation';

export function QuestionScreen({ activity, question: q, attempt, onChange, total = 5, context }: {
  activity: CharacterActivity; question: CharacterQuestion; attempt: SetAttempt; onChange: (a: SetAttempt) => void; total?: number; context?: string;
}) {
  const copy = useCharacterCopy();
  const { language } = useLocalization();
  const questionTitle = language === 'tl'
    ? ['Aling titik ang tumutugma sa tunog?', 'Anong tunog ang katumbas ng titik na ito?', 'Aling titik ang tumutugma rito?'][activity.number - 1]
    : ['Which character matches the sound?', 'Which sound matches this character?', 'Which character matches this sound?'][activity.number - 1];
  const { width, height } = useWindowDimensions();
  const compact = width < 600 || height < 650;
  const promptSize = height < 500 ? Math.max(64, Math.min(110, height - 265)) : 160;
  const [recognition, setRecognition] = useState<RecognitionState>({status: 'idle'});
  const [selected, setSelected] = useState<string>();
  const [played, setPlayed] = useState(false);
  const onPlayed = useCallback(() => setPlayed(true), []);
  const [strokes, setStrokes] = useState<StrokeData>([]);
  const [geometry, setGeometry] = useState({ width: 1, height: 1 });
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), mounted = useRef(true);
  const pendingAnswer = useRef<Answer | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const response = attempt.responses[attempt.cursor];
  const unavailable = activity.number === 1 && !questionRecording(q);
  async function submit() {
    if (lock.current || response) return;
    lock.current = true; setBusy(true); setError('');
    try {
      let answer = pendingAnswer.current;
      if (unavailable) answer = { kind: 'unavailable', reason: 'recording-pending-validation' };
      if (!answer && q.type === 'multiple-choice') {
        if (!selected) return;
        answer = { kind: 'choice', optionId: selected, audioPlayed: played };
      } else if (!answer && q.type === 'handwriting') {
        if (!validWritingCanvas(strokes, geometry)) { setError(copy.empty); return; }
        setRecognition({status: 'analyzing'});
        const predictions = await recognizeWriting(strokes, geometry, 3);
        if (!mounted.current) return;
        const decision = assessRecognition(predictions);
        if (decision.status !== 'recognized') {
          await service.failure(attempt, decision.status);
          if (mounted.current) { setRecognition({status: decision.status === 'insufficient-input' ? 'empty' : decision.status}); setError(decision.status === 'error' ? copy.error : copy.uncertain); }
          return;
        }
        answer = { kind: 'writing', prediction: decision.prediction };
      }
      if (!answer || !mounted.current) return;
      pendingAnswer.current = answer;
      const saved = await service.submit(attempt, q.id, answer);
      if (mounted.current) {
        if (q.type === 'multiple-choice') { onChange(await service.advance(saved)); }
        else onChange(saved);
      }
    } catch {
      // Keep a recognized answer for a safe persistence retry; inference failures are not wrong answers.
      if (mounted.current) { setRecognition({status: 'error'}); setError(copy.error); }
      await service.failure(attempt, 'inference-or-save-error').catch(() => undefined);
    } finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  async function advance() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { const saved = await service.advance(attempt); if (mounted.current) onChange(saved); }
    catch { if (mounted.current) setError(copy.error); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  const clear = () => { if (!lock.current && !response) { setStrokes([]); pendingAnswer.current = null; setError(''); setRecognition({status:'idle'}); } };
  if (q.type === 'handwriting') return <View style={{flex:1,minHeight:0}} testID={`question-${q.id}`}>
    <WritingActivityPresentation position={attempt.cursor + 1} total={total} context={context} question={q} busy={busy} submitted={!!response} result={response?.correct} error={error}
      recognition={response?.answer.kind === 'writing' ? {status:'success',prediction:presentTopPrediction(response.answer.prediction)} : recognition}
      canvas={{strokes, onChange: next => { if (!lock.current && !response) { pendingAnswer.current=null;setStrokes(next);setError('');setRecognition({status:'idle'}); } }, onSizeChange:setGeometry, disabled:busy || !!response}}
      onClear={clear} onUndo={() => { if (!lock.current && !response) {setStrokes(prev=>prev.slice(0,-1));pendingAnswer.current=null;setError('');setRecognition({status:'idle'});} }}
      onCheck={() => void submit()} onNext={() => void advance()} />
  </View>;
  return <View style={{flex:1,minHeight:0}} testID={`question-${q.id}`}>
    <AssessmentSlide questionId={q.id} label={`${copy.question} ${attempt.cursor + 1} ${copy.of} ${total}`}
      progress={null}
      guidance={copy.instructions[activity.number-1]}
      focus={<><Text style={{fontSize:height < 350 ? 14 : 17,lineHeight:height < 350 ? 18 : 22,fontWeight:'700',color:'#342214',textAlign:'center'}}>{questionTitle}</Text>{activity.number===1 ? <AudioPrompt compact question={q} onPlayed={onPlayed} /> : activity.number===2 ? <Glyph glyph={q.prompt} label={copy.question} size={promptSize} /> : <Text style={[s.word,{fontSize:compact ? 32 : 44}]}>{q.prompt}</Text>}</>}
      choices={<ChoiceOptions compact={compact} question={q} glyphs={activity.number!==2} selected={response?.answer.kind==='choice' ? response.answer.optionId : selected}
        checkedLetter={response && response.correct !== null ? q.correctLetter : undefined} disabled={busy || !!response || unavailable} onSelect={id=>{setSelected(id);pendingAnswer.current=null;}} />}
      action={<>
        {!!error && <Text accessibilityRole="alert" style={[s.body,{fontSize:14,lineHeight:18}]}>{error}</Text>}

        <AppButton compact fullWidth={false} label="" icon="chevronRight" style={{ width: 42, height: 44, minHeight: 44, paddingHorizontal: 0, borderWidth: 1 }}
          accessibilityLabel={copy.next}
          disabled={busy || (!response && !unavailable && (!selected || (activity.number===1 && !played)))} onPress={() => void (response ? advance() : submit())} />
      </>} />
  </View>;
}
