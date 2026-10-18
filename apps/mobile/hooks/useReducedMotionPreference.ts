import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Keep a static presentation until the platform preference is known. */
export function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      changed = true;
      if (active) setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (active && !changed) setReduced(value);
    }).catch(() => { /* Keep the static state if the API is unavailable. */ });
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}
