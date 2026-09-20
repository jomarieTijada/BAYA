import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { BayaFrameRenderer } from './baya/BayaFrameRenderer';
import { type BayaMascotState } from './baya/animationAssets';
import { useBayaAnimation } from './baya/useBayaAnimation';

export type { BayaMascotState } from './baya/animationAssets';

type BayaMascotProps = {
  state?: BayaMascotState;
  size: number;
  accessibilityLabel?: string;
  autoplay?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Public mascot API. Layout callers do not need to know how frames are rendered. */
export function BayaMascot({
  state = 'ambient',
  size,
  accessibilityLabel = 'BAYA, the Baybayin learning mascot',
  autoplay = true,
  loop = true,
  style,
}: BayaMascotProps) {
  const { source } = useBayaAnimation({ state, autoplay, loop });

  return (
    <BayaFrameRenderer
      accessibilityLabel={accessibilityLabel}
      size={size}
      source={source}
      style={style}
    />
  );
}
