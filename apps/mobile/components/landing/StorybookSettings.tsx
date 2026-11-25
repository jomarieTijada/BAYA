import React, { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalization } from '../../localization/LocalizationProvider';
import { Colors, FontFamily } from '../../constants/theme';
import { AppIcon } from '../ui/AppIcon';
import { OriginStorybook } from './OriginStorybook';

/** Shared learner/mentor entry; replay never reads or resets introduction state. */
export function StorybookSettings({ compact = false }: { compact?: boolean }) {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const trigger = useRef<View>(null);
  useFocusEffect(useCallback(() => () => setOpen(false), []));
  const title = t('Read BAYA’s Story');
  const description = t('Discover Bayani, the inspiration behind BAYA, and the people who helped bring our learning journey to life.');
  return <View style={[styles.card, compact && { padding: 6, gap: 4, marginBottom: 0, borderRadius: 16 }]} testID="storybook-settings">
    <Text accessibilityRole="header" style={[styles.heading, compact && { fontSize: 16 }]}>{t('About BAYA')}</Text>
    <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={title} accessibilityHint={description}
      testID="storybook-settings-trigger" onPress={() => setOpen(true)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.row, compact && { padding: 2, gap: 6 }, (pressed || focused) && styles.active]}>
      {!compact && <AppIcon name="lessons" color="accent" size={24} />}
      <View style={[styles.copy, compact && { gap: 3 }]}><Text style={[styles.title, compact && { fontSize: 14 }]}>{title}</Text><Text style={[styles.description, compact && { fontSize: 12, lineHeight: 16 }]}>{description}</Text></View>
      <AppIcon name="chevronRight" color="secondaryText" size={compact ? 12 : 20} />
    </Pressable>
    {open && <OriginStorybook onClose={() => {
      setOpen(false);
      if (Platform.OS === 'web') requestAnimationFrame(() => (trigger.current as unknown as HTMLElement)?.focus?.());
    }} />}
  </View>;
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: 24, padding: 20, gap: 12, marginBottom: 16 },
  heading: { fontFamily: FontFamily.rounded, fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  row: { minHeight: 48, padding: 12, borderWidth: 2, borderColor: 'transparent', borderRadius: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  active: { backgroundColor: '#FFF1E8', borderColor: Colors.focus },
  copy: { flex: 1, gap: 6 },
  title: { fontFamily: FontFamily.rounded, fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  description: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 21, color: Colors.textSecondary },
});
