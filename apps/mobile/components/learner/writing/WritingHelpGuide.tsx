import React, { useContext, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import { BAYA_WRITING_MASTERY_POLICY } from '../../../content/writingMastery';
import { AppIcon, type AppIconName } from '../../ui/AppIcon';
import type { WritingActionPhase } from './WritingNavigation';
import { placeWritingGuide, type GuideRect } from './writingGuideLayout';

export type WritingGuideTargets = Record<'reference' | 'canvas' | 'action' | 'stars', React.RefObject<View | null>>;
const steps: { target: keyof WritingGuideTargets; emphasis: string; message: string; icon: AppIconName }[] = [
  { target: 'reference', emphasis: 'Tingnan', message: ' ang simbolong isusulat mo!', icon: 'lessons' },
  { target: 'canvas', emphasis: 'Isulat', message: ' ang simbolo rito!', icon: 'writing' },
  { target: 'action', emphasis: 'Suriin', message: 'Pindutin ang Suriin kapag tapos ka na!', icon: 'check' },
  { target: 'stars', emphasis: 'dalawang bituin', message: 'Makakuha ng dalawang bituin upang makapagpatuloy!', icon: 'starOutline' },
  { target: 'action', emphasis: 'Susunod', message: 'Kapag nakuha mo na ang dalawang bituin, pindutin ang Susunod!', icon: 'forward' },
];

/** Only measures targets and presents guidance. Never invokes a lesson action. */
export function WritingHelpGuide({ targets, phase, onClose }: { targets?: WritingGuideTargets; phase: WritingActionPhase; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [technical, setTechnical] = useState(false);
  const [measurement, setMeasurement] = useState<{ key: string; rect: GuideRect } | null>(null);
  const [cardHeight, setCardHeight] = useState(270);
  const closeButton = useRef<View>(null);
  const content = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, left: 0, right: 0, bottom: 0 };
  const current = steps[step];
  const actualAction = step === 2 ? phase === 'ready' : step === 4 ? phase === 'complete' : true;
  const targetRef = actualAction ? targets?.[current.target] : undefined;
  const measurementKey = `${step}:${width}:${height}:${actualAction}:${insets.top}:${insets.right}:${insets.bottom}:${insets.left}`;
  const target = measurement?.key === measurementKey ? measurement.rect : null;
  useEffect(() => {
    let active = true;
    // Remeasure after responsive layout has settled, including orientation changes.
    const timer = setTimeout(() => targetRef?.current?.measureInWindow((x, y, w, h) => {
      if (!active || ![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) return;
      const left = Math.max(insets.left + 4, x - 4);
      const top = Math.max(insets.top + 4, y - 4);
      const right = Math.min(width - insets.right - 4, x + w + 4);
      const bottom = Math.min(height - insets.bottom - 4, y + h + 4);
      if (right > left && bottom > top) setMeasurement({ key: measurementKey, rect: { x: left, y: top, width: right - left, height: bottom - top } });
    }), 120);
    return () => { active = false; clearTimeout(timer); };
  }, [targetRef, measurementKey, width, height, insets.top, insets.right, insets.bottom, insets.left]);
  const cardWidth = Math.min(width < 900 ? 280 : 370, width - insets.left - insets.right - 24);
  const maxHeight = Math.max(100, height - insets.top - insets.bottom - 24);
  const position = placeWritingGuide(width, height, cardWidth, Math.min(cardHeight, maxHeight), insets, target);
  const { requiredValidAttempts, minConfidence } = BAYA_WRITING_MASTERY_POLICY;
  const goal = requiredValidAttempts === 2 ? 'dalawang bituin' : `${requiredValidAttempts} bituin`;
  const message = current.message.replace('dalawang bituin', goal);
  const emphasis = current.emphasis.replace('dalawang bituin', goal);
  const parts = message.includes(emphasis) ? message.split(emphasis) : ['', message];
  const changeStep = (next: number) => { setStep(next); setTechnical(false); content.current?.scrollTo({ y: 0, animated: false }); };

  return <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose} onShow={() => closeButton.current?.focus()}>
    <View style={styles.overlay} testID="writing-help-overlay">
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {target ? <>
          <View style={[styles.shade, { left: 0, top: 0, right: 0, height: target.y }]} />
          <View style={[styles.shade, { left: 0, top: target.y + target.height, right: 0, bottom: 0 }]} />
          <View style={[styles.shade, { left: 0, top: target.y, width: target.x, height: target.height }]} />
          <View style={[styles.shade, { left: target.x + target.width, right: 0, top: target.y, height: target.height }]} />
          <View testID={`writing-guide-highlight-${current.target}`} style={[styles.highlight, { left: target.x, top: target.y, width: target.width, height: target.height }]} />
        </> : <View style={[StyleSheet.absoluteFill, styles.shade]} />}
      </View>
      <View accessibilityViewIsModal aria-modal accessibilityLabel="Gabay sa pagsulat" style={[styles.popup, { left: position.x, top: position.y, width: cardWidth, maxHeight }]} onLayout={event => setCardHeight(event.nativeEvent.layout.height)} testID="writing-help-popup">
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>Paano Makakuha ng Bituin?</Text>
          <Pressable ref={closeButton} accessibilityRole="button" accessibilityLabel="Isara ang gabay" onPress={onClose} style={styles.close}><AppIcon name="close" size={24} /></Pressable>
        </View>
        <ScrollView ref={content} style={styles.scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.step}>Gabay {step + 1} ng {steps.length}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.message}>{parts[0]}<Text style={styles.emphasis}>{emphasis}</Text>{parts[1]}</Text>
          {!target && <View style={styles.illustration} testID="writing-guide-illustration"><AppIcon name={current.icon} size={24} color="primaryText" /><Text style={styles.illustrationText}>{step === 2 ? 'Suriin' : step === 4 ? 'Susunod' : step === 3 ? goal : step === 1 ? 'Lugar ng pagsusulat' : 'Simbolong isusulat'}</Text></View>}
          <Pressable accessibilityRole="button" aria-expanded={technical} accessibilityState={{ expanded: technical }} onPress={() => setTechnical(value => !value)} style={styles.disclosure} testID="writing-technical-toggle"><Text style={styles.disclosureText}>{technical ? 'Isara ang paliwanag' : 'Dagdag na Paliwanag'}</Text><AppIcon name={technical ? 'close' : 'add'} size={16} /></Pressable>
          {technical && <View style={styles.technical} testID="writing-technical-details"><Text style={styles.note}>Kailangang ang unang nakilalang simbolo ni BAYA ay ang ipinapasulat, na may hindi bababa sa {Math.round(minConfidence * 100)}% kumpiyansa.</Text><Text style={styles.note}>Ang {Math.round(minConfidence * 100)}% ay kumpiyansa ni BAYA sa pagkilala, hindi grado ng iyong sulat.</Text><Text style={styles.note}>Bawat natanggap at bagong naitalang sulat ay isang bituin. Hindi binibilang muli ang parehong guhit. Kailangan ng {requiredValidAttempts} bituin upang magpatuloy.</Text></View>}
        </ScrollView>
        <View style={styles.navigation}>
          {step > 0 && <Pressable accessibilityRole="button" onPress={() => changeStep(step - 1)} style={styles.previous}><Text style={styles.previousText}>Bumalik</Text></Pressable>}
          <Pressable accessibilityRole="button" onPress={() => step === steps.length - 1 ? onClose() : changeStep(step + 1)} style={styles.next}><Text style={styles.nextText}>{step === steps.length - 1 ? 'Tapos Na' : 'Susunod na Gabay'}</Text></Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  shade: { position: 'absolute', backgroundColor: 'rgba(36,31,27,0.25)' },
  highlight: { position: 'absolute', borderWidth: 3, borderRadius: Radius.lg, borderColor: Colors.bayaOrange, backgroundColor: 'rgba(250,166,31,0.07)' },
  popup: { position: 'absolute', backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.bayaOrange, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm, elevation: 12, boxShadow: '0px 4px 24px rgba(36,31,27,0.18)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 0 },
  title: { flex: 1, fontFamily: FontFamily.rounded, fontSize: 17, lineHeight: 21, color: Colors.textPrimary, fontWeight: '800' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, backgroundColor: Colors.background },
  scroll: { flexShrink: 1, minHeight: 0 },
  body: { gap: Spacing.sm },
  step: { fontFamily: FontFamily.body, color: Colors.textSecondary, fontSize: 12 },
  message: { fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontSize: 18, lineHeight: 25 },
  emphasis: { fontWeight: '800', backgroundColor: Colors.achievementSurface },
  illustration: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.achievementSurface, borderRadius: Radius.sm, padding: Spacing.sm },
  illustrationText: { fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontWeight: '800', flexShrink: 1 },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.xs },
  disclosureText: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textSecondary },
  technical: { gap: Spacing.sm },
  note: { fontFamily: FontFamily.body, fontSize: 13, lineHeight: 18, color: Colors.textPrimary },
  navigation: { flexDirection: 'row', gap: Spacing.sm, flexShrink: 0 },
  previous: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border },
  previousText: { fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontSize: 13 },
  next: { flex: 1, minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.sm, borderRadius: Radius.md, backgroundColor: Colors.accent },
  nextText: { fontFamily: FontFamily.rounded, color: Colors.surface, fontWeight: '800', fontSize: 13 },
});
