import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useBayaToast } from '../ui/BayaNotifications';

/** Informational only: connectivity never gates the learner navigator. */
export function OfflineLearningStatus() {
  const toast = useBayaToast();
  const notify = useRef(toast);
  useEffect(() => { notify.current = toast; }, [toast]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let offline = navigator.onLine === false;
    const announce = () => notify.current(offline
      ? "You're offline. Your progress is saved on this device."
      : "You're online.", offline ? 'information' : 'success');
    if (offline) announce();
    const update = () => {
      const next = navigator.onLine === false;
      if (next === offline) return;
      offline = next;
      announce();
    };
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return null;
}
