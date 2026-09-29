import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, FontFamily, Radius, Spacing } from "../../../constants/theme";

export type StoryVisualLearningProps = {
  compact?: boolean;
  landscapeCompact?: boolean;
  theme?: string;
};

const PATINIG_LIST = [
  { glyph: "ᜀ", latin: "A" },
  { glyph: "ᜁ", latin: "E / I" },
  { glyph: "ᜂ", latin: "O / U" },
];

const KATINIG_LIST = [
  { glyph: "ᜊ", latin: "Ba" },
  { glyph: "ᜃ", latin: "Ka" },
  { glyph: "ᜇ", latin: "Da/Ra" },
  { glyph: "ᜄ", latin: "Ga" },
  { glyph: "ᜑ", latin: "Ha" },
  { glyph: "ᜎ", latin: "La" },
  { glyph: "ᜋ", latin: "Ma" },
  { glyph: "ᜈ", latin: "Na" },
  { glyph: "ᜅ", latin: "Nga" },
  { glyph: "ᜉ", latin: "Pa" },
  { glyph: "ᜐ", latin: "Sa" },
  { glyph: "ᜆ", latin: "Ta" },
  { glyph: "ᜏ", latin: "Wa" },
  { glyph: "ᜌ", latin: "Ya" },
];

const ALLOPHONE_EXAMPLES = [
  { word1: "LALAKI", word2: "LALAKE" },
  { word1: "BABAE", word2: "BABAI" },
  { word1: "KAIN", word2: "KAEN" },
];

const DARA_EXAMPLES = [
  { prefix: "ma", root: "dapat", result: "marapat" },
  { prefix: "tawid", root: "an", result: "tawiran" },
  { prefix: "ma", root: "dunong", result: "marunong" },
];

