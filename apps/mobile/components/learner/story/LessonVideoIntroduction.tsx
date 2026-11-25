import { Text } from '../../../localization/components';
import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import type { VideoIntroduction } from '../../../content/types';
import { Colors, FontFamily, Spacing } from '../../../constants/theme';
import { BayaMascot } from '../../branding/BayaMascot';

/** A separate welcome slide; the video is revealed only after the learner continues. */
export function LessonVideoIntroduction({ introduction, compact = false, landscapeCompact = false }: { introduction: VideoIntroduction; compact?: boolean; landscapeCompact?: boolean }) {
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const mascotSize = Math.min(320, landscape ? width * 0.3 : width * 0.44, height * 0.8);
  return <ScrollView style={styles.slide} contentContainerStyle={[styles.introduction, compact && styles.compact, landscapeCompact && styles.landscape]} testID="lesson-video-introduction">
    <View style={[styles.content, !landscape && styles.portrait]}>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, landscapeCompact && styles.titleLandscape]}>{introduction.title}</Text>
        <Text style={[styles.body, compact && styles.bodyCompact, landscapeCompact && styles.bodyLandscape]}>{introduction.body}</Text>
      </View>
      <View style={[styles.mascot, { width: mascotSize, height: Math.round(mascotSize * 0.65) }]}>
        <BayaMascot decorative crop="upperBody" size={mascotSize} state="wave" autoplay={process.env.NODE_ENV !== 'test'} />
      </View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  slide: { flex: 1, minHeight: 0 },
  introduction: { padding: Spacing.lg, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  compact: { padding: Spacing.md },
  landscape: { paddingVertical: Spacing.xs },
  content: { flexDirection: 'row', alignItems: 'center', gap: 24, maxWidth: 1040, width: '100%' },
  portrait: { flexDirection: 'column', gap: 16 },
  copy: { flex: 1, minWidth: 0, gap: 14 },
  mascot: { overflow: 'hidden', flexShrink: 0 },
  title: { fontFamily: FontFamily.rounded, fontWeight: '900', color: Colors.accent, fontSize: 42, lineHeight: 50, textAlign: 'left' },
  titleCompact: { fontSize: 28, lineHeight: 34 },
  titleLandscape: { fontSize: 24, lineHeight: 29 },
  body: { fontFamily: FontFamily.body, fontWeight: '500', color: '#342214', fontSize: 22, lineHeight: 34, textAlign: 'left' },
  bodyCompact: { fontSize: 18, lineHeight: 28 },
  bodyLandscape: { fontSize: 16, lineHeight: 24 },
});
