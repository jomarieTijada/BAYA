import { BAYA_MODEL_CONFIG as config } from '../bayaModelConfig';

function setup(gpu = true) {
  jest.resetModules();
  global.fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) })) as jest.Mock;
  const tensors: { deleted: boolean }[] = [];
  class Tensor {
    deleted = false;
    dtype = 'float32';
    constructor(public data: Float32Array, public shape: number[]) { tensors.push(this); }
    delete() { this.deleted = true; }
    async moveTo() { return this; }
    toTypedArray() { return this.data; }
  }
  const makeModel = (backend: string) => ({
    deleted: false, isFullyAccelerated: backend === 'webgpu',
    delete: jest.fn(function (this: { deleted: boolean }) { this.deleted = true; }),
    getInputDetails: jest.fn(() => config.logicalInputs.map(v => ({ ...v, shape: Int32Array.from(v.shape) }))),
    getOutputDetails: jest.fn(() => config.outputs.map(v => ({ ...v, shape: Int32Array.from(v.shape) }))),
    run: jest.fn(async () => config.outputs.map(v => new Tensor(new Float32Array(v.shape[1]).fill(.5), v.shape))),
  });
  const models: ReturnType<typeof makeModel>[] = [];
  const rt = { Tensor, loadLiteRt: jest.fn(async () => undefined), isWebGPUSupported: () => gpu,
    loadAndCompile: jest.fn(async (_bytes: Uint8Array, options: { accelerator: string }) => { const model = makeModel(options.accelerator); models.push(model); return model; }) };
  jest.doMock('@litertjs/core', () => rt);
  Object.defineProperty(global, 'window', { configurable: true, value: {} });
  const service: typeof import('../bayaModel.web') = require('../bayaModel.web');
  return { rt, service, models, tensors };
}
const input = () => new Float32Array(76800);
it('initializes once, validates five outputs and disposes temporary tensors', async () => {
  const { rt, service, tensors } = setup();
  await Promise.all([service.preloadBayaModel(), service.preloadBayaModel()]);
  const result = await service.runBayaSpatialInference(input());
  expect(rt.loadLiteRt).toHaveBeenCalledTimes(1); expect(rt.loadAndCompile).toHaveBeenCalledTimes(1);
  expect(result.probabilities).toHaveLength(63); expect(result.base.label).toBe('b');
  expect(tensors.every(t => t.deleted)).toBe(true);
  await service.disposeBayaModel();
});
it('uses CPU when GPU is unavailable and retries a failed load', async () => {
  const { service, rt } = setup(false);
  rt.loadAndCompile.mockRejectedValueOnce(new Error('download failure'));
  await expect(service.preloadBayaModel()).rejects.toMatchObject({ code: 'MODEL_LOAD_FAILED' });
  await service.preloadBayaModel();
  expect(rt.loadAndCompile).toHaveBeenLastCalledWith(expect.any(Uint8Array), expect.objectContaining({ accelerator: 'wasm' }));
});
it('falls back after GPU compilation failure', async () => {
  const { service, rt } = setup(); rt.loadAndCompile.mockRejectedValueOnce(new Error('GPU unsupported'));
  const result = await service.getBayaModel(); expect(result.backend).toBe('wasm'); expect(result.fallbackReason).toContain('GPU');
});
it('falls back after GPU execution failure and cleans up both models', async () => {
  const { service, models, tensors } = setup(); await service.preloadBayaModel();
  models[0].run.mockRejectedValueOnce(new Error('device lost'));
  await service.runBayaSpatialInference(input());
  expect(models[0].delete).toHaveBeenCalled(); expect((await service.getBayaModel()).backend).toBe('wasm');
  expect(tensors.every(t => t.deleted)).toBe(true);
});
it('rejects metadata mismatch without masking it with a backend fallback', async () => {
  const { service, models } = setup(); await service.preloadBayaModel();
  models[0].getInputDetails.mockReturnValue([]);
  expect(() => service.validateModelMetadata(models[0] as never)).toThrow('metadata');
});
it('maps by verified tensor identity even when runtime outputs are reordered', async () => {
  const { service, models } = setup(); await service.preloadBayaModel();
  const details = models[0].getOutputDetails(); const run = models[0].run.getMockImplementation()!;
  models[0].getOutputDetails.mockReturnValue([...details].reverse());
  models[0].run.mockImplementation(async () => (await run()).reverse());
  expect((await service.runBayaSpatialInference(input())).probabilities).toHaveLength(63);
});
it('serializes concurrent inference and waits for work before cleanup', async () => {
  const { service, models } = setup(false); await service.preloadBayaModel();
  const run = models[0].run.getMockImplementation()!; let active = 0, maximum = 0;
  models[0].run.mockImplementation(async () => { active++; maximum = Math.max(maximum, active); await Promise.resolve(); const result = await run(); active--; return result; });
  await Promise.all([service.runBayaInference(input()), service.runBayaInference(input()), service.disposeBayaModel()]);
  expect(maximum).toBe(1); expect(models[0].delete).toHaveBeenCalledTimes(1);
});
it('rejects invalid input and frees tensors after malformed outputs', async () => {
  const { service, models, tensors } = setup(false);
  await expect(service.runBayaInference(new Float32Array(4))).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await service.preloadBayaModel(); models[0].run.mockResolvedValueOnce([]);
  await expect(service.runBayaInference(input())).rejects.toMatchObject({ code: 'INFERENCE_FAILED' });
  expect(tensors.every(t => t.deleted)).toBe(true); expect(models[0].delete).toHaveBeenCalled();
  await expect(service.runBayaInference(input())).resolves.toHaveLength(63);
});

it('verifies download integrity before compilation and recovers after a failed download', async () => {
  const {service, rt} = setup(false);
  jest.mocked(fetch).mockRejectedValueOnce(new TypeError('Integrity mismatch'));
  await expect(service.preloadBayaModel()).rejects.toMatchObject({code:'MODEL_LOAD_FAILED'});
  expect(rt.loadAndCompile).not.toHaveBeenCalled();
  await service.preloadBayaModel();
  expect(fetch).toHaveBeenLastCalledWith(config.modelUrl, {integrity: config.modelIntegrity});
});
