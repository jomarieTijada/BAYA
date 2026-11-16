import { useDialogBack } from '../../hooks/useDialogBack';
import { useLocalization } from '../../localization/LocalizationProvider';
import { AccessibilityView, Text } from '../../localization/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, findNodeHandle, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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
  contentKey?: string; // Reset internal scrolling for discrete story sections.
};

/** Presentation only. RN Modal supplies web focus containment and background isolation. */
export function BayaDialog({ visible, title, description, detail, variant = 'confirmation', icon,
  primaryAction, secondaryAction, onDismiss, detailSelectable = false, children, closeLabel, contentKey }: BayaDialogProps) {
  const { text } = useLocalization();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [present, setPresent] = useState(visible);
  if (visible && !present) setPresent(true);
  const reduced = useReducedMotionPreference();
  const [motion] = useState(() => new Animated.Value(0));
  const panel = useRef<View>(null);
  const busy = !!primaryAction.loading;
  useDialogBack(visible, onDismiss, busy);
  const compact = height < 600 || variant === 'form';
  useEffect(() => {
    if (reduced) {
      motion.setValue((() => {
        if (visible) {
          return 1;
        } else {
          return 0;
        }
      })());
      return;
    }
    const animation = Animated.timing(motion, { toValue: (() => {
      if (visible) {
        return 1;
      } else {
        return 0;
      }
    })(), duration: (() => {
      if (reduced) {
        return 0;
      } else {
        if (visible) {
          return 280;
        } else {
          return 180;
        }
      }
    })(), useNativeDriver: Platform.OS !== 'web' });
    animation.start(({ finished }) => { if (finished && !visible) setPresent(false); });
    return () => animation.stop();
  }, [visible, motion, reduced]);
  const focus = useCallback(() => {
    AccessibilityInfo.announceForAccessibility(text(title));
    if (Platform.OS === 'web') (panel.current as unknown as HTMLElement | null)?.focus?.();
    else {
      const node = findNodeHandle(panel.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
  }, [title, text]);
  useEffect(() => { if (visible) focus(); }, [visible, focus]);
  if (!visible && (!present || reduced)) return null;
  return <Modal transparent visible animationType="none" onShow={focus} onRequestClose={() => { if (!busy) onDismiss?.(); }}>
    <KeyboardAvoidingView style={{ flex: 1 }} enabled={variant === 'form' && Platform.OS !== 'web'} behavior={(() => {
      if (Platform.OS === 'ios') {
        return 'padding';
      } else {
        return 'height';
      }
    })()}>
    <Animated.View style={[styles.backdrop, { opacity: motion, paddingTop: Math.max(12, insets.top), paddingBottom: Math.max(12, insets.bottom) }, Platform.OS === 'web' && { backdropFilter: 'blur(7px)' } as object]}>
      <Animated.View accessibilityViewIsModal style={[styles.card, { width: Math.min(width - 2 * Math.max(16, insets.left, insets.right), (() => {
        if (variant === 'success') {
          return 860;
        } else {
          return 650;
        }
      })()), maxHeight: height - Math.max(12, insets.top) - Math.max(12, insets.bottom), transform: [{ scale: motion.interpolate({ inputRange: [0,1], outputRange: [0.95,1] }) }] }]}>
        <ScrollView key={contentKey} contentContainerStyle={[styles.content, compact && { padding: 20, gap: 14 }]} bounces={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <AccessibilityView ref={panel} tabIndex={-1} accessibilityLabel={title} style={[(() => {
            if (Platform.OS === 'web') {
              return { outlineStyle: 'none' } as object;
            } else {
              return undefined;
            }
          })(), variant === 'form' && { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            {variant !== 'form' && <View style={[styles.badge, variant === 'success' && styles.success, compact && { width: 62, height: 62, marginBottom: 14 }]}>
              <AppIcon name={icon ?? ((() => {
                if (variant === 'success') {
                  return 'check';
                } else {
                  if (variant === 'confirmation') {
                    return 'layers';
                  } else {
                    return 'help';
                  }
                }
              })())} color={(() => {
                if (variant === 'success') {
                  return 'success';
                } else {
                  return 'accent';
                }
              })()} size={(() => {
                if (compact) {
                  return 32;
                } else {
                  return 46;
                }
              })()} />
            </View>}
            <Text accessibilityRole="header" style={[styles.title, compact && { fontSize: 25, lineHeight: 31 }, variant === 'form' && { flex: 1, textAlign: 'left' }]}>{title}</Text>
            {closeLabel && <AppButton compact fullWidth={false} label="" icon="close" tone="outlinePrimary" accessibilityLabel={closeLabel} disabled={busy} onPress={() => onDismiss?.()} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 8 }} />}
          </AccessibilityView>
          {!!description && <Text style={[styles.description, compact && { fontSize: 18, lineHeight: 25 }]}>{description}</Text>}
          {!!detail && <Text selectable={detailSelectable} style={[styles.detail, compact && { fontSize: 16, lineHeight: 23 }]}>{detail}</Text>}
          {children}
          <View style={styles.actions}>
            <AppButton compact={variant === 'form'} label={(() => {
              if (primaryAction.loading) {
                return 'PLEASE WAIT…';
              } else {
                return primaryAction.label;
              }
            })()} accessibilityLabel={primaryAction.label} onPress={primaryAction.onPress} disabled={busy || primaryAction.disabled} />
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
