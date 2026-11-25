import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { kudlitVariant } from '../../content/traditionalCharacters';
import { Colors } from '../../constants/theme';
import { getBaybayinTracingGuide } from '../../content/baybayinTracingGuides';
import { useLocalization } from '../../localization/LocalizationProvider';
import { characterVariantRecordings } from './pronunciationMapping';
import { PronunciationButton } from './PronunciationButton';

/** Separate buttons preserve the distinct E/I and O/U recordings for a shared glyph. */
export function KudlitRecordings({ characterId, position, iconOnly = false }: { iconOnly?: boolean; characterId: string; position?: 'upper' | 'lower' }) {
  const { language } = useLocalization();
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const entries = characterVariantRecordings(characterId).filter(e => !position || (position === 'upper' ? /[ei]$/.test(e.syllableId) : /[ou]$/.test(e.syllableId)));
  const variant = position ? kudlitVariant(characterId, position) : null;
  if (!entries.length && !position) return null;
  const glyphs = variant ? [variant.id] : [...new Set(entries.map(entry => entry.characterId))];
  return <View testID="kudlit-recordings">
    {!position && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderRadius: 12, borderColor: focused ? Colors.focus : 'transparent' }}>
      <Text style={{ color: Colors.accent }}>{language === 'tl' ? 'Mga tunog na may kudlit' : 'Sounds with kudlit'} {expanded ? '−' : '+'}</Text>
    </Pressable>}
    {(expanded || position) && glyphs.map(id => <View key={id} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 4 }}>
      {!iconOnly && <Image source={getBaybayinTracingGuide(id)} accessibilityLabel={variant?.label ?? entries.filter(e => e.characterId === id).map(e => e.label).join(' / ')} style={{ width: 44, height: 44 }} resizeMode="contain" />}
      {entries.filter(e => e.characterId === id).map(entry => <PronunciationButton key={entry.id} audioId={entry.id} label={entry.label} iconOnly={false} />)}
      {!entries.some(e => e.characterId === id) && <Text>{language === 'tl' ? 'Hinihintay ang pagpapatunay ng recording.' : 'Recording awaiting validation.'}</Text>}
    </View>)}
  </View>;
}
