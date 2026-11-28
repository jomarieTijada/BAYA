import { usePwaInstall } from '../../modules/offline/usePwaInstall';
import { PwaLaunchScreen } from './PwaLaunchScreen';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from '../../localization/components';
import { useLocalization } from '../../localization/LocalizationProvider';
import { Colors, FontFamily } from '../../constants/theme';
import { initialState, OfflineManifest, OfflineState, validateRuntime, workerMessage } from '../../modules/offline/package';

const enabled = Platform.OS === 'web' && !__DEV__;
const Context = createContext({ state: initialState, manifest: undefined as OfflineManifest | undefined,
  storage: '', update: '', run: (_repair = true) => {}, checkUpdate: () => {} });
export const useOfflinePackage = () => useContext(Context);
const mb = (bytes: number) => (bytes / 1048576).toFixed(1);

// A hint only suppresses the returning-launch splash; the worker still verifies
// every cached resource. It never establishes readiness or bypasses repair.
function readyHint() {
  try { return enabled && typeof localStorage !== 'undefined' && !!localStorage.getItem('baya.offline.ready'); }
  catch { return false; }
}
function browserChoice() {
  try { return enabled && typeof sessionStorage !== 'undefined' && sessionStorage.getItem('baya.browser.continue') === '1'; }
  catch { return false; }
}

export function OfflinePackageProvider({ children }: React.PropsWithChildren) {
  const install = usePwaInstall();
  const [continueBrowser, setContinueBrowser] = useState(browserChoice);
  const [state, setState] = useState<OfflineState>(() => ({ ...initialState, phase: install.standalone ? 'preparing' : 'not-started' }));
  const [manifest, setManifest] = useState<OfflineManifest>();
  const [storage, setStorage] = useState('');
  const [update, setUpdate] = useState('');
  const [showSetup, setShowSetup] = useState(() => enabled && !readyHint());
  const busy = useRef(false);
  const preparationRequested = useRef(false);
  const resumeRequested = useRef(false);
  const initial = useRef(true);
  const currentWorker = useRef<ServiceWorker | undefined>(undefined);

  const run = useCallback(async (repair = true) => {
    if (!enabled || busy.current) return;
    if (repair) preparationRequested.current = true;
    busy.current = true;
    try {
      if (!navigator.serviceWorker || !window.isSecureContext) throw new Error('Offline storage is unavailable in this browser.');
      setState(s => ({ ...s, phase: 'preparing', error: undefined }));
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      const worker = await new Promise<ServiceWorker>((resolve, reject) => {
        const started = Date.now();
        const timer = setInterval(() => {
          if (navigator.serviceWorker.controller) { clearInterval(timer); resolve(navigator.serviceWorker.controller); }
          else if (Date.now() - started > 90000) { clearInterval(timer); reject(new Error('Preparation interrupted. Please retry.')); }
        }, 100);
      });
      currentWorker.current = worker;
      const inventory = await workerMessage<OfflineManifest>(worker, 'BAYA_PACKAGE_MANIFEST');
      setManifest(inventory);
      if (repair) await navigator.storage?.persist?.().catch(() => false);
      // PREPARE already verifies existing files. Do not run two scans/reset
      // progress twice on every first launch or reconnection.
      let result = await workerMessage<OfflineState>(worker, repair ? 'BAYA_PREPARE' : 'BAYA_VERIFY');
      if (!result.ready && initial.current && install.standalone) setShowSetup(true);
      initial.current = false;
      if (result.phase === 'validating') {
        setState(result);
        await validateRuntime(inventory);
        result = await workerMessage<OfflineState>(worker, 'BAYA_CONFIRM_READY');
      }
      setState(result);
      if (result.ready) {
        try { localStorage.setItem('baya.offline.ready', result.version || 'ready'); } catch { /* Cache verification remains authoritative. */ }
        setShowSetup(false);
      } else {
        try { localStorage.removeItem('baya.offline.ready'); } catch { /* Optional UI hint. */ }
      }
      const estimate = await navigator.storage?.estimate?.();
      const persisted = await navigator.storage?.persisted?.();
      if (estimate) setStorage(`${mb(estimate.usage || 0)} / ${mb(estimate.quota || 0)} MB · ${persisted ? 'Persistent storage granted' : 'Storage may be cleared by the browser'}`);
      if (registration.waiting) setUpdate('Update available');
    } catch (error) {
      setState(s => ({ ...s, ready: false, phase: navigator.onLine === false ? 'interrupted' : 'failed', error: error instanceof Error ? error.message : String(error) }));
    } finally {
      busy.current = false;
      if (resumeRequested.current) {
        resumeRequested.current = false;
        void run();
      }
    }
  }, [install.standalone]);

  const checkUpdate = useCallback(async () => {
    if (!enabled || busy.current) return;
    busy.current = true;
    setUpdate('Checking for updates');
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
      if (registration?.installing) await new Promise<void>(resolve => {
        const worker = registration.installing!;
        worker.addEventListener('statechange', () => { if (worker.state === 'installed' || worker.state === 'redundant') resolve(); });
      });
      if (registration?.waiting) {
        setUpdate('Downloading update');
        const result = await workerMessage<OfflineState>(registration.waiting, 'BAYA_PREPARE');
        setUpdate(result.phase === 'validating' || result.ready
          ? 'Update downloaded. Close all BAYA windows to use it.' : 'Update interrupted. Your current package is kept.');
      } else setUpdate('You have the latest resources');
    } catch { setUpdate('Update interrupted. Your current package is kept.'); }
    finally { busy.current = false; }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const progress = (event: MessageEvent) => {
      if (event.data?.type === 'BAYA_PACKAGE_PROGRESS' && event.source === currentWorker.current) {
        setState(event.data);
        if (initial.current && install.standalone && event.data.missing?.length) setShowSetup(true);
      }
    };
    const resume = () => {
      if (!install.standalone && !preparationRequested.current) return;
      if (busy.current) resumeRequested.current = true;
      else void run();
    };
    navigator.serviceWorker?.addEventListener('message', progress);
    window.addEventListener('online', resume);
    if (install.standalone) void run();
    return () => { navigator.serviceWorker?.removeEventListener('message', progress); window.removeEventListener('online', resume); };
  }, [run, install.standalone]);

  const welcome = enabled && !install.standalone && !continueBrowser;
  const proceed = () => {
    if (welcome) {
      try { sessionStorage.setItem('baya.browser.continue', '1'); } catch { /* Optional preference. */ }
      setContinueBrowser(true);
    } else setShowSetup(false);
  };
  return <Context.Provider value={{ state, manifest, storage, update, run, checkUpdate }}>
    {welcome || (enabled && install.standalone && showSetup)
      ? <PwaLaunchScreen install={welcome ? install : undefined} state={state}
          onRetry={() => { void run(); }} onContinue={proceed} />
      : children}
  </Context.Provider>;
}

