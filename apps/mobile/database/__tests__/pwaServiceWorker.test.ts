import { readFile } from 'node:fs/promises';
import path from 'node:path';

it('keeps offline resource maintenance isolated from learner records', async () => {
  const worker = await readFile(path.resolve(__dirname, '../../scripts/offline-worker.js'), 'utf8');
  expect(worker).not.toMatch(/deleteDatabase|localStorage.clear|DROP TABLE|DELETE FROM/);
  expect(worker).toContain("name.startsWith('baya-pwa-')");
  expect(worker).not.toContain('skipWaiting()');
});
