import React, { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, Modal, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Radius, Shadows } from '../../constants/theme';
import { useDialogBack } from '../../hooks/useDialogBack';
import { useLocalization } from '../../localization/LocalizationProvider';
import { StorybookVisual } from './StorybookVisual';
import { AppButton } from '../ui/AppButton';
import { storybookCopy, storybookPages } from './storybookContent';
import { useStorybookTurn } from './useStorybookTurn';

export function OriginStorybook({ onClose }: { onClose: () => void }) {
  const { language } = useLocalization();
  const copy = storybookCopy[language];
  const pages = storybookPages[language];
  const { page, busy, surface, fade, turn } = useStorybookTurn(pages.length);
  const current = pages[page];
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const small = height < 500;
  const narrow = width < 760 || (!small && width < 900);
  const heading = useRef<View>(null);
  const scroll = useRef<ScrollView>(null);
  useDialogBack(true, onClose, false);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    // Android browser Back is a close request, even when no route traversal exists.
    // Feature detection preserves the existing Escape/navigation fallback elsewhere.
    const Watcher = (window as unknown as { CloseWatcher?: new () => EventTarget & { destroy(): void } }).CloseWatcher;
    if (!Watcher) return;
    const watcher = new Watcher();
    watcher.addEventListener('close', onClose);
    return () => { watcher.removeEventListener('close', onClose); watcher.destroy(); };
  }, [onClose]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const focus = useCallback(() => {
    if (Platform.OS === 'web') (heading.current as unknown as HTMLElement)?.focus?.({ preventScroll: true });
    else {
      const node = findNodeHandle(heading.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [page]);
  useEffect(() => {
    if (!busy) { focus(); AccessibilityInfo.announceForAccessibility(`${copy.page(page + 1)}. ${current.title}`); }
  }, [page, busy, copy, current.title, focus]);
  const mascotSize = narrow ? Math.min(width - 100, 230) : Math.min(current.visual === 'learning' ? 380 : 430, width * .34, Math.max(170, height * .5));
  return <Modal transparent visible animationType="none" onRequestClose={onClose} onShow={focus}>
    <View style={[styles.backdrop, { paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(12, insets.bottom), paddingHorizontal: Math.max(12, insets.left, insets.right) }]}>
      <View accessibilityViewIsModal role="dialog" aria-label={copy.title} style={[styles.book, { height: Math.min(820, height - Math.max(12, insets.top) - Math.max(12, insets.bottom)) }]} testID="origin-storybook">
        <View style={styles.header} testID="origin-header">
          <View style={[styles.headerRow, small && { paddingVertical: 6 }]}>
            <Text style={styles.bookTitle} accessibilityRole="header">{copy.title}</Text>
            <AppButton label="" icon="close" compact fullWidth={false} tone="outlinePrimary" accessibilityLabel={copy.close} onPress={onClose} style={styles.close} />
          </View>
          <View testID="origin-progress" accessibilityRole="progressbar" accessibilityLabel={copy.chapter}
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={(page + 1) / pages.length * 100} aria-valuetext={copy.page(page + 1)}
            accessibilityValue={{ min: 0, max: 100, now: (page + 1) / pages.length * 100, text: copy.page(page + 1) }}
            style={[styles.progressTrack, small && { height: 3 }]}>
            <View style={[styles.progressFill, { width: `${(page + 1) / pages.length * 100}%` }]} />
          </View>
        </View>
        <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.scrollContent} testID="origin-scroll" bounces={false}>
          <Animated.View ref={surface} style={[styles.spread, narrow && styles.stacked, small && styles.shortSpread, { opacity: fade }]} testID="origin-spread">
            <View style={[styles.visual, narrow ? styles.visualStacked : { width: current.visual === 'eagle' || current.visual === 'gratitude' ? '52%' : '46%' }, small && styles.shortVisual]} testID="origin-illustration">
              <StorybookVisual key={current.id} page={current} language={language} mascotSize={mascotSize} turning={busy} />
            </View>
            <View style={[styles.reading, narrow && styles.readingStacked]} testID="origin-reading">
              <View ref={heading} tabIndex={-1} style={styles.headingFocus}>
                <Text accessibilityRole="header" style={[styles.title, (narrow || width < 1000) && { fontSize: 29, lineHeight: 35 }]}>{current.title}</Text>
              </View>
              <Text style={styles.subtitle}>{current.subtitle}</Text>
              {current.paragraphs.map(paragraph => <Text key={paragraph} style={styles.body}>{paragraph}</Text>)}
              {current.id === 'thanks' && <Text style={styles.closing}>{copy.closing}</Text>}
            </View>
          </Animated.View>
        </ScrollView>
        <View style={[styles.footer, narrow && { paddingHorizontal: 10, gap: 6 }]}>
          <AppButton label={copy.previous} accessibilityLabel={copy.previous} compact fullWidth={false} tone="outlinePrimary" disabled={page === 0 || busy} onPress={() => { void turn(-1); }} style={styles.nav} />
          <AppButton label={page === 4 ? copy.finish : copy.next} accessibilityLabel={page === 4 ? copy.finish : copy.next} compact fullWidth={false} disabled={busy} onPress={() => { if (page === 4) onClose(); else void turn(1); }} style={styles.nav} />
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(53,42,29,.32)' },
  book: { width: '100%', maxWidth: 1240, backgroundColor: '#FFFCF5', borderRadius: 24, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.card },
  header: { flexShrink: 0, borderBottomWidth: 1, borderColor: Colors.border, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, gap: 14 },
  bookTitle: { flex: 1, fontFamily: FontFamily.rounded, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  close: { minWidth: 44, minHeight: 44, paddingHorizontal: 8 },
  scroll: { flex: 1, minHeight: 0 }, scrollContent: { flexGrow: 1 },
  spread: { flexGrow: 1, flexDirection: 'row', padding: 32, gap: 36, backfaceVisibility: 'hidden', backgroundColor: '#FFFCF5' },
  shortSpread: { paddingVertical: 18, gap: 24 },
  shortVisual: { justifyContent: 'flex-start' },
  stacked: { flexDirection: 'column', padding: 22, gap: 24 },
  visual: { alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 0 },
  visualStacked: { width: '100%' },
  reading: { flex: 1, justifyContent: 'center', borderLeftWidth: 1, borderColor: '#EEE3D1', paddingLeft: 36, gap: 15, minWidth: 0 },
  readingStacked: { paddingLeft: 0, borderLeftWidth: 0 },
  eyebrow: { fontFamily: FontFamily.body, fontSize: 11, fontWeight: '700', letterSpacing: 2, color: Colors.accent },
  headingFocus: { borderRadius: 6 },
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
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 14, borderTopWidth: 1, borderColor: Colors.border, gap: 12 },
  nav: { minHeight: 48, paddingHorizontal: 14, maxWidth: '38%' },
  progressTrack: { backgroundColor: '#EAE1D5', borderRadius: Radius.full, height: 4, overflow: 'hidden', marginHorizontal: 24 },
  progressFill: { backgroundColor: Colors.bayaGreen, borderRadius: Radius.full, height: '100%' },
});
