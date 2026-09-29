import { TopicCard } from "./TopicCard";
import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, FontFamily, Radius, Spacing } from "../../../constants/theme";
import { FilipinoLabels } from '../../../constants/filipinoLabels';
import { AppIcon } from "../../ui/AppIcon";
import { BaseCard, type BaseCardProps } from "../../ui/cards/BaseCard";
import type { LessonItem } from "../../../content/modules/catalog";

export const LessonCardWidth = {
  regular: 300,
  compact: 268,
  landscapeCompact: 256,
} as const;

type LessonCardProps = Pick<
  BaseCardProps,
  | "variant"
  | "size"
  | "theme"
  | "icon"
  | "header"
  | "content"
  | "footer"
  | "status"
> & {
  compact?: boolean;
  isLandscapeCompact?: boolean;
  lesson: LessonItem;
  onContinue?: () => void;
  onPress?: () => void;
  totalLessons: number;
};

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (AccessibilityInfo?.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((enabled) => {
          if (mounted) {
            setReduceMotion(enabled);
          }
        })
        .catch(() => undefined);
    }

    const subscription = AccessibilityInfo?.addEventListener?.(
      "reduceMotionChanged",
      (enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      },
    );

    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reduceMotion;
}

/**
 * Reusable Lesson Card displaying approved topic checklists and progression.
 * Removes AI-generated summaries and educational fluff.
 * Fully responsive across desktop, tablet, landscape phone, and portrait phone.
 */
