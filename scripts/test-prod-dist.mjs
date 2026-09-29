// test-prod-dist.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const DIST_DIR = path.resolve('apps/mobile/dist');
const SERVER_PORT = 5055;
const CHROME_PORT = 9338;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
};

// 1. Start production static server with Cross-Origin headers
const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !path.extname(reqPath)) {
    reqPath = '/index.html';
  }

  const filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    const indexPath = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(SERVER_PORT, '127.0.0.1', resolve));
console.log(`[PROD TEST] Production server listening at http://127.0.0.1:${SERVER_PORT}`);

// 2. Launch headless Chrome
const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${CHROME_PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-baya-proddist',
  'about:blank'
], { stdio: 'ignore' });

function cleanup() {
  try { chromeProcess.kill(); } catch {}
  try { server.close(); } catch {}
}

process.on('exit', cleanup);

async function main() {
  await sleep(2000);

  const targetsRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let idCounter = 1;
  const pendingRequests = new Map();
  const consoleMessages = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      pendingRequests.get(msg.id)(msg);
      pendingRequests.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
      consoleMessages.push({ type: msg.params.type, text });
      if (text.includes('BAYA') || text.includes('VFS') || text.includes('Progress') || text.includes('Error')) {
        console.log(`[PROD BROWSER ${msg.params.type.toUpperCase()}]`, text);
      }
    }
  };

  function sendCommand(method, params = {}) {
    const id = idCounter++;
    return new Promise((resolve) => {
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  console.log('\n[PROD TEST] Evaluating capabilities on http://localhost:5055 ...');
  await sendCommand('Page.navigate', { url: `http://localhost:${SERVER_PORT}` });
  await sleep(3000);

  const capRes = await sendCommand('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        origin: window.location.origin,
        isSecureContext: window.isSecureContext,
        crossOriginIsolated: window.crossOriginIsolated,
        hasNavigatorStorage: typeof navigator.storage !== 'undefined',
        hasGetDirectory: typeof navigator.storage?.getDirectory === 'function',
      }, null, 2)
    `,
    returnByValue: true
  });
  console.log('Production Export Capabilities:\n', capRes.result?.result?.value);

  console.log('\n[PROD TEST] Navigating to http://localhost:5055/learner/activities/topic-1-1 ...');
  await sendCommand('Page.navigate', { url: `http://localhost:${SERVER_PORT}/learner/activities/topic-1-1` });
  await sleep(5000);

  // Click Next
  const clickRes = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
        const nextBtn = buttons.find(b => b.innerText && (b.innerText.includes('Susunod') || b.innerText.includes('Next') || b.innerText.includes('Topics')));
        if (nextBtn) {
          nextBtn.click();
          return { clicked: true, text: nextBtn.innerText };
        }
        return { clicked: false, all: buttons.map(b => b.innerText) };
      })()
    `,
    returnByValue: true
  });
  console.log('Click result:', JSON.stringify(clickRes.result?.result?.value));
  await sleep(4000);

  const postClickUrl = await sendCommand('Runtime.evaluate', {
    expression: 'window.location.href',
    returnByValue: true
  });
  console.log('URL after click:', postClickUrl.result?.result?.value);

  // Reload to verify persistence
  console.log('\n[PROD TEST] Navigating to home to check persistence...');
  await sendCommand('Page.navigate', { url: `http://localhost:${SERVER_PORT}/learner/home` });
  await sleep(5000);

  const homeData = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const texts = Array.from(document.querySelectorAll('div, span, p')).map(e => e.innerText).filter(Boolean);
        return {
          hasDailyGoal: texts.some(t => t.includes('1 of 1') || t.includes('1 / 1') || t.includes('Goal') || t.includes('Daily') || t.includes('complete')),
          sampleTexts: texts.slice(0, 15)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Home state after reload:\n', JSON.stringify(homeData.result?.result?.value, null, 2));

  const vfsErrors = consoleMessages.filter(m => m.text.includes('Invalid VFS state') || m.text.includes('VFS'));
  console.log(`\nTotal VFS errors in production export: ${vfsErrors.length}`);

  ws.close();
  cleanup();
  process.exit(vfsErrors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test error:', err);
  cleanup();
  process.exit(1);
});
