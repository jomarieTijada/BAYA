import { BAYA_MODEL_CONFIG, BAYA_RECOGNITION_MODEL_URL } from '../bayaModelConfig';

type MockTensor = {
  type: string;
  data: Float32Array;
  dims: number[];
  dispose: jest.Mock;
};

type MockSession = {
  inputNames: string[];
  outputNames: string[];
  inputMetadata: { isTensor: true; type: string; shape: number[] }[];
  outputMetadata: { isTensor: true; type: string; shape: number[] }[];
  run: jest.Mock;
  release: jest.Mock;
};

const IMAGE_NAME = 'image_input';
const OUTPUT_NAME = BAYA_MODEL_CONFIG.output.name;

function setup() {
  jest.resetModules();
  const ort = {
    env: { versions: { web: '1.30.0' }, wasm: {} as Record<string, unknown> },
    Tensor: jest.fn(),
    InferenceSession: { create: jest.fn() },
  };
  let tensorCount = 0;
  ort.Tensor.mockImplementation((type: string, data: Float32Array, dims: number[]) => {
    tensorCount += 1;
    return { type, data, dims, dispose: jest.fn(() => { tensorCount -= 1; }) } satisfies MockTensor;
  });
  const session: MockSession = {
    inputNames: [IMAGE_NAME],
    outputNames: [OUTPUT_NAME],
    inputMetadata: [
      { isTensor: true, type: 'float32', shape: [1, 96, 96, 1] },
      ...BAYA_MODEL_CONFIG.staticNormalizationInputs.map(input => ({ isTensor: true as const, type: 'float32', shape: input.shape })),
    ],
    outputMetadata: [{ isTensor: true, type: 'float32', shape: [1, 63] }],
    run: jest.fn(async () => ({
      [OUTPUT_NAME]: {
        type: 'float32',
        dims: [1, 63],
        data: new Float32Array(63).fill(1 / 63),
        dispose: jest.fn(),
      },
    })),
    release: jest.fn(async () => undefined),
  };
  ort.InferenceSession.create.mockResolvedValue(session);
  // @ts-expect-error Minimal browser surface for the web-only service.
  global.window = { location: { href: 'http://localhost:8081/' } };
  window.ort = ort as never;
  const fakeDocument = {
    createElement: jest.fn(() => ({} as HTMLScriptElement)),
    head: {
      appendChild: jest.fn((node: Node) => {
    const script = node as HTMLScriptElement;
    queueMicrotask(() => script.onload?.(new Event('load')));
    return node;
      }),
    },
  };
  Object.defineProperty(global, 'document', { configurable: true, value: fakeDocument });
  global.fetch = jest.fn() as typeof fetch;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const service = require('../bayaModel.web') as typeof import('../bayaModel.web');
  return { ort, session, service, getTensorCount: () => tensorCount };
}

