import React, { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';
import { useLocalization } from '../../../localization/LocalizationProvider';

/** Inspect the controlling worker's actual cache, not registration alone. */
export function OfflinePreparation({ compact = false }: { compact?: boolean }) {
  const { text } = useLocalization();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || !navigator.serviceWorker) return;
    let active = true;
    let pending = false;
    const inspect = () => {
      const worker = navigator.serviceWorker.controller;
      if (!worker || pending) return;
      pending = true;
      const channel = new MessageChannel();
      const close = () => { channel.port1.close(); pending = false; };
      const timeout = setTimeout(close, 5000);
      channel.port1.onmessage = event => {
        clearTimeout(timeout); close();
        if (active) setReady(event.data?.ready === true);
      };
      worker.postMessage({ type: 'BAYA_OFFLINE_STATUS' }, [channel.port2]);
    };
    inspect();
    const timer = setInterval(inspect, 10000);
    navigator.serviceWorker.addEventListener('controllerchange', inspect);
    return () => { active = false; clearInterval(timer); navigator.serviceWorker.removeEventListener('controllerchange', inspect); };
  }, []);
  if (Platform.OS !== 'web') return null;
  return <Text testID="offline-preparation" style={{ padding: compact ? 2 : 12, fontSize: compact ? 12 : 14, textAlign: 'center' }}>
    {text(ready ? 'Offline learning materials downloaded. Videos require internet.' : 'Offline preparation is incomplete. Connect to finish downloading learning materials.')}
  </Text>;
}
