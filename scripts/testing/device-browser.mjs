import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

/** Uses a fresh localhost origin; never clears Chrome data or reuses a personal tab. */
export async function openTestBrowser(port, options = {}) {
  const serial = process.env.BAYA_ANDROID_SERIAL;
  const url = `http://127.0.0.1:${port}/`;
  let debug, chrome, forward, profile;
  const adb = (...args) => execFileSync('adb', ['-s', serial, ...args], { encoding: 'utf8', windowsHide: true }).trim();
  if (serial) {
    if (adb('get-state') !== 'device' || adb('shell', 'getprop', 'ro.kernel.qemu') === '1') throw Error('An authorized physical Android device is required.');
    adb('reverse', `tcp:${port}`, `tcp:${port}`);
    adb('shell', 'am', 'start', '-a', 'android.intent.action.VIEW', '-d', url, '-p', 'com.android.chrome');
    await delay(1000);
    forward = adb('forward', 'tcp:0', 'localabstract:chrome_devtools_remote'); debug = forward;
  } else {
    profile = options.profile ?? fs.mkdtempSync(path.join(os.tmpdir(), 'baya-device-qa-'));
    if (options.profile) fs.rmSync(path.join(profile, 'DevToolsActivePort'), { force: true });
    chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
    const file = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; !fs.existsSync(file) && i < 100; i++) await delay(100);
    debug = fs.readFileSync(file, 'utf8').split('\n')[0];
  }
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    const targets = await (await fetch(`http://127.0.0.1:${debug}/json/list`)).json();
    target = targets.find(t => t.type === 'page' && (!serial || t.url.startsWith(url)));
    if (!target) await delay(250);
  }
  if (!target) throw Error('Test tab unavailable; unlock the device and open Chrome.');
  return { target, profile, physical: Boolean(serial), async close() {
    if (serial) {
      await fetch(`http://127.0.0.1:${debug}/json/close/${target.id}`).catch(() => undefined);
      adb('forward', '--remove', `tcp:${forward}`); adb('reverse', '--remove', `tcp:${port}`);
    } else {
      const exited = new Promise(resolve => chrome.once('exit', resolve));
      chrome.kill();
      await exited;
    }
  } };
}
