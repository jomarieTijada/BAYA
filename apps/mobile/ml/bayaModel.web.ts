import { BayaModelError } from './BayaModelError';
import { validateBayaProbabilities } from './bayaProbabilities';
import { BAYA_MODEL_CONFIG, BAYA_RECOGNITION_MODEL_NAME, BAYA_RECOGNITION_MODEL_VERSION, BAYA_RECOGNITION_MODEL_URL } from './bayaModelConfig';

const MODEL_URL = BAYA_RECOGNITION_MODEL_URL;
const ORT_SCRIPT_URL = '/ort/ort-wasm-runtime.min.js';
const WASM_BASE_URL = '/ort/';
const IMAGE_SHAPE = BAYA_MODEL_CONFIG.logicalInputs[0].shape;
const OUTPUT_SHAPE = BAYA_MODEL_CONFIG.output.shape;
const OUTPUT_UNITS = BAYA_MODEL_CONFIG.classCount;
const INPUT_NAMES = { image: BAYA_MODEL_CONFIG.logicalInputs[0].name };
const OUTPUT_NAME = BAYA_MODEL_CONFIG.output.name;

type OrtTensor = {
  type: string;
  data: Float32Array;
  dims: readonly number[];
  dispose(): void;
};
type OrtMetadata = {
  isTensor: boolean;
  type?: string;
  shape?: readonly (number | string)[];
};
type BayaSession = {
  inputNames: string[];
  outputNames: string[];
  inputMetadata: OrtMetadata[];
  outputMetadata: OrtMetadata[];
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
  release(): Promise<void>;
};
type OrtRuntime = {
  env: {
    versions: { web?: string };
    wasm: { wasmPaths?: string | Record<string, string>; numThreads?: number };
  };
  Tensor: new (type: string, data: Float32Array, dims: number[]) => OrtTensor;
  InferenceSession: { create(model: string, options: { executionProviders: string[] }): Promise<BayaSession> };
};

declare global {
  interface Window {
    ort?: OrtRuntime;
  }
}

type LoadedModel = {
  runtime: OrtRuntime;
  session: BayaSession;
  inputNames: readonly string[];
  outputNames: readonly string[];
};

export type BayaSmokeResult = {
  modelUrl: string;
  runtimeVersion: string;
  executionProvider: 'wasm';
  inputNames: string[];
  outputNames: string[];
  outputShape: number[];
  probabilitySum: number;
  allFinite: boolean;
  repeatedInferenceCount: number;
  sameSessionReused: boolean;
  sessionCreations: number;
};

export type BayaBenchmarkResult = {
  modelUrl: string;
  runtimeVersion: string;
  executionProvider: 'wasm';
  warmupRuns: number;
  timedRuns: number;
  meanMs: number;
  medianMs: number;
  standardDeviationMs: number;
  p95Ms: number;
  p99Ms: number;
  sameSessionReused: boolean;
  sessionCreations: number;
};

let ortRuntimePromise: Promise<OrtRuntime> | null = null;
let loadedModelPromise: Promise<LoadedModel> | null = null;
let preloadPromise: Promise<void> | null = null;
let smokePromise: Promise<BayaSmokeResult> | null = null;
let sessionCreationCount = 0;

function getOrtRuntime(): Promise<OrtRuntime> {
  if (ortRuntimePromise) return ortRuntimePromise;

  ortRuntimePromise = new Promise<OrtRuntime>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new BayaModelError('UNSUPPORTED_PLATFORM', 'The BAYA ONNX model requires a browser runtime.'));
      return;
    }

    const script = document.createElement('script');
    script.src = ORT_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      const runtime = window.ort;
      // The classic script exposes a temporary global; keep the runtime private to this module.
      try { delete window.ort; } catch { window.ort = undefined; }
      if (!runtime?.InferenceSession || !runtime.Tensor) {
        reject(new BayaModelError('MODEL_LOAD_FAILED', `ONNX Runtime did not initialize from ${ORT_SCRIPT_URL}.`));
        return;
      }
      resolve(runtime);
    };
    script.onerror = () => reject(new BayaModelError('MODEL_LOAD_FAILED', `Could not load ONNX Runtime from ${ORT_SCRIPT_URL}.`));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    ortRuntimePromise = null;
    throw error;
  });

  return ortRuntimePromise;
}

