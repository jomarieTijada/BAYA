import React from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text, Pressable } from '../../localization/components';
import { useLocalization } from '../../localization/LocalizationProvider';
import { Colors, FontFamily } from '../../constants/theme';
import { BayaLogo } from '../branding/BayaLogo';
import { BayaMascot } from '../branding/BayaMascot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton } from '../ui/AppButton';
import type { OfflineState } from '../../modules/offline/package';

const loadingLabels: Record<string, string> = {
  'Application shell': 'Loading BAYA…',
  'Lessons and activities': 'Loading lessons…',
  'Educational videos': 'Loading videos…',
  'Pronunciation audio': 'Loading sounds…',
  'Character illustrations': 'Loading characters…',
  'Bayani animations': 'Loading Bayani…',
  'Storybook resources': 'Loading stories…',
  'Handwriting model': 'Preparing handwriting…',
  'LiteRT runtime': 'Preparing handwriting…',
};

export function PwaLaunchScreen({ install, state, onRetry, onContinue }: {
  install?: { installed: boolean; instructions: boolean; prompting: boolean; install: () => Promise<void> };
  state: OfflineState;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const { language, setLanguage } = useLocalization();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const availableHeight = height - insets.top - insets.bottom;
  const wide = width > height;
  const compact = availableHeight < 500;
  const logoSize = compact ? 44 : 60;
  const mascotSize = wide
    ? Math.min(420, width * 0.43, Math.max(64, availableHeight - 60))
    : Math.min(300, width * 0.8, Math.max(64, availableHeight * 0.34));
  const failed = ['failed', 'interrupted', 'incomplete'].includes(state.phase);
  const downloading = state.phase === 'downloading';
  const percent = state.downloadTotalBytes ? Math.min(100, Math.floor((state.completedDownloadBytes || 0) * 100 / state.downloadTotalBytes)) : 0;
  const label = failed ? 'Download paused'
    : state.phase === 'validating' ? 'Getting everything ready…'
      : state.phase === 'verifying' ? 'Checking saved assets…'
        : loadingLabels[state.category || ''] || 'Loading assets…';
  return <View testID={install ? 'pwa-install-welcome' : 'offline-setup'} style={[s.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8, paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }]}>
    <View style={s.language}>
      {(['en', 'tl'] as const).map(code => <Pressable key={code} accessibilityRole="button"
        accessibilityLabel={code === 'en' ? 'English' : 'Tagalog'} accessibilityState={{ selected: language === code }}
        onPress={() => setLanguage(code)} style={[s.languageButton, language === code && s.selected]}>
        <Text style={s.languageText}>{code === 'en' ? 'English' : 'Tagalog'}</Text>
      </Pressable>)}
    </View>
    <View style={[s.content, wide && s.wide]}>
      <View style={[s.hero, wide && { flex: 1 }]}>
        <BayaMascot size={mascotSize} state="wave" loop />
      </View>
      <View style={[s.actions, wide && { flex: 1 }]}>
        <View style={{alignItems:'center'}}>
          <BayaLogo size={logoSize} />
          <Text style={s.tagline}>{"Mabuhay! Let's learn Baybayin together!"}</Text>
        </View>
        {install?.installed && <Text style={s.note}>Open BAYA from your home screen.</Text>}
        {install ? <>
          {!install.installed && <AppButton accessibilityLabel="Install BAYA" label="Install BAYA"
            disabled={install.prompting} onPress={() => { void install.install(); }} />}
          {install.instructions && <Text style={s.note}>Use your browser’s menu or Share button, then choose Install app or Add to Home Screen. After installing, open BAYA from your home screen.</Text>}
          <Pressable accessibilityRole="button" accessibilityLabel="Continue in browser" onPress={onContinue} style={s.textButton}>
            <Text style={s.link}>Continue in browser</Text>
          </Pressable>
        </> : <>
          <Text accessibilityLiveRegion="polite" style={s.loading}>{label}</Text>
          {downloading ? <><View accessibilityRole="progressbar" accessibilityLabel="Loading assets"
            accessibilityValue={{ min: 0, max: 100, now: percent }} style={s.track}>
            <View style={[s.fill, { width: `${percent}%` }]} />
          </View>
          <Text style={s.percent}>{`${percent}%`}</Text></> : !failed && <ActivityIndicator accessibilityLabel={label} color={Colors.accent} size="small" />}
          {failed ? <>
            <Text style={s.note}>{state.error === 'STORAGE_FULL'
              ? 'Not enough storage. Free some device space and retry. Your learning progress is safe.'
              : 'Check your connection, then try again.'}</Text>
            <AppButton accessibilityLabel="RETRY" label="RETRY" onPress={onRetry} />
            <Pressable accessibilityRole="button" accessibilityLabel="Continue with available lessons" onPress={onContinue} style={s.textButton}>
              <Text style={s.link}>Continue with available lessons</Text>
            </Pressable>
          </> : <Text style={s.note}>{downloading && state.downloadTotalBytes
            ? `${language === 'tl' ? 'Dina-download' : 'Downloading'} · ${Math.ceil(state.downloadTotalBytes / 1048576)} MB`
            : state.phase === 'validating' ? 'Download complete. Checking your learning tools…' : 'Checking this device before downloading.'}</Text>}
        </>}
      </View>
    </View>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: Colors.background, alignItems: 'center' },
  language: { flexDirection: 'row', alignSelf: 'flex-end', gap: 4, marginBottom: 4 },
  languageButton: { minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 20 },
  selected: { backgroundColor: '#F8E9D6' },
  languageText: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textPrimary },
  content: { width: '100%', maxWidth: 440, gap: 8, flex: 1, minHeight: 0, justifyContent: 'center' },
  wide: { maxWidth: 900, flexDirection: 'row', alignItems: 'center', gap: 24 },
  hero: { alignItems: 'center', minHeight: 0, flexShrink: 1 },
  tagline: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 18, textAlign: 'center', color: Colors.textPrimary, marginTop: 6, maxWidth: 320 },
  actions: { width: '100%', gap: 8 },
  loading: { fontFamily: FontFamily.body, fontSize: 17, fontWeight: '700', textAlign: 'center', color: Colors.textPrimary },
  track: { height: 18, padding: 3, borderWidth: 2, borderColor: '#795333', borderRadius: 4, backgroundColor: '#F3E4D0', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 1 },
  percent: { fontFamily: FontFamily.body, fontWeight: '700', fontSize: 14, color: Colors.textPrimary, textAlign: 'center' },
  note: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 20, color: Colors.textSecondary, textAlign: 'center' },
  textButton: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  link: { fontFamily: FontFamily.body, fontSize: 14, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
