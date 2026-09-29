// test-interactive-cdp.mjs
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9334;

console.log('Launching headless Chrome for interactive test...');
const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-baya-interactive',
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
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
      consoleMessages.push(`[${msg.params.type}] ${text}`);
      console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]`, text);
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

  console.log('\nNavigating to http://192.168.68.104:8081/learner/activities/topic-1-1 ...');
  await sendCommand('Page.navigate', { url: 'http://192.168.68.104:8081/learner/activities/topic-1-1' });

  // Wait for the app to hydrate
  await sleep(6000);

  console.log('\nLooking for NEXT button in DOM...');
  const findButtonRes = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
        const nextBtn = buttons.find(b => b.innerText && (b.innerText.includes('Susunod') || b.innerText.includes('Next')));
        if (!nextBtn) {
          return { found: false, allButtons: buttons.map(b => b.innerText || b.getAttribute('aria-label')) };
        }
        return {
          found: true,
          label: nextBtn.innerText,
          ariaLabel: nextBtn.getAttribute('aria-label'),
          rect: nextBtn.getBoundingClientRect()
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Button search result:', JSON.stringify(findButtonRes.result?.result?.value, null, 2));

  if (findButtonRes.result?.result?.value?.found) {
    console.log('\nClicking the NEXT button...');
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const buttons = Array.from(document.querySelectorAll('div[role="button"], button'));
          const nextBtn = buttons.find(b => b.innerText && (b.innerText.includes('Susunod') || b.innerText.includes('Next')));
          if (nextBtn) {
            console.log('[TEST ACTION] Clicking Next button now');
            nextBtn.click();
            return true;
          }
          return false;
        })()
      `
    });

    // Wait to see what happens after click
    await sleep(4000);

    const currentUrlRes = await sendCommand('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    console.log('\nCurrent URL after click:', currentUrlRes.result?.result?.value);
  }

  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Test error:', err);
  try { chromeProcess.kill(); } catch {}
  process.exit(1);
});
