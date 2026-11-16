import * as liteRtRuntime from '@litertjs/core';
import type { CompiledModel, Tensor, TensorDetails } from '@litertjs/core';
import { BayaModelError } from './BayaModelError';
import { BAYA_MODEL_CONFIG as config } from './bayaModelConfig';
import { decodeSpatialHeads, type SpatialHeads, type SpatialRecognition } from './bayaOutputs';

type Runtime = typeof import('@litertjs/core');
type LoadedModel = { runtime: Runtime; model: CompiledModel; backend: 'webgpu' | 'wasm'; runtimeInitializationMs: number; fallbackReason?: string };
let runtimePromise: Promise<Runtime> | null = null;
let modelPromise: Promise<LoadedModel> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let creations = 0;
let runtimeInitializationMs = 0;

function exclusive<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(operation);
  queue = result.catch(() => undefined);
  return result;
}
function runtime(): Promise<Runtime> {
  if (!runtimePromise) runtimePromise = (async () => {
    if (typeof window === 'undefined') throw new BayaModelError('UNSUPPORTED_PLATFORM', 'BAYA recognition requires a browser.');
    const rt = liteRtRuntime;
    const started = performance.now();
    await rt.loadLiteRt(config.runtimeBaseUrl);
    runtimeInitializationMs = performance.now() - started;
    return rt;
  })().catch(cause => { runtimePromise = null; throw new BayaModelError('MODEL_LOAD_FAILED', 'Could not initialize the local LiteRT runtime. Reconnect and retry.', cause); });
  return runtimePromise;
}

