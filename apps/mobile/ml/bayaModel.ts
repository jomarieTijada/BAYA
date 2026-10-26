import { BayaModelError } from './BayaModelError';

// Metro resolves bayaModel.web.ts in the PWA. Native never imports ONNX Runtime Web.
const unsupported = () => new BayaModelError(
  'UNSUPPORTED_PLATFORM',
  'BAYA recognition is currently available only in the web/PWA runtime.',
);

export async function getBayaModel(): Promise<never> {
  throw unsupported();
}

export async function preloadBayaModel(): Promise<never> {
  throw unsupported();
}

export async function runBayaInference(_imageData: Float32Array): Promise<never> {
  throw unsupported();
}

export async function runBayaSmokeTest(): Promise<never> {
  throw unsupported();
}

export async function runBayaBenchmark(): Promise<never> {
  throw unsupported();
}
