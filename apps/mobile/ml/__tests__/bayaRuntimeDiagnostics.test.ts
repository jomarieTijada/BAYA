import { classifyBayaRuntime, type BayaRuntimeProbe } from '../bayaRuntimeDiagnostics';

const base: BayaRuntimeProbe = {
  bundlePlatform: 'web',
  hasWindow: true,
  hasDocument: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
  standalone: false,
  serviceWorkerControlled: false,
};

it('identifies Expo Go as native JavaScript even on an Android device', () => {
  expect(classifyBayaRuntime({ ...base, bundlePlatform: 'android', hasWindow: false, hasDocument: false, userAgent: '' }))
    .toEqual({
      runtime: 'native-or-headless-js', bundlePlatform: 'android', browserDomAvailable: false,
      deviceOs: 'android', displayMode: 'unavailable', userAgentCategory: 'unavailable',
      serviceWorkerControlled: false,
    });
});

it('identifies Android Chrome and its installed PWA as web DOM runtimes', () => {
  expect(classifyBayaRuntime(base)).toMatchObject({
    runtime: 'web-dom', bundlePlatform: 'web', deviceOs: 'android',
    displayMode: 'browser', userAgentCategory: 'phone', serviceWorkerControlled: false,
  });
  expect(classifyBayaRuntime({ ...base, standalone: true, serviceWorkerControlled: true })).toMatchObject({
    runtime: 'web-dom', deviceOs: 'android', displayMode: 'standalone',
    userAgentCategory: 'phone', serviceWorkerControlled: true,
  });
});

it('keeps tablet user-agent classification separate from the web runtime', () => {
  expect(classifyBayaRuntime({ ...base, userAgent: 'Mozilla/5.0 (Linux; Android 14; Tablet) Chrome/126.0' }))
    .toMatchObject({ runtime: 'web-dom', deviceOs: 'android', userAgentCategory: 'tablet' });
});
