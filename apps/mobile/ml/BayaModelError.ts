export type BayaModelErrorCode =
  | 'UNSUPPORTED_PLATFORM'
  | 'MODEL_LOAD_FAILED'
  | 'MODEL_CONTRACT_INVALID'
  | 'INVALID_INPUT'
  | 'INFERENCE_FAILED';

export class BayaModelError extends Error {
  readonly code: BayaModelErrorCode;
  readonly cause?: unknown;

  constructor(code: BayaModelErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'BayaModelError';
    this.code = code;
    this.cause = cause;
  }
}
