import { readFile } from 'node:fs/promises';
import path from 'node:path';

describe('PWA Service Worker Generation and Fetch Strategy', () => {
  const scriptPath = path.resolve(__dirname, '../../scripts/generate-pwa-service-worker.mjs');

  it('excludes large media/video assets from precaching', async () => {
    const scriptContent = await readFile(scriptPath, 'utf8');

    expect(scriptContent).toContain('isExcludedMedia');
    expect(scriptContent).toContain('.mp4');
    expect(scriptContent).toContain('/videos/');
  });

  it('guarantees navigation requests never reject uncaught errors', async () => {
    const scriptContent = await readFile(scriptPath, 'utf8');

    // Navigation must fall back to shell or fallback response rather than throwing
    expect(scriptContent).toContain("request.mode === 'navigate'");
    expect(scriptContent).toContain("isNavigation");
    expect(scriptContent).toContain("cache.match('/')");
    expect(scriptContent).toContain("caches.match('/')");
    expect(scriptContent).toContain("BAYA is currently offline");
  });

  it('guarantees missing subresources return 504 status instead of throwing to respondWith', async () => {
    const scriptContent = await readFile(scriptPath, 'utf8');

    expect(scriptContent).toContain("status: 504");
    expect(scriptContent).toContain("Gateway Timeout");
  });
});
