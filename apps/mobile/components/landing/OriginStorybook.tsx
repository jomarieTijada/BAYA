import React, { useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, Image, Modal, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Shadows } from '../../constants/theme';
import { baybayinAssets } from '../../content/baybayinAssets';
import { useDialogBack } from '../../hooks/useDialogBack';
import { useLocalization } from '../../localization/LocalizationProvider';
import { BayaMascot } from '../branding/BayaMascot';
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
        <View style={[styles.header, small && { paddingVertical: 6 }]}>
          <Text style={styles.bookTitle} accessibilityRole="header">{copy.title}</Text>
          <AppButton label="" icon="close" compact fullWidth={false} tone="muted" accessibilityLabel={copy.close} onPress={onClose} style={styles.close} />
        </View>
        <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.scrollContent} testID="origin-scroll" bounces={false}>
          <Animated.View ref={surface} style={[styles.spread, narrow && styles.stacked, small && styles.shortSpread, { opacity: fade }]} testID="origin-spread">
            <View style={[styles.visual, narrow ? styles.visualStacked : { width: '46%' }, small && styles.shortVisual]} testID="origin-illustration">
              {current.visual !== 'characters' && <BayaMascot size={mascotSize} state="idle" autoplay={false} accessibilityLabel={copy.mascotAlt} />}
              {current.visual !== 'mascot' && <View style={[styles.glyphs, current.visual === 'learning' && styles.learningGlyphs]}>
                {(['a', 'ba', 'ka', 'ma'] as const).map(id => <View key={id} style={[styles.glyph, current.visual === 'learning' && styles.smallGlyph]}>
                  <Image source={baybayinAssets[id]} resizeMode="contain" accessibilityLabel={`Baybayin ${id}`} style={styles.glyphImage} />
                  <Text style={styles.glyphLabel}>{id === 'a' ? 'A' : id[0].toUpperCase() + id.slice(1)}</Text>
                </View>)}
              </View>}
              <Text style={styles.caption}>{current.caption}</Text>
              <Text style={[styles.credit, styles.imageCredit]}>{current.visual === 'characters' ? copy.glyphCredit : copy.art}</Text>
              {current.visual === 'learning' && <Text style={[styles.credit, styles.imageCredit]}>{copy.glyphCredit}</Text>}
            </View>
            <View style={[styles.reading, narrow && styles.readingStacked]} testID="origin-reading">
              <Text style={styles.eyebrow}>{copy.chapter} / 0{page + 1}</Text>
              <View ref={heading} tabIndex={-1} style={styles.headingFocus}>
                <Text accessibilityRole="header" style={[styles.title, (narrow || width < 1000) && { fontSize: 29, lineHeight: 35 }]}>{current.title}</Text>
              </View>
              <Text style={styles.subtitle}>{current.subtitle}</Text>
              {current.paragraphs.map(paragraph => <Text key={paragraph} style={styles.body}>{paragraph}</Text>)}
              {current.id === 'thanks' && <View style={styles.acknowledgements}>
                <Text style={styles.ackTitle}>{copy.guidance}</Text>
                <Text style={styles.ackBody}>Buhayin Baybayin{ '\n' }Ginhawa Baybayin Creativity Workshops</Text>
                <Text style={styles.ackTitle}>{copy.thanks}</Text>
                <Text style={styles.ackBody}>Ma&apos;am Mini Gavino</Text>
                <Text style={styles.credit}>{copy.support}</Text>
                <Text style={styles.closing}>{copy.closing}</Text>
              </View>}
            </View>
          </Animated.View>
        </ScrollView>
        <View style={[styles.footer, narrow && { paddingHorizontal: 10, gap: 6 }]}>
          <AppButton label={copy.previous} accessibilityLabel={copy.previous} compact fullWidth={false} tone="outlinePrimary" disabled={page === 0 || busy} onPress={() => { void turn(-1); }} style={styles.nav} labelStyle={styles.navText} />
          <View style={styles.progress} accessibilityLabel={`${copy.page(page + 1)}. ${current.title}`}>
            <Text style={styles.pageLabel}>{copy.page(page + 1)}</Text>
            <View style={styles.dots} aria-hidden>{pages.map((item, index) => <View key={item.id} style={[styles.dot, index === page && styles.activeDot]} />)}</View>
          </View>
          <AppButton label={page === 4 ? copy.finish : copy.next} accessibilityLabel={page === 4 ? copy.finish : copy.next} compact fullWidth={false} disabled={busy} onPress={() => { if (page === 4) onClose(); else void turn(1); }} style={[styles.nav, styles.nextNav]} labelStyle={styles.nextNavText} />
        </View>
      </View>
    </View>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(53,42,29,.32)' },
  book: { width: '100%', maxWidth: 1240, backgroundColor: '#FFFCF5', borderRadius: 24, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.card },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderColor: Colors.border, gap: 14 },
  bookTitle: { flex: 1, fontFamily: FontFamily.rounded, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  close: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, backgroundColor: '#FFFCF5', borderColor: '#965125' },
  scroll: { flex: 1, minHeight: 0 }, scrollContent: { flexGrow: 1 },
  spread: { flexGrow: 1, flexDirection: 'row', padding: 32, gap: 36, backfaceVisibility: 'hidden', backgroundColor: '#FFFCF5' },
  shortSpread: { paddingVertical: 18, gap: 24 },
  shortVisual: { justifyContent: 'flex-start' },
  stacked: { flexDirection: 'column', padding: 22, gap: 24 },
  visual: { alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 0 },
  visualStacked: { width: '100%' },
  reading: { flex: 1, justifyContent: 'center', borderLeftWidth: 1, borderColor: '#EEE3D1', paddingLeft: 36, gap: 15, minWidth: 0 },
  readingStacked: { paddingLeft: 0, borderLeftWidth: 0 },
  eyebrow: { fontFamily: FontFamily.body, fontSize: 11, fontWeight: '700', letterSpacing: 2, color: '#965125' },
  headingFocus: { borderRadius: 6 },
  title: { fontFamily: FontFamily.rounded, fontSize: 36, lineHeight: 42, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontFamily: FontFamily.body, fontSize: 17, lineHeight: 24, color: '#965125', marginBottom: 4 },
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
  ackTitle: { fontFamily: FontFamily.body, fontSize: 13, fontWeight: '700', color: '#965125' },
  ackBody: { fontFamily: FontFamily.body, fontSize: 15, lineHeight: 22, color: Colors.textPrimary },
  closing: { fontFamily: FontFamily.rounded, fontSize: 18, lineHeight: 25, fontWeight: '700', color: Colors.textPrimary, marginTop: 9 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 14, borderTopWidth: 1, borderColor: Colors.border, gap: 12 },
  nav: { minHeight: 48, paddingHorizontal: 14, maxWidth: '38%', borderColor: '#965125' },
  navText: { color: '#965125' }, nextNav: { backgroundColor: '#A84614', borderColor: '#A84614' }, nextNavText: { color: '#FFFFFF' },
  progress: { alignItems: 'center', gap: 8, flexShrink: 1 },
  pageLabel: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 5 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border }, activeDot: { width: 18, backgroundColor: Colors.accent },
});
