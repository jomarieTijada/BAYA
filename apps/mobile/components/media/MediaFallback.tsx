import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors, Spacing } from "../../constants/theme";

export function MediaFallback({
  title = "Hindi pa available ang media.",
  testID = "media-fallback",
  onRetry,
  retryLabel = "Subukan muli",
}: {
  title?: string;
  testID?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <View accessibilityRole="summary" style={styles.container} testID={testID}>
      <Text style={styles.text}>{title}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </Pressable>
      ) : (
        <Text style={styles.text}>Bumalik sa aralin o subukan muli mamaya.</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    minHeight: 120,
    padding: Spacing.md,
    gap: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: Colors.textSecondary, textAlign: "center" },
  retry: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  pressed: { opacity: 0.82 },
  retryText: { color: Colors.surface, fontWeight: "700" },
});