export function validateModelMetadata(model: Pick<CompiledModel, 'getInputDetails' | 'getOutputDetails'>): void {
  const matches = (actual: TensorDetails, expected: { name: string; dtype: string; shape: number[] }) =>
    actual.name === expected.name && actual.dtype === expected.dtype
    && Array.from(actual.shape).join(',') === expected.shape.join(',');
  const inputs = model.getInputDetails(), outputs = model.getOutputDetails();
  if (inputs.length !== 1 || !matches(inputs[0], config.logicalInputs[0]) || outputs.length !== 5
    || !config.outputs.every(expected => outputs.some(actual => matches(actual, expected)))) {
    throw new BayaModelError('MODEL_CONTRACT_INVALID', 'LiteRT input/output metadata differs from the verified ResNet18 contract.');
  }
}
async function compile(rt: Runtime, backend: 'webgpu' | 'wasm'): Promise<LoadedModel> {
  // Fetch integrity also validates a service-worker response, including stale/corrupt cached bytes.
  // Pass the downloaded buffer directly; do not retain an additional model-byte cache.
  const response = await fetch(config.modelUrl, { integrity: config.modelIntegrity });
  if (!response.ok) throw new Error(`Model download failed (${response.status}).`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const model = await rt.loadAndCompile(bytes, { accelerator: backend, gpuOptions: { precision: 'fp32' } });
  try { validateModelMetadata(model); } catch (error) { model.delete(); throw error; }
  creations++;
  return { runtime: rt, model, backend: model.isFullyAccelerated ? backend : 'wasm', runtimeInitializationMs };
}
function load(): Promise<LoadedModel> {
  if (!modelPromise) modelPromise = (async () => {
    const rt = await runtime();
    if (rt.isWebGPUSupported()) {
      try { return await compile(rt, 'webgpu'); }
      catch (error) {
        if (error instanceof BayaModelError) throw error;
        const loaded = await compile(rt, 'wasm');
        return { ...loaded, fallbackReason: String(error) };
      }
    }
    return compile(rt, 'wasm');
  })().catch(cause => {
    modelPromise = null;
    if (cause instanceof BayaModelError) throw cause;
    throw new BayaModelError('MODEL_LOAD_FAILED', 'Could not load the handwriting model. Reconnect and retry.', cause);
  });
  return modelPromise;
}
export function getBayaModel() { return exclusive(load); }
export function preloadBayaModel(): Promise<void> { return exclusive(async () => { await load(); }); }

async function execute(loaded: LoadedModel, data: Float32Array): Promise<SpatialRecognition> {
  const input = new loaded.runtime.Tensor(data, config.logicalInputs[0].shape);
  let outputs: Tensor[] = [];
  try {
    outputs = await loaded.model.run(input);
    const details = loaded.model.getOutputDetails();
    const heads = {} as SpatialHeads;
    for (const expected of config.outputs) {
      const index = details.findIndex(detail => detail.name === expected.name);
      const tensor = outputs[index];
      if (!tensor || tensor.dtype !== 'float32' || Array.from(tensor.shape).join(',') !== expected.shape.join(',')) {
        throw new BayaModelError('INFERENCE_FAILED', `Invalid runtime tensor for ${expected.head}.`);
      }
      const cpu = await tensor.moveTo('wasm');
      try { heads[expected.head as keyof SpatialHeads] = new Float32Array(cpu.toTypedArray() as Float32Array); }
      finally { if (!cpu.deleted) cpu.delete(); }
    }
    return decodeSpatialHeads(heads);
  } finally {
    input.delete();
    outputs.forEach(tensor => { if (!tensor.deleted) tensor.delete(); });
  }
}
export function runBayaSpatialInference(imageData: Float32Array): Promise<SpatialRecognition> {
  if (!(imageData instanceof Float32Array) || imageData.length !== 3 * 160 * 160 || !imageData.every(Number.isFinite)) {
    return Promise.reject(new BayaModelError('INVALID_INPUT', 'Expected a finite float32 [1,3,160,160] image.'));
  }
  // Snapshot before queuing so a caller cannot mutate a pending input.
  const data = new Float32Array(imageData);
  return exclusive(async () => {
    let loaded = await load();
    try {
      try { return await execute(loaded, data); }
      catch (error) {
        if (loaded.backend !== 'webgpu' || error instanceof BayaModelError) throw error;
        loaded.model.delete(); modelPromise = null;
        loaded = await compile(loaded.runtime, 'wasm');
        loaded.fallbackReason = String(error);
        modelPromise = Promise.resolve(loaded);
        return await execute(loaded, data);
      }
    } catch (cause) {
      if (!loaded.model.deleted) loaded.model.delete();
      modelPromise = null;
      if (cause instanceof BayaModelError) throw cause;
      throw new BayaModelError('INFERENCE_FAILED', 'Handwriting inference failed. Please retry.', cause);
    }
  });
}
export async function runBayaInference(imageData: Float32Array): Promise<Float32Array> {
  return (await runBayaSpatialInference(imageData)).probabilities;
}
/** Shared session survives screen changes; explicit cleanup waits for in-flight work. */
export function disposeBayaModel(): Promise<void> {
  return exclusive(async () => {
    const pending = modelPromise; modelPromise = null;
    if (pending) { const loaded = await pending; loaded.model.delete(); }
  });
}
export async function runBayaSmokeTest() {
  if (!__DEV__) throw new BayaModelError('INFERENCE_FAILED', 'Diagnostics are development-only.');
  const first = await getBayaModel();
  const output = await runBayaSpatialInference(new Float32Array(3 * 160 * 160));
  return { modelUrl: config.modelUrl, runtimeVersion: config.runtimeVersion, executionProvider: first.backend,
    inputs: first.model.getInputDetails(), outputs: first.model.getOutputDetails(),
    probabilitySum: output.probabilities.reduce((a, b) => a + b, 0), sameSessionReused: first === await getBayaModel(), sessionCreations: creations };
}
export async function runBayaBenchmark() {
  if (!__DEV__) throw new BayaModelError('INFERENCE_FAILED', 'Diagnostics are development-only.');
  const input = new Float32Array(3 * 160 * 160), times: number[] = [];
  const start = performance.now(); const loaded = await getBayaModel(); const loadMs = performance.now() - start;
  const first = performance.now(); await runBayaSpatialInference(input); const firstInferenceMs = performance.now() - first;
  for (let i = 0; i < 60; i++) { const t = performance.now(); await runBayaSpatialInference(input); times.push(performance.now() - t); }
  times.sort((a, b) => a - b);
  return { loadMs, firstInferenceMs, medianMs: (times[29] + times[30]) / 2, p95Ms: times[56], p99Ms: times[59], timedRuns: times.length,
    executionProvider: loaded.backend, fallbackReason: loaded.fallbackReason, runtimeVersion: config.runtimeVersion };
}
