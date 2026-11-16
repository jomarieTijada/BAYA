import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SpeechBubbleColors } from './speechBubbleStyles';

/** Same open-base curved pointer as the original bundled lesson SVG. */
export function SpeechBubbleTail({ position, size = 'regular' }: { position: 'right' | 'bottom'; size?: 'regular' | 'tablet' | 'compact' | 'landscape' }) {
  const [depth, breadth] = { regular: [28, 36], tablet: [24, 30], compact: [20, 26], landscape: [16, 20] }[size];
  const bottom = position === 'bottom';
  return <View pointerEvents="none" aria-hidden accessible={false} testID={`speech-tail-${position}`} style={[
    { position: 'absolute', zIndex: 2, width: (() => {
      if (bottom) {
        return breadth;
      } else {
        return depth;
      }
    })(), height: (() => {
      if (bottom) {
        return depth;
      } else {
        return breadth;
      }
    })() },
    (() => {
      if (bottom) {
        return { bottom: -depth + 3, left: '50%', marginLeft: -breadth / 2 };
      } else {
        return { right: -depth + 3, top: '50%', marginTop: -breadth / 2 };
      }
    })(),
  ]}>
    <Svg width="100%" height="100%" viewBox={(() => {
      if (bottom) {
        return '0 0 36 28';
      } else {
        return '0 0 28 36';
      }
    })()} aria-hidden focusable={false}>
      <Path transform={(() => {
        if (bottom) {
          return 'matrix(0 1 -1 0 36 0)';
        } else {
          return undefined;
        }
      })()} d="M 0,1 Q 12,9 26,18 Q 12,27 0,35 Z" fill={SpeechBubbleColors.paper} />
      <Path transform={(() => {
        if (bottom) {
          return 'matrix(0 1 -1 0 36 0)';
        } else {
          return undefined;
        }
      })()} d="M 0,1 Q 12,9 26,18 Q 12,27 0,35" fill="none" stroke={SpeechBubbleColors.border} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  </View>;
}
