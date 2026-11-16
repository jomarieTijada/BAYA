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
  let deviceOs;
  if (browserDomAvailable) {
    if (/Android/i.test(probe.userAgent)) {
      deviceOs = 'android';
    } else {
      if (/iPad|iPhone|iPod/i.test(probe.userAgent)) {
        deviceOs = 'ios';
      } else {
        deviceOs = 'unknown';
      }
    }
  } else {
    deviceOs = probe.bundlePlatform;
  }
  let userAgentCategory;
  if (!probe.userAgent) {
    userAgentCategory = 'unavailable';
  } else {
    if (/iPad|Tablet|Android(?!.*Mobile)/i.test(probe.userAgent)) {
      userAgentCategory = 'tablet';
    } else {
      if (/Mobile|iPhone|iPod/i.test(probe.userAgent)) {
        userAgentCategory = 'phone';
      } else {
        userAgentCategory = 'desktop';
      }
    }
  }

  return {
    runtime: (() => {
      if (browserDomAvailable) {
        return 'web-dom';
      } else {
        return 'native-or-headless-js';
      }
    })(),
    bundlePlatform: probe.bundlePlatform,
    browserDomAvailable,
    deviceOs,
    displayMode: (() => {
      if (browserDomAvailable) {
        if (probe.standalone) {
          return 'standalone';
        } else {
          return 'browser';
        }
      } else {
        return 'unavailable';
      }
    })(),
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
    userAgent: (() => {
      if (hasNavigator) {
        return navigator.userAgent;
      } else {
        return '';
      }
    })(),
    standalone,
    serviceWorkerControlled: hasNavigator && Boolean(navigator.serviceWorker?.controller),
  });
}
