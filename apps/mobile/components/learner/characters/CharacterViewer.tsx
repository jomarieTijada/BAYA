import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import type { BaybayinCharacter } from '../../../content/baybayinCharactersData';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { StorybookTopicLayout } from '../story/StorybookTopicLayout';
import { StoryGuide } from '../story/StoryGuide';
import { useCharacterPronunciation } from './useCharacterPronunciation';

type Props = {
  characters: readonly BaybayinCharacter[];
  topicId: string;
  selectedIndex: number;
  onSelectCharacter: (index: number) => void;
};

function CharacterExampleGuide({ character, compact, large, short, isStacked }: { character: BaybayinCharacter; compact: boolean; large: boolean; short: boolean; isStacked: boolean }) {
  const { pronounce, speaking } = useCharacterPronunciation(character);
  return (
    <StoryGuide
      bubbleContent={<ExampleWord character={character} large={large} short={short} />}
      compact={compact}
      landscapeCompact={short}
      mascotAccessibilityLabel={`Pakinggan si BAYA sa pagbigkas ng ${character.latinEquivalent}`}
      mascotSpeaking={speaking}
      maxSpreadMascotWidth={large ? 360 : undefined}
      fullBodyMascot={large}
      onMascotPress={() => { void pronounce(); }}
      stackGuide={isStacked}
      style={[styles.exampleGuide, large && styles.exampleGuideLarge]}
    />
  );
}

function ExampleWord({ character, large, short }: { character: BaybayinCharacter; large: boolean; short: boolean }) {
  const { word, baybayinWord, highlightedSyllable, highlightIndex } = character.example;
  const [availableWidth, setAvailableWidth] = useState(0);
  const [glyphMeasure, setGlyphMeasure] = useState<{ word: string; units: number } | null>(null);
  // Keep vowel signs and the final consonant's virama with their base glyph.
  const glyphs = Array.from(baybayinWord).reduce<string[]>((parts, symbol) => {
    if (/^[\u1712\u1713\u1714]$/.test(symbol) && parts.length > 0) parts[parts.length - 1] += symbol;
    else parts.push(symbol);
    return parts;
  }, []);
  const baseFontSize = short ? 32 : large ? 58 : 48;
  const baseLineHeight = short ? 44 : large ? 74 : 64;
  const widthUnits = glyphMeasure?.word === baybayinWord ? glyphMeasure.units : glyphs.length;
  // Measure the font's actual glyph widths; longer modern spellings must fit
  // the existing speech bubble without separating a mark from its character.
  const fontSize = availableWidth > 1
    ? Math.min(baseFontSize, Math.max(1, Math.floor((availableWidth - 1) / widthUnits)))
    : baseFontSize;
  const glyphTypeStyle = { fontSize, lineHeight: Math.round(baseLineHeight * fontSize / baseFontSize) };
  const start = word.toLowerCase().indexOf(highlightedSyllable.toLowerCase());
  const end = start + highlightedSyllable.length;
  return (
    <View onLayout={({ nativeEvent: { layout } }) => setAvailableWidth(previous => previous === layout.width ? previous : layout.width)} style={[styles.exampleWord, short && styles.exampleWordShort]} testID="character-example-container">
      <Text style={[styles.exampleCaption, large && styles.exampleCaptionLarge]}>Halimbawa</Text>
      <View accessible accessibilityRole="text" accessibilityLabel={`Baybayin: ${baybayinWord}`} onLayout={({ nativeEvent: { layout } }) => {
        const units = layout.width / fontSize;
        if (units > 0) setGlyphMeasure(previous => previous?.word === baybayinWord && Math.abs(previous.units - units) < 0.001 ? previous : { word: baybayinWord, units });
      }} style={styles.exampleGlyphRow} testID="character-example-baybayin">
        {glyphs.map((glyph, index) => (
          <View key={index} accessibilityLabel={glyph} style={styles.exampleGlyphCell}>
            <Text style={[styles.exampleBaybayin, glyphTypeStyle, index === highlightIndex && styles.highlightedGlyph]} testID={index === highlightIndex ? 'character-example-highlighted-glyph' : undefined}>{glyph.replace(/\u1714$/, '')}</Text>
            {glyph.endsWith('\u1714') && <Text accessible={false} aria-hidden style={[styles.exampleCancellationMark, { fontSize: Math.round(fontSize * 0.28), lineHeight: Math.round(fontSize * 0.32) }]} testID="character-example-cancellation-mark">×</Text>}
            {index === highlightIndex && <View style={styles.exampleGlyphGuide} testID="character-example-guide-line" />}
          </View>
        ))}
      </View>
      <Text accessibilityLabel={word} style={[styles.exampleLatin, large && styles.exampleLatinLarge, short && styles.exampleLatinShort]} testID="character-example-latin">
        {start >= 0 ? <>
          {word.slice(0, start)}
          <Text style={styles.highlightedSyllable} testID="character-example-syllable">{word.slice(start, end)}</Text>
          {word.slice(end)}
        </> : word}
      </Text>
    </View>
  );
}

