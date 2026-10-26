import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontFamily, Shadows } from '../../constants/theme';
import { useReducedMotionPreference } from '../../hooks/useReducedMotionPreference';
import { AppIcon, type AppIconName } from './AppIcon';
import { PopoverLayer } from './PopoverLayer';
import { menuPosition, type MenuAnchor } from './menuPosition';

export type MenuAction = { label: string; icon: AppIconName; onPress: () => void; disabled?: boolean; busy?: boolean; keepOpen?: boolean };
export type MenuGroup = { label: string; actions: MenuAction[] };

/** Presentation only: callers own navigation, network requests and authentication. */
export function BayaActionMenu({ groups, label = 'Workspace options' }: { groups: MenuGroup[]; label?: string }) {
  const trigger = useRef<View>(null);
  const panel = useRef<View>(null);
  const [anchor, setAnchor] = useState<MenuAnchor>();
  const anchored = !!anchor;
  const [open, setOpen] = useState(false);
  const [present, setPresent] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeRow, setActiveRow] = useState<string>();
  const [motion] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotionPreference();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (open && !present) setPresent(true);
  const close = useCallback((restore = true) => {
    setOpen(false);
    if (reduced) setPresent(false);
    if (restore) trigger.current?.focus?.();
  }, [reduced]);
  const measure = useCallback(() => trigger.current?.measureInWindow((x, y, w, h) => setAnchor({ x, y, width: w, height: h })), []);
  useFocusEffect(useCallback(() => () => close(false), [close]));
  useEffect(() => {
    if (!present) return;
    const animation = Animated.timing(motion, { toValue: open ? 1 : 0, duration: reduced ? 0 : open ? 180 : 120, useNativeDriver: Platform.OS !== 'web' });
    animation.start(({ finished }) => { if (finished && !open) setPresent(false); });
    return () => animation.stop();
  }, [open, present, motion, reduced]);
  useEffect(() => {
    if (!open) return;
    measure();
    if (Platform.OS === 'web') return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => back.remove();
  }, [open, width, height, measure, close]);
  useEffect(() => {
    if (!open || !anchored || Platform.OS !== 'web') return;
    const menu = () => panel.current as unknown as HTMLElement | null;
    const button = () => trigger.current as unknown as HTMLElement | null;
    const focusTimer = setTimeout(() => menu()?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus(), 0);
    const outside = (event: PointerEvent) => {
      if (menu()?.contains(event.target as Node) || button()?.contains(event.target as Node)) return;
      event.preventDefault(); event.stopPropagation();
      // Consume the corresponding click too, so dismissing over an underlying
      // dashboard control cannot also activate it.
      const consume = (click: MouseEvent) => { click.preventDefault(); click.stopPropagation(); };
      document.addEventListener('click', consume, { capture: true, once: true });
      setTimeout(() => document.removeEventListener('click', consume, true), 500);
      close();
    };
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (!menu()?.contains(document.activeElement)) return;
      const items = Array.from(menu()?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next = event.key === 'ArrowDown' ? (index + 1) % items.length : event.key === 'ArrowUp' ? (index - 1 + items.length) % items.length : event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); items[next]?.focus(); }
    };
    const focus = (event: FocusEvent) => { if (!menu()?.contains(event.target as Node) && !button()?.contains(event.target as Node)) close(false); };
    const scroll = (event: Event) => { if (!menu()?.contains(event.target as Node)) close(false); };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', keys);
    document.addEventListener('focusin', focus);
    document.addEventListener('scroll', scroll, true);
    return () => { clearTimeout(focusTimer); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', keys); document.removeEventListener('focusin', focus); document.removeEventListener('scroll', scroll, true); };
  }, [open, anchored, close, measure]);
  const size = groups.reduce((total, group) => total + 36 + group.actions.length * 44, 16);
  const busy = groups.some(group => group.actions.some(action => action.busy));
  return <>
    <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ expanded: open }} aria-expanded={open} aria-haspopup="menu"
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onPress={() => { if (open) close(); else { measure(); setOpen(true); } }} style={[styles.trigger, focused && styles.focused]}>
      {busy ? <ActivityIndicator color={Colors.rolePrimary} size="small" /> : <AppIcon name="settings" color="accent" size={26} />}
    </Pressable>
    {present && anchor && <PopoverLayer onDismiss={close}>
      {Platform.OS !== 'web' && <Pressable accessibilityLabel="Close workspace options" accessibilityRole="button" onPress={() => close()} style={{ position: 'absolute', left: anchor.x, top: anchor.y, width: anchor.width, height: anchor.height }} />}
      <Animated.View ref={panel} accessibilityRole="menu" accessibilityLabel="Workspace settings" testID="workspace-settings-menu"
        pointerEvents={open ? 'auto' : 'none'} style={[styles.panel, menuPosition(anchor, width, height, size, insets), { opacity: motion, transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          {groups.map((group, groupIndex) => <View key={group.label} style={groupIndex > 0 ? styles.divider : undefined}>
            <Text style={styles.group}>{group.label}</Text>
            {group.actions.map(action => <Pressable key={action.label} accessibilityRole="menuitem" accessibilityLabel={action.label} tabIndex={action.disabled ? -1 : 0} disabled={action.disabled} aria-disabled={!!action.disabled} accessibilityState={{ disabled: !!action.disabled, busy: !!action.busy }}
              onFocus={() => setActiveRow(action.label)} onBlur={() => setActiveRow(undefined)} onHoverIn={() => setActiveRow(action.label)} onHoverOut={() => setActiveRow(undefined)}
              onPress={() => { if (!action.keepOpen) close(); action.onPress(); }}
              style={({ pressed }) => [styles.item, (pressed || activeRow === action.label) && styles.highlight, action.disabled && { opacity: 0.55 }]}>
              {action.busy ? <ActivityIndicator size="small" color={Colors.rolePrimary} /> : <AppIcon name={action.icon} size={20} color="accent" />}
              <Text style={styles.label}>{action.label}</Text>
            </Pressable>)}
          </View>)}
        </ScrollView>
      </Animated.View>
    </PopoverLayer>}
  </>;
}
const styles = StyleSheet.create({
  trigger: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', ...Shadows.card },
  focused: { borderColor: Colors.rolePrimary },
  panel: { position: 'absolute', pointerEvents: 'auto', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 8, ...Shadows.card },
  group: { fontFamily: FontFamily.body, color: Colors.textMuted, fontSize: 12, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, textTransform: 'uppercase' },
  divider: { marginTop: 6, borderTopWidth: 1, borderTopColor: Colors.border },
  item: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  highlight: { backgroundColor: '#FFF1E2' },
  label: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textPrimary, flexShrink: 1 },
});
