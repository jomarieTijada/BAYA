// scripts/test-cdp-drawing.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const DIST_DIR = path.resolve('apps/mobile/dist');
const SERVER_PORT = 5058;
const CHROME_PORT = 9342;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES = {
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

const server = http.createServer((req, res) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
});

await new Promise((resolve) => server.listen(SERVER_PORT, '127.0.0.1', resolve));

const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${CHROME_PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-draw',
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

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      pendingRequests.get(msg.id)(msg);
      pendingRequests.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
      if (text.includes('BAYA') || text.includes('ML') || text.includes('Recognition') || text.includes('ONNX') || text.includes('Result')) {
        console.log(`[BROWSER LOG]`, text);
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

  console.log('Navigating to topic-3-1...');
  await sendCommand('Page.navigate', { url: `http://localhost:${SERVER_PORT}/learner/activities/topic-3-1` });
  await sleep(6000);

  // Get canvas coordinates
  const canvasInfo = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const el = document.querySelector('[data-testid="writing-canvas"]');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.top, width: r.width, height: r.height };
      })()
    `,
    returnByValue: true
  });
  console.log('Canvas location:', canvasInfo.result?.result?.value);
  const rect = canvasInfo.result?.result?.value;

  if (rect) {
    const startX = Math.round(rect.x + rect.width * 0.3);
    const startY = Math.round(rect.y + rect.height * 0.3);
    const midX = Math.round(rect.x + rect.width * 0.5);
    const midY = Math.round(rect.y + rect.height * 0.7);
    const endX = Math.round(rect.x + rect.width * 0.7);
    const endY = Math.round(rect.y + rect.height * 0.4);

    console.log(`Drawing with Input.dispatchMouseEvent at (${startX}, ${startY}) -> (${midX}, ${midY}) -> (${endX}, ${endY})...`);
    await sendCommand('Input.dispatchMouseEvent', { type: 'mousePressed', x: startX, y: startY, button: 'left', buttons: 1, clickCount: 1 });
    await sleep(50);
    for (let i = 1; i <= 10; i++) {
      const t = i / 10;
      await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(startX + (midX - startX) * t), y: Math.round(startY + (midY - startY) * t), button: 'left', buttons: 1 });
      await sleep(30);
    }
    for (let i = 1; i <= 10; i++) {
      const t = i / 10;
      await sendCommand('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(midX + (endX - midX) * t), y: Math.round(midY + (endY - midY) * t), button: 'left', buttons: 1 });
      await sleep(30);
    }
    await sendCommand('Input.dispatchMouseEvent', { type: 'mouseReleased', x: endX, y: endY, button: 'left', buttons: 0, clickCount: 1 });
    await sleep(1000);

    // Click Suriin button
    console.log('Clicking Suriin button...');
    const suriinResult = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const btns = Array.from(document.querySelectorAll('div[role="button"], button'));
          const suriin = btns.find(b => b.innerText && b.innerText.includes('Suriin'));
          if (suriin) { suriin.click(); return { clicked: true }; }
          return { clicked: false, btns: btns.map(b => b.innerText) };
        })()
      `,
      returnByValue: true
    });
    console.log('Suriin click:', suriinResult.result?.result?.value);

    // Wait for inference
    await sleep(9000);

    const afterCheck = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const texts = Array.from(document.querySelectorAll('div, span, p')).map(e => e.innerText).filter(Boolean);
          const snippets = Array.from(new Set(texts.map(t => t.trim()))).filter(t => t.length > 0 && t.length < 50);
          return snippets;
        })()
      `,
      returnByValue: true
    });
    console.log('Text snippets after Suriin:\n', afterCheck.result?.result?.value);
  }

  ws.close();
  cleanup();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  cleanup();
  process.exit(1);
});
