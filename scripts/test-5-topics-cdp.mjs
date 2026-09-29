// test-5-topics-cdp.mjs
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9337;

console.log('Launching headless Chrome for 5-topic acceptance test...');
const chromeProcess = spawn(CHROME_PATH, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--user-data-dir=C:\\Users\\jomsa\\AppData\\Local\\Temp\\chrome-debug-baya-5topics',
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
      consoleMessages.push({ type: msg.params.type, text, time: Date.now() });
      const lower = text.toLowerCase();
      if (lower.includes('baya') || lower.includes('vfs') || lower.includes('progress') || lower.includes('error')) {
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

  console.log('\nStep 1: Navigating to http://localhost:8081/learner/activities/topic-1-1 ...');
  await sendCommand('Page.navigate', { url: 'http://localhost:8081/learner/activities/topic-1-1' });
  await sleep(6000);

  for (let topicNum = 1; topicNum <= 5; topicNum++) {
    const expectedTopic = `topic-1-${topicNum}`;
    console.log(`\n========================================`);
    console.log(`Step ${topicNum + 1}: Completing ${expectedTopic}...`);
    console.log(`========================================`);

    const currentUrlRes = await sendCommand('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    console.log('Current URL before click:', currentUrlRes.result?.result?.value);

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
    await sleep(3000);

    const postUrlRes = await sendCommand('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    console.log('Current URL after click:', postUrlRes.result?.result?.value);
  }

  // Now reload page and verify persistence
  console.log('\n========================================');
  console.log('Step 7: Refreshing page to verify persistence...');
  console.log('========================================');
  await sendCommand('Page.navigate', { url: 'http://localhost:8081/learner/home' });
  await sleep(6000);

  const homeData = await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const texts = Array.from(document.querySelectorAll('div, span, p')).map(e => e.innerText).filter(Boolean);
        return {
          hasDailyGoal: texts.some(t => t.includes('1 of 1') || t.includes('1 / 1') || t.includes('Goal') || t.includes('Daily')),
          sampleTexts: texts.slice(0, 30)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Home page state after reload:');
  console.log(JSON.stringify(homeData.result?.result?.value, null, 2));

  // Check for any VFS errors across all console messages
  const vfsErrors = consoleMessages.filter(m => m.text.includes('Invalid VFS state') || m.text.includes('VFS'));
  console.log(`\nTotal VFS errors captured: ${vfsErrors.length}`);
  if (vfsErrors.length > 0) {
    console.error('VFS ERRORS FOUND:', vfsErrors);
  } else {
    console.log('SUCCESS: ZERO Invalid VFS state errors across all 5 topics and reload!');
  }

  ws.close();
  chromeProcess.kill();
  process.exit(vfsErrors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test error:', err);
  try { chromeProcess.kill(); } catch {}
  process.exit(1);
});
