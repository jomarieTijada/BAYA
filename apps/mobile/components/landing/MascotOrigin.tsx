import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily } from '../../constants/theme';
import { useLocalization } from '../../localization/LocalizationProvider';
import { OriginStorybook } from './OriginStorybook';
import { storybookCopy } from './storybookContent';

/** Optional story: no account, learning progress, or persistence side effects. */
export function MascotOrigin({ compact = false, onOpen }: { compact?: boolean; onOpen?: () => void }) {
  const { language } = useLocalization();
  const copy = storybookCopy[language];
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const trigger = useRef<View>(null);
  return <>
    <Pressable ref={trigger} testID="mascot-origin-teaser" accessibilityRole="button" accessibilityLabel={`${copy.title}. ${copy.open}`} onPress={() => { if (onOpen) onOpen(); else setOpen(true); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [styles.teaser, compact && styles.compact, (pressed || hovered) && { backgroundColor: '#F7EBD7' }, focused && { borderColor: Colors.focus }]}>
      <View style={styles.text}>
        <Text style={styles.title}>{copy.title}</Text>
        {!compact && <Text style={styles.body}>{copy.invitation}</Text>}
        <Text style={styles.link}>{copy.open}  →</Text>
      </View>
    </Pressable>
    {open && <OriginStorybook onClose={() => {
      setOpen(false);
      if (Platform.OS === 'web') requestAnimationFrame(() => (trigger.current as unknown as HTMLElement)?.focus?.());
    }} />}
  </>;
}
const styles = StyleSheet.create({
  teaser: { width: '100%', maxWidth: 500, marginTop: 18, padding: 16, borderWidth: 2, borderColor: 'transparent', borderRadius: 16, backgroundColor: '#F5EEDD' },
  compact: { marginTop: 10, padding: 10 }, text: { gap: 6 },
  title: { fontFamily: FontFamily.rounded, fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  body: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 20, color: Colors.textSecondary },
  link: { fontFamily: FontFamily.body, fontSize: 14, fontWeight: '700', color: '#965125' },
});
