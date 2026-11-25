import React, { useState, type ComponentProps, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Colors, Radius, ResponsiveLayout, Spacing } from '../../../constants/theme';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { getBaybayinTracingGuide } from '../../../content/baybayinTracingGuides';
import type { WritingExercise } from '../../../content/writingLessonData';
import { CharacterReferenceCard } from './CharacterReferenceCard';
import { WritingInstructions } from './WritingInstructions';
import { WritingToolbar } from './WritingToolbar';
import { WritingCanvas } from './WritingCanvas';
import { ConfidenceCard } from './ConfidenceCard';
import { BayaWritingGuide } from './BayaWritingGuide';
import { getWritingLayout } from './writingLayout';
import type { RecognitionState } from './recognitionPresentation';
import type { WritingGuideTargets } from './WritingHelpGuide';
import type { WritingActionPhase } from './WritingNavigation';

type Density = {compact: boolean; dense: boolean};
type Props = {
 exercise: WritingExercise; targetKey: string;
 instruction: ComponentProps<typeof WritingInstructions>;
 toolbar: ComponentProps<typeof WritingToolbar>;
 canvas: Omit<ComponentProps<typeof WritingCanvas>, 'compact' | 'dense' | 'fillHeight' | 'hintImage'>;
 recognition: RecognitionState; phase: WritingActionPhase;
 action: (density: Density) => ReactNode;
 progress?: (density: Density) => ReactNode;
 guideTargets?: WritingGuideTargets;
 assessment?: boolean; context?: ReactNode; status?: ReactNode; diagnostic?: ReactNode;
};
/** Canonical lesson presentation. Adapters own inference, persistence and progression. */
export function WritingPracticeLayout({exercise, toolbar, canvas, recognition, phase, action, progress, guideTargets, assessment, context, status, diagnostic}: Props) {
 const {width,height} = useResponsiveLayout();
 const [available,setAvailable] = useState({width,height});
 const {columns,compact,dense} = getWritingLayout(assessment && width > height ? Math.max(600, available.width) : available.width,available.height);
 const referenceTarget=guideTargets?.reference, canvasTarget=guideTargets?.canvas;
 const mascotSize=Math.min(190, available.width * .19, available.height * .43);
 return (
    <ScrollView testID="canonical-writing-layout" contentContainerStyle={[styles.scrollContent, dense && styles.denseScrollContent, { paddingHorizontal: (() => {
      if (available.width < 700 || dense) {
        return ResponsiveLayout.pagePadding.phone;
      } else {
        return ResponsiveLayout.pagePadding.desktop;
      }
    })() }]} keyboardShouldPersistTaps="handled" onLayout={event => { const { width: measuredWidth, height: measuredHeight } = event.nativeEvent.layout; if (measuredWidth !== available.width || measuredHeight !== available.height) setAvailable({ width: measuredWidth, height: measuredHeight }); }} style={styles.scroll}>
      <View style={[styles.columns, dense && styles.denseColumns, columns === 1 && styles.stack, columns === 3 && styles.desktopColumns, columns === 3 && { height: Math.max(0, available.height - ((() => {
        if (dense) {
          return Spacing.xs * 2;
        } else {
          return Spacing.md + Spacing.lg;
        }
      })())) }]}>
        <View ref={referenceTarget} collapsable={false} testID="writing-reference-panel" style={[styles.referenceColumn, columns === 1 && styles.stackColumn, columns === 2 && styles.twoColumn]}>
          {context}
          <CharacterReferenceCard compact={compact} dense={dense} exercise={exercise} fullHeight={columns === 3} />
        </View>
        <View style={[styles.canvasColumn, columns === 1 && styles.stackColumn, columns === 2 && styles.twoColumn]}>
          <View style={[styles.canvasCard, dense && styles.denseCanvasCard, columns === 3 && styles.tallCard]}>
            <WritingToolbar {...toolbar} dense />
            <WritingCanvas {...canvas} targetRef={canvasTarget} compact={compact} dense={dense} fillHeight={columns === 3} hintImage={getBaybayinTracingGuide(exercise.characterId)} />
          </View>
        </View>
        <View testID="writing-feedback-panel" style={[styles.feedbackColumn, dense && styles.denseFeedbackColumn, columns === 1 && styles.stackColumn, columns === 2 && styles.rowFullColumn, columns === 3 && { maxHeight: Math.max(0, available.height - ((() => {
          if (dense) {
            return Spacing.xs * 2;
          } else {
            return Spacing.md + Spacing.lg;
          }
        })())) }]}>
          <ConfidenceCard assessment={assessment} dense={dense} embedded guideTargets={guideTargets} phase={phase} action={action({ compact, dense })} progress={progress?.({ compact, dense })}>
          {status}
          <BayaWritingGuide fillHeight dense={dense} mascotSize={mascotSize} recognition={recognition} targetClass={exercise.characterId} />
          {diagnostic}
          </ConfidenceCard>
        </View>
      </View>
    </ScrollView>
 );
}

const styles = StyleSheet.create({

  scroll: { flex: 1, minHeight: 0, width: '100%' },
  scrollContent: { flexGrow: 1, paddingBottom: Spacing.lg, paddingTop: Spacing.md, width: '100%' },
  denseScrollContent: { paddingBottom: Spacing.xs, paddingTop: Spacing.xs },
  columns: { alignItems: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, width: '100%' },
  denseColumns: { gap: Spacing.sm },
  desktopColumns: { flexWrap: 'nowrap' },
  stack: { flexDirection: 'column', flexWrap: 'nowrap' },
  referenceColumn: { flex: 0.75, minWidth: 0 },
  canvasColumn: { flex: 2.35, minWidth: 0 },
  feedbackColumn: { alignSelf: 'stretch', backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, flex: 1.05, gap: Spacing.sm, minWidth: 0, padding: Spacing.md },
  denseFeedbackColumn: { gap: Spacing.xs, padding: Spacing.sm },
  twoColumn: { flexBasis: '46%', flexGrow: 1 },
  stackColumn: { flexBasis: 'auto', flexGrow: 0, flexShrink: 0, width: '100%' },
  rowFullColumn: { flexBasis: '100%', flexGrow: 0, width: '100%' },
  canvasCard: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.sm, minWidth: 0, padding: Spacing.md, width: '100%' },
  denseCanvasCard: { gap: Spacing.xs, padding: Spacing.sm },
  tallCard: { flex: 1 },
});
