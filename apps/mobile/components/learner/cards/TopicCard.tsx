import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, FontFamily, Radius, Spacing } from "../../../constants/theme";
import { useResponsiveLayout } from "../../../hooks/useResponsiveLayout";
import { AppIcon } from "../../ui/AppIcon";
import type { Topic } from "../../../content/modules/catalog";
import { BaseCard, type BaseCardProps } from "../../ui/cards/BaseCard";

/** Presentation only: all titles and state come from curriculum data. */
export function TopicCard({
  topic,
  number,
  dense = false,
  ...props
}: BaseCardProps & { topic: Topic; number?: number; dense?: boolean }) {
  const { isCompactHeight, isPhone } = useResponsiveLayout();
  const compact = isPhone || isCompactHeight;
  const locked = topic.status === "locked";
  return (
    <BaseCard
      {...props}
      size={dense || compact ? "small" : "medium"}
      status={
        props.status ??
        (locked ? "locked" : topic.completed ? "completed" : "available")
      }
      accessibilityLabel={`Paksa ${number ?? 1}: ${topic.title}, ${locked ? 'naka-lock' : topic.completed ? 'tapos na' : 'maaari nang buksan'}`}
      accessibilityState={{ disabled: locked }}
      style={[styles.card, compact && styles.cardCompact, dense && styles.cardDense]}
      testID={`topic-card-${topic.id}`}
    >
      <AppIcon
        name={locked ? "lock" : topic.completed ? "check" : "lessons"}
        color={locked ? "muted" : topic.completed ? "success" : "accent"}
        size={dense ? 15 : compact ? 18 : 20}
      />
      <View style={styles.copy}>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={[
            styles.title,
            compact && styles.titleCompact,
            dense && styles.titleDense,
            locked && styles.titleLocked,
          ]}
        >
          <Text style={[styles.number, compact && styles.numberCompact, dense && styles.numberDense]}>
            {`${number ?? 1}.\u00a0`}
          </Text>
          {topic.title}
        </Text>
      </View>
    </BaseCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  cardCompact: { paddingHorizontal: 6, paddingVertical: 2, gap: 6 },
  cardDense: { paddingHorizontal: 6, paddingVertical: 4, gap: 6 },
  numberDense: { fontSize: 12 },
  titleDense: { fontSize: 13, lineHeight: 17 },
  copy: { flex: 1, minWidth: 0 },
  number: { color: Colors.textSecondary, fontSize: 15, fontWeight: "700" },
  numberCompact: { fontSize: 13 },
  title: {
    color: Colors.textPrimary,
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 21,
  },
  titleLocked: { color: Colors.textSecondary },
  titleCompact: { fontSize: 14, lineHeight: 18 },
});
