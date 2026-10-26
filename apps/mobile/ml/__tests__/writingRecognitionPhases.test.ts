import { runBayaInference } from '../bayaModel';
import { preprocessNotebookImage } from '../inkImagePreprocessing';
import { recognizeWriting } from '../writingRecognition';

jest.mock('../bayaModel', () => ({ runBayaInference: jest.fn() }));
jest.mock('../inkImagePreprocessing', () => ({
  INK_THRESHOLD: 0.08,
  preprocessNotebookImage: jest.fn(),
}));

const strokes = [[
  { x: 0.1, y: 0.2, t: 1000 },
  { x: 0.5, y: 0.6, t: 1020 },
  { x: 0.8, y: 0.7, t: 1040 },
]];
const originalDocument = global.document;

afterEach(() => {
  Object.defineProperty(global, 'document', { configurable: true, value: originalDocument });
  jest.clearAllMocks();
});

it('captures the actual stroke image before starting ONNX inference', async () => {
  const drawing: string[] = [];
  const context = {
    fillRect: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(() => drawing.push('move')),
    lineTo: jest.fn(() => drawing.push('line')), stroke: jest.fn(), arc: jest.fn(), fill: jest.fn(),
    getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(256 * 256 * 4) })),
  };
  Object.defineProperty(global, 'document', { configurable: true, value: {
    createElement: jest.fn(() => ({ getContext: () => context })),
  } });
  jest.mocked(preprocessNotebookImage).mockReturnValue(new Float32Array(96 * 96).fill(0.5));
  const probabilities = new Float32Array(63);
  probabilities[0] = 0.7;
  probabilities[1] = 0.3;
  (runBayaInference as jest.Mock).mockResolvedValue(probabilities);
  const phases: string[] = [];

  const result = await recognizeWriting(strokes, { width: 200, height: 100 }, 3, {
    onCaptureStarted: () => phases.push('captureStarted'),
    onCaptureCompleted: shapes => {
      expect(shapes).toEqual({ imageShape: [1, 96, 96, 1] });
      phases.push('captureCompleted');
    },
    onInferenceStarted: () => phases.push('inferenceStarted'),
    onInferenceCompleted: () => phases.push('inferenceCompleted'),
  });

  expect(phases).toEqual(['captureStarted', 'captureCompleted', 'inferenceStarted', 'inferenceCompleted']);
  expect(drawing).toContain('line');
  expect(preprocessNotebookImage).toHaveBeenCalledWith(expect.objectContaining({ width: 256, height: 256 }));
  expect(runBayaInference).toHaveBeenCalledWith(expect.any(Float32Array));
  expect(result[0].label).toBe('a');
  expect(result[0].probability).toBeCloseTo(0.7);
});

it('stops before inference when the browser document is missing', async () => {
  Object.defineProperty(global, 'document', { configurable: true, value: undefined });
  const phases: string[] = [];
  await expect(recognizeWriting(strokes, { width: 200, height: 100 }, 3, {
    onCaptureStarted: () => phases.push('captureStarted'),
    onCaptureCompleted: () => phases.push('captureCompleted'),
    onInferenceStarted: () => phases.push('inferenceStarted'),
  })).rejects.toThrow('BAYA drawing capture is available in the web runtime.');
  expect(phases).toEqual(['captureStarted']);
  expect(runBayaInference).not.toHaveBeenCalled();
});

function installCapture(visible = true) {
  Object.defineProperty(global, 'document', { configurable: true, value: {
    createElement: jest.fn(() => ({ getContext: () => ({
      fillRect: jest.fn(), beginPath: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(),
      stroke: jest.fn(), arc: jest.fn(), fill: jest.fn(),
      getImageData: jest.fn(() => ({ data: new Uint8ClampedArray(256 * 256 * 4) })),
    }) })),
  } });
  jest.mocked(preprocessNotebookImage).mockReturnValue(new Float32Array(96 * 96).fill(visible ? 0.5 : 0));
}

it('does not infer a blank rendered image even if stroke metadata exists', async () => {
  installCapture(false);
  await expect(recognizeWriting(strokes)).rejects.toThrow('visible character');
  expect(runBayaInference).not.toHaveBeenCalled();
});

it.each([[], [[{ x: NaN, y: 0.5 }]], [[{ x: 1.1, y: 0.5 }]]].map(value => ({ value })))('rejects invalid drawing metadata before preprocessing', async ({ value }) => {
  installCapture();
  await expect(recognizeWriting(value)).rejects.toThrow();
  expect(preprocessNotebookImage).not.toHaveBeenCalled();
  expect(runBayaInference).not.toHaveBeenCalled();
});

it.each([null, new Float32Array(62), new Float32Array(64), new Float32Array(63).fill(NaN)])('does not rank invalid runtime probabilities', async output => {
  installCapture();
  (runBayaInference as jest.Mock).mockResolvedValue(output);
  await expect(recognizeWriting(strokes)).rejects.toThrow();
});

it('keeps stable class-index ties and supplies the image tensor only', async () => {
  installCapture();
  const probabilities = new Float32Array(63);
  probabilities[0] = probabilities[1] = 0.5;
  (runBayaInference as jest.Mock).mockResolvedValue(probabilities);
  const ranked = await recognizeWriting(strokes);
  expect(ranked.map(p => p.classIndex)).toEqual([0, 1, 2]);
  expect(jest.mocked(runBayaInference).mock.calls[0]).toHaveLength(1);
});
