import { useKeyboardFocus } from '../../../hooks/useKeyboardFocus';
import { useLocalization } from '../../../localization/LocalizationProvider';
import { Pressable } from '../../../localization/components';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import type { SlideStepContent } from '../../../content/types';
import { Colors } from '../../../constants/theme';
import { useReducedMotionPreference } from '../../../hooks/useReducedMotionPreference';
import { BayaMascot } from '../../branding/BayaMascot';
import { SpeechBubbleTail } from '../../ui/SpeechBubbleTail';
import { StorySpeechBubble } from './StorySpeechBubble';

/** A text-only companion for constrained topic layouts; never writes learner state. */
export function StoryMascotPopover({ content, pageWidth, pageHeight }: {
  content: SlideStepContent; pageWidth: number; pageHeight: number;
}) {
  const { text } = useLocalization();
  const [open, setOpen] = useState(false);
  const [presented, setPresented] = useState(false);
  const [columnWidth, setColumnWidth] = useState(0);
  const { focused, onFocus, onBlur, onPressIn } = useKeyboardFocus();
  const [motion] = useState(() => new Animated.Value(0));
  const trigger = useRef<View>(null);
  const reduced = useReducedMotionPreference();
  const message = content.storyMessage || content.storyHighlight || '';
  const size = Math.min(pageWidth < 640 ? 180 : 260, Math.max(140, pageHeight * 0.65));
  const footerHeight = Math.round(size * 0.65);
  const close = () => { setOpen(false); trigger.current?.focus?.(); };
  if (open && !presented) setPresented(true);
  if (!open && reduced && presented) setPresented(false);

  const announcement = text(message);
  useEffect(() => { if (open) AccessibilityInfo.announceForAccessibility(announcement); }, [open, announcement]);
  useEffect(() => {
    if (reduced) {
      motion.setValue((() => {
        if (open) {
          return 1;
        } else {
          return 0;
        }
      })());
      return;
    }
    try {
      const animation = Animated.timing(motion, {
        toValue: (() => {
          if (open) {
            return 1;
          } else {
            return 0;
          }
        })(), duration: (() => {
          if (open) {
            return 300;
          } else {
            return 180;
          }
        })(),
        easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web',
      });
      animation.start(({ finished }) => { if (finished && !open) setPresented(false); });
      return () => animation.stop();
    } catch {
      motion.setValue((() => {
        if (open) {
          return 1;
        } else {
          return 0;
        }
      })());
      const frame = requestAnimationFrame(() => setPresented(open));
      return () => cancelAnimationFrame(frame);
    }
  }, [message, motion, open, reduced]);

  if (!message) return null;
  return <View onLayout={event => setColumnWidth(event.nativeEvent.layout.width)} style={[styles.root, { height: footerHeight }]} testID="story-interactive-guide">
    {presented && <Animated.View
      {...(Platform.OS === 'web' ? { onKeyDown: (event: React.KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); } } } : {})}
      style={[styles.popover, { bottom: footerHeight + 12, width: Math.min(420, columnWidth || pageWidth * 0.6), opacity: motion,
        transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}
      testID="story-mascot-popover">
      <StorySpeechBubble takeawayText={message} highlightWords={content.highlightWords}
        compact effectiveLandscape={false} isDesktop={false} isTablet={false} stackGuide={false}
        floating maxHeight={Math.max(80, pageHeight - footerHeight - 24)} onClose={close} />
      <View pointerEvents="none" style={[styles.tailAnchor, { width: size }]}><SpeechBubbleTail position="bottom" size="compact" /></View>
    </Animated.View>}
    <Pressable ref={trigger} accessibilityRole="button" accessibilityLabel="Pindutin si BAYA upang mabasa ang kanyang mensahe."
      accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)}
      onFocus={onFocus} onPressIn={onPressIn} onBlur={onBlur}
      style={({ pressed }) => [styles.trigger, { width: size, height: footerHeight }, focused && styles.focused, pressed && { opacity: 0.75 }]}
      testID="story-mascot-button">
      <BayaMascot crop="upperBody" size={size} state="wave" autoplay={!reduced && process.env.NODE_ENV !== 'test'} loop={false} decorative />

    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  root: { flexShrink: 0, alignItems: 'flex-end', width: '100%', position: 'relative', zIndex: 5 },
  trigger: { outlineWidth: 0, borderWidth: 2, borderColor: 'transparent', borderRadius: 16, alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' },
  focused: { borderColor: Colors.rolePrimary },
  popover: { position: 'absolute', right: 0, zIndex: 10 },
  tailAnchor: { position: 'absolute', right: 0, bottom: 0, width: 96, height: 0 },
});
