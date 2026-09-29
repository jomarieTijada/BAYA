import React from 'react';
import { Asset } from 'expo-asset';
import { Image as ExpoImage } from 'expo-image';
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

type BayaFrameRendererProps = {
  source: number;
  size: number;
  accessibilityLabel: string;
  crop: 'default' | 'upperBody';
  decorative: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Render one animation frame at a time inside the shared mascot slot. */
export function BayaFrameRenderer({
  source,
  size,
  accessibilityLabel,
  crop,
  decorative,
  style,
}: BayaFrameRendererProps) {
  const upperBody = crop === 'upperBody';
  const frameStyle = [
    styles.image,
    upperBody && styles.upperBodyImage,
    upperBody && {
      transform: [
        { scale: 1.7 },
        { translateY: Math.round(size * 0.04) },
      ],
    },
  ];
  const webSource = Platform.OS === 'web' ? Asset.fromModule(source).uri : null;

  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityRole={decorative ? undefined : 'image'}
      aria-hidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.viewport,
        { height: upperBody ? Math.round(size * 0.82) : size, width: size },
        style,
      ]}
      testID="baya-mascot"
    >
      {Platform.OS === 'web' ? (
        // Keep the same DOM image mounted while its already loaded source changes.
        // The React Native web Image loader clears its background during each swap.
        <img
          alt=""
          aria-hidden="true"
          decoding="sync"
          draggable={false}
          src={webSource ?? undefined}
          style={{
            display: 'block',
            height: '100%',
            left: 0,
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            transform: upperBody
              ? `scale(1.7) translateY(${Math.round(size * 0.04)}px)`
              : 'scale(1.42)',
            width: '100%',
          }}
        />
      ) : (
        <ExpoImage
          accessible={false}
          aria-hidden
          cachePolicy="memory-disk"
          contentFit="contain"
          loading="eager"
          priority="high"
          source={source}
          style={frameStyle}
          transition={0}
        />
      )}
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
    transform: [{ scale: 1.42 }],
    width: '100%',
  },
  upperBodyImage: {
    height: '100%',
    position: 'absolute',
    top: 0,
    width: '100%',
  },
});
