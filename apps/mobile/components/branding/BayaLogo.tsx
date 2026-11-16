import { AccessibilityView, Text } from '../../localization/components';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';

type BayaLogoProps = {
  size?: number;
};

const LETTERS = [
  { letter: 'B', color: Colors.bayaGreen },
  { letter: 'A', color: Colors.bayaOrange },
  { letter: 'Y', color: Colors.bayaBlue },
  { letter: 'A', color: Colors.bayaRed },
] as const;

export function BayaLogo({ size = 96 }: BayaLogoProps) {
  return (
    <AccessibilityView
      accessible
      accessibilityLabel="BAYA"
      accessibilityRole="header"
      style={styles.row}
    >
      {LETTERS.map(({ letter, color }, index) => (
        <Text
          key={`${letter}-${index}`}
          aria-hidden
          style={[styles.letter, { color, fontSize: size, lineHeight: size * 1.06 }]}
        >
          {letter}
        </Text>
      ))}
    </AccessibilityView>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: FontFamily.rounded,
    fontWeight: '900',
    letterSpacing: -3,
  },
});
