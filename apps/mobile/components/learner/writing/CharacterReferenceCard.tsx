import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import type { WritingExercise } from '../../../content/writingLessonData';
import { AppIcon } from '../../ui/AppIcon';
import { useCharacterPronunciation } from '../characters/useCharacterPronunciation';

export function CharacterReferenceCard({ exercise, fullHeight = false, compact = false, dense = false }: { exercise: WritingExercise; fullHeight?: boolean; compact?: boolean; dense?: boolean }) {
  const { pronounce, speaking } = useCharacterPronunciation(exercise.pronunciation);
  return <View style={[styles.card, compact && styles.compactCard, fullHeight && styles.fullHeight]} testID="writing-reference-card">
    <Text style={styles.eyebrow}>SIMBOLO</Text>
    <View style={[styles.glyphFrame, compact && styles.compactGlyphFrame, dense && styles.denseGlyphFrame]}>
      <Image accessibilityLabel={`Simbolo ng ${exercise.romanization}`} resizeMode="contain" source={exercise.referenceImage} style={styles.glyph} />
    </View>
    <View style={styles.labelRow}>
      <View style={styles.labelText}>
        <Text style={[styles.romanization, compact && styles.compactRomanization, dense && styles.denseRomanization]}>{exercise.romanization}</Text>
        <Text style={[styles.sound, dense && styles.denseSound]}>{exercise.sound}</Text>
      </View>
      <Pressable accessibilityLabel={`Pakinggan ang tunog ng ${exercise.romanization}`} accessibilityRole="button" onPress={() => { void pronounce(); }} style={({ pressed }) => [styles.soundButton, dense && styles.denseSoundButton, speaking && styles.speaking, pressed && styles.pressed]} testID="writing-sound-button">
        <AppIcon name="sound" color="accent" size={dense ? 18 : 22} />
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.sm, minWidth: 0, padding: Spacing.md, width: '100%' },
  compactCard: { gap: Spacing.xs, padding: Spacing.sm },
  fullHeight: { flex: 1, justifyContent: 'space-between' },
  eyebrow: { alignSelf: 'center', backgroundColor: '#FFF0E4', borderRadius: Radius.md, color: Colors.accent, fontFamily: FontFamily.rounded, fontSize: 12, fontWeight: '900', letterSpacing: 1, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  glyphFrame: { alignItems: 'center', alignSelf: 'center', aspectRatio: 1, backgroundColor: '#FFF9EE', borderColor: '#F1E6D3', borderRadius: Radius.lg, borderWidth: 1, justifyContent: 'center', maxWidth: 320, overflow: 'hidden', width: '100%' },
  compactGlyphFrame: { maxWidth: 280 },
  denseGlyphFrame: { maxWidth: 320 },
  glyph: { height: '90%', width: '90%' },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'space-between', width: '100%' },
  labelText: { alignItems: 'center', flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, minWidth: 0 },
  romanization: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 25, fontWeight: '900' },
  compactRomanization: { fontSize: 21 },
  denseRomanization: { fontSize: 18 },
  sound: { borderColor: Colors.border, borderRadius: Radius.sm, borderWidth: 1, color: Colors.textSecondary, fontSize: 16, paddingHorizontal: 8, paddingVertical: 3 },
  denseSound: { fontSize: 12, paddingHorizontal: 4, paddingVertical: 1 },
  soundButton: { alignItems: 'center', backgroundColor: '#FFF0E4', borderColor: '#F6D7C3', borderRadius: Radius.full, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  denseSoundButton: { height: 32, width: 32 },
  speaking: { borderColor: Colors.accent, backgroundColor: '#FFE4D1' },
  pressed: { opacity: 0.7 },
});
