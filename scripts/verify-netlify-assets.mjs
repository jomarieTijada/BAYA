// scripts/verify-netlify-assets.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve('apps/mobile/dist');
const PORT = 5099;

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.onnx': 'application/octet-stream',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
};

// Start a server emulating Netlify's routing & headers rules
const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, urlPath);

  // Global Netlify headers
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Check if physical file exists
  let isStatic = false;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    isStatic = true;
  } else if (urlPath === '/' && fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    filePath = path.join(DIST_DIR, 'index.html');
    isStatic = true;
  }

  if (isStatic) {
    const ext = path.extname(filePath).toLowerCase();
    let contentType = MIME_MAP[ext] || 'application/octet-stream';

    // Route-specific headers from netlify.toml
    if (urlPath === '/sw.js') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (urlPath === '/manifest.json') {
      contentType = 'application/manifest+json; charset=utf-8';
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (urlPath === '/' || urlPath === '/index.html') {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else if (urlPath.startsWith('/models/')) {
      contentType = 'application/octet-stream';
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (urlPath.startsWith('/ort/') && ext === '.wasm') {
      contentType = 'application/wasm';
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // SPA redirect: /* -> /index.html 200
  const indexPath = path.join(DIST_DIR, 'index.html');
  const stat = fs.statSync(indexPath);
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': stat.size,
    'Cache-Control': 'no-cache, must-revalidate',
  });
  fs.createReadStream(indexPath).pipe(res);
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[VERIFY] Emulated Netlify server listening on http://127.0.0.1:${PORT}`);

const testUrls = [
  { url: '/', expectStatus: 200, expectType: 'text/html', expectBinary: false },
  { url: '/learner/home', expectStatus: 200, expectType: 'text/html', expectSpa: true },
  { url: '/learner/settings', expectStatus: 200, expectType: 'text/html', expectSpa: true },
  { url: '/learner/activities/topic-3-1', expectStatus: 200, expectType: 'text/html', expectSpa: true },
  { url: '/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1.onnx', expectStatus: 200, expectType: 'application/octet-stream', expectBinary: true, minSize: 15_000_000 },
  { url: '/ort/ort-wasm-simd-threaded.wasm', expectStatus: 200, expectType: 'application/wasm', expectBinary: true, minSize: 10_000_000 },
  { url: '/ort/ort-wasm-simd-threaded.mjs', expectStatus: 200, expectType: 'application/javascript', expectBinary: false },
  { url: '/ort/ort-wasm-runtime.min.js', expectStatus: 200, expectType: 'application/javascript', expectBinary: false },
  { url: '/sw.js', expectStatus: 200, expectNoCache: true },
  { url: '/manifest.json', expectStatus: 200, expectType: 'application/manifest+json' },
  { url: '/icon-192.png', expectStatus: 200, expectType: 'image/png' },
  { url: '/icon-512.png', expectStatus: 200, expectType: 'image/png' },
];

let allPassed = true;

for (const test of testUrls) {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}${test.url}`);
    const status = res.status;
    const contentType = res.headers.get('content-type') || '';
    const coop = res.headers.get('cross-origin-opener-policy');
    const coep = res.headers.get('cross-origin-embedder-policy');
    const buffer = await res.arrayBuffer();
    const size = buffer.byteLength;

    let pass = status === test.expectStatus;
    if (test.expectType && !contentType.includes(test.expectType)) pass = false;
    if (test.minSize && size < test.minSize) pass = false;

    // Check that binary files are NOT index.html
    if (test.expectBinary) {
      const textSample = Buffer.from(buffer.slice(0, 100)).toString('utf8');
      if (textSample.includes('<!DOCTYPE html>') || textSample.includes('<html')) {
        pass = false;
        console.error(`FAIL: ${test.url} returned HTML instead of binary!`);
      }
    }

    if (pass) {
      console.log(`[PASS] ${test.url.padEnd(50)} ${status} ${(size + ' B').padStart(12)}  type: ${contentType.split(';')[0]}`);
    } else {
      allPassed = false;
      console.error(`[FAIL] ${test.url.padEnd(50)} ${status} ${size} B  type: ${contentType}`);
    }
  } catch (err) {
    allPassed = false;
    console.error(`[ERROR] ${test.url}:`, err);
  }
}

server.close();

if (allPassed) {
  console.log('\nAll Netlify asset and route checks PASSED successfully!');
  process.exit(0);
} else {
  console.error('\nSome checks FAILED!');
  process.exit(1);
}
