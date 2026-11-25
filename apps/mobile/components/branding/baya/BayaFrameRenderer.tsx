import React from 'react';
import { BayaWebFrame } from './BayaWebFrame';
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
  let webSource;
  if (Platform.OS === 'web') {
    webSource = Asset.fromModule(source).uri;
  } else {
    webSource = null;
  }

  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={(() => {
        if (decorative) {
          return undefined;
        } else {
          return accessibilityLabel;
        }
      })()}
      accessibilityRole={(() => {
        if (decorative) {
          return undefined;
        } else {
          return 'image';
        }
      })()}
      aria-hidden={decorative}
      importantForAccessibility={(() => {
        if (decorative) {
          return 'no-hide-descendants';
        } else {
          return 'auto';
        }
      })()}
      style={[
        styles.viewport,
        { height: (() => {
          if (upperBody) {
            return Math.round(size * 0.82);
          } else {
            return size;
          }
        })(), width: size },
        style,
      ]}
      testID="baya-mascot"
    >
      {(() => {
        if (Platform.OS === 'web') {
          return (
        <BayaWebFrame
          uri={webSource ?? ''}
          style={{
            display: 'block',
            height: '100%',
            left: 0,
            objectFit: 'contain',
            position: 'absolute',
            top: 0,
            transform: (() => {
              if (upperBody) {
                return `scale(1.7) translateY(${Math.round(size * 0.04)}px)`;
              } else {
                return 'scale(1.42)';
              }
            })(),
            width: '100%',
          }}
        />
      );
        } else {
          return (
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
      );
        }
      })()}
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