function describeMetadata(names: readonly string[], metadata: readonly OrtMetadata[]): string[] {
  return names.map((name, index) => {
    const value = metadata[index];
    if (!value) return `${name} (metadata unavailable)`;
    if (!value.isTensor) return `${name} (non-tensor)`;
    return `${name} ${JSON.stringify(value.shape)} ${value.type}`;
  });
}

function shapeMatches(actual: readonly (number | string)[] | undefined, expected: readonly number[]): boolean {
  if (!actual || actual.length === 0) return false;
  return actual.length === expected.length
    && expected.every((dimension, index) => actual[index] === dimension);
}

function tensorMetadataMatches(metadata: OrtMetadata | undefined, expectedShape: readonly number[]): boolean {
  if (!metadata?.isTensor || metadata.type !== 'float32') return false;
  return shapeMatches(metadata.shape, expectedShape);
}

function validateSession(session: BayaSession, runtime: OrtRuntime): LoadedModel {
  const expectedInputNames = [INPUT_NAMES.image];
  const inputNameSet = new Set(session.inputNames);
  const namesMatch = session.inputNames.length === expectedInputNames.length
    && expectedInputNames.every((name) => inputNameSet.has(name));
  const outputsMatch = session.outputNames.length === 1 && session.outputNames[0] === OUTPUT_NAME;

  const metadataByName = new Map(session.inputNames.map((name, index) => [name, session.inputMetadata[index]]));
  const shapesMatch = tensorMetadataMatches(metadataByName.get(INPUT_NAMES.image), IMAGE_SHAPE)
    && tensorMetadataMatches(session.outputMetadata[0], OUTPUT_SHAPE);

  if (!namesMatch || !outputsMatch || !shapesMatch) {
    throw new BayaModelError(
      'MODEL_CONTRACT_INVALID',
      `Expected float32 image (${IMAGE_SHAPE}) input `
        + `and output ${OUTPUT_SHAPE} named ${OUTPUT_NAME}. `
        + `Received inputs: ${describeMetadata(session.inputNames, session.inputMetadata).join('; ')}. `
        + `Outputs: ${describeMetadata(session.outputNames, session.outputMetadata).join('; ')}.`,
    );
  }

  return { runtime, session, inputNames: session.inputNames, outputNames: session.outputNames };
}

async function createAndValidateModel(): Promise<LoadedModel> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    throw new BayaModelError('UNSUPPORTED_PLATFORM', 'The BAYA ONNX model requires a browser runtime.');
  }

  const runtime = await getOrtRuntime();
  const pageUrl = typeof window.location?.href === 'string' ? window.location.href : 'http://localhost/';
  runtime.env.wasm.wasmPaths = {
    mjs: new URL(`${WASM_BASE_URL}ort-wasm-simd-threaded.mjs`, pageUrl).toString(),
    wasm: new URL(`${WASM_BASE_URL}ort-wasm-simd-threaded.wasm`, pageUrl).toString(),
  };
  runtime.env.wasm.numThreads = 1;

  let session: BayaSession;
  try {
    session = await runtime.InferenceSession.create(MODEL_URL, { executionProviders: ['wasm'] });
    sessionCreationCount += 1;
  } catch (cause) {
    throw new BayaModelError('MODEL_LOAD_FAILED', `Could not load ONNX model ${MODEL_URL} with WASM.`, cause);
  }

  try {
    const loaded = validateSession(session, runtime);
    if (__DEV__) {
      console.info('[BAYA ML] ONNX Runtime Web:', runtime.env.versions.web, 'Execution provider: wasm');
      console.info('[BAYA ML] Model:', { modelName: BAYA_RECOGNITION_MODEL_NAME, modelVersion: BAYA_RECOGNITION_MODEL_VERSION, modelUrl: MODEL_URL });
      console.info('[BAYA ML] Session inputs:', describeMetadata(session.inputNames, session.inputMetadata).join('; '));
      console.info('[BAYA ML] Session outputs:', describeMetadata(session.outputNames, session.outputMetadata).join('; '));
      console.info('[BAYA ML] Logical inputs:', INPUT_NAMES.image);
    }
    return loaded;
  } catch (error) {
    await session.release();
    throw error;
  }
}

