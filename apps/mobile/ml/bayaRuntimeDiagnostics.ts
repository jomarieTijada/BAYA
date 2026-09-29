import { Platform } from 'react-native';

export type BayaRuntimeProbe = {
  bundlePlatform: string;
  hasWindow: boolean;
  hasDocument: boolean;
  userAgent: string;
  standalone: boolean;
  serviceWorkerControlled: boolean;
};

/** Report the JavaScript runtime separately from the device OS and install mode. */
export function classifyBayaRuntime(probe: BayaRuntimeProbe) {
  const browserDomAvailable = probe.hasWindow && probe.hasDocument;
  const deviceOs = browserDomAvailable
    ? /Android/i.test(probe.userAgent) ? 'android'
      : /iPad|iPhone|iPod/i.test(probe.userAgent) ? 'ios' : 'unknown'
    : probe.bundlePlatform;
  const userAgentCategory = !probe.userAgent ? 'unavailable'
    : /iPad|Tablet|Android(?!.*Mobile)/i.test(probe.userAgent) ? 'tablet'
      : /Mobile|iPhone|iPod/i.test(probe.userAgent) ? 'phone' : 'desktop';

  return {
    runtime: browserDomAvailable ? 'web-dom' : 'native-or-headless-js',
    bundlePlatform: probe.bundlePlatform,
    browserDomAvailable,
    deviceOs,
    displayMode: browserDomAvailable ? (probe.standalone ? 'standalone' : 'browser') : 'unavailable',
    userAgentCategory,
    serviceWorkerControlled: browserDomAvailable && probe.serviceWorkerControlled,
  };
}

export function getBayaRuntimeDiagnostics() {
  const hasWindow = typeof window !== 'undefined';
  const hasDocument = typeof document !== 'undefined';
  const hasNavigator = typeof navigator !== 'undefined';
  const standalone = hasWindow && hasNavigator && (
    Boolean(window.matchMedia?.('(display-mode: standalone)').matches)
    || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
  return classifyBayaRuntime({
    bundlePlatform: Platform.OS,
    hasWindow,
    hasDocument,
    userAgent: hasNavigator ? navigator.userAgent : '',
    standalone,
    serviceWorkerControlled: hasNavigator && Boolean(navigator.serviceWorker?.controller),
  });
}