export function StoryVisualLearning({
  compact = false,
  landscapeCompact = false,
  theme,
}: StoryVisualLearningProps) {
  if (theme === "seventeen-symbols") {
    return (
      <View style={styles.container}>
        <View style={styles.topHeader} testID="story-image-placeholder">
          <View style={styles.placeholderPill}>
            <Text style={styles.placeholderPillText}>Add Image Here</Text>
          </View>
          <Text style={styles.headerSubtitle}>Koleksyon ng 17 Simbolo</Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Big picture breakdown: 17 ↓ 3 Patinig + 14 Katinig */}
          <View style={styles.heroSection}>
            <View style={styles.heroNumberBox}>
              <Text style={styles.heroNumber}>17</Text>
              <Text style={styles.heroNumberLabel}>Payak na Simbolo</Text>
            </View>
            <Text style={styles.arrowDown}>↓</Text>
            <View style={styles.equationSummary}>
              <View style={styles.summaryBadgePatinig}>
                <Text style={styles.summaryBadgePatinigText}>3 Patinig</Text>
              </View>
              <Text style={styles.equationPlus}>+</Text>
              <View style={styles.summaryBadgeKatinig}>
                <Text style={styles.summaryBadgeKatinigText}>14 Katinig</Text>
              </View>
            </View>
          </View>

          {/* 3 Patinig Grid */}
          <View style={styles.groupCard}>
            <View style={styles.groupHeaderRow}>
              <Text style={styles.groupTitle}>3 Patinig (Vowels)</Text>
              <Text style={styles.groupSub}>ᜀ · ᜁ · ᜂ</Text>
            </View>
            <View style={styles.glyphRow}>
              {PATINIG_LIST.map((item) => (
                <View key={item.glyph} style={styles.glyphCardVowel}>
                  <Text style={styles.glyphSymbol}>{item.glyph}</Text>
                  <Text style={styles.glyphLatin}>{item.latin}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 14 Katinig Grid */}
          <View style={styles.groupCard}>
            <View style={styles.groupHeaderRow}>
              <Text style={styles.groupTitle}>14 Katinig (Consonants)</Text>
              <Text style={styles.groupSub}>May kasamang tunog na &quot;A&quot;</Text>
            </View>
            <View style={styles.glyphGrid}>
              {KATINIG_LIST.map((item) => (
                <View key={item.glyph} style={styles.glyphCardConsonant}>
                  <Text style={styles.glyphSymbolConsonant}>{item.glyph}</Text>
                  <Text style={styles.glyphLatinConsonant}>{item.latin}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (theme === "allophone") {
    return (
      <View style={styles.container}>
        <View style={styles.topHeader} testID="story-image-placeholder">
          <View style={styles.placeholderPill}>
            <Text style={styles.placeholderPillText}>Add Image Here</Text>
          </View>
          <Text style={styles.headerSubtitle}>Malayang Nagpapalitan</Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Vowel Pairing Hero Equations */}
          <View style={styles.pairingSection}>
            <View style={styles.pairEquationCard}>
              <View style={styles.pairGlyphBox}>
                <Text style={styles.pairGlyph}>ᜁ</Text>
              </View>
              <Text style={styles.pairEquals}>=</Text>
              <View style={styles.pairLettersBox}>
                <Text style={styles.pairLetters}>E / I</Text>
                <Text style={styles.pairLettersSub}>Iisang simbolo</Text>
              </View>
            </View>

            <View style={styles.pairEquationCard}>
              <View style={styles.pairGlyphBox}>
                <Text style={styles.pairGlyph}>ᜂ</Text>
              </View>
              <Text style={styles.pairEquals}>=</Text>
              <View style={styles.pairLettersBox}>
                <Text style={styles.pairLetters}>O / U</Text>
                <Text style={styles.pairLettersSub}>Iisang simbolo</Text>
              </View>
            </View>
          </View>

          {/* Word Examples */}
          <View style={styles.groupCard}>
            <View style={styles.groupHeaderRow}>
              <Text style={styles.groupTitle}>Mga Halimbawa ng Salita</Text>
              <Text style={styles.groupSub}>Hindi nagbabago ang kahulugan</Text>
            </View>
            <View style={styles.examplesList}>
              {ALLOPHONE_EXAMPLES.map((ex, idx) => (
                <View key={idx} style={styles.exampleRow}>
                  <View style={styles.exampleWordChip}>
                    <Text style={styles.exampleWordText}>{ex.word1}</Text>
                  </View>
                  <Text style={styles.exampleSwapIcon}>⇄</Text>
                  <View style={styles.exampleWordChip}>
                    <Text style={styles.exampleWordText}>{ex.word2}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noteBanner}>
            <Text style={styles.noteBannerText}>
              Dahil magkalapit ang tunog ng E at I, pati na rin ng O at U, iisang simbolo lang ang ginamit ng ating mga ninuno!
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (theme === "da-ra") {
    return (
      <View style={styles.container}>
        <View style={styles.topHeader} testID="story-image-placeholder">
          <View style={styles.placeholderPill}>
            <Text style={styles.placeholderPillText}>Add Image Here</Text>
          </View>
          <Text style={styles.headerSubtitle}>Pagbabagong Morpoponemiko</Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            compact && styles.scrollContentCompact,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Da and Ra Hero Card */}
          <View style={styles.daRaHeroCard}>
            <View style={styles.pairGlyphBox}>
              <Text style={styles.pairGlyph}>ᜇ</Text>
            </View>
            <Text style={styles.pairEquals}>=</Text>
            <View style={styles.daRaLabelsBox}>
              <Text style={styles.daRaLetters}>Da / Ra</Text>
              <Text style={styles.daRaLettersSub}>
                Iisang simbolo para sa dalawang tunog
              </Text>
            </View>
          </View>

          {/* Morphophonemic Shift Examples */}
          <View style={styles.groupCard}>
            <View style={styles.groupHeaderRow}>
              <Text style={styles.groupTitle}>Pagbabago ng Tunog (D → R)</Text>
              <Text style={styles.groupSub}>Kapag napagigitnaan ng patinig</Text>
            </View>
            <View style={styles.morphList}>
              {DARA_EXAMPLES.map((item, idx) => (
                <View key={idx} style={styles.morphRowCard}>
                  <View style={styles.morphEquation}>
                    <Text style={styles.morphPart}>{item.prefix}</Text>
                    <Text style={styles.morphPlus}>+</Text>
                    <Text style={styles.morphPart}>{item.root}</Text>
                  </View>
                  <Text style={styles.morphArrow}>→</Text>
                  <View style={styles.morphResultBadge}>
                    <Text style={styles.morphResultText}>{item.result}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noteBanner}>
            <Text style={styles.noteBannerText}>
              Ang titik D ay madalas maging R kapag napagigitnaan ng mga patinig sa wikang Tagalog!
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Fallback default label
  return (
    <View style={styles.defaultContent} testID="story-image-placeholder">
      <Text style={[styles.defaultLabel, compact && styles.defaultLabelCompact]}>
        Add Image Here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    height: "100%",
    width: "100%",
  },
  topHeader: {
    alignItems: "center",
    backgroundColor: "#FBF3E4",
    borderBottomColor: "#EFE2CF",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
  },
  placeholderPill: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DECFC0",
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  placeholderPillText: {
    color: "#82715B",
    fontFamily: FontFamily.rounded,
    fontSize: 11,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#665D53",
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: "600",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.sm + 2,
  },
  scrollContentCompact: {
    padding: Spacing.xs + 2,
  },
  heroSection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EFE2CF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  heroNumberBox: {
    alignItems: "center",
  },
  heroNumber: {
    color: "#241F1B",
    fontFamily: FontFamily.rounded,
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 40,
  },
  heroNumberLabel: {
    color: "#665D53",
    fontFamily: FontFamily.body,
    fontSize: 13,
    fontWeight: "700",
  },
  arrowDown: {
    color: "#F76D22",
    fontSize: 18,
    fontWeight: "800",
    marginVertical: 2,
  },
  equationSummary: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  summaryBadgePatinig: {
    backgroundColor: "#FFF2E6",
    borderColor: "#F5C799",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryBadgePatinigText: {
    color: "#D94F0C",
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: "800",
  },
  equationPlus: {
    color: "#8D8174",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryBadgeKatinig: {
    backgroundColor: "#F2F8EE",
    borderColor: "#C5E6BB",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  summaryBadgeKatinigText: {
    color: "#2E7D32",
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: "800",
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EFE2CF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  groupHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#F4EDE2",
    borderBottomWidth: 1,
    paddingBottom: 4,
    marginBottom: 8,
  },
  groupTitle: {
    color: "#241F1B",
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: "800",
  },
  groupSub: {
    color: "#8D8174",
    fontFamily: FontFamily.body,
    fontSize: 11,
    fontWeight: "600",
  },
  glyphRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-around",
  },
  glyphCardVowel: {
    alignItems: "center",
    backgroundColor: "#FFF9F2",
    borderColor: "#F7D8BA",
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 6,
  },
  glyphSymbol: {
    color: "#241F1B",
    fontFamily: FontFamily.body,
    fontSize: 26,
    fontWeight: "800",
  },
  glyphLatin: {
    color: "#D94F0C",
    fontFamily: FontFamily.rounded,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  glyphGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "space-between",
  },
  glyphCardConsonant: {
    alignItems: "center",
    backgroundColor: "#FAF7F2",
    borderColor: "#E8DED1",
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 42,
    flexGrow: 1,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  glyphSymbolConsonant: {
    color: "#241F1B",
    fontFamily: FontFamily.body,
    fontSize: 18,
    fontWeight: "800",
  },
  glyphLatinConsonant: {
    color: "#665D53",
    fontFamily: FontFamily.rounded,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 1,
  },
  pairingSection: {
    flexDirection: "column",
    gap: 8,
    marginBottom: Spacing.sm,
  },
  pairEquationCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EFE2CF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    padding: Spacing.sm,
    gap: 12,
  },
  pairGlyphBox: {
    alignItems: "center",
    backgroundColor: "#FFF4E8",
    borderColor: "#F5C799",
    borderRadius: Radius.md,
    borderWidth: 1.5,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  pairGlyph: {
    color: "#241F1B",
    fontFamily: FontFamily.body,
    fontSize: 30,
    fontWeight: "800",
  },
  pairEquals: {
    color: "#F76D22",
    fontSize: 22,
    fontWeight: "800",
  },
  pairLettersBox: {
    flex: 1,
  },
  pairLetters: {
    color: "#241F1B",
    fontFamily: FontFamily.rounded,
    fontSize: 22,
    fontWeight: "900",
  },
  pairLettersSub: {
    color: "#665D53",
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: "600",
  },
  examplesList: {
    flexDirection: "column",
    gap: 6,
  },
  exampleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  exampleWordChip: {
    alignItems: "center",
    backgroundColor: "#FDF8F0",
    borderColor: "#EFE2CF",
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  exampleWordText: {
    color: "#241F1B",
    fontFamily: FontFamily.rounded,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  exampleSwapIcon: {
    color: "#F76D22",
    fontSize: 16,
    fontWeight: "900",
  },
  daRaHeroCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#EFE2CF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  daRaLabelsBox: {
    flex: 1,
  },
  daRaLetters: {
    color: "#241F1B",
    fontFamily: FontFamily.rounded,
    fontSize: 24,
    fontWeight: "900",
  },
  daRaLettersSub: {
    color: "#665D53",
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: "600",
  },
  morphList: {
    flexDirection: "column",
    gap: 8,
  },
  morphRowCard: {
    alignItems: "center",
    backgroundColor: "#FAF7F2",
    borderColor: "#EFE2CF",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  morphEquation: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  morphPart: {
    color: "#241F1B",
    fontFamily: FontFamily.body,
    fontSize: 14,
    fontWeight: "700",
  },
  morphPlus: {
    color: "#8D8174",
    fontSize: 14,
    fontWeight: "700",
  },
  morphArrow: {
    color: "#F76D22",
    fontSize: 16,
    fontWeight: "900",
    marginHorizontal: 6,
  },
  morphResultBadge: {
    backgroundColor: "#FFF2E6",
    borderColor: "#F5C799",
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  morphResultText: {
    color: "#D94F0C",
    fontFamily: FontFamily.rounded,
    fontSize: 13,
    fontWeight: "800",
  },
  noteBanner: {
    backgroundColor: "#FFF9EE",
    borderColor: "#F5C799",
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  noteBannerText: {
    color: "#665D53",
    fontFamily: FontFamily.body,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
  },
  defaultContent: {
    alignItems: "center",
    flex: 1,
    height: "100%",
    justifyContent: "center",
    padding: Spacing.md,
    width: "100%",
  },
  defaultLabel: {
    color: "#82715B",
    fontFamily: FontFamily.rounded,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  defaultLabelCompact: {
    fontSize: 14,
  },
});
