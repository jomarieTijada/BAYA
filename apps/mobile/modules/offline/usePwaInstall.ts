import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function isStandalone() {
  return Platform.OS === 'web' && typeof window !== 'undefined'
    && (window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true);
}

/** Installation is browser-owned. An accepted prompt does not start asset setup. */
export function usePwaInstall() {
  const [standalone, setStandalone] = useState(isStandalone);
  const [installed, setInstalled] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [prompting, setPrompting] = useState(false);
  const deferred = useRef<InstallPrompt | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const display = window.matchMedia('(display-mode: standalone)');
    const changed = () => setStandalone(isStandalone());
    const available = (event: Event) => { event.preventDefault(); deferred.current = event as InstallPrompt; };
    const completed = () => { deferred.current = null; setInstalled(true); setInstructions(false); };
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', completed);
    display.addEventListener('change', changed);
    return () => {
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', completed);
      display.removeEventListener('change', changed);
    };
  }, []);
  const install = async () => {
    const prompt = deferred.current;
    if (!prompt) { setInstructions(true); return; }
    deferred.current = null;
    setPrompting(true);
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === 'accepted') setInstructions(true);
    } catch { setInstructions(true); }
    finally { setPrompting(false); }
  };
  return { standalone, installed, instructions, prompting, install };
}
