import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LearnerAppShell } from '../LearnerAppShell';
import { openLearnerSettings } from '../settings/LearnerSettingsOverlay';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { localLearnerService } from '../../../database/services/localLearnerService';
import { reconcileAchievements, subscribeAchievements } from '../../../modules/achievements/service';
import { evaluateAchievements } from '../../../modules/achievements/evaluate';
import type { AchievementState } from '../../../content/achievements/achievementTypes';
import { FontFamily } from '../../../constants/theme';
import { useDialogBack } from '../../../hooks/useDialogBack';
import { AchievementCard, achievementStatus } from './AchievementCard';
import { AchievementIconBadge } from './AchievementIconBadge';

export function AchievementsScreen() {
  const { language } = useLocalization(), tl = language === 'tl';
  const { width, fontScale } = useWindowDimensions();
  const [states, setStates] = useState<AchievementState[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selected, setSelected] = useState<AchievementState | null>(null);
  const heading = useRef<View>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const close = useCallback(() => { setSelected(null); if (Platform.OS === 'web') requestAnimationFrame(() => previousFocus.current?.focus()); }, []);
  useDialogBack(!!selected, close, false);
  useEffect(() => {
    if (!selected || Platform.OS !== 'web') return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key);
  }, [selected, close]);
  useFocusEffect(useCallback(() => {
    let live = true;
    const load = async () => {
      try {
        const profile = await localLearnerService.getActiveLearner();
        const next = profile ? await reconcileAchievements(profile.profile_id) : evaluateAchievements({ topics: [], events: [], attempts: [], writingAttempts: 0, writingSuccess: 0 });
        if (live) { setStates(next); setError(false); }
      } catch { if (live) setError(true); }
    };
    setStates(null); void load(); const unsubscribe = subscribeAchievements(() => { void load(); });
    return () => { live = false; unsubscribe(); };
  }, []));
  const earned = states?.filter(s => s.unlockedAt).length ?? 0;
  const available = states?.filter(s => s.availability === 'available').length ?? 0;
  const shown = states?.filter(s => filter === 'all' || (filter === 'unlocked' ? !!s.unlockedAt : !s.unlockedAt));
  const columns = width / fontScale >= 940 ? 4 : width / fontScale >= 310 ? 3 : 2;
  return <LearnerAppShell activeRoute="/learner/achievements" testID="achievements-screen">
    <ScrollView contentContainerStyle={styles.scroll} testID="achievements-scroll">
      <View style={styles.headingRow}><View style={{ flex: 1 }}><Text accessibilityRole="header" style={styles.heading}>{tl ? 'Aking mga Nakamit' : 'My Achievements'}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={tl ? 'Mga Setting' : 'Settings'} onPress={() => openLearnerSettings()} style={styles.settings}><Ionicons name="settings" size={26} color="#FA711B" /></Pressable></View>
      <View style={styles.filters}>{(['all', 'unlocked', 'locked'] as const).map((f, i) => <Pressable key={f} accessibilityRole="button" accessibilityState={{ selected: filter === f }} onPress={() => setFilter(f)} style={[styles.filter, filter === f && styles.activeFilter]}><Text style={[styles.filterText, filter === f && { color: '#FFF' }]}>{(tl ? ['Lahat', 'Nakamit', 'Hindi Pa Nakamit'] : ['All', 'Unlocked', 'Locked'])[i]}</Text></Pressable>)}</View>
      {error ? <Text accessibilityRole="alert">{tl ? 'Hindi mabasa ang mga nakamit. Buksan muli ang pahina upang subukan.' : 'Could not load achievements. Reopen this page to retry.'}</Text> : !states ? <ActivityIndicator accessibilityLabel={tl ? 'Naglo-load' : 'Loading achievements'} color="#FA711B" /> : <>
        <Text style={styles.summary}>{earned} / 50 {tl ? 'nakamit' : 'unlocked'} · {available} {tl ? 'maaaring makamit ngayon' : 'currently obtainable'}</Text>
        {!shown?.length && <Text style={styles.empty}>{tl ? 'Nagsisimula pa lang ang iyong paglalakbay sa Baybayin!' : 'Your Baybayin journey is just beginning!'}</Text>}
        <View style={styles.grid}>{shown?.map(state => <View key={state.definition.id} style={{ width: `${100 / columns}%`, padding: 4 }}><AchievementCard state={state} onPress={() => { if (Platform.OS === 'web') previousFocus.current = document.activeElement as HTMLElement; setSelected(state); }} /></View>)}</View>
      </>}
    </ScrollView>
    <Modal visible={!!selected} transparent animationType="none" onRequestClose={close} onShow={() => { if (Platform.OS === 'web') (heading.current as unknown as HTMLElement)?.focus(); }}>
      <View style={styles.backdrop}>{selected && <View role="dialog" accessibilityViewIsModal aria-label={selected.definition.title[language]} style={styles.dialog}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', gap: 18, padding: 28 }}>
          <AchievementIconBadge definition={selected.definition} unlocked={!!selected.unlockedAt} />
          <View ref={heading} tabIndex={-1}><Text accessibilityRole="header" style={styles.heading}>{selected.definition.title[language]}</Text></View>
          <Text style={styles.subtitle}>{achievementStatus(selected, tl)}</Text>
          <Text style={styles.subtitle}>{selected.definition.description[language]}</Text>
          <Text style={styles.requirement}>{selected.definition.requirement[language]}</Text>
          {selected.definition.condition.type === 'metric' && selected.definition.condition.metric === 'recordings' && <Text style={styles.subtitle}>{tl ? 'Ipinapakita nito na natapos ang pagpatugtog, hindi na nasukat ang pag-unawa.' : 'Playback completion records that a recording played; it does not measure understanding or hearing.'}</Text>}
          <Text style={styles.summary}>{selected.current} / {selected.target}</Text>
          {selected.unlockedAt && <Text style={styles.subtitle}>{tl ? 'Nakamit noong' : 'Unlocked on'} {new Date(selected.unlockedAt).toLocaleDateString(tl ? 'fil-PH' : 'en-PH')}</Text>}
          <Pressable accessibilityRole="button" onPress={close} style={[styles.filter, styles.activeFilter]}><Text style={[styles.filterText, { color: '#FFF' }]}>{tl ? 'Isara' : 'Close'}</Text></Pressable>
        </ScrollView>
      </View>}</View>
    </Modal>
  </LearnerAppShell>;
}
const styles = StyleSheet.create({
  scroll: { padding: 8, paddingBottom: 36, width: '100%', maxWidth: 1500, alignSelf: 'center' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 16, margin: 4 }, heading: { fontFamily: FontFamily.rounded, color: '#30261F', fontSize: 23, fontWeight: '800' }, subtitle: { color: '#746957', fontFamily: FontFamily.body, fontSize: 16, lineHeight: 24, marginTop: 6 },
  settings: { width: 44, height: 44, borderRadius: 26, borderWidth: 2, borderColor: '#E6D9C7', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, margin: 4, marginTop: 2 }, filter: { minHeight: 36, borderRadius: 18, borderWidth: 2, borderColor: '#DFD4C4', paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#FFF', justifyContent: 'center' }, activeFilter: { backgroundColor: '#ED6610', borderColor: '#ED6610' }, filterText: { fontFamily: FontFamily.rounded, fontSize: 14, fontWeight: '700', color: '#675B4D' },
  summary: { margin: 4, color: '#746957', fontSize: 14 }, grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch' }, empty: { padding: 28, fontSize: 18, color: '#746957' },
  backdrop: { flex: 1, backgroundColor: 'rgba(40,30,20,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 }, dialog: { width: '100%', maxWidth: 560, maxHeight: '90%', backgroundColor: '#FFFDF8', borderRadius: 28, borderColor: '#FA711B', borderWidth: 2 }, requirement: { fontFamily: FontFamily.body, color: '#504334', fontSize: 17, lineHeight: 26, textAlign: 'center' },
});