function getLoadedModel(): Promise<LoadedModel> {
  if (__DEV__) console.info('[BAYA Recognition] ONNX session', { sessionCached: loadedModelPromise !== null, modelUrl: MODEL_URL, wasmPath: `${WASM_BASE_URL}ort-wasm-simd-threaded.wasm` });
  if (!loadedModelPromise) {
    loadedModelPromise = createAndValidateModel().catch((error: unknown) => {
      loadedModelPromise = null;
      throw error;
    });
  }
  return loadedModelPromise;
}

/** Lazily initialize the private web session without exposing ONNX Runtime. */
export async function getBayaModel(): Promise<void> {
  await getLoadedModel();
}

/** Preload the shared session and warm it once, independently of drawing attempts. */
export function preloadBayaModel(): Promise<void> {
  if (!preloadPromise) {
    preloadPromise = getBayaModel()
      .then(() => runBayaInference(new Float32Array(IMAGE_SHAPE.reduce((a, b) => a * b, 1))))
      .then(() => undefined)
      .catch((error: unknown) => { preloadPromise = null; throw error; });
  }
  return preloadPromise;
}

function validateInput(data: Float32Array, expectedLength: number, label: string): void {
  if (!(data instanceof Float32Array) || data.length !== expectedLength) {
    throw new BayaModelError('INVALID_INPUT', `${label} must be a Float32Array with ${expectedLength} values; received ${data?.length ?? 'no data'}.`);
  }
  for (let index = 0; index < data.length; index += 1) {
    if (!Number.isFinite(data[index]) || data[index] < 0 || data[index] > 1) {
      throw new BayaModelError('INVALID_INPUT', `${label} contains an invalid ink value at index ${index}.`);
    }
  }
}

function validateProbabilities(values: Float32Array, shape: readonly number[]): void {
  if (!Array.isArray(shape) || shape.length !== OUTPUT_SHAPE.length || shape.some((dimension, index) => dimension !== OUTPUT_SHAPE[index])
    || values.length !== OUTPUT_UNITS) {
    throw new Error(`Expected output ${OUTPUT_SHAPE}; received ${JSON.stringify(shape)} with ${values.length} values.`);
  }
  validateBayaProbabilities(values);
}

export async function runBayaInference(imageData: Float32Array): Promise<Float32Array> {
  validateInput(imageData, IMAGE_SHAPE.reduce((a, b) => a * b, 1), 'imageData');

  const { runtime, session } = await getLoadedModel();
  const image = new runtime.Tensor('float32', imageData, [...IMAGE_SHAPE]);
  let outputs: Record<string, OrtTensor> = {};

  try {
    outputs = await session.run({
      [INPUT_NAMES.image]: image,
    });
    const output = outputs?.[OUTPUT_NAME];
    if (!output) throw new Error(`ONNX Runtime did not return the expected output ${OUTPUT_NAME}.`);
    const values = output.data;
    if (!(values instanceof Float32Array)) throw new Error(`Expected float32 output data; received ${output.type}.`);
    validateProbabilities(values, output.dims);
    return new Float32Array(values);
  } catch (cause) {
    if (cause instanceof BayaModelError) throw cause;
    throw new BayaModelError('INFERENCE_FAILED', 'BAYA ONNX inference failed validation or execution.', cause);
  } finally {
    image.dispose();
    if (outputs && typeof outputs === 'object') {
      Object.values(outputs).forEach((output) => {
        if (output && typeof output.dispose === 'function') output.dispose();
      });
    }
  }
}