/** The same media/example/selector presentation is used by both Module 2 topics. */
export function CharacterViewer({ characters, topicId, selectedIndex, onSelectCharacter }: Props) {
  const { isCompactHeight, isDesktop, isPhone, isTablet } = useResponsiveLayout();
  const compact = isCompactHeight || isPhone || isTablet;
  const large = isDesktop && !isCompactHeight;
  const selector = useRef<ScrollView>(null);
  const chipLayouts = useRef<Record<number, { x: number; width: number }>>({});
  const [activeScale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    chipLayouts.current = {};
    selector.current?.scrollTo({ x: 0, animated: false });
  }, [topicId]);

  useEffect(() => {
    activeScale.setValue(0.94);
    const animation = Animated.timing(activeScale, { toValue: 1, duration: 180, useNativeDriver: Platform.OS !== 'web' });
    animation.start();
    const chip = chipLayouts.current[selectedIndex];
    if (chip) selector.current?.scrollTo({ x: Math.max(0, chip.x - 16), animated: true });
    return () => animation.stop();
  }, [selectedIndex, activeScale]);

  const character = characters[selectedIndex];
  if (!character) return null;

  return (
    <View style={styles.root} testID="character-viewer">
      <StorybookTopicLayout
        compactSpread={compact}
        visualAspectRatio={4 / 3}
        visual={(
          <View style={[styles.glyphCard, compact && styles.glyphCardCompact]}>
            <View style={styles.glyphFrame}>
              <Image accessibilityLabel={`Simbolo ng ${character.latinEquivalent}`} resizeMode="contain" source={character.imageAsset} style={styles.glyphImage} testID="character-glyph" />
              <View style={[styles.latinBadgeAnchor, large && styles.latinBadgeAnchorLarge]}>
                <View style={[styles.latinBadge, compact && styles.latinBadgeCompact, large && styles.latinBadgeLarge]}>
                  <Text style={[styles.latinBadgeText, large && styles.latinBadgeTextLarge]}>{character.latinEquivalent}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        content={(isStacked) => (
          <ScrollView style={styles.contentScroll} contentContainerStyle={[styles.content, isStacked && styles.contentStacked]} showsVerticalScrollIndicator>
            <View style={[styles.selectorSection, large && styles.selectorSectionLarge]}>
              <Text style={[styles.selectorTitle, large && styles.selectorTitleLarge]}>Mga simbolo</Text>
              <ScrollView horizontal ref={selector} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.selectorContent, large && styles.selectorContentCentered]} style={styles.selector} testID="character-selector">
                {characters.map((item, index) => {
                  const selected = index === selectedIndex;
                  return (
                    <Animated.View key={item.id} onLayout={event => { chipLayouts.current[index] = { x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width }; }} style={selected ? { transform: [{ scale: activeScale }] } : undefined}>
                      <Pressable
                        accessibilityLabel={`Piliin ang ${item.latinEquivalent}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => onSelectCharacter(index)}
                        style={({ pressed }) => [styles.chip, large && styles.chipLarge, compact && styles.chipShort, selected && styles.chipSelected, pressed && styles.pressed]}
                        testID={`character-chip-${item.id}`}
                      >
                        <Image resizeMode="contain" source={item.imageAsset} style={[styles.chipGlyph, large && styles.chipGlyphLarge, compact && styles.chipGlyphShort]} />
                        <Text style={[styles.chipLabel, large && styles.chipLabelLarge, selected && styles.chipLabelSelected]}>{item.latinEquivalent}</Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </ScrollView>
            </View>
            <View style={[styles.exampleRegion, isStacked && styles.exampleRegionStacked]}>
              <CharacterExampleGuide character={character} compact={compact} large={large} short={isCompactHeight} isStacked={isStacked} />
            </View>
          </ScrollView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, width: '100%' },
  glyphCard: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, elevation: 3, flex: 1, minHeight: 0, padding: Spacing.md, shadowColor: '#55422A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 12, width: '100%' },
  glyphCardCompact: { padding: Spacing.sm },
  glyphFrame: { alignItems: 'center', backgroundColor: '#FFF9EE', borderRadius: Radius.lg, flex: 1, justifyContent: 'center', minHeight: 0, overflow: 'hidden', width: '100%' },
  glyphImage: { height: '85%', width: '85%' },
  latinBadgeAnchor: { bottom: Spacing.sm, left: Spacing.sm, position: 'absolute' },
  latinBadgeAnchorLarge: { alignItems: 'center', bottom: Spacing.md, left: 0, right: 0 },
  latinBadge: { backgroundColor: '#FFF0E4', borderColor: '#FBC8A9', borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  latinBadgeCompact: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  latinBadgeLarge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs },
  latinBadgeText: { color: Colors.rolePrimary, fontFamily: FontFamily.rounded, fontSize: 17, fontWeight: '900' },
  latinBadgeTextLarge: { fontSize: 32 },
  contentScroll: { flex: 1, minHeight: 0, minWidth: 0, width: '100%' },
  content: { flexGrow: 1, justifyContent: 'flex-start', paddingBottom: Spacing.xs, paddingRight: 0, width: '100%' },
  contentStacked: { gap: Spacing.md, justifyContent: 'flex-start', paddingTop: Spacing.sm },
  exampleRegion: { flex: 1, justifyContent: 'center', minHeight: 0 },
  exampleRegionStacked: { flexBasis: 'auto', flexGrow: 0, flexShrink: 0 },
  exampleGuide: { marginTop: 0 },
  exampleGuideLarge: { justifyContent: 'center', paddingRight: 0 },
  exampleWord: { alignItems: 'center', gap: Spacing.xs, justifyContent: 'center', minHeight: 128, minWidth: 0, width: '100%' },
  exampleWordShort: { gap: 2, minHeight: 96 },
  exampleCaption: { color: Colors.textSecondary, fontFamily: FontFamily.body, fontSize: 14, fontWeight: '700' },
  exampleCaptionLarge: { fontSize: 17 },
  exampleGlyphRow: { flexDirection: 'row', justifyContent: 'center' },
  exampleGlyphCell: { position: 'relative' },
  // Draw the chosen X-shaped virama independently of the platform font.
  exampleCancellationMark: { bottom: 0, color: Colors.textPrimary, fontFamily: FontFamily.body, fontWeight: '800', left: 0, position: 'absolute', right: 0, textAlign: 'center' },
  // Separate from font decoration so the guide stays thin on web and native.
  exampleGlyphGuide: { backgroundColor: Colors.textMuted, bottom: Spacing.xs, height: 1, left: 0, position: 'absolute', right: 0 },
  exampleBaybayin: { color: Colors.textPrimary, fontSize: 48, lineHeight: 64 },
  exampleLatin: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 32, fontWeight: '800' },
  exampleLatinLarge: { fontSize: 38 },
  exampleLatinShort: { fontSize: 24 },
  highlightedGlyph: { color: Colors.rolePrimary },
  highlightedSyllable: { color: Colors.rolePrimary, textDecorationLine: 'underline' },
  selectorSection: { gap: Spacing.xs, minWidth: 0 },
  selectorSectionLarge: { gap: Spacing.sm },
  selectorTitle: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 17, fontWeight: '900' },
  selectorTitleLarge: { fontSize: 22, textAlign: 'center' },
  selector: { flexGrow: 0 },
  selectorContent: { gap: Spacing.xs, paddingBottom: 2, paddingHorizontal: 2, paddingTop: 2 },
  selectorContentCentered: { flexGrow: 1, justifyContent: 'center' },
  chip: { alignItems: 'center', backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.lg, borderWidth: 1, gap: 2, justifyContent: 'center', minHeight: 82, minWidth: 74, paddingHorizontal: Spacing.sm },
  chipLarge: { minHeight: 104, minWidth: 100, paddingHorizontal: Spacing.md },
  chipShort: { minHeight: 66, minWidth: 64, paddingHorizontal: Spacing.xs },
  chipSelected: { backgroundColor: '#FFF0E4', borderColor: Colors.rolePrimary, borderWidth: 2 },
  chipGlyph: { height: 42, width: 48 },
  chipGlyphLarge: { height: 60, width: 68 },
  chipGlyphShort: { height: 30, width: 40 },
  chipLabel: { color: Colors.textSecondary, fontFamily: FontFamily.rounded, fontSize: 12, fontWeight: '800' },
  chipLabelLarge: { fontSize: 15 },
  chipLabelSelected: { color: Colors.rolePrimary },
  pressed: { opacity: 0.75 },
});
