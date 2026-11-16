import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { openTestBrowser } from './device-browser.mjs';

const port = Number(process.env.BAYA_TEST_PORT || 5055);
const out = process.env.BAYA_STORYBOOK_OUTPUT || 'docs/verification/baya-storybook-introduction/desktop';
fs.mkdirSync(out, { recursive: true });
const browser = await openTestBrowser(port);
const report = { checks: [], screens: [], physical: browser.physical, warnings: [] };
async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise(r => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('close', () => { for (const request of pending.values()) request.reject(Error('Test tab closed')); pending.clear(); });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      const request = pending.get(message.id); pending.delete(message.id);
      message.error ? request.reject(Error(JSON.stringify(message.error))) : request.resolve(message.result);
    }
    if (message.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(message.params.type))
      report.warnings.push(message.params.args.map(a => a.value || a.description).join(' '));
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id; pending.set(key, { resolve, reject }); ws.send(JSON.stringify({ id: key, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  return { ws, send, evaluate };
}
const client = await connect(browser.target.webSocketDebuggerUrl);
const { send, evaluate } = client;
let origin = `http://127.0.0.1:${port}`;
const book = "document.querySelector('[data-testid=origin-storybook]')";
const trigger = "document.querySelector('[data-testid=storybook-settings-trigger]')";
const button = label => `([...document.querySelectorAll('[role=button]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}))`;
const check = (name, value) => { report.checks.push({ name, pass: Boolean(value) }); assert.ok(value, name); };
async function wait(expression, target = evaluate) {
  for (let i = 0; i < 150; i++) { if (await target(`(async()=>Boolean(await (${expression})))()`)) return; await delay(100); }
  throw Error('Timeout: ' + expression);
}
async function nav(route) { await send('Page.navigate', { url: origin + route }); await delay(300); await wait("!!document.querySelector('[role=button],[role=radio]')"); }
async function press(label) { await evaluate(`${button(label)}.click()`); await delay(600); }
async function key(key, modifiers = 0) {
  const vk = { Enter: 13, Escape: 27, Tab: 9 }[key];
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, modifiers, windowsVirtualKeyCode: vk, text: key === 'Enter' ? '\r' : undefined });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, modifiers, windowsVirtualKeyCode: vk });
  await delay(150);
}
async function shot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${out}/${name}.png`, Buffer.from(result.data, 'base64')); report.screens.push(name);
}
async function layout(name) {
  await wait(`${book} && [...${book}.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth)`);
  check(name, await evaluate(`(()=>{const s=document.querySelector('[data-testid=origin-scroll]');return s.scrollWidth<=s.clientWidth+1&&[...${book}.querySelectorAll('[role=button]')].every(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.x>=0&&r.y>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth+1})})()`));
}
const adb = (...args) => execFileSync('adb', ['-s', process.env.BAYA_ANDROID_SERIAL, ...args], { encoding: 'utf8', windowsHide: true }).trim();
let rotation, autoRotation;
async function resize(landscape) {
  if (browser.physical) {
    adb('shell', 'settings', 'put', 'system', 'user_rotation', landscape ? '1' : '0'); await delay(1000);
  } else {
    await send('Emulation.setDeviceMetricsOverride', { width: landscape ? 844 : 390, height: landscape ? 390 : 844, deviceScaleFactor: 1, mobile: false }); await delay(200);
  }
}
let second;
async function run() {
  await send('Page.enable'); await send('Network.enable'); await send('Runtime.enable');
  report.browser = await send('Browser.getVersion');
  if (browser.physical) {
    report.device = { serial: process.env.BAYA_ANDROID_SERIAL, model: adb('shell', 'getprop', 'ro.product.model') };
    rotation = adb('shell', 'settings', 'get', 'system', 'user_rotation');
    autoRotation = adb('shell', 'settings', 'get', 'system', 'accelerometer_rotation');
    adb('shell', 'settings', 'put', 'system', 'accelerometer_rotation', '0');
  }
  await resize(false);
  // Give browser Back an actual same-origin history entry; exiting a fresh tab
  // is controlled by Chrome, outside the page's navigation events.
  if (browser.physical) await nav('/?entry=1');
  await nav('/'); await wait(book); await wait(`${book}.textContent.includes('Meet BAYA!')`);
  check('fresh automatic page one, single dialog', await evaluate(`document.querySelectorAll('[data-testid=origin-storybook]').length===1`));
  await layout('automatic portrait layout'); await shot('automatic-portrait');
  check('focus enters automatic dialog', await evaluate(`${book}.contains(document.activeElement)`));
  if (process.env.BAYA_INTRO_ESCAPE_ONLY) {
    await key('Escape');
    check('Escape dismisses automatic introduction', await evaluate(`!${book}`));
    check('focus returns to learner choice', await evaluate("document.activeElement===document.querySelector('[data-testid=welcome-role-selector] [role=button]')"));
    await nav('/'); await delay(500);
    check('Escape acknowledgement survives a fresh runtime', await evaluate(`!${book}`));
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await shot('returning-desktop');
    await nav('/learner/settings'); await wait(trigger); await shot('settings-desktop');
    await evaluate(`${trigger}.focus()`); await key('Enter'); await wait(book); await shot('settings-desktop-replay');
    for (let i = 0; i < 8; i++) await key('Tab');
    check('keyboard focus remains in replay', await evaluate(`${book}.contains(document.activeElement)`));
    await key('Escape');
    check('Escape restores Settings trigger focus', await evaluate(`document.activeElement===${trigger}`));
    return;
  }
  await press('Next'); await resize(true);
  check('rotation preserves automatic reading page', await evaluate(`document.querySelector('[data-testid=origin-progress]').getAttribute('aria-valuenow')==='40'`));
  await layout('automatic landscape layout'); await shot('automatic-landscape');
  await nav('/'); await wait(book);
  check('reload before acknowledgement offers again', await evaluate(`${book}.textContent.includes('Meet BAYA!')`));

  // A second real tab reads the same database and broadcasts its intentional dismissal.
  if (!browser.physical) {
    const created = await send('Target.createTarget', { url: origin + '/' });
    const debug = new URL(browser.target.webSocketDebuggerUrl).host;
    const targets = await (await fetch(`http://${debug}/json/list`)).json();
    const target = targets.find(t => t.id === created.targetId);
    second = { ...(await connect(target.webSocketDebuggerUrl)), id: created.targetId };
    await wait(book, second.evaluate);
    await second.evaluate(`${button('Close the story')}.click()`);
    await wait(`!${book}`);
    check('another tab acknowledgement closes automatic introduction', true);
    second.ws.close(); await send('Target.closeTarget', { targetId: second.id }); second = null;
  } else {
    // With a real prior history entry, Android Back must close the dialog first.
    adb('shell', 'input', 'keyevent', '4'); await delay(700);
    check('physical Android Back dismisses automatic book', await evaluate(`!${book} && location.pathname==='/'`));
  }
  await nav('/'); await delay(600);
  check('reload suppresses acknowledged introduction', await evaluate(`!${book}`)); await shot('returning-welcome');
  check('welcome has no story replay card', await evaluate("!document.querySelector('[data-testid=mascot-origin-teaser]')"));
  await press('Continue as learner');
  check('learner navigation remains available', await evaluate("location.pathname.startsWith('/learner/')"));
  await nav('/'); await press('Continue as mentor');
  check('mentor navigation remains available', await evaluate("location.pathname.startsWith('/mentor')"));

  for (const language of ['en', 'tl']) {
    const next = language === 'en' ? 'Next' : 'Susunod';
    const close = language === 'en' ? 'Close the story' : 'Isara ang kuwento';
    const finish = language === 'en' ? 'Finish Reading' : 'Tapusin ang Pagbasa';
    for (const role of ['learner', 'mentor']) {
      await resize(true); await nav(`/${role}/settings`); await wait(trigger);
      await evaluate(`document.querySelector('[role=radio][aria-label="${language === 'en' ? 'English' : 'Tagalog'}"]').click()`); await delay(250);
      await evaluate(`${trigger}.scrollIntoView({block:'center'});${trigger}.focus()`); await shot(`${language}-${role}-settings`);
      await key('Enter'); await wait(book);
      check(`${language} ${role} replay starts at page one`, await evaluate(`${book}.textContent.includes(${JSON.stringify(language === 'en' ? 'Meet BAYA!' : 'Kilalanin ang BAYA!')})`));
      for (let p = 1; p <= 5; p++) {
        await layout(`${language} ${role} page ${p}`); await shot(`${language}-${role}-replay-${p}`);
        await press(p === 5 ? finish : next);
      }
      check(`${language} ${role} finish returns to Settings`, await evaluate(`!${book}&&location.pathname==='/${role}/settings'`));
      check(`${language} ${role} focus returns to Settings row`, await evaluate(`document.activeElement===${trigger}`));
      await evaluate(`${trigger}.click()`); await wait(book); await press(close);
      await nav('/'); await delay(250); check(`${language} ${role} replay does not reset acknowledgement`, await evaluate(`!${book}`));
    }
  }
  // A distinct test origin: cache first, choose Tagalog, then first eligible launch offline.
  origin = `http://localhost:${port}`;
  await resize(true); await nav('/learner/settings'); await wait(trigger);
  await evaluate("document.querySelector('[role=radio][aria-label=Tagalog]').click()"); await delay(300);
  await wait("!!navigator.serviceWorker.controller");
  await wait("caches.keys().then(keys=>keys.some(k=>k.startsWith('baya-pwa-')))");
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await nav('/'); await wait(book);
  check('first eligible launch offline uses persisted Tagalog', await evaluate(`${book}.textContent.includes('Kilalanin ang BAYA!')`));
  await shot('offline-first-launch');
  for (let p = 1; p < 5; p++) { await layout('offline page ' + p); await press('Susunod'); }
  await press('Tapusin ang Pagbasa'); await nav('/'); await delay(300);
  check('offline finish persists across reload', await evaluate(`!${book}`));
  await nav('/learner/settings'); await wait(trigger); await evaluate(`${trigger}.click()`); await wait(book);
  check('offline Settings replay starts at one', await evaluate(`${book}.textContent.includes('Kilalanin ang BAYA!')`));
  await layout('offline replay assets'); await shot('offline-settings-replay'); await press('Isara ang kuwento');
}
try { await run(); } catch (error) {
  report.error = String(error); process.exitCode = 1; await shot('failure').catch(() => {});
} finally {
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }).catch(() => {});
  if (second) { second.ws.close(); await send('Target.closeTarget', { targetId: second.id }).catch(() => {}); }
  if (browser.physical) {
    adb('shell', 'settings', 'put', 'system', 'user_rotation', rotation);
    adb('shell', 'settings', 'put', 'system', 'accelerometer_rotation', autoRotation);
  }
  fs.writeFileSync(`${out}/browser-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks.length, screens: report.screens.length, error: report.error }));
  client.ws.close(); await browser.close();
}
