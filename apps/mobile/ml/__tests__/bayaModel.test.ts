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
const SEQUENCE_NAME = 'sequence_input';
const MEAN_NAME = 'BAYA_EfficientNetB0_BiLSTM_1/efficientnetb0_1/normalization_1/Sub/y:0';
const VARIANCE_NAME = 'BAYA_EfficientNetB0_BiLSTM_1/efficientnetb0_1/normalization_1/Sqrt/x:0';
const OUTPUT_NAME = 'Identity:0';

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
    inputNames: [IMAGE_NAME, SEQUENCE_NAME, MEAN_NAME, VARIANCE_NAME],
    outputNames: [OUTPUT_NAME],
    inputMetadata: [
      { isTensor: true, type: 'float32', shape: [1, 96, 96, 1] },
      { isTensor: true, type: 'float32', shape: [1, 512, 6] },
      { isTensor: true, type: 'float32', shape: [1, 1, 1, 3] },
      { isTensor: true, type: 'float32', shape: [1, 1, 1, 3] },
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
      '/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1.onnx',
      { executionProviders: ['wasm'] },
    );
  });

  it('keeps the public inference API to image and sequence and internally creates four correct tensors', async () => {
    const { ort, session, service, getTensorCount } = setup();
    expect(service.runBayaInference).toHaveLength(2);
    const imageData = new Float32Array(96 * 96);
    const sequenceData = new Float32Array(512 * 6);
    const output = await service.runBayaInference(imageData, sequenceData);

    expect(output).toHaveLength(63);
    expect(session.run).toHaveBeenCalledTimes(1);
    const feeds = session.run.mock.calls[0][0] as Record<string, MockTensor>;
    expect(Object.keys(feeds)).toEqual([IMAGE_NAME, SEQUENCE_NAME, MEAN_NAME, VARIANCE_NAME]);
    expect(feeds[IMAGE_NAME].dims).toEqual([1, 96, 96, 1]);
    expect(feeds[SEQUENCE_NAME].dims).toEqual([1, 512, 6]);
    expect(feeds[MEAN_NAME].dims).toEqual([1, 1, 1, 3]);
    expect(feeds[MEAN_NAME].data).toEqual(Float32Array.from([
      0.48500001430511475, 0.4560000002384186, 0.4059999883174896,
    ]));
    expect(feeds[VARIANCE_NAME].dims).toEqual([1, 1, 1, 3]);
    expect(feeds[VARIANCE_NAME].data).toEqual(Float32Array.from([
      0.2290000021457672, 0.2240000069141388, 0.22499999403953552,
    ]));
    expect(Object.values(feeds).every((tensor) => tensor.dispose.mock.calls.length === 1)).toBe(true);
    expect(getTensorCount()).toBe(0);
    expect(ort.env.wasm).toMatchObject({ numThreads: 1 });
    expect(ort.env.wasm.wasmPaths).toEqual({
      mjs: 'http://localhost:8081/ort/ort-wasm-simd-threaded.mjs',
      wasm: 'http://localhost:8081/ort/ort-wasm-simd-threaded.wasm',
    });
  });

  it('rejects malformed image and sequence lengths before loading the model', async () => {
    const { ort, service } = setup();
    await expect(service.runBayaInference(new Float32Array(10), new Float32Array(512 * 6)))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(service.runBayaInference(new Float32Array(96 * 96), new Float32Array(10)))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(ort.InferenceSession.create).not.toHaveBeenCalled();
  });

  it('rejects non-finite caller data', async () => {
    const { ort, service } = setup();
    const image = new Float32Array(96 * 96);
    image[3] = Number.NaN;
    await expect(service.runBayaInference(image, new Float32Array(512 * 6)))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(ort.InferenceSession.create).not.toHaveBeenCalled();
  });

  it('rejects a malformed graph contract and releases the invalid session', async () => {
    const { ort, session, service } = setup();
    session.inputNames = [IMAGE_NAME, SEQUENCE_NAME];
    session.inputMetadata = session.inputMetadata.slice(0, 2);
    await expect(service.getBayaModel()).rejects.toMatchObject({ code: 'MODEL_CONTRACT_INVALID' });
    expect(session.release).toHaveBeenCalledTimes(1);
    expect(ort.InferenceSession.create).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['missing output', () => ({}), 'expected output'],
    ['incorrect output length', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 62], data: new Float32Array(62), dispose: jest.fn() } }), 'Expected output'],
    ['non-finite output', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(63).fill(Number.NaN), dispose: jest.fn() } }), 'invalid probability'],
    ['bad probability sum', () => ({ [OUTPUT_NAME]: { type: 'float32', dims: [1, 63], data: new Float32Array(63), dispose: jest.fn() } }), 'probability sum'],
  ])('rejects %s', async (_label, outputFactory, expectedMessage) => {
    const { session, service } = setup();
    session.run.mockImplementation(outputFactory);
    await expect(service.runBayaInference(new Float32Array(96 * 96), new Float32Array(512 * 6)))
      .rejects.toMatchObject({ code: 'INFERENCE_FAILED', cause: expect.objectContaining({ message: expect.stringContaining(expectedMessage) }) });
  });

  it('smokes three times, reports all four graph inputs, and reuses one session', async () => {
    const { ort, session, service } = setup();
    const result = await service.runBayaSmokeTest();
    expect(result).toMatchObject({
      modelUrl: '/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1.onnx',
      runtimeVersion: '1.30.0',
      executionProvider: 'wasm',
      inputNames: [IMAGE_NAME, SEQUENCE_NAME, MEAN_NAME, VARIANCE_NAME],
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
    await expect(nativeService.runBayaInference(new Float32Array(1), new Float32Array(1)))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_PLATFORM' });
  });
});
