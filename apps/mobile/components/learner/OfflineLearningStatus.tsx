import React, { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';
import { useLocalization } from '../../localization/LocalizationProvider';

/** Informational only: connectivity never gates the learner navigator. */
export function OfflineLearningStatus() {
  const { text } = useLocalization();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => setOffline(navigator.onLine === false);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (!offline) return null;
  return <Text accessibilityRole="text" testID="offline-learning-status" style={{ padding: 6, textAlign: 'center', backgroundColor: '#FFF4EB', color: '#45352A' }}>
    {text('Learning offline — Your progress is saved on this device.')}
  </Text>;
}
