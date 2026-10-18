import { StyleSheet, type TextStyle } from "react-native";
import { Colors, FontFamily, Radius, Spacing } from "../../../constants/theme";
import { speechBubbleStyles, SpeechBubbleColors } from "../../ui/speechBubbleStyles";
export const storyGuideStyles = StyleSheet.create({
  guideContainer: {
    alignItems: "center", // Vertically aligns speech bubble directly with BAYA's face & upper body
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: Spacing.md,
    paddingRight: Spacing.xs,
    position: "relative",
    width: "100%",
  },
  guideContainerDesktop: {
    marginTop: Spacing.md,
    paddingRight: Spacing.xs,
  },
  guideContainerCompact: {
    marginTop: Spacing.sm,
    paddingRight: Spacing.xs,
  },
  guideContainerLandscape: {
    marginTop: 2,
    paddingRight: Spacing.xs,
  },
  guideContainerPhonePortrait: {
    alignItems: "flex-end",
    flexDirection: "column",
    justifyContent: "flex-start",
    marginTop: 2,
    paddingRight: 0,
  },
  bubbleCard: {
    ...speechBubbleStyles.surface,
    flex: 1,
    justifyContent: "center",
    maxWidth: 480,
    minHeight: 80,
    paddingHorizontal: 32,
    paddingVertical: 22,
    position: "relative",
    zIndex: 1,

  },
  bubbleCardDesktop: {
    maxWidth: 500,
    paddingHorizontal: 34,
    paddingVertical: 24,
  },
  bubbleCardTablet: {
    borderRadius: 20,
    maxWidth: 380,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  bubbleCardCompact: {
    borderRadius: 16,
    maxWidth: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleCardLandscape: {
    borderRadius: 14,
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleCardPhonePortrait: {
    alignSelf: "stretch",
    borderRadius: 14,
    flexBasis: "auto",
    flexGrow: 0,
    maxWidth: "100%",
    minHeight: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  bubbleText: {
    color: SpeechBubbleColors.text,
    fontFamily: FontFamily.rounded,
    fontSize: 16.5,
    fontWeight: "700",
    lineHeight: 24,
    textAlign: "left",
  },
  bubbleTextDesktop: {
    fontSize: 21.5,
    lineHeight: 31,
  },
  bubbleTextTablet: {
    fontSize: 17.5,
    lineHeight: 25,
  },
  bubbleTextCompact: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  bubbleTextLandscape: {
    fontSize: 11,
    includeFontPadding: false,
    lineHeight: 14,
  },
  bubbleTextPhonePortrait: {
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 19,
    textAlign: "center",
  },
  mascotContainer: {
    alignItems: "center",
    justifyContent: "flex-start", // Anchors Baya's top (salakot hat) at top, hides feet at bottom
    overflow: "hidden",
    position: "relative",
    zIndex: 2,
  },
  mascotContainerDesktop: {
    marginLeft: -32, // Natural slight overlap with dialogue area for storybook depth
    marginRight: -16, // Offsets Baya's right transparent margin
  },
  mascotContainerCompact: {
    marginLeft: -4,
  },
  mascotContainerLandscape: {
    marginLeft: -2,
  },
  mascotContainerPhonePortrait: { marginLeft: 0, marginTop: 4 },
  mascotButton: { alignItems: "center", borderColor: "transparent", borderRadius: Radius.xl, borderWidth: 2, flex: 1, justifyContent: "flex-start", width: "100%" },
  mascotSoundIcon: { alignItems: "center", backgroundColor: Colors.rolePrimary, borderRadius: Radius.full, bottom: 4, height: 28, justifyContent: "center", position: "absolute", right: 4, width: 28 },
  highlightKeyword: {
    color: "#D8540B", // BAYA Heritage Terracotta Orange
    fontFamily: FontFamily.rounded,
    fontWeight: "900",
  } as TextStyle,
});
