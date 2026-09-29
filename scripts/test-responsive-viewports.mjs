// scripts/test-responsive-viewports.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const DIST_DIR = path.resolve('apps/mobile/dist');
const SERVER_PORT = 5059;
const CHROME_PORT = 9345;
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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
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
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-responsive',
  'about:blank'
], { stdio: 'ignore' });

function cleanup() {
  try { chromeProcess.kill(); } catch {}
  try { server.close(); } catch {}
}
process.on('exit', cleanup);

const VIEWPORTS = [
  { name: 'Small Phone', width: 360, height: 740, isMobile: true },
  { name: 'Standard Phone (iPhone 12/13/14)', width: 390, height: 844, isMobile: true },
  { name: 'Large Phone (iPhone Pro Max)', width: 430, height: 932, isMobile: true },
  { name: 'Tablet Portrait (iPad Mini)', width: 768, height: 1024, isMobile: true },
  { name: 'Tablet Landscape / Small Laptop', width: 1024, height: 768, isMobile: false },
  { name: 'Standard Laptop (1366x768)', width: 1366, height: 768, isMobile: false },
  { name: 'Desktop Full HD (1440+)', width: 1440, height: 900, isMobile: false },
];

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
  await sendCommand('Emulation.setFocusSurrogate', { focus: true });

  console.log('Testing responsive layouts across all requested viewports...');

  const results = [];

  for (const vp of VIEWPORTS) {
    await sendCommand('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2,
      mobile: vp.isMobile,
      fitWindow: false,
    });

    // Test /learner/home
    await sendCommand('Page.navigate', { url: `http://localhost:${SERVER_PORT}/learner/home` });
    await sleep(2500);

    const homeLayout = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const bodyWidth = document.body.offsetWidth;
          const scrollWidth = document.documentElement.scrollWidth;
          const rootEl = document.getElementById('root');
          const hasOverflow = scrollWidth > window.innerWidth;
          const navItems = Array.from(document.querySelectorAll('div[role="button"], button, a')).map(el => el.innerText).filter(Boolean);
          return {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            scrollWidth,
            hasOverflow,
            navItemsCount: navItems.length,
          };
        })()
      `,
      returnByValue: true
    });

    // Test /learner/activities/topic-3-1
    await sendCommand('Page.navigate', { url: `http://localhost:${SERVER_PORT}/learner/activities/topic-3-1` });
    await sleep(2500);

    const activityLayout = await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const canvas = document.querySelector('[data-testid="writing-canvas"]');
          const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
          const scrollWidth = document.documentElement.scrollWidth;
          const hasOverflow = scrollWidth > window.innerWidth;
          return {
            scrollWidth,
            hasOverflow,
            hasCanvas: Boolean(canvas),
            canvasWidth: canvasRect ? Math.round(canvasRect.width) : null,
            canvasHeight: canvasRect ? Math.round(canvasRect.height) : null,
          };
        })()
      `,
      returnByValue: true
    });

    const homeData = homeLayout.result?.result?.value;
    const actData = activityLayout.result?.result?.value;

    const pass = !homeData.hasOverflow && !actData.hasOverflow && actData.hasCanvas;
    results.push({
      viewport: `${vp.width}x${vp.height} (${vp.name})`,
      homeOverflow: homeData.hasOverflow,
      activityOverflow: actData.hasOverflow,
      canvasRendered: actData.hasCanvas,
      canvasDimensions: `${actData.canvasWidth}x${actData.canvasHeight}`,
      pass,
    });
  }

  console.table(results);

  const allPass = results.every(r => r.pass);
  ws.close();
  cleanup();

  if (allPass) {
    console.log('\nAll 7 viewports passed responsive validation with 0 layout overflows!');
    process.exit(0);
  } else {
    console.error('\nSome viewports failed responsive validation!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  cleanup();
  process.exit(1);
});
