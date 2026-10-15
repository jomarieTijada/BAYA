import type { StrokeData } from '../../../content/writingEngine';
import { BAYA_RECOGNITION_MODEL_NAME, BAYA_RECOGNITION_MODEL_VERSION } from '../../../ml/bayaModelConfig';
import { captureWritingRgba, prepareBayaInputs, type BayaPrediction, type WritingCanvasGeometry } from '../../../ml/writingRecognition';

const RASTER_SIZE = 256;
export type BayaCaptureDownload = { url: string; filename: string };

export function isBayaCaptureEnabled(): boolean {
  return __DEV__ && typeof window !== 'undefined'
    && new URLSearchParams(window.location?.search ?? '').get('bayaCapture') === '1';
}

function encodeBase64(bytes: Uint8ClampedArray): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

/** A single opt-in download containing the exact browser input and its source drawing. */
export function downloadBayaCapture(targetClass: string, strokes: StrokeData, geometry: WritingCanvasGeometry, predictions: BayaPrediction[]): BayaCaptureDownload | null {
  if (!isBayaCaptureEnabled() || predictions.length === 0) return null;

  const rgba = captureWritingRgba(strokes, geometry);
  const { imageData, sequenceData } = prepareBayaInputs(strokes, geometry);
  const capturedAt = new Date().toISOString();
  const capture = {
    schemaVersion: 2,
    modelName: BAYA_RECOGNITION_MODEL_NAME,
    modelVersion: BAYA_RECOGNITION_MODEL_VERSION,
    capturedAt,
    targetClass,
    predictions,
    canvas: geometry,
    normalizedStrokes: strokes,
    raster: { width: RASTER_SIZE, height: RASTER_SIZE, rgbaBase64: encodeBase64(rgba) },
    webInputs: { image: Array.from(imageData), sequence: Array.from(sequenceData) },
  };
  const blob = new Blob([JSON.stringify(capture)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const filename = `baya-capture-${targetClass}-${capturedAt.replace(/[:.]/g, '-')}.json`;
  // The optional local receiver is for in-app browsers that suppress downloads.
  if (new URLSearchParams(window.location.search).get('bayaCaptureSink') === '1') {
    void fetch('http://127.0.0.1:8765/capture', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(capture),
    }).catch((error: unknown) => { if (__DEV__) console.warn('[BAYA CAPTURE] Local receiver failed', error); });
  }
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return { url, filename };
}
