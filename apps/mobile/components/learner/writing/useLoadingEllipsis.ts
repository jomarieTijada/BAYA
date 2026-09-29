import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Shared, text-only loading cue for the writing bubble and Suriin button. */
export function useLoadingEllipsis(active: boolean) {
  const [dots, setDots] = useState(3);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo?.isReduceMotionEnabled?.()
      .then(enabled => { if (mounted) setReduceMotion(enabled); })
      .catch(() => undefined);
    const subscription = AccessibilityInfo?.addEventListener?.('reduceMotionChanged', enabled => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => { mounted = false; subscription?.remove?.(); };
  }, []);

  useEffect(() => {
    if (!active || reduceMotion) return;
    const interval = setInterval(() => setDots(current => (current + 1) % 4), 450);
    return () => clearInterval(interval);
  }, [active, reduceMotion]);

  return !active || reduceMotion ? '...' : '.'.repeat(dots);
}
