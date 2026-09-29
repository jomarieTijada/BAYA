import { Platform } from 'react-native';

/** Install the versioned web-export cache; a new controller refreshes an older open bundle. */
export function registerBayaPwa(): void {
  if (__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined'
    || typeof navigator === 'undefined' || !navigator.serviceWorker) return;

  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    if (hadController && !reloaded) {
      reloaded = true;
      try {
        const { closeDatabaseConnection } = await import('../database/connection');
        await closeDatabaseConnection();
      } catch {
        // Safe to ignore if database connection was not initialized
      }
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  });
  void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    .then(registration => registration.update().catch(() => undefined))
    .catch(error => console.warn('[BAYA PWA] Service worker registration failed:', error));
}
