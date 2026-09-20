import {
  ATTEMPTS_PER_CHARACTER,
  BAYBAYIN_CLASSES,
  HANDWRITING_SCHEMA_VERSION,
  getCollectionProgress,
  type CollectionAttemptIdsByClass,
  type HandwritingAttempt,
} from '@baya/shared-types';

export function getExportImageFilename(attemptId: string): string {
  return `attempt_${attemptId}.png`;
}

export function buildExportAttemptRecord(attempt: HandwritingAttempt) {
  const filename = getExportImageFilename(attempt.attemptId);
  return { ...attempt, imageUri: `images/${filename}` };
}

export function buildDatasetMetadata(
  attemptIdsByClass: CollectionAttemptIdsByClass,
  attemptCount: number,
  imageCount: number,
  exportedAt = Date.now(),
  attemptSchemaVersions: readonly number[] = [HANDWRITING_SCHEMA_VERSION],
) {
  const progress = getCollectionProgress(attemptIdsByClass);
  const schemaVersionsFound = [...new Set(attemptSchemaVersions)].sort((a, b) => a - b);

  return {
    exportedAt,
    schemaVersion: HANDWRITING_SCHEMA_VERSION,
    attemptSchemaVersions: schemaVersionsFound,
    attemptsPerCharacter: ATTEMPTS_PER_CHARACTER,
    targetCharacterCount: BAYBAYIN_CLASSES.length,
    expectedAttemptCount: progress.expectedAttemptCount,
    attemptCount,
    imageCount,
    completedAttemptCount: progress.completedAttemptCount,
    completedCharacterCount: progress.completedCharacterCount,
    isComplete: progress.isComplete,
    coordinateSpace: 'raw canvas-local logical pixels',
    coordinateNormalization: 'Apply x/canvasWidth and y/canvasHeight during ML preprocessing; raw exports are not normalized.',
    timing: 'Elapsed milliseconds from the first touch; the first point has t=0.',
    pairing: 'Each attempts.json record and images/attempt_<attemptId>.png describe the same independent attempt.',
    attemptNumbering: 'attemptNumber is 1-based within each target class. Legacy version-1 rows are assigned by persisted acceptance order during export.',
    schemaCompatibility: 'attemptSchemaVersions lists the unchanged per-attempt versions included in this export; legacy records are not rewritten.',
    description: 'BAYA Handwriting Dataset Export (Current Session)',
  };
}
