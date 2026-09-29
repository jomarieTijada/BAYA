import { BayaModelError } from './BayaModelError';
import { BAYA_RECOGNITION_MODEL_URL } from './bayaModelConfig';

const MODEL_URL = BAYA_RECOGNITION_MODEL_URL;
const ORT_SCRIPT_URL = '/ort/ort-wasm-runtime.min.js';
const WASM_BASE_URL = '/ort/';
const IMAGE_SHAPE = [1, 96, 96, 1] as const;
const SEQUENCE_SHAPE = [1, 512, 6] as const;
const STATIC_SHAPE = [1, 1, 1, 3] as const;
const OUTPUT_SHAPE = [1, 63] as const;
const OUTPUT_UNITS = 63;
const PROBABILITY_SUM_TOLERANCE = 1e-3;

const INPUT_NAMES = {
  image: 'image_input',
  sequence: 'sequence_input',
  normalizationMean: 'BAYA_EfficientNetB0_BiLSTM_1/efficientnetb0_1/normalization_1/Sub/y:0',
  normalizationVariance: 'BAYA_EfficientNetB0_BiLSTM_1/efficientnetb0_1/normalization_1/Sqrt/x:0',
} as const;
const OUTPUT_NAME = 'Identity:0';

const NORMALIZATION_MEAN = [
  0.48500001430511475,
  0.4560000002384186,
  0.4059999883174896,
] as const;
const NORMALIZATION_VARIANCE = [
  0.2290000021457672,
  0.2240000069141388,
  0.22499999403953552,
] as const;

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
  logicalInputNames: [string, string];
  staticInputNames: [string, string];
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
  if (!actual || actual.length === 0) return true;
  return actual.length === expected.length
    && expected.every((dimension, index) => actual[index] === dimension);
}

function tensorMetadataMatches(metadata: OrtMetadata | undefined, expectedShape: readonly number[]): boolean {
  if (!metadata?.isTensor || metadata.type !== 'float32') return false;
  return shapeMatches(metadata.shape, expectedShape);
}

