import contract from './bayaActiveModel.json';

/** Sole production model; shared by runtime, labels and PWA generation. */
export const BAYA_MODEL_CONFIG = contract;
export const BAYA_RECOGNITION_MODEL_NAME = contract.modelName;
export const BAYA_RECOGNITION_MODEL_VERSION = contract.modelVersion;
export const BAYA_RECOGNITION_MODEL_URL = contract.modelUrl;
