export type OfflineAsset = { id: string; url: string; category: string; sizeBytes: number; revision: string };
export type OfflineManifest = { version: string; totalBytes: number; assets: OfflineAsset[] };
export type OfflineState = {
  phase: string; version?: string; ready: boolean; verifiedBytes: number; receivedBytes: number;
  totalBytes: number; verifiedFiles: number; totalFiles: number; files: Record<string, string>;
  missing: string[]; category?: string; error?: string; lastVerified?: string;
  downloadTotalBytes?: number; completedDownloadBytes?: number;
};
export const initialState: OfflineState = { phase: 'preparing', ready: false, verifiedBytes: 0,
  receivedBytes: 0, totalBytes: 0, verifiedFiles: 0, totalFiles: 0, files: {}, missing: [] };

export function workerMessage<T>(worker: ServiceWorker, type: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const cleanup = () => { clearTimeout(timer); channel.port1.close(); navigator.serviceWorker.removeEventListener('message', heartbeat); };
    const expired = () => { cleanup(); reject(new Error('Preparation interrupted. Please retry.')); };
    let timer = setTimeout(expired, 90000);
    const heartbeat = (event: MessageEvent) => {
      if (event.source === worker && event.data?.type === 'BAYA_PACKAGE_PROGRESS') {
        clearTimeout(timer); timer = setTimeout(expired, 90000);
      }
    };
    navigator.serviceWorker.addEventListener('message', heartbeat);
    channel.port1.onmessage = event => { cleanup(); resolve(event.data); };
    worker.postMessage({ type }, [channel.port2]);
  });
}

/** Exercise the same runtime URLs and modules used by ordinary learning. */
export async function validateRuntime(manifest: OfflineManifest) {
  const { getReadyDatabase } = await import('../../database');
  await getReadyDatabase();
  const { runBayaSpatialInference } = await import('../../ml/bayaModel');
  await runBayaSpatialInference(new Float32Array(3 * 160 * 160));
  const illustration = manifest.assets.find(a => a.category === 'Character illustrations' && /\.(png|webp)$/.test(a.url));
  if (illustration) {
    const image = new Image();
    image.src = illustration.url;
    await image.decode();
  }
  const audio = manifest.assets.find(a => a.category === 'Pronunciation audio');
  if (audio) {
    const context = new AudioContext();
    try { await context.decodeAudioData(await (await fetch(audio.url)).arrayBuffer()); }
    finally { await context.close(); }
  }
  for (const asset of manifest.assets.filter(a => a.category === 'Educational videos')) {
    const video = document.createElement('video');
    video.preload = 'metadata'; video.muted = true; video.playsInline = true;
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Video validation timed out')), 20000);
        video.onloadedmetadata = () => { clearTimeout(timer); resolve(); };
        video.onerror = () => { clearTimeout(timer); reject(new Error('Video could not be opened')); };
        video.src = asset.url;
      });
      if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error('Invalid video duration');
      for (const fraction of [0.5, 0.95]) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Video seeking timed out')), 20000);
          video.onseeked = () => { clearTimeout(timer); resolve(); };
          video.currentTime = video.duration * fraction;
        });
      }
    } finally { video.removeAttribute('src'); video.load(); }
  }
  await document.fonts.ready;
}
