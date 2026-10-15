import { BAYA_MODEL_CONFIG } from './bayaModelConfig';

/** Exact training label order stored with the selected model, including rollback. */
export const EFFICIENTNET_CLASS_LABELS: readonly string[] = BAYA_MODEL_CONFIG.orderedLabels;

export const EFFICIENTNET_LABEL_TO_ID = Object.fromEntries(
  EFFICIENTNET_CLASS_LABELS.map((label, index) => [label, index]),
) as Record<(typeof EFFICIENTNET_CLASS_LABELS)[number], number>;
