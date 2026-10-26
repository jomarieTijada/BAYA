import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Shadows } from '../../constants/theme';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { AppButton } from './AppButton';
import { AppIcon, type AppIconName } from './AppIcon';

type Action = { label: string; onPress: () => void; loading?: boolean; disabled?: boolean };
export type BayaDialogProps = {
  visible: boolean; title: string; description?: string; detail?: string;
  variant?: 'confirmation' | 'success' | 'warning' | 'information' | 'form'; icon?: AppIconName;
  primaryAction: Action; secondaryAction?: Action; onDismiss?: () => void;
  detailSelectable?: boolean;
  children?: React.ReactNode;
  closeLabel?: string;
};

/** Presentation only. RN Modal supplies web focus containment and background isolation. */
export function BayaDialog({ visible, title, description, detail, variant = 'confirmation', icon,
  primaryAction, secondaryAction, onDismiss, detailSelectable = false, children, closeLabel }: BayaDialogProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [present, setPresent] = useState(visible);
  if (visible && !present) setPresent(true);
  const reduced = useReducedMotionPreference();
  const [motion] = useState(() => new Animated.Value(0));
  const panel = useRef<View>(null);
  const busy = !!primaryAction.loading;
  const compact = height < 600 || variant === 'form';
  useEffect(() => {
    if (reduced) {
      motion.setValue(visible ? 1 : 0);
      return;
    }
    const animation = Animated.timing(motion, { toValue: visible ? 1 : 0, duration: reduced ? 0 : visible ? 280 : 180, useNativeDriver: Platform.OS !== 'web' });
    animation.start(({ finished }) => { if (finished && !visible) setPresent(false); });
    return () => animation.stop();
  }, [visible, motion, reduced]);
  const focus = useCallback(() => {
    AccessibilityInfo.announceForAccessibility(title);
    if (Platform.OS === 'web') (panel.current as unknown as HTMLElement | null)?.focus?.();
    else {
      const node = findNodeHandle(panel.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, [title]);
  useEffect(() => { if (visible) focus(); }, [visible, focus]);
  if (!visible && (!present || reduced)) return null;
  return <Modal transparent visible animationType="none" onShow={focus} onRequestClose={() => { if (!busy) onDismiss?.(); }}>
    <KeyboardAvoidingView style={{ flex: 1 }} enabled={variant === 'form' && Platform.OS !== 'web'} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <Animated.View style={[styles.backdrop, { opacity: motion, paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(12, insets.bottom) }, Platform.OS === 'web' && { backdropFilter: 'blur(7px)' } as object]}>
      <Animated.View accessibilityViewIsModal style={[styles.card, { width: Math.min(width - 2 * Math.max(16, insets.left, insets.right), variant === 'success' ? 860 : 650), maxHeight: height - Math.max(12, insets.top) - Math.max(12, insets.bottom), transform: [{ scale: motion.interpolate({ inputRange: [0,1], outputRange: [0.95,1] }) }] }]}>
        <ScrollView contentContainerStyle={[styles.content, compact && { padding: 20, gap: 14 }]} bounces={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <View ref={panel} tabIndex={-1} accessibilityLabel={title} style={[Platform.OS === 'web' ? { outlineStyle: 'none' } as object : undefined, variant === 'form' && { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            {variant !== 'form' && <View style={[styles.badge, variant === 'success' && styles.success, compact && { width: 62, height: 62, marginBottom: 14 }]}>
              <AppIcon name={icon ?? (variant === 'success' ? 'check' : variant === 'confirmation' ? 'layers' : 'help')} color={variant === 'success' ? 'success' : 'accent'} size={compact ? 32 : 46} />
            </View>}
            <Text accessibilityRole="header" style={[styles.title, compact && { fontSize: 25, lineHeight: 31 }, variant === 'form' && { flex: 1, textAlign: 'left' }]}>{title}</Text>
            {closeLabel && <AppButton compact fullWidth={false} label="" icon="close" tone="outlinePrimary" accessibilityLabel={closeLabel} disabled={busy} onPress={() => onDismiss?.()} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 8 }} />}
          </View>
          {!!description && <Text style={[styles.description, compact && { fontSize: 18, lineHeight: 25 }]}>{description}</Text>}
          {!!detail && <Text selectable={detailSelectable} style={[styles.detail, compact && { fontSize: 16, lineHeight: 23 }]}>{detail}</Text>}
          {children}
          <View style={styles.actions}>
            <AppButton compact={variant === 'form'} label={primaryAction.loading ? 'PLEASE WAIT…' : primaryAction.label} accessibilityLabel={primaryAction.label} onPress={primaryAction.onPress} disabled={busy || primaryAction.disabled} />
            {secondaryAction && <AppButton tone="outlinePrimary" label={secondaryAction.label} accessibilityLabel={secondaryAction.label} onPress={secondaryAction.onPress} disabled={busy || secondaryAction.disabled} />}
          </View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244,237,222,0.60)' },
  card: { backgroundColor: Colors.surface, borderRadius: 34, borderWidth: 2, borderColor: '#F3E9D5', overflow: 'hidden', ...Shadows.card },
  content: { padding: 38, gap: 25 },
  badge: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', width: 104, height: 104, borderRadius: 60, backgroundColor: '#FFF7EC', borderWidth: 2, borderColor: '#FFE9CF', marginBottom: 28 },
  success: { backgroundColor: '#EBFCF4', borderColor: '#A4EACD' },
  title: { fontFamily: FontFamily.rounded, fontWeight: '800', fontSize: 34, lineHeight: 44, color: Colors.textPrimary, textAlign: 'center' },
  description: { fontFamily: FontFamily.body, fontSize: 23, lineHeight: 34, textAlign: 'center', color: Colors.textSecondary },
  detail: { fontFamily: FontFamily.body, fontSize: 21, lineHeight: 31, textAlign: 'center', color: Colors.textMuted },
  actions: { gap: 16, marginTop: 12 },
});
