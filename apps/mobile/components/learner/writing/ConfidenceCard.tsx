import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors, FontFamily, Radius, Spacing } from '../../../constants/theme';
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference';
import { AppIcon } from '../../ui/AppIcon';
import { WritingHelpGuide, type WritingGuideTargets } from './WritingHelpGuide';
import type { WritingActionPhase } from './WritingNavigation';

/** Presentation owns help; the screen supplies authoritative progress and actions. */
export function ConfidenceCard({ embedded = false, dense = false, children, progress, action, guideTargets, phase = 'ready' }: {
  embedded?: boolean; dense?: boolean; children?: React.ReactNode; progress?: React.ReactNode; action?: React.ReactNode; guideTargets?: WritingGuideTargets; phase?: WritingActionPhase;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [glow] = useState(() => new Animated.Value(0));
  const noticed = useRef(false);
  const helpButton = useRef<View>(null);
  const reducedMotion = useReducedMotionPreference();
  useEffect(() => {
    glow.stopAnimation(); glow.setValue(0);
    if (reducedMotion || noticed.current || helpOpen) return;
    noticed.current = true;
    let animation: Animated.CompositeAnimation | undefined;
    try {
      const pulse = () => [Animated.timing(glow, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== 'web', isInteraction: false }), Animated.timing(glow, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web', isInteraction: false })];
      animation = Animated.sequence([...pulse(), ...pulse()]);
      animation.start();
    } catch { glow.setValue(0); }
    return () => { animation?.stop(); glow.setValue(0); };
  }, [helpOpen, reducedMotion, glow]);
  const openHelp = () => { noticed.current = true; setHelpOpen(true); };
  const closeHelp = () => { setHelpOpen(false); helpButton.current?.focus(); };
  return <View style={[styles.card, embedded && styles.embedded, dense && styles.denseCard]} testID="writing-confidence-card">
    <View style={styles.header} testID="writing-feedback-header">
      <Text accessibilityRole="header" style={[styles.heading, dense && styles.denseHeading]}>Pagsusuri</Text>
      <Pressable ref={helpButton} accessibilityRole="button" accessibilityLabel="Tulong sa pagsusuri" aria-expanded={helpOpen} accessibilityState={{ expanded: helpOpen }} onPress={openHelp} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [styles.helpButton, helpOpen && styles.helpActive, focused && styles.helpFocused, pressed && styles.pressed]} testID="writing-help-toggle">
        <Animated.View pointerEvents="none" testID="writing-help-glow" style={[styles.halo, { opacity: glow }]} />
        <AppIcon name="help" size={28} color="primaryText" />
      </Pressable>
    </View>
    {progress}
    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={styles.content} testID="writing-feedback-content">{children}</ScrollView>
    {action}
    {helpOpen && <WritingHelpGuide targets={guideTargets} phase={phase} onClose={closeHelp} />}
  </View>;
}
const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderColor: Colors.border, borderRadius: Radius.xl, borderWidth: 1, gap: Spacing.sm, minWidth: 0, minHeight: 0, flexShrink: 1, padding: Spacing.md, width: '100%' },
  embedded: { borderWidth: 0, padding: 0 },
  denseCard: { gap: Spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.xs, flexShrink: 0 },
  heading: { color: Colors.textPrimary, fontFamily: FontFamily.rounded, fontSize: 16, lineHeight: 20, fontWeight: '800' },
  denseHeading: { fontSize: 14, lineHeight: 18 },
  helpButton: { width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.background },
  halo: { position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, borderRadius: Radius.full, borderWidth: 5, borderColor: 'rgba(250,166,31,0.5)', backgroundColor: 'rgba(250,166,31,0.14)' },
  helpActive: { borderColor: Colors.accent, backgroundColor: Colors.achievementSurface },
  helpFocused: { borderColor: Colors.focus },
  pressed: { opacity: 0.7 },
  scroll: { flexShrink: 1, minHeight: 0 },
  content: { paddingBottom: Spacing.xs },
});