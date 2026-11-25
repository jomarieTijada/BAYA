import { Platform } from 'react-native';

/** Prepare offline assets. Updates activate after existing app windows close. */
export function registerBayaPwa(): void {
  if (__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined'
    || typeof navigator === 'undefined' || !navigator.serviceWorker) return;

  void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    .then(registration => registration.update().catch(() => undefined))
    .catch(error => console.warn('[BAYA PWA] Service worker registration failed:', error));
}
