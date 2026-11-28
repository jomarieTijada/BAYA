import { localLearnerService } from '../../database/services/localLearnerService';
import { getReadyDatabase } from '../../database/lifecycle';
import { recordAchievementEvent } from '../../modules/achievements/service';
import { useOrientationBlocked } from '../layout/OrientationVisibility';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Radius, Shadows } from '../../constants/theme';
import { useDialogBack } from '../../hooks/useDialogBack';
import { useLocalization } from '../../localization/LocalizationProvider';
import { StorybookVisual } from './StorybookVisual';
import { AppIcon } from '../ui/AppIcon';
import { AppButton } from '../ui/AppButton';
import { storybookCopy, storybookPages } from './storybookContent';
import { useStorybookTurn } from './useStorybookTurn';

export function OriginStorybook({ onClose, settingsReplay = false }: { onClose: () => void; settingsReplay?: boolean }) {
  const previousStory = useRef(false);
  const ownerAtOpen = useRef<Promise<string | undefined> | null>(null);
  useEffect(() => { ownerAtOpen.current = localLearnerService.getActiveLearner().then(async p => {
    if (p) { const db = await getReadyDatabase(); previousStory.current = !!(await db.getFirstAsync('SELECT 1 FROM achievement_events WHERE learner_id = ? AND event_type = ? LIMIT 1;', [p.profile_id, 'story'])); }
    return p?.profile_id;
  }).catch(() => undefined); }, []);
  const blocked = useOrientationBlocked();
  const { language } = useLocalization();
  const copy = storybookCopy[language];
  const pages = storybookPages[language];
  const { page, busy, surface, fade, turn } = useStorybookTurn(pages.length);
  const current = pages[page];
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const small = height < 500;
  const narrow = width < 600 && height >= 500;
  // Short phones use paragraph-sized turns so the copy stays readable without scrolling.
  const pagedParagraphs = small && (width < 780 || language === 'tl');
  const [part, setPart] = useState(0);
  const separateClosing = pagedParagraphs && height < 350 && current.id === 'thanks';
  const partCount = pagedParagraphs ? current.paragraphs.length + (separateClosing ? 1 : 0) : 1;
  const activePart = Math.min(part, partCount - 1);
  const lastPart = activePart === partCount - 1;
  const progress = (page + (activePart + 1) / partCount) / pages.length * 100;
  const pageLabel = `${copy.page(page + 1)}${partCount > 1 ? ` · ${activePart + 1}/${partCount}` : ''}`;
  const navigate = (direction: -1 | 1) => {
    if (busy) return;
    if (direction === 1 && !lastPart) { setPart(activePart + 1); return; }
    if (direction === -1 && activePart > 0) { setPart(activePart - 1); return; }
    if (direction === 1 && page === pages.length - 1) {
      void ownerAtOpen.current?.then(async id => {
        if (!id) return;
        await recordAchievementEvent(id, 'story', 'five-pages-v1');
        if (settingsReplay && previousStory.current) await recordAchievementEvent(id, 'replay', 'settings-five-pages-v1');
      }).catch(error => console.warn('[BAYA achievements] Story evidence could not be saved.', error));
      onClose(); return;
    }
    setPart(direction === -1 && pagedParagraphs ? pages[page - 1].paragraphs.length - 1 : 0);
    void turn(direction);
  };
  const heading = useRef<View>(null);
  const scroll = useRef<ScrollView>(null);
  useDialogBack(!blocked, onClose, false);
  useEffect(() => {
    if (blocked || Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Android browser Back is a close request, even when no route traversal exists.
    // Feature detection preserves the existing Escape/navigation fallback elsewhere.
    const Watcher = (window as unknown as { CloseWatcher?: new () => EventTarget & { destroy(): void } }).CloseWatcher;
    if (!Watcher) return;
    const watcher = new Watcher();
    watcher.addEventListener('close', onClose);
    return () => { watcher.removeEventListener('close', onClose); watcher.destroy(); };
  }, [onClose, blocked]);
  useEffect(() => {
    if (blocked || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, blocked]);
  const focus = useCallback(() => {
    if (blocked) return;
    if (Platform.OS === 'web') {
      const element = heading.current as unknown as HTMLElement | null;
      // This is a programmatic reading target, not an interactive control.
      element?.style?.setProperty('outline', 'none', 'important');
      element?.focus?.({ preventScroll: true });
    }
    else {
      const node = findNodeHandle(heading.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, [blocked]);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [page, activePart]);
  useEffect(() => {
    if (!blocked && !busy) { focus(); AccessibilityInfo.announceForAccessibility(`${pageLabel}. ${current.title}`); }
  }, [page, busy, copy, current.title, focus, blocked, activePart, pageLabel]);
  const mascotSize = narrow ? Math.min(width - 120, 220) : Math.min(380, (Math.min(1240, width - 24) - 112) * (small && width < 780 ? .28 : .4), height - 95);
  return <Modal transparent visible={!blocked} animationType="none" onRequestClose={onClose} onShow={focus}>
    <View style={[styles.backdrop, { paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(12, insets.bottom), paddingHorizontal: Math.max(12, insets.left, insets.right) }]}>
      <View accessibilityViewIsModal role="dialog" aria-label={copy.title} style={[styles.book, { height: Math.min(820, height - Math.max(12, insets.top) - Math.max(12, insets.bottom)) }]} testID="origin-storybook">
        <View style={styles.header} testID="origin-header">
          <View style={[styles.headerRow, small && { paddingVertical: 6 }]}>
            <Text style={styles.bookTitle} accessibilityRole="header">{copy.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={copy.close} onPress={onClose} hitSlop={8} style={({ pressed }) => [styles.close, pressed && { backgroundColor: '#EEE3D1' }]}><AppIcon name="close" size={18} color="secondaryText" /></Pressable>
          </View>
          <View testID="origin-progress" accessibilityRole="progressbar" accessibilityLabel={copy.chapter}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={pageLabel}
            accessibilityValue={{ min: 0, max: 100, now: progress, text: pageLabel }}
            style={[styles.progressTrack, small && { height: 3 }]}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        <View style={styles.stage}>
        <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.scrollContent} testID="origin-scroll" bounces={false}>
          <Animated.View ref={surface} style={[styles.spread, narrow && styles.stacked, small && styles.shortSpread, { opacity: fade }]} testID="origin-spread">
            <View style={[styles.visual, narrow ? styles.visualStacked : { width: small ? (width < 780 ? '28%' : current.visual === 'mascot' ? '40%' : '34%') : '40%' }, small && styles.shortVisual]} testID="origin-illustration">
              <StorybookVisual key={current.id} page={current} language={language} mascotSize={mascotSize} turning={busy} detailIndex={pagedParagraphs ? Math.min(activePart, 2) : undefined} />
            </View>
            <View style={[styles.reading, narrow && styles.readingStacked, small && styles.shortReading]} testID="origin-reading">
              <View ref={heading} tabIndex={-1} style={styles.headingFocus}>
                <Text accessibilityRole="header" style={[styles.title, (narrow || small) && { fontSize: width < 780 ? 20 : 23, lineHeight: width < 780 ? 23 : 27 }]}>{current.title}</Text>
              </View>
              <Text style={[styles.subtitle, small && { fontSize: 13, lineHeight: 17, marginBottom: 0 }]}>{current.subtitle}</Text>
              {(pagedParagraphs ? current.paragraphs.slice(activePart, activePart + 1) : current.paragraphs).map(paragraph => <Text key={paragraph} style={[styles.body, small && { fontSize: height < 350 ? 13 : 14, lineHeight: height < 350 ? 17 : 19 }]}>{paragraph}</Text>)}
              {current.id === 'thanks' && lastPart && <Text style={[styles.closing, small && { fontSize: height < 350 ? 13 : 14, lineHeight: height < 350 ? 17 : 19, marginTop: 0 }]}>{copy.closing}</Text>}
            </View>
          </Animated.View>
        </ScrollView>
        <View pointerEvents="box-none" style={styles.navigation}>
          <AppButton label="" icon="chevronLeft" accessibilityLabel={copy.previous} compact fullWidth={false} tone="outlinePrimary" disabled={(page === 0 && activePart === 0) || busy} onPress={() => navigate(-1)} style={styles.nav} />
          <AppButton label="" icon={page === pages.length - 1 && lastPart ? 'check' : 'chevronRight'} accessibilityLabel={page === pages.length - 1 && lastPart ? copy.finish : copy.next} compact fullWidth={false} disabled={busy} onPress={() => navigate(1)} style={styles.nav} />
        </View>
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(53,42,29,.32)' },
  book: { width: '100%', maxWidth: 1240, backgroundColor: '#FFFCF5', borderRadius: 24, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.card },
  header: { flexShrink: 0, borderBottomWidth: 1, borderColor: Colors.border, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6, gap: 12 },
  bookTitle: { flex: 1, fontFamily: FontFamily.rounded, fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  close: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  stage: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 }, scrollContent: { flexGrow: 1 },
  spread: { flexGrow: 1, flexDirection: 'row', paddingVertical: 20, paddingHorizontal: 56, gap: 24, backfaceVisibility: 'hidden', backgroundColor: '#FFFCF5' },
  shortSpread: { paddingVertical: 10, gap: 18 },
  shortVisual: { gap: 4 },
  stacked: { flexDirection: 'column', paddingVertical: 14, paddingHorizontal: 48, gap: 12 },
  visual: { alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 0 },
  visualStacked: { width: '100%' },
  reading: { flex: 1, justifyContent: 'center', borderLeftWidth: 1, borderColor: '#EEE3D1', paddingLeft: 24, gap: 12, minWidth: 0 },
  readingStacked: { paddingLeft: 0, borderLeftWidth: 0 },
  shortReading: { paddingLeft: 18, gap: 7 },
  eyebrow: { fontFamily: FontFamily.body, fontSize: 11, fontWeight: '700', letterSpacing: 2, color: Colors.accent },
  headingFocus: { borderRadius: 6, ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}) },
  title: { fontFamily: FontFamily.rounded, fontSize: 36, lineHeight: 42, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: 17, lineHeight: 24, color: Colors.accent, marginBottom: 4 },
  body: { fontFamily: FontFamily.body, fontSize: 18, lineHeight: 28, color: Colors.textPrimary },
  caption: { fontFamily: FontFamily.body, fontSize: 14, lineHeight: 20, textAlign: 'center', color: Colors.textSecondary, maxWidth: 360 },
  credit: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  imageCredit: { textAlign: 'center', maxWidth: 360 },
  glyphs: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 380, paddingVertical: 16 },
  learningGlyphs: { gap: 8, paddingVertical: 0, maxWidth: 320 },
  glyph: { width: '43%', aspectRatio: 1, padding: 12, borderRadius: 18, backgroundColor: '#F5EDD9', alignItems: 'center' },
  smallGlyph: { width: '21%', height: 70, aspectRatio: undefined, padding: 5 },
  glyphImage: { width: '100%', flex: 1 }, glyphLabel: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textSecondary },
  acknowledgements: { borderTopWidth: 1, borderColor: Colors.border, paddingTop: 14, gap: 7 },
  ackTitle: { fontFamily: FontFamily.body, fontSize: 13, fontWeight: '700', color: Colors.accent },
  ackBody: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
  closing: { fontFamily: FontFamily.rounded, fontSize: 18, lineHeight: 25, fontWeight: '700', color: Colors.textPrimary, marginTop: 9 },
  navigation: { position: 'absolute', left: 7, right: 7, top: '50%', marginTop: -20, flexDirection: 'row', justifyContent: 'space-between' },
  nav: { width: 38, height: 40, minHeight: 40, paddingHorizontal: 0, borderWidth: 1, ...Shadows.card },
  progressTrack: { backgroundColor: '#EAE1D5', borderRadius: Radius.full, height: 4, overflow: 'hidden', marginHorizontal: 24 },
  progressFill: { backgroundColor: Colors.bayaGreen, borderRadius: Radius.full, height: '100%' },
});
