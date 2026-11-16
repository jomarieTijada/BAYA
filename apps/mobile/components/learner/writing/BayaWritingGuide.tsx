import { Text } from '../../../localization/components';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FontFamily, Spacing } from '../../../constants/theme';
import { SpeechBubbleTail } from '../../ui/SpeechBubbleTail';
import { speechBubbleStyles, SpeechBubbleColors } from '../../ui/speechBubbleStyles';
import { BayaMascot } from '../../branding/BayaMascot';
import { isValidWritingResult } from '../../../content/writingMastery';
import { type RecognitionState } from './recognitionPresentation';
import { RecognitionMatchRow } from './RecognitionMatchRow';
import { useLoadingEllipsis } from './useLoadingEllipsis';

export function BayaWritingGuide({ recognition, targetClass, mascotSize, dense = false, fillHeight = false, showMascot = true }: { recognition: RecognitionState; targetClass: string; mascotSize: number; dense?: boolean; fillHeight?: boolean; showMascot?: boolean }) {
  const [bubbleWidth, setBubbleWidth] = useState(0);
  const loadingDots = useLoadingEllipsis(recognition.status === 'analyzing');
  let result;
  if (recognition.status === 'success') {
    result = recognition;
  } else {
    result = null;
  }
  const top = result?.prediction;
  const matchesTarget = Boolean(result && isValidWritingResult(targetClass, [result.prediction]));
  let density: 'regular' | 'tight' | 'compact';
  if (bubbleWidth > 0 && bubbleWidth < 170) {
    density = 'tight';
  } else {
    if (dense || (bubbleWidth > 0 && bubbleWidth < 240)) {
      density = 'compact';
    } else {
      density = 'regular';
    }
  }

  return <View style={[styles.root, dense && styles.denseRoot, fillHeight && styles.fillHeight]} testID="baya-writing-guide">
    <View accessibilityLiveRegion="polite" onLayout={event => { const width = event.nativeEvent.layout.width; if (Math.abs(width - bubbleWidth) > 1) setBubbleWidth(width); }} style={[styles.bubble, dense && styles.denseBubble, result && styles.resultBubble, result && density !== 'regular' && styles.compactResultBubble, result && density === 'tight' && styles.tightResultBubble]} testID="baya-result-bubble">
      {(() => {
        if (result && top) {
          return <View style={[styles.resultContent, density !== 'regular' && styles.compactResultContent]}>
        <RecognitionMatchRow density={density} prediction={top} />
        <Text style={[styles.status, density !== 'regular' && styles.compactStatus, (() => {
          if (matchesTarget) {
            return styles.correctStatus;
          } else {
            return styles.retryStatus;
          }
        })()]} testID="baya-correctness-message">
          {(() => {
            if (matchesTarget) {
              return 'Mahusay!';
            } else {
              return 'Malapit na!';
            }
          })()}
        </Text>

      </View>;
        } else {
          return <Text style={[styles.message, dense && styles.denseMessage]} testID="baya-status-message">
        {(() => {
          if (recognition.status === 'analyzing') {
            return `Sinusuri ang sulat${loadingDots}`;
          } else if (recognition.status === 'rejected') {
            return 'No recognizable Baybayin character detected. Try again.';
          } else if (recognition.status === 'uncertain') {
            return 'Your writing is unclear. Try writing the character again.';
          } else {
            if (recognition.status === 'empty') {
              return 'Magsulat muna sa kahon bago suriin.';
            } else {
              if (recognition.status === 'error') {
                return 'Hindi masuri ni BAYA ang sulat. Subukan muli.';
              } else {
                return 'Magsulat na!';
              }
            }
          }
        })()}
      </Text>;
        }
      })()}
      {showMascot && <SpeechBubbleTail position="bottom" size={(() => {
        if (dense) {
          return 'landscape';
        } else {
          return 'compact';
        }
      })()} />}
    </View>
    {showMascot && <View style={[styles.mascot, fillHeight && styles.fillMascot]}><BayaMascot crop="upperBody" decorative size={mascotSize} state={(() => {
      if (matchesTarget) {
        return 'wave';
      } else {
        return 'ambient';
      }
    })()} /></View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', flexDirection: 'column', gap: Spacing.sm, justifyContent: 'center', minWidth: 0, width: '100%' },
  denseRoot: { gap: Spacing.xs },
  fillHeight: { flex: 1, justifyContent: 'flex-start' },
  mascot: { alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  fillMascot: { flex: 1 },
  bubble: { ...speechBubbleStyles.surface, alignSelf: 'stretch', minWidth: 0, padding: Spacing.md },
  denseBubble: { ...speechBubbleStyles.landscape },
  resultBubble: { paddingHorizontal: 12, paddingVertical: 8 },
  compactResultBubble: { paddingHorizontal: 8, paddingVertical: 4 },
  tightResultBubble: { paddingHorizontal: 6, paddingVertical: 5 },
  message: { color: SpeechBubbleColors.text, fontFamily: FontFamily.rounded, fontSize: 15, fontWeight: '800', lineHeight: 20, minWidth: 0, textAlign: 'center' },
  denseMessage: { fontSize: 13, lineHeight: 16 },
  resultContent: { alignItems: 'stretch', gap: 2, minWidth: 0 },
  compactResultContent: { gap: 1 },
  status: { fontFamily: FontFamily.rounded, fontSize: 14, fontWeight: '800', lineHeight: 18, textAlign: 'center' },
  compactStatus: { fontSize: 12, lineHeight: 13 },
  correctStatus: { color: '#216E38' },
  retryStatus: { color: '#865600' },
});
