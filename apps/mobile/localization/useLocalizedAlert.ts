import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useLocalization } from './LocalizationProvider';
/** Translate only the app-owned title/body; callbacks and platform options stay intact. */
export function useLocalizedAlert() {
  const { text } = useLocalization();
  return useCallback((title: string, message: string) => {
    // React Native Web's Alert.alert is a no-op, including save failures.
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${text(title)}\n\n${text(message)}`);
    } else {
      Alert.alert(text(title), text(message));
    }
  }, [text]);
}
