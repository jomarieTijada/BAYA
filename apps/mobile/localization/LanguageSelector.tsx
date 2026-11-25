import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../constants/theme';
import { languageNames, type Language } from './core';
import { useLocalization } from './LocalizationProvider';
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t, saveError } = useLocalization();
  return <View style={[styles.card, compact && { padding: 6, gap: 6, marginBottom: 0, borderRadius: 16 }]} testID="language-selector">
    <Text style={[styles.title, compact && { fontSize: 16 }]}>{t('Language')}</Text>
    <View style={[styles.options, compact && { gap: 6, flexWrap: "nowrap" }]} accessibilityRole="radiogroup" accessibilityLabel={t('Language')}>
      {(Object.keys(languageNames) as Language[]).map(value => <Pressable key={value} {...(Platform.OS === 'web' ? {
        tabIndex: language === value ? 0 : -1,
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next: Language = event.key === 'Home' ? 'en' : event.key === 'End' ? 'tl' : value === 'en' ? 'tl' : 'en';
          setLanguage(next);
          event.currentTarget.parentElement?.querySelector<HTMLElement>('[aria-label="' + languageNames[next] + '"]')?.focus();
        },
      } : {})} accessibilityRole="radio" accessibilityState={{ checked: language === value }} accessibilityLabel={languageNames[value]} onPress={() => setLanguage(value)} style={[styles.option, compact && { minHeight: 36, minWidth: 0, flex: 1, paddingVertical: 6, paddingHorizontal: 6 }, language === value && styles.selected]}>
        <Text style={[styles.label, compact && { fontSize: 14 }]}>{languageNames[value]}</Text>
      </Pressable>)}
    </View>
    {saveError && <Text accessibilityRole="alert" style={styles.error}>{t('Language changed for this session. Could not save it. Select the language to retry.')}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: 24, padding: 20, gap: 12, marginBottom: 16, width: '100%' },
  title: { fontFamily: FontFamily.rounded, fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  option: { borderRadius: 18, borderWidth: 2, borderColor: Colors.border, paddingHorizontal: 20, paddingVertical: 12, minHeight: 48, minWidth: 120, alignItems: 'center', justifyContent: 'center' },
  selected: { borderColor: Colors.accent, backgroundColor: '#FFF1E8' },
  label: { fontFamily: FontFamily.rounded, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  error: { fontFamily: FontFamily.body, color: Colors.error, fontSize: 15 },
});
