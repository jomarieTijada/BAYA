import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile, unlink, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.resolve(appRoot, process.env.BAYA_WEB_OUTPUT_DIR ?? 'dist');
const activeModel = JSON.parse(await readFile(path.join(appRoot, 'ml/bayaActiveModel.json'), 'utf8'));
const modelPath = activeModel.modelUrl;
const metadataPaths = [activeModel.labelsUrl, activeModel.contractUrl];
const runtimePaths = activeModel.runtimeFiles.map(name => activeModel.runtimeBaseUrl + name);

function localPath(url) {
  const parsed = new URL(url, 'https://baya.invalid');
  if (parsed.origin !== 'https://baya.invalid') throw new Error(`Cross-origin PWA entry asset: ${url}`);
  return parsed.pathname;
}

async function exportedFiles(directory) {
  const absolute = path.join(outputRoot, directory);
  const paths = [];
  for (const entry of await readdir(absolute, { withFileTypes: true })) {
    const child = path.posix.join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...await exportedFiles(child));
    else if (entry.isFile() && !child.endsWith('.map')) paths.push(`/${child}`);
  }
  return paths;
}

function category(url) {
  if (url === '/') return 'Application shell';
  if (url === modelPath) return 'Handwriting model';
  if (runtimePaths.includes(url)) return 'LiteRT runtime';
  if (/\.(?:mp4|webm|mov)$/.test(url)) return 'Educational videos';
  if (/\.(?:m4a|mp3|wav|ogg)$/.test(url)) return 'Pronunciation audio';
  if (/\.(?:ttf|woff2?|otf)$/.test(url)) return 'Fonts and icons';
  if (/mascot|bayani|blink|wave/i.test(url)) return 'Bayani animations';
  if (/story/i.test(url)) return 'Storybook resources';
  if (/\.(?:png|webp|jpg|jpeg|svg|gif)$/.test(url)) return 'Character illustrations';
  if (/\.(?:js|css)$/.test(url)) return 'Lessons and activities';
  return 'Other offline resources';
}

async function buildServiceWorker() {
  // Expo copies public research candidates too. Ship only the selected model
  // and its metadata; preserve all source/research artifacts outside dist.
  const modelDirectory = path.join(outputRoot, 'models/baya');
  const resolvedOutput = await realpath(outputRoot);
  const resolvedModels = await realpath(modelDirectory);
  if (!resolvedModels.startsWith(resolvedOutput + path.sep) || resolvedOutput === await realpath(path.join(appRoot, 'public'))) {
    throw new Error('Refusing to prune model files outside the export directory.');
  }
  const selectedFiles = new Set([modelPath, ...metadataPaths]);
  for (const url of await exportedFiles('models/baya')) {
    if (selectedFiles.has(url)) continue;
    if (process.argv.includes('--check')) throw new Error(`Unselected model artifact in export: ${url}`);
    const target = await realpath(path.join(outputRoot, url));
    if (!target.startsWith(resolvedModels + path.sep)) throw new Error('Model artifact escaped the export directory.');
    await unlink(target);
  }
  const html = await readFile(path.join(outputRoot, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(match => localPath(match[1]));
  const styles = [...html.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["']/gi)]
    .map(match => localPath(match[1]));
  if (scripts.length === 0) throw new Error('Web export has no entry script to cache.');

  const assets = await exportedFiles('assets');
  const bundles = await exportedFiles('_expo/static/js/web');
  // Metro emits the exact runtime asset URL into its web modules. Verify those
  // references too: scanning only existing files would hide an omitted export.
  const referencedAssets = new Set();
  for (const bundle of bundles) {
    const code = await readFile(path.join(outputRoot, bundle.slice(1)), 'utf8');
    for (const match of code.matchAll(/["'](\/assets\/[^"'\\]+\.[a-z0-9]+)["']/gi)) referencedAssets.add(match[1]);
  }
  for (const url of referencedAssets) {
    if (!assets.includes(url)) throw new Error('Required bundled asset missing from export: ' + url);
  }
  const songAssets = assets.filter(url => /\/baybayin-song\.[^.]+\.mp4$/i.test(url));
  if (songAssets.length !== 1 ||
      (await stat(path.join(outputRoot, songAssets[0].slice(1)))).size === 0) {
    throw new Error('Web export must contain one nonempty hashed baybayin-song MP4 asset.');
  }

  const precache = [...new Set([
    '/', '/manifest.json', '/favicon.ico', '/icon-192.png', '/icon-512.png',
    modelPath, ...metadataPaths, ...runtimePaths, ...scripts, ...styles,
    ...bundles,
    ...assets,
  ])];
  const digest = createHash('sha256');
  const integrity = {};
  const inventory = [];
  const template = await readFile(path.join(appRoot, 'scripts/offline-worker.js'), 'utf8');
  digest.update(await readFile(fileURLToPath(import.meta.url)));
  digest.update(template);
  for (const url of precache) {
    const file = path.join(outputRoot, (() => {
      if (url === '/') {
        return 'index.html';
      } else {
        return url.slice(1);
      }
    })());
    digest.update(url);
    const bytes = await readFile(file);
    if (!bytes.length) throw new Error('Empty required asset: ' + url);
    const revision = createHash('sha256').update(bytes).digest('hex');
    digest.update(bytes);
    inventory.push({ id: url.replace(/\.[a-f0-9]{32}(?=\.)/g, ''), url, category: category(url), required: true, sizeBytes: bytes.length, revision, validation: url === '/' ? 'shell-entry-references' : 'sha256-size' });
    // Hosting may add comments/snippets to HTML at response time. Validate the
    // shell's entry scripts below; keep exact digests on all executable assets.
    if (url !== '/') integrity[url] = 'sha256-' + createHash('sha256').update(bytes).digest('base64');
  }
  const cacheName = `baya-pwa-${digest.digest('hex').slice(0, 16)}`;
  const manifest = { version: cacheName, totalBytes: inventory.reduce((n, a) => n + a.sizeBytes, 0), assets: inventory.map(a => ({ ...a, cache: cacheName })) };
  const source = `/* Generated: do not edit. */
const CACHE_NAME = ${JSON.stringify(cacheName)};
const MANIFEST = ${JSON.stringify(manifest)};
const ASSET_INTEGRITY = ${JSON.stringify(integrity)};
const SHELL_SCRIPTS = ${JSON.stringify(scripts)};
${template}`;
  if (!process.argv.includes('--check')) {
    await writeFile(path.join(outputRoot, 'offline-manifest.json'), JSON.stringify(manifest, null, 2));
  } else if (await readFile(path.join(outputRoot, 'offline-manifest.json'), 'utf8') !== JSON.stringify(manifest, null, 2)) {
    throw new Error('Offline manifest is stale.');
  }
  return { cacheName, precache, source };
}

const { cacheName, precache, source } = await buildServiceWorker();
const destination = path.join(outputRoot, 'sw.js');
if (process.argv.includes('--check')) {
  if (await readFile(destination, 'utf8') !== source) throw new Error('PWA service worker is missing or stale.');
  process.stdout.write(`[BAYA PWA] Verified ${cacheName} with ${precache.length} precached assets.\n`);
} else {
  await writeFile(destination, source);
  process.stdout.write(`[BAYA PWA] Wrote ${destination} (${cacheName}; ${precache.length} assets).\n`);
}