export function LessonCard({
  compact = false,
  isLandscapeCompact = false,
  lesson,
  onContinue,
  onPress,
  totalLessons,
  ...cardProps
}: LessonCardProps) {
  const isReduceMotion = useReducedMotion();
  const isCompleted = lesson.status === "completed";
  const isCurrent = lesson.status === "current";
  const isLocked = lesson.status === "locked";

  const [buttonHovered, setButtonHovered] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(false);

  // The active module's progress badge gently pulses to mark the current card.
  const [pulseAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!isCurrent || isReduceMotion) {
      pulseAnim.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [isCurrent, isReduceMotion, pulseAnim]);

  const badgeScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const cardScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });

  const topics = lesson.topics || [];
  const completedTopicsCount = topics.filter((t) => t.completed).length;
  const totalTopicsCount = topics.length;
  const topicsButtonLabel = isCompleted
    ? 'Balikan ang mga Paksa'
    : completedTopicsCount > 0
      ? 'Magpatuloy sa mga Paksa'
      : 'Simulan ang mga Paksa';

  const accessibilityLabel = isCurrent
    ? `Kasalukuyang modyul, ${lesson.title}, Modyul ${lesson.number} sa ${totalLessons}. ${completedTopicsCount} sa ${totalTopicsCount} paksa ang natapos.`
    : isCompleted
      ? `Natapos na ang modyul na ${lesson.title}. Tapos na ang lahat ng ${totalTopicsCount} paksa.`
      : `Naka-lock ang modyul na ${lesson.title}. May ${totalTopicsCount} paksa.`;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
      accessibilityState={{ disabled: isLocked }}
      style={[
        styles.cardContainer,
        compact && styles.cardContainerCompact,
        isLandscapeCompact && styles.cardContainerLandscapeCompact,
      ]}
      testID={`lesson-card-${lesson.id}`}
    >
      <Animated.View
        style={[
          styles.cardShell,
          isCurrent && !isReduceMotion && { transform: [{ scale: cardScale }] },
        ]}
      >
        <BaseCard
          {...cardProps}
          status={cardProps.status ?? lesson.status}
          style={[
            styles.card,
            compact && styles.cardCompact,
            isLandscapeCompact && styles.cardLandscapeCompact,
            isCompleted && styles.cardCompleted,
            isCurrent && styles.cardCurrent,
            isLocked && styles.cardLocked,
          ]}
        >
        {/* The numbered badge doubles as a segmented module progress tracker. */}
        <View style={[styles.moduleHeading, compact && styles.moduleHeadingCompact]}>
          <View
            accessibilityElementsHidden
            style={[
              styles.badgeWrapper,
              compact && styles.badgeWrapperCompact,
              isLandscapeCompact && styles.badgeWrapperLandscapeCompact,
            ]}
          >
            {topics.map((topic, index) => {
              const angle = (index / Math.max(totalTopicsCount, 1)) * Math.PI * 2 - Math.PI / 2;
              const center = isLandscapeCompact ? 20 : compact ? 21 : 28;
              const radius = isLandscapeCompact ? 16 : compact ? 18 : 25;
              const markerSize = isLandscapeCompact ? 4 : compact ? 5 : 6;
              const completed = topic.completed;
              const available = topic.status === "available" || topic.status === "in_progress";
              return (
                <View
                  key={topic.id}
                  style={[
                    styles.progressMarker,
                    completed && styles.progressMarkerCompleted,
                    !completed && available && styles.progressMarkerCurrent,
                    !completed && !available && styles.progressMarkerLocked,
                    {
                      height: markerSize,
                      left: center + Math.cos(angle) * radius - markerSize / 2,
                      top: center + Math.sin(angle) * radius - markerSize / 2,
                      width: markerSize,
                    },
                  ]}
                />
              );
            })}
            <Animated.View
              style={[
                styles.badge,
                isCompleted ? styles.badgeCompleted : isCurrent ? styles.badgeCurrent : styles.badgeLocked,
                compact && styles.badgeCompact,
                isLandscapeCompact && styles.badgeLandscapeCompact,
                isCurrent && !isReduceMotion && { transform: [{ scale: badgeScale }] },
              ]}
            >
              <Text
                style={[
                  styles.badgeNumber,
                  compact && styles.badgeNumberCompact,
                  isLandscapeCompact && styles.badgeNumberLandscapeCompact,
                ]}
              >
                {lesson.number}
              </Text>
            </Animated.View>
          </View>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.title,
              compact && styles.titleCompact,
              isLandscapeCompact && styles.titleLandscapeCompact,
              isLocked && styles.titleLocked,
            ]}
          >
            {lesson.title}
          </Text>
          {isCompleted && (
            <View
              accessibilityElementsHidden
              style={[styles.completedCheck, compact && styles.completedCheckCompact]}
              testID={`lesson-completed-check-${lesson.id}`}
            >
              <AppIcon color="success" name="check" size={isLandscapeCompact ? 16 : compact ? 18 : 22} />
            </View>
          )}
        </View>

        {/* Topic rows use one compact line: icon, number, and approved title. */}
        <View
          accessibilityLabel={`Mga paksa sa ${lesson.title}`}
          accessibilityRole="list"
          style={[
            styles.topicsList,
            compact && styles.topicsListCompact,
            isLandscapeCompact && styles.topicsListLandscapeCompact,
          ]}
        >
          {topics.map((topic, index) => (
            <TopicCard dense={isLandscapeCompact} key={topic.id} topic={topic} number={index + 1} />
          ))}
        </View>

        {/* The card opens the topic flow directly; no module-detail screen. */}
        <View style={[styles.footer, compact && styles.footerCompact, isLandscapeCompact && { marginTop: 4 }]}>
          {!isLocked ? (
            <View style={[styles.currentFooter, isLandscapeCompact && { gap: 2 }]}>
              <Pressable
                accessibilityHint="Buksan ang susunod na maaaring araling paksa"
                accessibilityLabel={`${topicsButtonLabel} sa Modyul ${lesson.number}: ${lesson.title}`}
                accessibilityRole="button"
                onBlur={() => setButtonFocused(false)}
                onFocus={() => setButtonFocused(true)}
                onHoverIn={() => setButtonHovered(true)}
                onHoverOut={() => setButtonHovered(false)}
                onPress={onContinue || onPress}
                style={({ pressed }) => [
                  styles.continueButton,
                  compact && styles.continueButtonCompact,
                  isLandscapeCompact && styles.continueButtonLandscapeCompact,
                  buttonHovered && styles.continueButtonHovered,
                  buttonFocused && styles.continueButtonFocused,
                  pressed && styles.continueButtonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.continueText,
                    compact && styles.continueTextCompact,
                    isLandscapeCompact && styles.continueTextLandscapeCompact,
                  ]}
                >
                  {topicsButtonLabel}
                </Text>
                <AppIcon
                  color="onPrimary"
                  name="chevronRight"
                  size={isLandscapeCompact ? 12 : compact ? 15 : 18}
                />
              </Pressable>
            </View>
          ) : (
            <View
              style={[
                styles.lockedPill,
                compact && styles.lockedPillCompact,
                isLandscapeCompact && styles.lockedPillLandscapeCompact,
              ]}
            >
              <AppIcon
                color="level"
                name="lock"
                size={isLandscapeCompact ? 11 : compact ? 13 : 15}
              />
              <Text
                style={[
                  styles.lockedText,
                  compact && styles.lockedTextCompact,
                  isLandscapeCompact && styles.lockedTextLandscapeCompact,
                ]}
              >
                {FilipinoLabels.locked}
              </Text>
            </View>
          )}
        </View>
        </BaseCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "relative",
    width: LessonCardWidth.regular,
    maxWidth: "100%",
    flexShrink: 0,
    zIndex: 1,
  },
  cardContainerCompact: {
    width: LessonCardWidth.compact,
  },
  cardContainerLandscapeCompact: {
    width: LessonCardWidth.landscapeCompact,
  },
  cardShell: {
    width: "100%",
  },
  card: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 2,
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    shadowColor: "#55422A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: "100%",
  },
  cardCompact: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  cardLandscapeCompact: {
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  cardCompleted: {
    backgroundColor: Colors.surface,
    borderColor: "#72C76A",
    borderWidth: 2.5,
  },
  cardCurrent: {
    backgroundColor: Colors.surface,
    borderColor: "#FAA61F",
    borderWidth: 3.5,
    shadowColor: "#55422A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardLocked: {
    backgroundColor: "#FAF7FD",
    borderColor: "#E7DDF6",
    borderWidth: 2,
    opacity: 0.95,
  },
  moduleHeading: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  moduleHeadingCompact: { gap: 6, marginBottom: 2 },
  completedCheck: {
    alignItems: "center",
    backgroundColor: "#E7F6E4",
    borderColor: "#C7EAC1",
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  completedCheckCompact: { height: 30, width: 30 },
  badgeWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    position: "relative",
    width: 56,
  },
  badgeWrapperCompact: { height: 42, width: 42 },
  badgeWrapperLandscapeCompact: { height: 40, width: 40 },
  progressMarker: {
    borderRadius: Radius.full,
    position: "absolute",
  },
  progressMarkerCompleted: { backgroundColor: Colors.bayaGreen },
  progressMarkerCurrent: { backgroundColor: Colors.bayaOrange },
  progressMarkerLocked: { backgroundColor: Colors.border },
  badge: {
    alignItems: "center",
    borderRadius: Radius.full,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  badgeCompact: {
    height: 28,
    width: 28,
  },
  badgeLandscapeCompact: {
    height: 24,
    width: 24,
  },
  badgeCompleted: {
    backgroundColor: Colors.bayaGreen,
  },
  badgeCurrent: {
    backgroundColor: "#FAA61F",
  },
  badgeLocked: {
    backgroundColor: Colors.level,
  },
  badgeNumber: {
    color: Colors.surface,
    fontFamily: FontFamily.rounded,
    fontSize: 22,
    fontWeight: "900",
  },
  badgeNumberCompact: {
    fontSize: 18,
  },
  badgeNumberLandscapeCompact: {
    fontSize: 14,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.rounded,
    fontSize: 18,
    fontWeight: "900",
    flex: 1,
    minWidth: 0,
  },
  titleCompact: {
    fontSize: 16,
  },
  titleLandscapeCompact: {
    fontSize: 13,
    includeFontPadding: false,
  },
  titleLocked: {
    color: "#43345A",
  },
  topicsList: {
    alignSelf: "stretch",
    gap: 6,
    marginVertical: 0,
    width: "100%",
  },
  topicsListCompact: {
    gap: 1,
    marginVertical: 0,
  },
  topicsListLandscapeCompact: {
    gap: 3,
    marginVertical: 0,
  },
  topicRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  topicRowCompact: {
    gap: 6,
  },
  topicRowLandscapeCompact: {
    gap: 4,
  },
  topicCheckboxWrapper: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
  },
  topicTitle: {
    color: Colors.textPrimary,
    flex: 1,
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  topicTitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  topicTitleLandscapeCompact: {
    fontSize: 10.5,
    includeFontPadding: false,
    lineHeight: 13,
  },
  topicTitleCompleted: {
    color: Colors.textSecondary,
  },
  topicTitleCurrent: {
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  topicTitleLocked: {
    color: "#76678C",
  },
  footer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    width: "100%",
  },
  footerCompact: { marginTop: 1 },
  currentFooter: {
    alignItems: "center",
    gap: 0,
    width: "100%",
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: Colors.rolePrimary,
    borderColor: "#E65D12",
    borderRadius: Radius.full,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 4,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: "#FAA61F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    width: "100%",
  },
  continueButtonCompact: {
    minHeight: 36,
    paddingHorizontal: 14,
  },
  continueButtonLandscapeCompact: {
    borderWidth: 1,
    gap: 2,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  continueButtonHovered: {
    backgroundColor: Colors.rolePrimaryHover,
  },
  continueButtonFocused: {
    borderColor: Colors.focus,
  },
  continueButtonPressed: {
    backgroundColor: Colors.rolePrimaryPressed,
    transform: [{ scale: 0.98 }],
  },
  continueText: {
    color: Colors.surface,
    fontFamily: FontFamily.rounded,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  continueTextCompact: {
    fontSize: 12.5,
  },
  continueTextLandscapeCompact: {
    fontSize: 14,
    includeFontPadding: false,
  },
  lockedPill: {
    alignItems: "center",
    backgroundColor: "#EFE7FC",
    borderColor: "#DACAF6",
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 92,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  lockedPillCompact: {
    minHeight: 28,
    minWidth: 78,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  lockedPillLandscapeCompact: {
    gap: 3,
    minHeight: 22,
    minWidth: 60,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  lockedText: {
    color: Colors.level,
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: "800",
  },
  lockedTextCompact: {
    fontSize: 11,
  },
  lockedTextLandscapeCompact: {
    fontSize: 9.5,
    includeFontPadding: false,
  },
});
