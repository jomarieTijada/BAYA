import React from 'react';
import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

type BayaFrameRendererProps = {
  source: number;
  size: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Expo Image keeps the previous decoded frame visible until the next source is ready.
 * This avoids the blank paint between source swaps produced by React Native Image on web.
 */
export function BayaFrameRenderer({
  source,
  size,
  accessibilityLabel,
  style,
}: BayaFrameRendererProps) {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[styles.viewport, { height: size, width: size }, style]}
      testID="baya-mascot"
    >
      <Image
        accessible={false}
        aria-hidden
        cachePolicy="memory-disk"
        contentFit="contain"
        loading="eager"
        priority="high"
        source={source}
        style={styles.image}
        transition={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    transform: [{ scale: 1.58 }],
    width: '100%',
  },
});
