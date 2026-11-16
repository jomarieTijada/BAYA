import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

it('routes native LiteRT INFO to info while preserving errors in both shipped variants', () => {
  execFileSync(process.execPath, [path.resolve(__dirname, '../copy-litert-wasm.mjs')]);
  for (const variant of ['litert_wasm_internal.js', 'litert_wasm_compat_internal.js']) {
    const source = readFileSync(path.resolve(__dirname, '../../public/litert/2.6.0', variant), 'utf8');
    const routing = source.split('// BAYA LiteRT severity routing')[1].split('// End BAYA LiteRT severity routing')[0];
    const console = { info: jest.fn(), error: jest.fn() };
    const context = { console, err: undefined as unknown as (message: unknown) => void };
    runInNewContext(routing, context);
    const info = 'INFO: [environment.cc:47] Adding options to the existing LiteRT environment';
    context.err(info);
    expect(console.info).toHaveBeenCalledWith(info);
    expect(console.error).not.toHaveBeenCalled();
    for (const error of ['ERROR: model failed', 'RuntimeError: abort', 'Unknown failure', { message: 'failure' }]) {
      context.err(error);
      expect(console.error).toHaveBeenLastCalledWith(error);
    }
    expect(console.info).toHaveBeenCalledTimes(1);
  }
});