describe('BAYA ONNX web model service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  it('loads lazily, deduplicates concurrent loads, and caches the expected model URL', async () => {
    const { ort, service } = setup();
    expect(ort.InferenceSession.create).not.toHaveBeenCalled();
    await Promise.all([service.getBayaModel(), service.getBayaModel()]);
    await service.getBayaModel();

    expect(ort.InferenceSession.create).toHaveBeenCalledTimes(1);
    expect(ort.InferenceSession.create).toHaveBeenCalledWith(
      BAYA_RECOGNITION_MODEL_URL,
      { executionProviders: ['wasm'] },
    );
  });

  it('supplies only the image tensor for ResNet18', async () => {
    const { ort, session, service, getTensorCount } = setup();
    expect(service.runBayaInference).toHaveLength(1);
    const imageData = new Float32Array(96 * 96);
    const output = await service.runBayaInference(imageData);

    expect(output).toHaveLength(63);
    expect(session.run).toHaveBeenCalledTimes(1);
    const feeds = session.run.mock.calls[0][0] as Record<string, MockTensor>;
    expect(Object.keys(feeds)).toEqual([IMAGE_NAME]);
    expect(feeds[IMAGE_NAME].dims).toEqual([1, 96, 96, 1]);
    expect(feeds.sequence_input).toBeUndefined();
    expect(Object.values(feeds).every((tensor) => tensor.dispose.mock.calls.length === 1)).toBe(true);
    expect(getTensorCount()).toBe(0);
    expect(ort.env.wasm).toMatchObject({ numThreads: 1 });
    expect(ort.env.wasm.wasmPaths).toEqual({
      mjs: 'http://localhost:8081/ort/ort-wasm-simd-threaded.mjs',
      wasm: 'http://localhost:8081/ort/ort-wasm-simd-threaded.wasm',
    });
  });

  it('deduplicates preload and one-time warmup, then reuses the session for drawing inference', async () => {
    const { ort, session, service, getTensorCount } = setup();
    const first = service.preloadBayaModel();
    expect(service.preloadBayaModel()).toBe(first);
    await first;
    await service.preloadBayaModel();
    expect(session.run).toHaveBeenCalledTimes(1);
    await service.runBayaInference(new Float32Array(96 * 96));
    expect(session.run).toHaveBeenCalledTimes(2);
    expect(ort.InferenceSession.create).toHaveBeenCalledTimes(1);
    expect(getTensorCount()).toBe(0);
  });

  it('allows preload to retry after warmup fails without recreating a valid session', async () => {
    const { ort, session, service } = setup();
    session.run.mockRejectedValueOnce(new Error('warmup failure'));
    await expect(service.preloadBayaModel()).rejects.toMatchObject({ code: 'INFERENCE_FAILED' });
    await expect(service.preloadBayaModel()).resolves.toBeUndefined();
    expect(ort.InferenceSession.create).toHaveBeenCalledTimes(1);
    expect(session.run).toHaveBeenCalledTimes(2);
  });

  it('rejects malformed image length before loading the model', async () => {
    const { ort, service } = setup();
    await expect(service.runBayaInference(new Float32Array(10)))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(ort.InferenceSession.create).not.toHaveBeenCalled();
  });

  it('rejects non-finite caller data', async () => {
    const { ort, service } = setup();
    const image = new Float32Array(96 * 96);
    image[3] = Number.NaN;
    await expect(service.runBayaInference(image))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(ort.InferenceSession.create).not.toHaveBeenCalled();
  });

  it('rejects unavailable input dimensions before inference', async () => {
    const { session, service } = setup();
    session.inputMetadata[0].shape = [];
    await expect(service.getBayaModel()).rejects.toMatchObject({ code: 'MODEL_CONTRACT_INVALID' });
    expect(session.run).not.toHaveBeenCalled();
    expect(session.release).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed graph contract and releases the invalid session', async () => {
    const { ort, session, service } = setup();
    session.inputNames = [IMAGE_NAME, 'unexpected_input'];
    session.inputMetadata = session.inputMetadata.slice(0, 2);
    await expect(service.getBayaModel()).rejects.toMatchObject({ code: 'MODEL_CONTRACT_INVALID' });
    expect(session.release).toHaveBeenCalledTimes(1);
    expect(ort.InferenceSession.create).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['missing output', () => ({}), 'expected output'],
    ['null outputs', () => null, 'expected output'],
    ['null tensor', () => ({ [OUTPUT_NAME]: null }), 'expected output'],
    ['missing dimensions', () => ({ [OUTPUT_NAME]: { type: 'float32', data: new Float32Array(63) } }), 'Expected output'],
    ['non-float data', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: Array(63).fill(1 / 63) } }), 'float32 output'],
    ['empty output', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(0) } }), 'Expected output'],
    ['extra outputs', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 64], data: new Float32Array(64) } }), 'Expected output'],
    ['incorrect output length', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 62], data: new Float32Array(62), dispose: jest.fn() } }), 'Expected output'],
    ['non-finite output', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(63).fill(Number.NaN), dispose: jest.fn() } }), 'invalid probability'],
    ['positive infinity', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(63).fill(Infinity) } }), 'invalid probability'],
    ['negative infinity', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(63).fill(-Infinity) } }), 'invalid probability'],
    ['negative probability', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(63).fill(-0.1) } }), 'invalid probability'],
    ['bad probability sum', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(63), dispose: jest.fn() } }), 'probability sum'],
  ])('rejects %s', async (_label, outputFactory, expectedMessage) => {
    const { session, service } = setup();
    session.run.mockImplementation(outputFactory);
    await expect(service.runBayaInference(new Float32Array(96 * 96)))
      .rejects.toMatchObject({ code: 'INFERENCE_FAILED', cause: expect.objectContaining({ message: expect.stringContaining(expectedMessage) }) });
  });

  it('disposes the image on runtime failure and can infer again', async () => {
    const { session, service, getTensorCount } = setup();
    session.run.mockRejectedValueOnce(new Error('WASM execution failed'));
    await expect(service.runBayaInference(new Float32Array(96 * 96))).rejects.toMatchObject({ code: 'INFERENCE_FAILED' });
    expect(getTensorCount()).toBe(0);
    await expect(service.runBayaInference(new Float32Array(96 * 96))).resolves.toHaveLength(63);
  });

  it.each([null, new Float64Array(96 * 96), new Float32Array(96 * 96).fill(-0.1), new Float32Array(96 * 96).fill(1.1)])('rejects malformed image data before model loading', async data => {
    const { ort, service } = setup();
    await expect(service.runBayaInference(data as Float32Array)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(ort.InferenceSession.create).not.toHaveBeenCalled();
  });

  it('smokes three times, reports the image-only model input, and reuses one session', async () => {
    const { ort, session, service } = setup();
    const result = await service.runBayaSmokeTest();
    expect(result).toMatchObject({
      modelUrl: BAYA_RECOGNITION_MODEL_URL,
      runtimeVersion: '1.30.0',
      executionProvider: 'wasm',
      inputNames: [IMAGE_NAME],
      outputNames: [OUTPUT_NAME],
      outputShape: [1, 63],
      allFinite: true,
      repeatedInferenceCount: 3,
      sameSessionReused: true,
      sessionCreations: 1,
    });
    expect(result.probabilitySum).toBeCloseTo(1, 5);
    expect(session.run).toHaveBeenCalledTimes(3);
    expect(ort.InferenceSession.create).toHaveBeenCalledTimes(1);
  });

  it('keeps the native fallback isolated from the ONNX web runtime', async () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nativeService = require('../bayaModel') as typeof import('../bayaModel');
    await expect(nativeService.runBayaInference(new Float32Array(1)))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_PLATFORM' });
  });
});
