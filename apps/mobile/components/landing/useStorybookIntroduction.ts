import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { introductionSession, STORYBOOK_INTRO_KEY } from './storybookIntroduction';

export type StorybookOpenMode = 'automatic' | 'manual';

/** One presentation above the responsive branches; navigation cancels pending hydration. */
export function useStorybookIntroduction(eligible: boolean, session = introductionSession) {
  const [mode, setMode] = useState<StorybookOpenMode | null>(null);
  const current = useRef(mode);
  const active = useRef(eligible);
  const leaving = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const update = useCallback((value: StorybookOpenMode | null) => {
    current.current = value;
    setMode(value);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof BroadcastChannel === 'undefined') return;
    try {
      const connection = new BroadcastChannel(STORYBOOK_INTRO_KEY);
      channel.current = connection;
      connection.onmessage = event => {
        if (event.data === 'acknowledged') session.acceptExternalAcknowledgement();
      };
      return () => { channel.current = null; connection.close(); };
    } catch { /* Storage still works when browser messaging is unavailable. */ }
  }, [session]);

  useEffect(() => session.subscribe(() => {
    // Another tab finishing must not interrupt an explicit manual reading session.
    if (current.current === 'automatic') update(null);
  }), [session, update]);

  useEffect(() => {
    let cancelled = false;
    active.current = eligible && !leaving.current;
    if (!eligible) leaving.current = false;
    void (eligible ? session.load() : Promise.resolve(true)).then(seen => {
      if (cancelled) return;
      if (!eligible) { update(null); return; }
      if (!cancelled && active.current && !seen && !current.current && session.claim()) update('automatic');
    });
    return () => { cancelled = true; };
  }, [eligible, session, update]);

  const openManual = useCallback(() => { session.claim(); update('manual'); }, [session, update]);
  const close = useCallback(() => {
    if (current.current === 'automatic') {
      const connection = channel.current;
      void session.acknowledge().then(saved => {
        if (saved && connection && channel.current === connection) connection.postMessage('acknowledged');
      });
    }
    update(null);
  }, [session, update]);
  const leaveWelcome = useCallback(() => { leaving.current = true; active.current = false; update(null); }, [update]);
  return { mode, openManual, close, leaveWelcome };
}
