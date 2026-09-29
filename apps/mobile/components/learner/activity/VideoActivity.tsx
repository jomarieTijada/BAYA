import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius, Shadows, Spacing } from '../../../constants/theme';
import { AppIcon } from '../../ui/AppIcon';
import type { VideoData } from './activityData';

type VideoActivityProps = {
  compact?: boolean;
  isWatched?: boolean;
  landscapeCompact?: boolean;
  onWatched?: () => void;
  video: VideoData;
};

/**
 * Kid-friendly Video Player Card.
 * Uses BAYA cream/orange theme with large AppIcon play button.
 * Includes reusable placeholder layout when media file is pending.
 */
export function VideoActivity({
  compact = false,
  isWatched = false,
  landscapeCompact = false,
  onWatched,
  video,
}: VideoActivityProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playHovered, setPlayHovered] = useState(false);
  const [playFocused, setPlayFocused] = useState(false);

  const handlePlayToggle = () => {
    setIsPlaying((prev) => !prev);
    onWatched?.();
  };

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        landscapeCompact && styles.containerLandscapeCompact,
      ]}
      testID="video-activity"
    >
      {/* Top Badge & Video Title */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <AppIcon color="accent" name="video" size={landscapeCompact ? 13 : 16} />
          <Text style={styles.badgeText}>PANIMULANG VIDEO</Text>
        </View>
        <Text
          accessibilityRole="header"
          style={[
            styles.title,
            compact && styles.titleCompact,
            landscapeCompact && styles.titleLandscapeCompact,
          ]}
        >
          {video.title}
        </Text>
      </View>

      {/* Video Player Card Frame */}
      <View
        accessibilityLabel={`Pampalabas ng video: ${video.title}`}
        accessibilityRole="image"
        style={[
          styles.playerWrapper,
          compact && styles.playerWrapperCompact,
          landscapeCompact && styles.playerWrapperLandscapeCompact,
        ]}
      >
        <Pressable
          accessibilityHint={isPlaying ? 'Ihinto muna ang video' : 'Panoorin ang video tungkol sa Baybayin'}
          accessibilityLabel={
            isPlaying ? 'Ihinto muna ang panimulang video' : 'Panoorin ang panimulang video'
          }
          accessibilityRole="button"
          onBlur={() => setPlayFocused(false)}
          onFocus={() => setPlayFocused(true)}
          onHoverIn={() => setPlayHovered(true)}
          onHoverOut={() => setPlayHovered(false)}
          onPress={handlePlayToggle}
          style={[
            styles.playerCanvas,
            (playHovered || playFocused) && styles.playerCanvasHovered,
          ]}
        >
          {/* Friendly Organic Backdrop Pill Elements */}
          <View accessibilityElementsHidden style={styles.playerBackdrop}>
            <View style={styles.backdropPill1} />
            <View style={styles.backdropPill2} />
          </View>

          {/* Large Central Play Button */}
          <View
            style={[
              styles.playButtonCircle,
              compact && styles.playButtonCircleCompact,
              isPlaying && styles.playButtonCircleActive,
              (playHovered || playFocused) && styles.playButtonCircleHovered,
            ]}
          >
            <AppIcon
              color="onPrimary"
              name={isPlaying ? 'close' : 'play'}
              size={landscapeCompact ? 24 : compact ? 28 : 36}
            />
          </View>

          {/* Video Status Meta Overlay */}
          <View style={styles.playerMeta}>
            <Text style={styles.playerStatusText}>
              {isPlaying ? 'Ipinapalabas ang Video' : video.durationText ? `Panoorin · ${video.durationText}` : 'Panoorin ang Video'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Video Content Placeholder Layout */}
      {!video.isAvailable ? (
        <View
          style={[
            styles.placeholderCard,
            compact && styles.placeholderCardCompact,
            landscapeCompact && styles.placeholderCardLandscapeCompact,
          ]}
        >
          <AppIcon color="muted" name="cloud" size={compact ? 18 : 22} />
          <View style={styles.placeholderTextWrapper}>
            <Text
              style={[
                styles.placeholderTitle,
                compact && styles.placeholderTitleCompact,
                landscapeCompact && styles.placeholderTitleLandscapeCompact,
              ]}
            >
              Video unavailable / Content will be loaded
            </Text>
            <Text
              style={[
                styles.placeholderDescription,
                compact && styles.placeholderDescriptionCompact,
                landscapeCompact && styles.placeholderDescriptionLandscapeCompact,
              ]}
            >
              Ang video na &ldquo;{video.title}&rdquo; ay awtomatikong maglo-load kapag nakakabit ang media file o remote stream.
            </Text>
          </View>
          {isWatched ? (
            <View style={styles.watchedBadge}>
              <AppIcon color="success" name="check" size={14} />
              <Text style={styles.watchedText}>Napanood na</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: '#FFFDF9',
    borderColor: '#EFE7DA',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    width: '100%',
    ...Shadows.card,
  },
  containerCompact: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  containerLandscapeCompact: {
    padding: Spacing.sm + 2,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#FFE9D4',
    borderColor: '#FFD3B5',
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: Colors.rolePrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 22,
    fontWeight: '900',
    marginTop: Spacing.xs + 2,
  },
  titleCompact: {
    fontSize: 18,
    marginTop: Spacing.xs,
  },
  titleLandscapeCompact: {
    fontSize: 15,
    includeFontPadding: false,
    marginTop: 2,
  },
  playerWrapper: {
    borderRadius: Radius.lg,
    height: 280,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  playerWrapperCompact: {
    height: 200,
  },
  playerWrapperLandscapeCompact: {
    height: 140,
  },
  playerCanvas: {
    alignItems: 'center',
    backgroundColor: '#27201A',
    borderRadius: Radius.lg,
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  playerCanvasHovered: {
    opacity: 0.96,
  },
  playerBackdrop: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backdropPill1: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radius.full,
    height: 240,
    position: 'absolute',
    transform: [{ rotate: '25deg' }],
    width: 240,
  },
  backdropPill2: {
    backgroundColor: 'rgba(250, 166, 31, 0.08)',
    borderRadius: Radius.full,
    height: 320,
    position: 'absolute',
    transform: [{ rotate: '-35deg' }],
    width: 320,
  },
  playButtonCircle: {
    alignItems: 'center',
    backgroundColor: Colors.rolePrimary,
    borderColor: '#FFA20A',
    borderRadius: Radius.full,
    borderWidth: 3,
    height: 64,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    width: 64,
    zIndex: 2,
  },
  playButtonCircleCompact: {
    height: 48,
    width: 48,
  },
  playButtonCircleActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#50B946',
  },
  playButtonCircleHovered: {
    transform: [{ scale: 1.06 }],
  },
  playerMeta: {
    alignItems: 'center',
    bottom: 12,
    position: 'absolute',
    zIndex: 2,
  },
  playerStatusText: {
    color: '#FFF5EA',
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  placeholderCard: {
    alignItems: 'center',
    backgroundColor: '#FAF5EE',
    borderColor: '#E7DDD0',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  placeholderCardCompact: {
    gap: 8,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  placeholderCardLandscapeCompact: {
    gap: 6,
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  placeholderTextWrapper: {
    flex: 1,
  },
  placeholderTitle: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: '800',
  },
  placeholderTitleCompact: {
    fontSize: 12,
  },
  placeholderTitleLandscapeCompact: {
    fontSize: 11,
    includeFontPadding: false,
  },
  placeholderDescription: {
    color: Colors.textSecondary,
    fontFamily: FontFamily.body,
    fontSize: 12,
    marginTop: 2,
  },
  placeholderDescriptionCompact: {
    fontSize: 11,
    marginTop: 1,
  },
  placeholderDescriptionLandscapeCompact: {
    fontSize: 10,
    includeFontPadding: false,
    marginTop: 0,
  },
  watchedBadge: {
    alignItems: 'center',
    backgroundColor: '#E7F6E4',
    borderColor: '#C7EAC1',
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  watchedText: {
    color: '#2E7D32',
    fontFamily: FontFamily.rounded,
    fontSize: 11,
    fontWeight: '800',
  },
});
