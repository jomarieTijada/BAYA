import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius, Shadows, Spacing } from '../../../constants/theme';
import { AppIcon } from '../../ui/AppIcon';
import { ActivityCard } from '../cards/ActivityCard';
import { VideoPlayer } from '../../media/VideoPlayer';
import { resolveStaticMediaUri } from '../../media/mediaResolver';
import type { VideoSource, VideoStepContent } from './activityData';
import { LessonVideoIntroduction } from '../story/LessonVideoIntroduction';
import { AppButton } from '../../ui/AppButton';
import { VideoCreditLink } from '../story/VideoCreditLink';

export type VideoPlayState = 'not_started' | 'playing' | 'completed';

export type VideoActivityCardProps = {
  compact?: boolean;
  content: VideoStepContent;
  isWatched?: boolean;
  landscapeCompact?: boolean;
  onWatch?: () => void;
  title?: string;
  videoSource?: VideoSource;
};

/**
 * Resolves any video source format into a concrete URL string.
 */
export function resolveVideoUri(source: any): string | null {
  if (!source) return null;
  if (typeof source === 'object' && 'type' in source) {
    return resolveStaticMediaUri(source);
  }
  return resolveStaticMediaUri({ type: 'local', source });
}

/**
 * Child-friendly Fullscreen Video Activity Card.
 * The video surface occupies the majority of the learning card.
 * Contains only: Title area, Video player, and Controls.
 */
export function VideoActivityCard({
  compact = false,
  content,
  landscapeCompact = false,
  onWatch,
  title,
  videoSource,
}: VideoActivityCardProps) {
  const displayTitle = content.title || title || 'Video';
  const displayBadge = content.badge || 'PANOORIN';
  const resolvedSource = videoSource !== undefined ? videoSource : content.source;
  const [showIntroduction, setShowIntroduction] = useState(Boolean(content.introduction));

  if (showIntroduction && content.introduction) {
    return <View style={styles.introSlide}>
      <LessonVideoIntroduction introduction={content.introduction} compact={compact} landscapeCompact={landscapeCompact} />
      <AppButton accessibilityLabel="Panoorin ang Video" label="Panoorin ang Video" compact={compact} onPress={() => setShowIntroduction(false)} />
    </View>;
  }

  return (
    <ActivityCard
      type="video"
      icon={null}
      style={[
        styles.card,
        compact && styles.cardCompact,
        landscapeCompact && styles.cardLandscapeCompact,
      ]}
      testID="video-activity-card"
    >
      {/* Category Badge & Video Title */}
      <View style={styles.titleRow}>
        <View style={styles.videoBadge}>
          <AppIcon color="accent" name="video" size={landscapeCompact ? 12 : 14} />
          <Text style={styles.videoBadgeText}>{displayBadge.toUpperCase()}</Text>
        </View>

        <Text
          accessibilityRole="header"
          numberOfLines={1}
          style={[
            styles.titleText,
            compact && styles.titleTextCompact,
            landscapeCompact && styles.titleTextLandscapeCompact,
          ]}
        >
          {displayTitle}
        </Text>
      </View>

      {content.credit ? <VideoCreditLink credit={content.credit} /> : null}
      {/* Main Video Learning Viewport: Delegated to VideoPlayer */}
      <VideoPlayer
        compact={compact}
        isLandscapeCompact={landscapeCompact}
        metadata={content.metadata}
        onEnd={onWatch}
        source={resolvedSource}
        title={displayTitle}
      />
    </ActivityCard>
  );
}

// Re-export backward-compatible alias
export const VideoLessonCard = VideoActivityCard;

const styles = StyleSheet.create({
  introSlide: { flex: 1, minHeight: 0 },
  card: {
    alignItems: 'stretch',
    backgroundColor: '#FFFDF9',
    borderColor: '#EFE7DA',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    flex: 1,
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: Spacing.md,
    position: 'relative',
    width: '100%',
    zIndex: 1,
    ...Shadows.card,
  },
  cardCompact: {
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
  },
  cardLandscapeCompact: {
    padding: Spacing.xs + 2,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs + 2,
  },
  videoBadge: {
    alignItems: 'center',
    backgroundColor: '#FFE9D4',
    borderColor: '#FFD3B5',
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  videoBadgeText: {
    color: Colors.rolePrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  titleText: {
    color: Colors.textPrimary,
    flex: 1,
    fontFamily: FontFamily.rounded,
    fontSize: 14,
    fontWeight: '800',
  },
  titleTextCompact: {
    fontSize: 13,
  },
  titleTextLandscapeCompact: {
    fontSize: 11.5,
    includeFontPadding: false,
  },
});
