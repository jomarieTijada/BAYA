import React, { useEffect, useRef, type ComponentProps } from 'react';
import { Platform, Text, View } from 'react-native';
import { glyphAsset, glyphClass, type WritingQuestion } from '../../../content/characterActivities';
import { traditionalGroupForGlyph } from '../../../content/traditionalCharacters';
import type { WritingExercise } from '../../../content/writingLessonData';
import { WritingPracticeLayout } from '../writing/WritingPracticeLayout';
import { AppButton } from '../../ui/AppButton';
import type { RecognitionState } from '../writing/recognitionPresentation';
import { useCharacterCopy } from './copy';
import { s } from './QuestionParts';

/** Context adapter only: the entire writing presentation belongs to the lesson component. */
export function WritingActivityPresentation({ question: q, position, total = 5, context: topicContext, canvas, recognition, busy, submitted, result, error, onCheck, onNext, onClear, onUndo }: {
  question: WritingQuestion; position?: number; total?: number; context?: string; canvas: ComponentProps<typeof WritingPracticeLayout>['canvas'];
  recognition: RecognitionState; busy: boolean; submitted: boolean; result?: boolean | null;
  error: string; onCheck: () => void; onNext: () => void; onClear: () => void; onUndo: () => void;
}) {
  const copy = useCharacterCopy();
  const context = useRef<View>(null);
  useEffect(() => { if (Platform.OS === 'web') context.current?.focus(); }, [q.id]);
  const id = glyphClass(q.expectedGlyph);
  const label = traditionalGroupForGlyph(q.expectedGlyph)?.label ?? id.replace(/_/g, '/').toUpperCase();
  const exercise: WritingExercise = {
    id: q.id, characterId: id, character: q.expectedGlyph, romanization: label, sound: `/${label.toLowerCase()}/`, referenceImage: glyphAsset(q.expectedGlyph),
    pronunciation: { id, category: ['a','e_i','o_u'].includes(id) ? 'patinig' : 'katinig', latinEquivalent: label, unicodeSymbol: q.expectedGlyph, imageAsset: glyphAsset(q.expectedGlyph), audioSrc: null,
      example: { word: q.prompt, baybayinWord: q.expectedGlyph, highlightedSyllable: q.target, highlightIndex: 0 } },
  };
  const phase = submitted ? 'complete' : busy ? 'checking' : 'ready';
  return <View style={{ flex: 1, minHeight: 0, paddingRight: 52 }}><WritingPracticeLayout assessment exercise={exercise} targetKey={q.id} recognition={recognition} phase={phase}
    instruction={{ message: copy.instructions[3] }}
    toolbar={{ canEdit: !busy && !submitted && canvas.strokes.length > 0, onClear, onUndo }} canvas={canvas}
    context={<View ref={context} tabIndex={-1} accessibilityRole="header" accessibilityLabel={`${copy.question} ${position ?? (q.number - 1) % 5 + 1} ${copy.of} ${total}. ${q.prompt}`} style={{ gap: 4, paddingBottom: 4, outlineWidth: 0 }}>
      <Text style={[s.word, { fontSize: 26 }]}>{q.prefix}<Text testID="underlined-syllable" style={s.underlined}>{q.target}</Text>{q.suffix}</Text></View>}
    status={<View accessibilityLiveRegion="polite" testID={submitted ? 'answer-feedback' : undefined}>
      {submitted && <><Text style={s.body}>{result ? copy.correct : copy.incorrect}</Text><Text style={s.eyebrow}>{copy.saved}</Text></>}
      {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    </View>}
    action={() => null}
  />
    <View style={{ position: 'absolute', right: 6, top: '50%', marginTop: -22 }}>
      <AppButton label="" icon="chevronRight" compact fullWidth={false}
        accessibilityLabel={submitted ? copy.next : copy.checkWriting}
        disabled={busy || (!submitted && canvas.strokes.length === 0)} onPress={submitted ? onNext : onCheck}
        style={{ width: 42, height: 44, minHeight: 44, paddingHorizontal: 0, borderWidth: 1 }} />
    </View>
  </View>;
}
