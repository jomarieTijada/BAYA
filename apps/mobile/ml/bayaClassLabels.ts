import labels from '../public/models/baya/resnet18-v1/labels.json';

/** Training order is authoritative; never sort these arrays. */
export const BAYA_CLASS_LABELS: readonly string[] = labels.classes;
export const BAYA_BASE_LABELS: readonly string[] = labels.bases;
export const BAYA_MODIFIER_LABELS: readonly string[] = labels.modifiers;
