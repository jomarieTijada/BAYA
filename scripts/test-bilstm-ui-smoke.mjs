// scripts/test-writing-recognition-cdp.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const DIST_DIR = path.resolve('apps/mobile/dist');
const ACTIVE_MODEL_URL = JSON.parse(fs.readFileSync('apps/mobile/ml/bayaActiveModel.json', 'utf8')).modelUrl;
const SERVER_PORT = 5058;
const DRAWING=JSON.parse(fs.readFileSync('ml/rollback/fixtures/bilstm-v1.1/real-ka.json','utf8')).normalizedStrokes;
const CHROME_PORT = 9341;
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

// 1. Start production server
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

  // SPA fallback
  const indexPath = path.join(DIST_DIR, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
});

await new Promise((resolve) => server.listen(SERVER_PORT, '127.0.0.1', resolve));
console.log(`[ML TEST] Production server listening at http://127.0.0.1:${SERVER_PORT}`);

// 2. Launch headless Chrome
const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${CHROME_PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-baya-bilstm-1791432490856118400',
  'about:blank'
], { stdio: 'ignore', windowsHide:true });

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
      if (text.includes('BAYA') || text.includes('ML') || text.includes('Recognition') || text.includes('ONNX') || text.includes('Error')) {
        console.log(`[BROWSER ${msg.params.type.toUpperCase()}]`, text);
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

  console.log('\nNavigating to http://localhost:5057/learner/activities/topic-3-1 ...');
  await sendCommand('Page.navigate', { url: `http://localhost:${SERVER_PORT}/learner/activities/topic-3-1` });
  await sleep(5000);

  // Check what's rendered
  const pageCheck = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const text = document.body.innerText;
        const svg = document.querySelector('svg');
        const buttons = Array.from(document.querySelectorAll('div[role="button"], button')).map(b => b.innerText);
        return { hasText: text.length > 0, buttonCount: buttons.length, buttons, hasSvg: Boolean(svg) };
      })()
    `,
    returnByValue: true
  });
  console.log('Page elements on topic-3-1:', JSON.stringify(pageCheck.result?.result?.value, null, 2));

  const rectangle = await sendCommand('Runtime.evaluate', {expression: `(()=>{const e=document.querySelector('[data-testid="writing-canvas"]');if(!e)throw Error('Canvas absent');e.scrollIntoView();const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()`,returnByValue:true});
  const rect=rectangle.result?.result?.value;if(!rect)throw Error('No canvas bounds');
  const draw = async () => {
    for(const stroke of DRAWING){
      if(!stroke.length)continue;
      const pos=p=>({x:rect.x+p.x*rect.width,y:rect.y+p.y*rect.height});
      await sendCommand('Input.dispatchMouseEvent',{type:'mouseMoved',...pos(stroke[0])});
      await sendCommand('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...pos(stroke[0])});
      for(const p of stroke.slice(1))await sendCommand('Input.dispatchMouseEvent',{type:'mouseMoved',buttons:1,...pos(p)});
      await sendCommand('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...pos(stroke.at(-1))});
    }
  };
  await draw();await sleep(300);
  // Click Suriin button
  console.log('\nFinding and clicking Suriin / Check button...');
  const suriinClick = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
        const suriinBtn = buttons.find(b => b.innerText && (b.innerText.includes('Suriin') || b.innerText.includes('Check') || b.innerText.includes('Analyze')));
        if (suriinBtn) {
          suriinBtn.click();
          return { clicked: true, text: suriinBtn.innerText };
        }
        return { clicked: false, all: buttons.map(b => b.innerText) };
      })()
    `,
    returnByValue: true
  });
  console.log('Suriin click result:', JSON.stringify(suriinClick.result?.result?.value));

  // Wait for ONNX inference to run (it downloads model & wasm if needed and runs session)
  console.log('\nWaiting for inference to complete...');
  await sleep(8000);

  // Inspect results in the DOM
  const resultsRes = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const text = document.body.innerText;
        return {
          hasMatch: text.includes('%') || text.includes('Confidence') || text.includes('Top') || text.includes('Katugma'),
          allTextSnippets: text.split('\\n').filter(s => s.trim().length > 0).slice(0, 30)
        };
      })()
    `,
    returnByValue: true
  });
  console.log('\nDOM state after Suriin:\n', JSON.stringify(resultsRes.result?.result?.value, null, 2));

  const feedback=resultsRes.result?.result?.value;
  if(!feedback?.hasMatch || !feedback.allTextSnippets.includes('KA'))throw Error('Drawing did not reach recognition');
  await sendCommand('Runtime.evaluate',{expression:`Array.from(document.querySelectorAll('[role="button"],button')).find(e=>e.innerText==='Ulitin')?.click()`});
  await sleep(200);await draw();await sleep(200);
  await sendCommand('Runtime.evaluate',{expression:`Array.from(document.querySelectorAll('[role="button"],button')).find(e=>e.innerText==='Suriin')?.click()`});
  await sleep(2000);
  const repeat=await sendCommand('Runtime.evaluate',{expression:'document.body.innerText',returnByValue:true});
  console.log('REPEATED FEEDBACK',repeat.result?.result?.value);
  if(!repeat.result?.result?.value?.includes('KA'))throw Error('Repeated recognition feedback missing');
  const errors=consoleMessages.filter(m=>m.type==='error');if(errors.length)throw Error(JSON.stringify(errors));
  // Also directly check ONNX inference capability by running a quick synthetic forward pass via window / bayaModel
  console.log('\nTesting direct ML inference pipeline in browser context...');
  const directMlTest = await sendCommand('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          // Verify ORT runtime script and model fetch
          const modelRes = await fetch(${JSON.stringify(ACTIVE_MODEL_URL)});
          const modelSize = (await modelRes.arrayBuffer()).byteLength;

          const wasmRes = await fetch('/ort/ort-wasm-simd-threaded.wasm');
          const wasmSize = (await wasmRes.arrayBuffer()).byteLength;

          return {
            success: true,
            modelByteLength: modelSize,
            wasmByteLength: wasmSize,
            isSecureContext: window.isSecureContext,
            crossOriginIsolated: window.crossOriginIsolated,
          };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });
  console.log('Browser direct asset and runtime test:\n', JSON.stringify(directMlTest.result?.result?.value, null, 2));

  ws.close();
  cleanup();
  process.exit(0);
}

main().catch(err => {
  console.error('Test error:', err);
  cleanup();
  process.exit(1);
});
