import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Colors, FontFamily } from '../../../constants/theme';
import { BayaMascot } from '../../branding/BayaMascot';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { AppIcon } from '../../ui/AppIcon';
import { useKeyboardFocus } from '../../../hooks/useKeyboardFocus';
import { StorySpeechBubble } from '../story/StorySpeechBubble';
import { SpeechBubbleTail } from '../../ui/SpeechBubbleTail';
import { BackButton } from '../../ui/BackButton';

export function AssessmentHeader({ title, context, onBack, position, total, progressLabel }: { title: string; context: string; onBack: () => void; position?: number; total?: number; progressLabel?: string }) {
  return <View style={styles.header}>
    <View style={styles.headerRow}><BackButton accessibilityLabel="Back" size="compact" onPress={onBack} />
      <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.title}>{title}</Text><Text style={styles.context}>{context}</Text></View>
      {!!total && <Text style={styles.context}>{Math.min(position ?? 1, total)} / {total}</Text>}
    </View>
    {!!total && <View accessibilityRole="progressbar" accessibilityLabel={progressLabel} accessibilityValue={{ min: 0, max: total, now: Math.min(position ?? 1, total) }} style={styles.track}><View style={[styles.fill, { width: `${Math.min(position ?? 1, total) / total * 100}%` }]} /></View>}
  </View>;
}

/** A bounded question stage. Only the central region may overflow at zoom/short heights. */
export function AssessmentSlide({ questionId, label, progress, guidance, focus, choices, action, matching = false, dragging = false }: {
  questionId: string; label: string; progress: ReactNode; guidance: string;
  focus: ReactNode; choices: ReactNode; action: ReactNode; matching?: boolean; dragging?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const { language } = useLocalization();
  const [helpId, setHelpId] = useState<string>();
  const helpOpen = helpId === questionId;
  const setHelpOpen = (open: boolean | ((value: boolean) => boolean)) => setHelpId((typeof open === 'function' ? open(helpOpen) : open) ? questionId : undefined);
  const { focused, onFocus, onBlur, onPressIn } = useKeyboardFocus();
  const mascotSize = matching ? (height < 500 ? 90 : 112) : height < 500 ? Math.min(136, width * .2) : 190;
  const heading = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS === 'web') heading.current?.focus();
  }, [questionId]);
  return <View style={styles.stage} testID="assessment-slide">
    <View ref={heading} tabIndex={-1} accessibilityRole="header" accessibilityLabel={label} accessibilityLiveRegion="polite" testID="question-context" style={styles.progress}>{progress}</View>
    <ScrollView scrollEnabled={!dragging} style={styles.scroll} contentContainerStyle={[styles.body, { paddingLeft: matching ? (width > height ? 102 : 12) : height < 500 ? mascotSize + 12 : 36, paddingRight: matching ? (width > height ? 130 : 12) : 56, paddingBottom: matching ? (width > height ? 6 : 88) : 6 }]} keyboardShouldPersistTaps="handled" testID="slide-content">
      <View style={[styles.learning, matching && { maxWidth: 760, gap: 6 }]}>
        <View style={styles.focus}>{focus}</View>
        <View style={styles.choices}>{choices}</View>
      </View>
    </ScrollView>
    <View style={[styles.helper, { width: mascotSize }]}>
      {helpOpen && <View style={[styles.instructionBubble, { bottom: mascotSize * .65 + 8, width: Math.min(340, width - 90) }]} testID="quiz-instruction" accessibilityLiveRegion="polite">
        <StorySpeechBubble takeawayText={guidance} compact effectiveLandscape={false} isDesktop={false} isTablet={false} stackGuide={false}
          floating maxHeight={Math.max(80, height - 100 - mascotSize * .65)} onClose={() => setHelpOpen(false)} />
        <View pointerEvents="none" style={[styles.tailAnchor, { width: mascotSize - 16 }]}><SpeechBubbleTail position="bottom" size="compact" /></View>
      </View>}
      <Pressable testID="quiz-help-button" accessibilityRole="button" accessibilityLabel={language === 'tl' ? 'Pindutin si BAYA para sa panuto' : 'Tap BAYA for instructions'} accessibilityState={{ expanded: helpOpen }}
        onPress={() => setHelpOpen(value => !value)} onFocus={onFocus} onBlur={onBlur} onPressIn={onPressIn}
        style={[styles.mascot, { height: mascotSize * .65 }, focused && { borderColor: Colors.focus }]}>
        <BayaMascot size={mascotSize} crop="upperBody" autoplay={false} decorative state="idle" />
        <View style={styles.helpBadge}><AppIcon name="help" size={18} color="accent" /></View>
      </Pressable>
    </View>
    <View style={matching ? { position: 'absolute', right: 14, bottom: 8, maxWidth: '65%' } : styles.actions} testID="slide-actions">{action}</View>
  </View>;
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { height: 3, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: Colors.bayaGreen },
  header: { gap: 5, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.background, borderBottomWidth: 1, borderColor: Colors.border },
  title: { fontFamily: FontFamily.rounded, color: Colors.textPrimary, fontSize: 17, fontWeight: '800' },
  context: { fontFamily: FontFamily.rounded, color: Colors.textSecondary, fontSize: 12 },
  stage: { flex: 1, minHeight: 0, width: '100%', maxWidth: 1100, alignSelf: 'center' },
  progress: { height: 0, overflow: 'hidden', outlineWidth: 0 },
  scroll: { flex: 1, minHeight: 0 },
  body: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 6 },
  learning: { width: '100%', maxWidth: 520, gap: 8 },
  focus: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  choices: { width: '100%' },
  helper: { position: 'absolute', left: 8, bottom: 0, zIndex: 5 },
  mascot: { overflow: 'hidden', borderWidth: 1, borderColor: 'transparent', outlineWidth: 0 },
  helpBadge: { position: 'absolute', right: 4, bottom: 5, backgroundColor: '#FFF2DD', borderRadius: 20, padding: 4 },
  instructionBubble: { position: 'absolute', left: 8 },
  tailAnchor: { position: 'absolute', left: 0, bottom: 0, height: 0 },
  actions: { position: 'absolute', right: 6, top: '50%', marginTop: -22, gap: 4 },
});
