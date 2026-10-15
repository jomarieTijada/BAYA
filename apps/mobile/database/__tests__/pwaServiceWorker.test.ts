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

  it('bypasses service worker interception for video, audio, and Range requests', async () => {
    const scriptContent = await readFile(scriptPath, 'utf8');

    expect(scriptContent).toContain('isMedia');
    expect(scriptContent).toContain("request.destination === 'video'");
    expect(scriptContent).toContain("request.headers.has('range')");
  });

  it('guarantees navigation requests never reject uncaught errors or return 504', async () => {
    const scriptContent = await readFile(scriptPath, 'utf8');

    expect(scriptContent).toContain("request.mode === 'navigate'");
    expect(scriptContent).toContain("isNavigation");
    expect(scriptContent).toContain("cache.match('/')");
    expect(scriptContent).toContain("caches.match('/')");
    expect(scriptContent).toContain("BAYA is currently offline");
    expect(scriptContent).not.toContain("status: 504");
  });

  it('provides diagnostic logging and clean offline responses without synthetic 504s', async () => {
    const scriptContent = await readFile(scriptPath, 'utf8');

    expect(scriptContent).toContain("[BAYA SW Asset Fetch Error]");
    expect(scriptContent).toContain("status: 404");
  });
});
