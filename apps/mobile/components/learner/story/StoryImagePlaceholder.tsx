import React from "react";
import {
  Platform,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { FontFamily, Radius, Spacing } from "../../../constants/theme";

import { StoryVisualLearning } from "./StoryVisualLearning";

export type StoryImagePlaceholderProps = {
  caption?: string;
  compact?: boolean;
  landscapeCompact?: boolean;
  style?: StyleProp<ViewStyle>;
  theme?: string;
};

/** Reserves the illustration frame without presenting unvalidated artwork. */
export function StoryImagePlaceholder({
  caption,
  compact = false,
  landscapeCompact = false,
  style,
  theme,
}: StoryImagePlaceholderProps) {
  const isSpecialVisualTheme =
    theme === "seventeen-symbols" ||
    theme === "allophone" ||
    theme === "da-ra";

  return (
    <View
      style={[
        styles.panel,
        compact && styles.panelCompact,
        landscapeCompact && styles.panelLandscapeCompact,
        style,
      ]}
      testID="story-illustration-area"
    >
      {isSpecialVisualTheme ? (
        <StoryVisualLearning
          compact={compact}
          landscapeCompact={landscapeCompact}
          theme={theme}
        />
      ) : (
        <View style={styles.content} testID="story-image-placeholder">
          <Text style={[styles.label, compact && styles.labelCompact]}>
            Add Image Here
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#FFF9EE",
    borderColor: "#EFE2CF",
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    flex: 1,
    height: "100%",
    overflow: "hidden",
    position: "relative",
    width: "100%",
    ...Platform.select({
      web: { boxShadow: "0 3px 12px rgba(85, 66, 42, 0.06)" },
      default: {
        elevation: 2,
        shadowColor: "#55422A",
        shadowOffset: { height: 3, width: 0 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
    }),
  },
  panelCompact: { borderRadius: Radius.lg },
  panelLandscapeCompact: { borderRadius: Radius.md, borderWidth: 1 },
  content: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "center",
    padding: Spacing.md,
    width: "100%",
  },
  label: {
    color: "#82715B",
    fontFamily: FontFamily.rounded,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  labelCompact: { fontSize: 14 },
});
