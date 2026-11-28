import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AchievementState } from '../../../content/achievements/achievementTypes';
import { FontFamily } from '../../../constants/theme';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { AchievementIconBadge } from './AchievementIconBadge';

export function achievementStatus(s: AchievementState, tl: boolean) {
  if (s.unlockedAt) return tl ? 'Nakamit' : 'Unlocked';
  if (s.availability === 'coming-soon') return tl ? 'Paparating' : 'Coming Soon';
  if (s.availability === 'pending-validation') return tl ? 'Sinusuri pa' : 'Pending validation';
  return s.current ? (tl ? 'Kasalukuyang Isinasagawa' : 'In Progress') : (tl ? 'Hindi Pa Nakamit' : 'Locked');
}
export function AchievementCard({ state, onPress }: { state: AchievementState; onPress: () => void }) {
  const { language } = useLocalization();
  const d = state.definition, status = achievementStatus(state, language === 'tl');
  const amount = state.unlockedAt ? state.grantedStars : d.starValue;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${d.title[language]}. ${status}. ${state.current} / ${state.target}`} onPress={onPress}
    testID={`achievement-${d.id}`} style={({ pressed }) => [styles.card, state.unlockedAt && styles.earned, pressed && { backgroundColor: '#FFF6EB' }]}>
    <View style={[styles.status, state.unlockedAt && { backgroundColor: '#FA711B' }]}><Ionicons name={state.unlockedAt ? 'checkmark' : 'lock-closed-outline'} size={13} color={state.unlockedAt ? '#FFF' : '#796B55'} /></View>
    <View style={styles.icon}><AchievementIconBadge compact definition={d} unlocked={!!state.unlockedAt} /></View>
    <Text style={styles.title}>{d.title[language]}</Text>

    <View style={styles.footer}>
      {state.availability==='available' && amount!=null && <Text style={styles.statusText}>★ {amount} {state.unlockedAt?(language==='tl'?'bituing nakuha':amount===1?'Star earned':'Stars earned'):(language==='tl'?'bituing makukuha':amount===1?'Star to earn':'Stars to earn')}</Text>}
      {state.availability!=='available' && <Text style={styles.statusText}>{status}</Text>}
      {state.availability === 'available' && <>
        <Text style={styles.count}>{state.current} / {state.target}</Text>
        <View accessibilityRole="progressbar" accessibilityLabel={d.title[language]} accessibilityValue={{ min: 0, max: state.target, now: state.current }} style={styles.track}><View style={[styles.fill, { width: `${100 * state.current / state.target}%` }]} /></View>
      </>}
    </View>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#DFD4C4', borderRadius: 16, padding: 7, minHeight: 122, alignItems: 'center', boxShadow: '0 6px 18px rgba(127,82,30,0.06)' },
  earned: { borderColor: '#FA711B', borderWidth: 2 }, status: { position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 15, backgroundColor: '#F4EFE3', alignItems: 'center', justifyContent: 'center' },
  icon: { height: 42, alignItems: 'center' },
  title: { fontFamily: FontFamily.rounded, color: '#30261F', fontWeight: '800', fontSize: 14, textAlign: 'center', marginTop: 3 },
  description: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 22, color: '#746957', textAlign: 'center', minHeight: 66 },
  footer: { width: '100%', marginTop: 'auto', paddingTop: 4, alignItems: 'center', gap: 2 }, statusText: { color: '#855000', fontWeight: '700', fontSize: 12 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#EEE6DA', width: '80%', overflow: 'hidden' }, fill: { height: 6, backgroundColor: '#FA711B' }, count: { color: '#746957', fontSize: 13 },
});