function validateSession(session: BayaSession, runtime: OrtRuntime): LoadedModel {
  const expectedInputNames = Object.values(INPUT_NAMES);
  const inputNameSet = new Set(session.inputNames);
  const namesMatch = session.inputNames.length === expectedInputNames.length
    && expectedInputNames.every((name) => inputNameSet.has(name));
  const outputsMatch = session.outputNames.length === 1 && session.outputNames[0] === OUTPUT_NAME;

  const metadataByName = new Map(session.inputNames.map((name, index) => [name, session.inputMetadata[index]]));
  const shapesMatch = tensorMetadataMatches(metadataByName.get(INPUT_NAMES.image), IMAGE_SHAPE)
    && tensorMetadataMatches(metadataByName.get(INPUT_NAMES.sequence), SEQUENCE_SHAPE)
    && tensorMetadataMatches(metadataByName.get(INPUT_NAMES.normalizationMean), STATIC_SHAPE)
    && tensorMetadataMatches(metadataByName.get(INPUT_NAMES.normalizationVariance), STATIC_SHAPE)
    && tensorMetadataMatches(session.outputMetadata[0], OUTPUT_SHAPE);

  if (!namesMatch || !outputsMatch || !shapesMatch) {
    throw new BayaModelError(
      'MODEL_CONTRACT_INVALID',
      `Expected four float32 inputs (${IMAGE_SHAPE}, ${SEQUENCE_SHAPE}, ${STATIC_SHAPE}, ${STATIC_SHAPE}) `
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
      console.info('[BAYA ML] Model URL:', MODEL_URL);
      console.info('[BAYA ML] Session inputs:', describeMetadata(session.inputNames, session.inputMetadata).join('; '));
      console.info('[BAYA ML] Session outputs:', describeMetadata(session.outputNames, session.outputMetadata).join('; '));
      console.info('[BAYA ML] Logical inputs:', INPUT_NAMES.image, INPUT_NAMES.sequence);
      console.info('[BAYA ML] Static normalization inputs:', INPUT_NAMES.normalizationMean, INPUT_NAMES.normalizationVariance);
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

function validateInput(data: Float32Array, expectedLength: number, label: string): void {
  if (!(data instanceof Float32Array) || data.length !== expectedLength) {
    throw new BayaModelError('INVALID_INPUT', `${label} must be a Float32Array with ${expectedLength} values; received ${data?.length ?? 'no data'}.`);
  }
  for (let index = 0; index < data.length; index += 1) {
    if (!Number.isFinite(data[index])) {
      throw new BayaModelError('INVALID_INPUT', `${label} contains a non-finite value at index ${index}.`);
    }
  }
}

function validateProbabilities(values: Float32Array, shape: readonly number[]): number {
  if (shape.length !== OUTPUT_SHAPE.length || shape.some((dimension, index) => dimension !== OUTPUT_SHAPE[index])
    || values.length !== OUTPUT_UNITS) {
    throw new Error(`Expected output ${OUTPUT_SHAPE}; received ${JSON.stringify(shape)} with ${values.length} values.`);
  }
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!Number.isFinite(value) || value < -1e-6 || value > 1 + 1e-6) {
      throw new Error(`Output contains an invalid probability at index ${index}: ${value}.`);
    }
    sum += value;
  }
  if (Math.abs(sum - 1) > PROBABILITY_SUM_TOLERANCE) {
    throw new Error(`Expected a probability sum near 1; received ${sum}.`);
  }
  return sum;
}

export async function runBayaInference(imageData: Float32Array, sequenceData: Float32Array): Promise<Float32Array> {
  validateInput(imageData, 96 * 96, 'imageData');
  validateInput(sequenceData, 512 * 6, 'sequenceData');

  const { runtime, session } = await getLoadedModel();
  const image = new runtime.Tensor('float32', imageData, [...IMAGE_SHAPE]);
  const sequence = new runtime.Tensor('float32', sequenceData, [...SEQUENCE_SHAPE]);
  const mean = new runtime.Tensor('float32', new Float32Array(NORMALIZATION_MEAN), [...STATIC_SHAPE]);
  const variance = new runtime.Tensor('float32', new Float32Array(NORMALIZATION_VARIANCE), [...STATIC_SHAPE]);
  let outputs: Record<string, OrtTensor> = {};

  try {
    outputs = await session.run({
      [INPUT_NAMES.image]: image,
      [INPUT_NAMES.sequence]: sequence,
      [INPUT_NAMES.normalizationMean]: mean,
      [INPUT_NAMES.normalizationVariance]: variance,
    });
    const output = outputs[OUTPUT_NAME];
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
    sequence.dispose();
    mean.dispose();
    variance.dispose();
    Object.values(outputs).forEach((output) => output.dispose());
  }
}

async function runSmoke(): Promise<BayaSmokeResult> {
  const creationsBefore = sessionCreationCount;
  const image = new Float32Array(96 * 96);
  const sequence = new Float32Array(512 * 6);
  const [firstLoad, concurrentLoad] = await Promise.all([getLoadedModel(), getLoadedModel()]);
  const sessionBefore = firstLoad.session;
  if (sessionBefore !== concurrentLoad.session) {
    throw new BayaModelError('MODEL_LOAD_FAILED', 'Concurrent BAYA loads did not share one ONNX session.');
  }

  let finalOutput: Float32Array<ArrayBufferLike> = new Float32Array(OUTPUT_UNITS);
  let probabilitySum = 0;
  const repeatedInferenceCount = 3;
  for (let run = 0; run < repeatedInferenceCount; run += 1) {
    finalOutput = await runBayaInference(image, sequence);
    probabilitySum = finalOutput.reduce((sum, value) => sum + value, 0);
  }
  const sameSessionReused = (await getLoadedModel()).session === sessionBefore;
  const result: BayaSmokeResult = {
    modelUrl: MODEL_URL,
    runtimeVersion: firstLoad.runtime.env.versions.web ?? 'unknown',
    executionProvider: 'wasm',
    inputNames: [...sessionBefore.inputNames],
    outputNames: [...sessionBefore.outputNames],
    logicalInputNames: [INPUT_NAMES.image, INPUT_NAMES.sequence],
    staticInputNames: [INPUT_NAMES.normalizationMean, INPUT_NAMES.normalizationVariance],
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
  const sequence = new Float32Array(512 * 6);
  const warmupRuns = 5;
  const timedRuns = 40;
  for (let index = 0; index < warmupRuns; index += 1) await runBayaInference(image, sequence);
  const times: number[] = [];
  for (let index = 0; index < timedRuns; index += 1) {
    const start = performance.now();
    await runBayaInference(image, sequence);
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