export function OfflinePackageDetails({ compact = false, metadata = true, hideStatus = false }: { compact?: boolean; metadata?: boolean; hideStatus?: boolean }) {
  const { state, manifest, storage } = useOfflinePackage();
  const { text, date } = useLocalization();
  const percent = state.totalBytes ? Math.floor(state.verifiedBytes * 100 / state.totalBytes) : 0;
  const categories = [...new Set(manifest?.assets.map(a => a.category) || [])];
  return <View style={{ gap: 8 }} testID="offline-package-details">
    {!hideStatus && <Text style={styles.description}>{state.ready ? 'Ready for Offline Learning!' : state.phase === 'not-started' ? 'Offline files are not downloaded yet.' : state.phase === 'validating' ? 'Checking learning resources' : state.phase === 'verifying' ? 'Verifying offline files' : 'Downloading offline files'}</Text>}
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={styles.track}><View style={[styles.fill, { width: `${percent}%` }]} /></View>
    <Text style={styles.caption}>{`${percent}% · ${mb(state.verifiedBytes)} / ${mb(state.totalBytes)} MB · ${state.verifiedFiles} / ${state.totalFiles} ${text('files verified')}`}</Text>
    {!compact && categories.map(category => {
      const assets = manifest!.assets.filter(a => a.category === category);
      const verified = assets.filter(a => state.files[a.url] === 'verified').length;
      return <Text key={category} style={styles.caption}>{`${verified === assets.length ? '✓' : '○'} ${text(category)} (${verified}/${assets.length})`}</Text>;
    })}
    {metadata && state.version && <Text style={styles.caption}>{state.version}</Text>}
    {metadata && state.lastVerified && <Text style={styles.caption}>{`${text('Last verified')}: ${date(state.lastVerified)}`}</Text>}
    {metadata && !!storage && <Text style={styles.caption}>{storage.split(' · ').map(text).join(' · ')}</Text>}
    {!!state.missing.length && ['incomplete', 'failed', 'interrupted'].includes(state.phase) && <Text style={styles.caption}>{`${text('Files needing repair')}: ${state.missing.length}`}</Text>}
    {!!state.error && <Text style={styles.caption}>{text(state.error)}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 20 },
  card: { width: '100%', maxWidth: 620, padding: 24, borderRadius: 24, backgroundColor: Colors.surface, gap: 16, borderWidth: 1, borderColor: Colors.border },
  title: { fontFamily: FontFamily.body, fontSize: 25, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  description: { fontFamily: FontFamily.body, fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
  caption: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textPrimary },
  track: { height: 12, borderRadius: 6, backgroundColor: '#F4E5D5', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#E97828' },
});
