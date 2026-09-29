// test-env-cdp.mjs
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;

console.log('Launching headless Chrome...');
const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-baya',
  'about:blank'
], { stdio: 'ignore' });

process.on('exit', () => {
  try { chromeProcess.kill(); } catch {}
});

async function main() {
  await sleep(2000);

  const versionRes = await fetch(`http://127.0.0.1:${PORT}/json/version`);
  const versionData = await versionRes.json();
  console.log('Chrome Browser:', versionData.Browser);

  const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  console.log('Target WS URL:', pageTarget.webSocketDebuggerUrl);

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
      consoleMessages.push(`[${msg.params.type}] ${text}`);
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

  async function testUrl(testUrlStr) {
    console.log(`\n========================================`);
    console.log(`Testing URL: ${testUrlStr}`);
    console.log(`========================================`);
    consoleMessages.length = 0;

    await sendCommand('Page.navigate', { url: testUrlStr });
    await sleep(4000);

    const evalRes = await sendCommand('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          origin: window.location.origin,
          isSecureContext: window.isSecureContext,
          crossOriginIsolated: window.crossOriginIsolated,
          hasNavigatorStorage: typeof navigator.storage !== 'undefined',
          hasGetDirectory: typeof navigator.storage?.getDirectory === 'function',
          storagePrototype: Object.getOwnPropertyNames(Object.getPrototypeOf(navigator.storage || {})),
          hasSyncAccessHandleInWorker: typeof FileSystemFileHandle !== 'undefined' && 'createSyncAccessHandle' in FileSystemFileHandle.prototype,
        }, null, 2)
      `,
      returnByValue: true
    });

    console.log('Evaluated Capabilities:\n', evalRes.result?.result?.value);
    console.log('\nCaptured Browser Console Logs:');
    consoleMessages.forEach(msg => console.log('  ', msg));
  }

  await testUrl('http://localhost:8081');
  await testUrl('http://192.168.68.104:8081');

  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Test error:', err);
  try { chromeProcess.kill(); } catch {}
  process.exit(1);
});