async function runSmoke(): Promise<BayaSmokeResult> {
  const creationsBefore = sessionCreationCount;
  const image = new Float32Array(96 * 96);
  const [firstLoad, concurrentLoad] = await Promise.all([getLoadedModel(), getLoadedModel()]);
  const sessionBefore = firstLoad.session;
  if (sessionBefore !== concurrentLoad.session) {
    throw new BayaModelError('MODEL_LOAD_FAILED', 'Concurrent BAYA loads did not share one ONNX session.');
  }

  let finalOutput: Float32Array<ArrayBufferLike> = new Float32Array(OUTPUT_UNITS);
  let probabilitySum = 0;
  const repeatedInferenceCount = 3;
  for (let run = 0; run < repeatedInferenceCount; run += 1) {
    finalOutput = await runBayaInference(image);
    probabilitySum = finalOutput.reduce((sum, value) => sum + value, 0);
  }
  const sameSessionReused = (await getLoadedModel()).session === sessionBefore;
  const result: BayaSmokeResult = {
    modelUrl: MODEL_URL,
    runtimeVersion: firstLoad.runtime.env.versions.web ?? 'unknown',
    executionProvider: 'wasm',
    inputNames: [...sessionBefore.inputNames],
    outputNames: [...sessionBefore.outputNames],
    outputShape: [1, finalOutput.length],
    probabilitySum,
    allFinite: Array.from(finalOutput).every(Number.isFinite),
    repeatedInferenceCount,
    sameSessionReused,
    sessionCreations: sessionCreationCount - creationsBefore,
  };
  console.info('[BAYA ML] Browser smoke inference passed:', JSON.stringify(result));
  return result;
}

export function runBayaSmokeTest(): Promise<BayaSmokeResult> {
  if (!__DEV__) {
    return Promise.reject(new BayaModelError('INFERENCE_FAILED', 'The BAYA smoke test is development-only.'));
  }
  if (!smokePromise) {
    smokePromise = runSmoke().finally(() => { smokePromise = null; });
  }
  return smokePromise;
}

/** Development-only browser benchmark of the cached inference service. */
export async function runBayaBenchmark(): Promise<BayaBenchmarkResult> {
  if (!__DEV__) throw new BayaModelError('INFERENCE_FAILED', 'The BAYA benchmark is development-only.');
  const creationsBefore = sessionCreationCount;
  const loaded = await getLoadedModel();
  const image = new Float32Array(96 * 96);
  const warmupRuns = 5;
  const timedRuns = 40;
  for (let index = 0; index < warmupRuns; index += 1) await runBayaInference(image);
  const times: number[] = [];
  for (let index = 0; index < timedRuns; index += 1) {
    const start = performance.now();
    await runBayaInference(image);
    times.push(performance.now() - start);
  }
  const sorted = [...times].sort((left, right) => left - right);
  const percentile = (fraction: number) => {
    const position = (sorted.length - 1) * fraction;
    const lower = Math.floor(position);
    return sorted[lower] + (sorted[Math.ceil(position)] - sorted[lower]) * (position - lower);
  };
  const meanMs = times.reduce((sum, value) => sum + value, 0) / times.length;
  const result: BayaBenchmarkResult = {
    modelUrl: MODEL_URL,
    runtimeVersion: loaded.runtime.env.versions.web ?? 'unknown',
    executionProvider: 'wasm',
    warmupRuns,
    timedRuns,
    meanMs,
    medianMs: percentile(0.5),
    standardDeviationMs: Math.sqrt(times.reduce((sum, value) => sum + (value - meanMs) ** 2, 0) / times.length),
    p95Ms: percentile(0.95),
    p99Ms: percentile(0.99),
    sameSessionReused: (await getLoadedModel()).session === loaded.session,
    sessionCreations: sessionCreationCount - creationsBefore,
  };
  console.info('[BAYA ML] Browser benchmark:', JSON.stringify(result));
  return result;
}
