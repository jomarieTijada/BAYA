import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Shadows } from '../../constants/theme';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { AppIcon } from './AppIcon';

type Tone = 'success' | 'information' | 'warning' | 'error';
type Toast = { message: string; tone: Tone; id: number };
const Context = createContext<(message: string, tone?: Tone) => void>(() => undefined);
export const useBayaToast = () => useContext(Context);

/** One nonblocking live region persists across navigation; repeated messages coalesce. */
export function BayaNotifications({ children }: React.PropsWithChildren) {
  const [toast, setToast] = useState<Toast>();
  const sequence = useRef(0);
  const reduced = useReducedMotionPreference();
  const [opacity] = useState(() => new Animated.Value(1));
  const last = useRef({ message: '', at: 0 });
  const insets = useSafeAreaInsets();
  const dismiss = useCallback((id: number) => {
    if (reduced) {
      setToast(current => current?.id === id ? undefined : current);
      return;
    }
    Animated.timing(opacity, { toValue: 0, duration: reduced ? 0 : 150, useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
      if (finished) setToast(current => current?.id === id ? undefined : current);
    });
  }, [opacity, reduced]);
  const show = useCallback((message: string, tone: Tone = 'success') => {
    const now = Date.now();
    if (last.current.message === message && now - last.current.at < 1500) return;
    last.current = { message, at: now };
    setToast({ message, tone, id: ++sequence.current });
    AccessibilityInfo.announceForAccessibility(message);
  }, []);
  useEffect(() => {
    if (!toast) return;
    opacity.setValue(reduced ? 1 : 0);
    const opening = Animated.timing(opacity, {toValue:1,duration:reduced ? 0 : 180,useNativeDriver:Platform.OS !== 'web'});
    opening.start();
    const timer = setTimeout(() => dismiss(toast.id), toast.tone === 'error' ? 9000 : 6000);
    return () => { clearTimeout(timer); opening.stop(); };
  }, [toast, reduced, opacity, dismiss]);
  return <Context.Provider value={show}>
    {children}
    {!!toast && <View pointerEvents="box-none" style={[styles.host, { top: Math.max(12, insets.top) }]}>
      <Animated.View accessibilityLiveRegion="polite" style={[styles.toast, {opacity}]}>
        <AppIcon name={toast.tone === 'success' ? 'check' : 'help'} color={toast.tone === 'success' ? 'success' : toast.tone === 'error' ? 'error' : 'accent'} size={24} />
        <Text style={styles.text}>{toast.message}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={() => dismiss(toast.id)} style={styles.close}><AppIcon name="close" size={20} /></Pressable>
      </Animated.View>
    </View>}
  </Context.Provider>;
}
const styles = StyleSheet.create({
  host: { position: 'absolute', left: 12, right: 12, zIndex: 1000, alignItems: 'center' },
  toast: { maxWidth: 560, flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 18, paddingVertical: 6, paddingRight: 6, backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: 20, ...Shadows.card },
  text: { flexShrink: 1, fontFamily: FontFamily.body, fontSize: 16, lineHeight: 23, color: Colors.textPrimary },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
