import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import { glyphAsset, questionRecording, type CharacterQuestion, type ChoiceQuestion } from '../../../content/characterActivities';
import { usePronunciation } from '../../../modules/audio/usePronunciation';
import { AppButton } from '../../ui/AppButton';
import { useCharacterCopy } from './copy';

export function Glyph({ glyph, label, size = 100 }: { glyph: string; label: string; size?: number }) {
  return <Image accessibilityLabel={label} source={glyphAsset(glyph)} resizeMode="contain" style={{ width: size, height: size }} />;
}
export function QuestionProgress({ value, total, label }: { value: number; total: number; label: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: total, now: value }} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} style={s.track}>
    <View style={[s.fill, { width: `${Math.min(100, value / total * 100)}%` }]} />
  </View>;
}
export function AudioPrompt({ question, onPlayed, compact = false }: { question: CharacterQuestion; onPlayed: () => void; compact?: boolean }) {
  const copy = useCharacterCopy(), entry = questionRecording(question), player = usePronunciation(entry);
  const [hasPlayed, setHasPlayed] = useState(false);
  useEffect(() => { if (player.phase === 'playing') onPlayed(); }, [player.phase, onPlayed]);
  if (compact && !entry) return <Text accessibilityRole="alert" style={[s.body, { fontSize: 14, lineHeight: 18 }]}>{copy.missingAudio}</Text>;
  return <View style={[s.audio, compact && { padding: 8, gap: 4 }]}>
    {!compact && <Text style={s.eyebrow}>{copy.types[0]}</Text>}
    <AppButton compact={compact} icon="sound" label={player.loading ? copy.loading : player.speaking ? copy.playing : hasPlayed ? copy.replay : copy.play}
      accessibilityLabel={copy.play} disabled={!entry || player.loading} onPress={() => { setHasPlayed(true); player.pronounce(); }} tone={player.speaking ? 'primary' : 'outlinePrimary'} />
    {!compact && <Text style={s.audioHint}>{!entry ? copy.deferred : copy.listenSteps}</Text>}
    {(!entry || player.error) && <Text accessibilityRole="alert" style={s.body}>{entry ? copy.audioError : copy.missingAudio}</Text>}
  </View>;
}
export function ChoiceOptions({ question, glyphs, selected, disabled, onSelect, compact = false, checkedLetter }: {
  question: ChoiceQuestion; glyphs: boolean; selected?: string; disabled: boolean; onSelect: (id: string) => void; compact?: boolean; checkedLetter?: string;
}) {
  const copy = useCharacterCopy();
  const [focus, setFocus] = useState('');
  return <View style={[s.choices, compact && { gap: 6 }]} >
    {question.options.map(option => <Pressable key={option.id} testID={`answer-${option.letter}`}
      accessibilityRole="radio" accessibilityLabel={`${copy.option} ${option.letter}${glyphs ? '' : `: ${option.label}`}`}
      accessibilityState={{ checked: selected === option.id, disabled }} aria-checked={selected === option.id} aria-disabled={disabled} disabled={disabled}
      onFocus={event => setFocus((event.currentTarget as unknown as { matches?: (selector: string) => boolean }).matches?.(':focus-visible') ? option.id : '')} onPressIn={() => setFocus('')} onBlur={() => setFocus('')} onPress={() => onSelect(option.id)}
      style={({ pressed }) => [s.choice, compact && { minHeight: 38, paddingHorizontal: 12 }, checkedLetter === option.letter && { borderColor: Colors.bayaGreen }, selected === option.id && s.selected, disabled && s.disabledChoice, pressed && !disabled && s.pressed, focus === option.id && s.focus]}>
      <Text style={s.letter}>{option.letter}</Text>
      {glyphs ? <Glyph glyph={option.label} label={`${copy.option} ${option.letter}`} size={compact ? 34 : 64} /> : <Text style={s.option}>{option.label}</Text>}
      <Text style={s.check}>{selected === option.id ? '✓' : ''}</Text>
    </Pressable>)}
  </View>;
}
export const s = StyleSheet.create({
  page: { alignSelf: 'center', width: '100%', maxWidth: 1100, padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },
  title: { fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  heading: { fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontSize: 21, fontWeight: '800' },
  body: { fontFamily: FontFamily.rounded, color: Colors.textSecondary, fontSize: 16, lineHeight: 23 },
  eyebrow: { fontFamily: FontFamily.rounded, color: Colors.textSecondary, fontSize: 13, fontWeight: '800' },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, flexWrap: 'wrap' },
  track: { height: 10, borderRadius: Radius.full, overflow: 'hidden', backgroundColor: Colors.progressTrack, width: '100%' },
  fill: { backgroundColor: Colors.accent, height: '100%', borderRadius: Radius.full },
  audio: { alignSelf: 'center', width: '100%', gap: Spacing.md, padding: Spacing.md, backgroundColor: '#FFF7E9', borderColor: Colors.border, borderWidth: 1, borderRadius: Radius.xl },
  audioHint: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center', fontFamily: FontFamily.rounded },
  choices: { gap: Spacing.sm },
  choice: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, gap: Spacing.sm, borderWidth: 2, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.surface },
  selected: { borderColor: Colors.accent, backgroundColor: Colors.roleSecondaryHover },
  disabledChoice: { backgroundColor: '#F7F3ED' },
  pressed: { backgroundColor: '#FFF1DE' },
  focus: { borderColor: Colors.focus, borderWidth: 3 },
  letter: { color: Colors.textSecondary, fontSize: 16, fontWeight: '800', width: 24 },
  option: { flexShrink: 1, color: Colors.textPrimary, fontSize: 21, fontWeight: '700', textAlign: 'center' },
  check: { width: 24, fontSize: 24, color: Colors.textPrimary },
  prompt: { alignItems: 'center', justifyContent: 'center', minHeight: 132, padding: Spacing.md, backgroundColor: '#FFF9EF', borderColor: '#EBDCC6', borderWidth: 1, borderRadius: Radius.xl },
  underlined: { textDecorationLine: 'underline', color: '#B74912', backgroundColor: '#FFEACA' },
  word: { fontSize: 36, fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontWeight: '800', textAlign: 'center' },
  feedback: { padding: Spacing.md, borderRadius: Radius.xl, borderWidth: 1, borderColor: '#E6D1AD', backgroundColor: Colors.surface, gap: Spacing.md },
});
