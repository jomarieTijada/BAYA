// test-mem-cdp.mjs
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9335;

const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-baya-mem',
  'about:blank'
], { stdio: 'ignore' });

process.on('exit', () => {
  try { chromeProcess.kill(); } catch {}
});

async function main() {
  await sleep(2000);

  const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
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

  console.log('Navigating to http://192.168.68.104:8081 ...');
  await sendCommand('Page.navigate', { url: 'http://192.168.68.104:8081' });
  await sleep(4000);

  // Test what happens if we import and call expo-sqlite directly on insecure context
  const testRes = await sendCommand('Runtime.evaluate', {
    expression: `
      (async () => {
        try {
          const sqliteModule = await import('expo-sqlite');
          console.log('Got sqliteModule');
          const db = await sqliteModule.openDatabaseAsync(':memory:');
          return { success: true };
        } catch (e) {
          return { error: e.message, stack: e.stack };
        }
      })()
    `,
    awaitPromise: true,
    returnByValue: true
  });

  console.log('Direct expo-sqlite openDatabaseAsync(:memory:) result on LAN IP:');
  console.log(JSON.stringify(testRes.result?.result?.value, null, 2));

  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Test error:', err);
  try { chromeProcess.kill(); } catch {}
  process.exit(1);
});
