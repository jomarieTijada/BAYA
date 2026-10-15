import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { VideoIntroduction } from '../../../content/types';
import { FontFamily, Spacing } from '../../../constants/theme';
import { BayaMascot } from '../../branding/BayaMascot';

/** A separate welcome slide; the video is revealed only after the learner continues. */
export function LessonVideoIntroduction({ introduction, compact = false, landscapeCompact = false }: { introduction: VideoIntroduction; compact?: boolean; landscapeCompact?: boolean }) {
  return <ScrollView style={styles.slide} contentContainerStyle={[styles.introduction, compact && styles.compact, landscapeCompact && styles.landscape]} testID="lesson-video-introduction">
    <View style={[styles.content, landscapeCompact && styles.contentLandscape]}>
      <BayaMascot decorative size={landscapeCompact ? 80 : compact ? 144 : 220} state="wave" autoplay={process.env.NODE_ENV !== 'test'} />
      <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact, landscapeCompact && styles.titleLandscape]}>{introduction.title}</Text>
      <Text style={[styles.body, compact && styles.bodyCompact, landscapeCompact && styles.bodyLandscape]}>{introduction.body}</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  slide: { flex: 1, minHeight: 0 },
  introduction: { padding: Spacing.lg, flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  compact: { padding: Spacing.md },
  landscape: { paddingVertical: Spacing.xs },
  content: { alignItems: 'center', gap: Spacing.md, maxWidth: 760, width: '100%' },
  contentLandscape: { gap: Spacing.xs },
  title: { fontFamily: FontFamily.rounded, fontWeight: '900', color: '#26180D', fontSize: 42, lineHeight: 50, textAlign: 'center' },
  titleCompact: { fontSize: 28, lineHeight: 34 },
  titleLandscape: { fontSize: 24, lineHeight: 29 },
  body: { fontFamily: FontFamily.body, fontWeight: '500', color: '#342214', fontSize: 22, lineHeight: 34, textAlign: 'center' },
  bodyCompact: { fontSize: 18, lineHeight: 28 },
  bodyLandscape: { fontSize: 16, lineHeight: 24 },
});
