import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import { BayaMascot } from '../../branding/BayaMascot';
import { isValidWritingResult } from '../../../content/writingMastery';
import { type RecognitionState } from './recognitionPresentation';
import { RecognitionMatchRow } from './RecognitionMatchRow';
import { useLoadingEllipsis } from './useLoadingEllipsis';

export function BayaWritingGuide({ recognition, targetClass, mascotSize, dense = false, fillHeight = false }: { recognition: RecognitionState; targetClass: string; mascotSize: number; dense?: boolean; fillHeight?: boolean }) {
  const [bubbleWidth, setBubbleWidth] = useState(0);
  const loadingDots = useLoadingEllipsis(recognition.status === 'analyzing');
  const result = recognition.status === 'success' ? recognition : null;
  const top = result?.predictions[0];
  const matchesTarget = Boolean(result && isValidWritingResult(targetClass, result.predictions));
  const bubbleBorder = result ? (matchesTarget ? '#91CCA0' : '#EBC48B') : '#F3CCA5';
  const bubbleBackground = result && matchesTarget ? '#F3FAF0' : '#FFF9EE';
  const density = bubbleWidth > 0 && bubbleWidth < 170 ? 'tight' : dense || (bubbleWidth > 0 && bubbleWidth < 240) ? 'compact' : 'regular';

  return <View style={[styles.root, dense && styles.denseRoot, fillHeight && styles.fillHeight]} testID="baya-writing-guide">
    <View accessibilityLiveRegion="polite" onLayout={event => { const width = event.nativeEvent.layout.width; if (Math.abs(width - bubbleWidth) > 1) setBubbleWidth(width); }} style={[styles.bubble, dense && styles.denseBubble, result && styles.resultBubble, result && density !== 'regular' && styles.compactResultBubble, result && density === 'tight' && styles.tightResultBubble, { borderColor: bubbleBorder, backgroundColor: bubbleBackground }]} testID="baya-result-bubble">
      {result && top ? <View style={[styles.resultContent, density !== 'regular' && styles.compactResultContent]}>
        <RecognitionMatchRow density={density} label={top.label} primary probability={top.probability} rank={1} />
        <Text style={[styles.status, density !== 'regular' && styles.compactStatus, matchesTarget ? styles.correctStatus : styles.retryStatus]} testID="baya-correctness-message">
          {matchesTarget ? 'Mahusay!' : 'Malapit na!'}
        </Text>
        {result.predictions.length > 1 && <View style={[styles.otherMatches, density !== 'regular' && styles.compactOtherMatches]}>
          <Text style={[styles.otherHeading, density !== 'regular' && styles.compactOtherHeading]}>Iba pang nasuri</Text>
          {result.predictions.slice(1, 3).map((prediction, index) => <RecognitionMatchRow density={density} key={`${prediction.classIndex}-${index}`} label={prediction.label} probability={prediction.probability} rank={index + 2} />)}
        </View>}
      </View> : <Text style={[styles.message, dense && styles.denseMessage]} testID="baya-status-message">
        {recognition.status === 'analyzing' ? `Sinusuri ang sulat${loadingDots}`
          : recognition.status === 'empty' ? 'Magsulat muna sa kahon bago suriin.'
            : recognition.status === 'error' ? 'Hindi masuri ni BAYA ang sulat. Subukan muli.'
              : 'Magsulat na!'}
      </Text>}
      <View pointerEvents="none" style={[styles.tailBorder, { borderTopColor: bubbleBorder }]} />
      <View pointerEvents="none" style={[styles.tailFill, { borderTopColor: bubbleBackground }]} />
    </View>
    <BayaMascot crop="upperBody" decorative size={mascotSize} state={matchesTarget ? 'wave' : 'ambient'} />
  </View>;
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', flexDirection: 'column', gap: Spacing.sm, justifyContent: 'center', minWidth: 0, width: '100%' },
  denseRoot: { gap: Spacing.xs },
  fillHeight: { flex: 1, justifyContent: 'flex-end' },
  bubble: { alignSelf: 'stretch', borderRadius: Radius.lg, borderWidth: 1, minWidth: 0, padding: Spacing.md, position: 'relative' },
  denseBubble: { padding: Spacing.xs },
  resultBubble: { paddingHorizontal: 12, paddingVertical: 8 },
  compactResultBubble: { paddingHorizontal: 8, paddingVertical: 4 },
  tightResultBubble: { paddingHorizontal: 6, paddingVertical: 5 },
  message: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 15, fontWeight: '800', lineHeight: 20, minWidth: 0, textAlign: 'center' },
  denseMessage: { fontSize: 13, lineHeight: 16 },
  resultContent: { alignItems: 'stretch', gap: 2, minWidth: 0 },
  compactResultContent: { gap: 1 },
  status: { fontFamily: FontFamily.rounded, fontSize: 14, fontWeight: '800', lineHeight: 18, textAlign: 'center' },
  compactStatus: { fontSize: 12, lineHeight: 13 },
  correctStatus: { color: '#216E38' },
  retryStatus: { color: '#865600' },
  otherMatches: { borderTopColor: Colors.border, borderTopWidth: 1, gap: 1, marginTop: 2, paddingTop: 4 },
  compactOtherMatches: { marginTop: 0, paddingTop: 1 },
  otherHeading: { color: Colors.textSecondary, fontFamily: FontFamily.rounded, fontSize: 12, fontWeight: '800', marginBottom: 1, textAlign: 'center' },
  compactOtherHeading: { fontSize: 10, lineHeight: 12, marginBottom: 0 },
  tailBorder: { borderLeftColor: 'transparent', borderLeftWidth: 9, borderRightColor: 'transparent', borderRightWidth: 9, borderTopWidth: 10, bottom: -10, height: 0, left: '50%', marginLeft: -9, position: 'absolute', width: 0 },
  tailFill: { borderLeftColor: 'transparent', borderLeftWidth: 7, borderRightColor: 'transparent', borderRightWidth: 7, borderTopWidth: 8, bottom: -7, height: 0, left: '50%', marginLeft: -7, position: 'absolute', width: 0 },
});
