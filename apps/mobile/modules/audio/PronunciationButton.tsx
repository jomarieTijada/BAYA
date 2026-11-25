import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/theme';
import { useLocalization } from '../../localization/LocalizationProvider';
import { AppIcon } from '../../components/ui/AppIcon';
import { bayaAudio } from './manifest';
import { usePronunciation } from './usePronunciation';

export function PronunciationButton({ audioId, label, language: override, iconOnly = false }: { iconOnly?: boolean; audioId: string; label: string; language?: 'en' | 'tl' }) {
  const { language } = useLocalization();
  const tl = (override ?? language) === 'tl';
  const entry = bayaAudio.find(item => item.id === audioId);
  const { pronounce, phase, available, stop } = usePronunciation(entry);
  React.useEffect(() => () => stop(), [override, stop]);
  const [focused, setFocused] = useState(false);
  return <View>
    <Pressable accessibilityRole="button" disabled={!available}
      accessibilityLabel={tl ? `Pakinggan ang pagbigkas ng ${label}` : `Play ${label} pronunciation`}
      accessibilityState={{ disabled: !available, busy: phase === 'loading', selected: phase === 'playing' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={pronounce}
      style={[styles.button, focused && styles.focus, phase === 'playing' && styles.active]}>
      <AppIcon name="sound" size={18} color="accent" />{!iconOnly && <Text style={styles.label}>{label}</Text>}
    </Pressable>
    {(phase === 'loading' || phase === 'error' || !available) && <Text accessibilityLiveRegion="polite" style={styles.feedback}>
      {!available ? (tl ? 'Wala pang recording.' : 'Recording unavailable.') : phase === 'loading' ? (tl ? 'Inihahanda ang tunog…' : 'Loading sound…') : (tl ? 'Hindi mapatugtog. Subukang muli.' : 'Could not play. Try again.')}
    </Text>}
  </View>;
}
const styles = StyleSheet.create({
  button: { minHeight: 44, minWidth: 44, paddingHorizontal: 10, flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0E4', borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  focus: { borderColor: Colors.focus }, active: { borderColor: Colors.accent }, label: { color: Colors.textPrimary }, feedback: { fontSize: 12, maxWidth: 160, color: Colors.textSecondary },
});
