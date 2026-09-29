import type { StrokeData } from '../content/writingEngine';
import { runBayaInference } from './bayaModel';
import { EFFICIENTNET_CLASS_LABELS } from './efficientNetClassLabels';
import { preprocessNotebookImage, preprocessNotebookSequence } from './efficientNetPreprocessing';

const CAPTURE_SIZE = 256;
const CAPTURE_STROKE_WIDTH = CAPTURE_SIZE * (13 / 1000);

export type BayaPrediction = { label: string; probability: number; classIndex: number };
export type WritingCanvasGeometry = { width: number; height: number };
export type BayaRecognitionObserver = {
  onCaptureStarted?: () => void;
  onCaptureCompleted?: (shapes: { imageShape: readonly number[]; sequenceShape: readonly number[] }) => void;
  onInferenceStarted?: () => void;
  onInferenceCompleted?: () => void;
};
const DEFAULT_GEOMETRY: WritingCanvasGeometry = { width: 1, height: 1 };

/** Convert the live canvas capture to the notebook's duration_ms/strokes schema. */
export function toNotebookSequenceRow(strokes: StrokeData, geometry: WritingCanvasGeometry = DEFAULT_GEOMETRY) {
  const points = strokes.flat();
  const timestamps = points.map((point) => point.t ?? 0);
  return {
    duration_ms: Math.max(0, Math.max(...timestamps) - Math.min(...timestamps)),
    strokes: strokes.map((stroke) => ({
      points: stroke.map((point) => ({ x: point.x * geometry.width, y: point.y * geometry.height, t: point.t ?? 0 })),
    })),
  };
}

/** Rasterize active writing strokes to the RGBA boundary accepted by the pure preprocessing port. */
export function captureWritingRgba(strokes: StrokeData, geometry: WritingCanvasGeometry = DEFAULT_GEOMETRY): Uint8ClampedArray {
  if (typeof document === 'undefined') throw new Error('BAYA drawing capture is available in the web runtime.');
  const canvas = document.createElement('canvas');
  canvas.width = CAPTURE_SIZE;
  canvas.height = CAPTURE_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not create a 2D context for BAYA drawing capture.');

  context.fillStyle = '#fff';
  context.fillRect(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);
  context.strokeStyle = '#000';
  context.fillStyle = '#000';
  context.lineWidth = CAPTURE_STROKE_WIDTH;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const sourceScale = CAPTURE_SIZE / Math.max(geometry.width, geometry.height, 1);
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    if (stroke.length === 1) {
      const point = stroke[0];
      context.beginPath();
      context.arc(point.x * geometry.width * sourceScale, point.y * geometry.height * sourceScale, CAPTURE_STROKE_WIDTH / 2, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    context.beginPath();
    context.moveTo(stroke[0].x * geometry.width * sourceScale, stroke[0].y * geometry.height * sourceScale);
    for (let index = 1; index < stroke.length; index += 1) {
      context.lineTo(stroke[index].x * geometry.width * sourceScale, stroke[index].y * geometry.height * sourceScale);
    }
    context.stroke();
  }
  return context.getImageData(0, 0, CAPTURE_SIZE, CAPTURE_SIZE).data;
}

function prepareCapturedInputs(strokes: StrokeData, geometry: WritingCanvasGeometry, imageRgba: Uint8ClampedArray) {
  const points = strokes.flat();
  if (points.length === 0) throw new Error('Write a character before asking BAYA to recognize it.');
  const imageData = preprocessNotebookImage({ width: CAPTURE_SIZE, height: CAPTURE_SIZE, data: imageRgba });
  const sequenceData = preprocessNotebookSequence(toNotebookSequenceRow(strokes, geometry));
  return { imageData, sequenceData };
}

export function prepareBayaInputs(strokes: StrokeData, geometry: WritingCanvasGeometry = DEFAULT_GEOMETRY) {
  return prepareCapturedInputs(strokes, geometry, captureWritingRgba(strokes, geometry));
}

export async function recognizeWriting(strokes: StrokeData, geometry: WritingCanvasGeometry = DEFAULT_GEOMETRY, topK = 3, observer?: BayaRecognitionObserver): Promise<BayaPrediction[]> {
  observer?.onCaptureStarted?.();
  const { imageData, sequenceData } = prepareBayaInputs(strokes, geometry);
  observer?.onCaptureCompleted?.({ imageShape: [1, 96, 96, 1], sequenceShape: [1, 512, 6] });
  observer?.onInferenceStarted?.();
  const probabilities = await runBayaInference(imageData, sequenceData);
  observer?.onInferenceCompleted?.();
  const bestIndices = Array.from(probabilities, (_probability, index) => index)
    .sort((left, right) => probabilities[right] - probabilities[left])
    .slice(0, Math.min(Math.max(1, topK), EFFICIENTNET_CLASS_LABELS.length));
  return bestIndices.map((classIndex) => ({
    classIndex,
    label: EFFICIENTNET_CLASS_LABELS[classIndex],
    probability: probabilities[classIndex],
  }));
}
