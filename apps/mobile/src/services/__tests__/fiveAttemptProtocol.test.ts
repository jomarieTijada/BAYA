import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATTEMPTS_PER_CHARACTER,
  BAYBAYIN_CLASSES,
  HANDWRITING_SCHEMA_VERSION,
  getAcceptedAttemptCount,
  getCollectionProgress,
  getNextIncompleteTarget,
  type BaybayinClass,
  type CollectionAttemptIdsByClass,
  type HandwritingAttempt,
  type NewHandwritingAttemptDraft,
} from '../../../../../packages/shared-types/src/index';
import {
  buildNewHandwritingSampleValues,
  getHandwritingSample,
  normalizeCollectionSessionJson,
} from '../../../../../packages/db/src/handwritingRepository';
import {
  buildDatasetMetadata,
  buildExportAttemptRecord,
  getExportImageFilename,
} from '../datasetManifest';

const TARGET_A: BaybayinClass = 'a';
const TARGET_B: BaybayinClass = 'b';

function ids(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);
}

function attempt(attemptId: string, targetClass: BaybayinClass, attemptNumber: number): HandwritingAttempt {
  return {
    schemaVersion: HANDWRITING_SCHEMA_VERSION,
    attemptId,
    attemptNumber,
    participantId: null,
    activityId: null,
    targetClass,
    observedClass: null,
    canvasWidth: 300,
    canvasHeight: 300,
    durationMs: 100,
    strokes: [],
    imageUri: `file:///attempt_${attemptId}.png`,
    reviewStatus: 'unreviewed',
    visualValid: null,
    strokeValid: null,
    rubricVersion: null,
    createdAt: attemptNumber,
  };
}

function draft(attemptId: string, attemptNumber: number): NewHandwritingAttemptDraft {
  return {
    attemptId,
    attemptNumber,
    participantId: null,
    activityId: null,
    targetClass: TARGET_A,
    canvasWidth: 200,
    canvasHeight: 200,
    screenWidth: 759,
    screenHeight: 351,
    pixelRatio: 3.08,
    layoutMode: 'compact',
    durationMs: 10,
    strokes: [{
      strokeId: 0,
      startedAtMs: 0,
      endedAtMs: 10,
      points: [{ x: 100, y: 100, t: 0 }],
    }],
    imageUri: `file:///attempt_${attemptId}.png`,
    createdAt: attemptNumber,
  };
}

function databaseReturning(row: Record<string, unknown>) {
  return {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [row],
        }),
      }),
    }),
  };
}

test('attempts 1 through 4 keep the same target and attempt 5 advances', () => {
  for (let completed = 0; completed < ATTEMPTS_PER_CHARACTER; completed += 1) {
    const membership: CollectionAttemptIdsByClass = { [TARGET_A]: ids('a', completed) };
    assert.equal(getNextIncompleteTarget(membership, [TARGET_A, TARGET_B]), TARGET_A);
    assert.equal(getAcceptedAttemptCount(membership, TARGET_A) + 1, completed + 1);
  }

  const afterFifth: CollectionAttemptIdsByClass = {
    [TARGET_A]: ids('a', ATTEMPTS_PER_CHARACTER),
  };
  assert.equal(getNextIncompleteTarget(afterFifth, [TARGET_A, TARGET_B]), TARGET_B);
  assert.equal(getAcceptedAttemptCount(afterFifth, TARGET_B) + 1, 1);
});

test('fresh and resumed attempts all use the current schema version', () => {
  const beforeRestart = [1, 2].map(attemptNumber =>
    buildNewHandwritingSampleValues(draft(`a-${attemptNumber}`, attemptNumber)),
  );
  // A process restart creates new drafts, but every persistence path calls the
  // same authoritative row builder.
  const afterRestart = [3, 4, 5].map(attemptNumber =>
    buildNewHandwritingSampleValues(draft(`a-${attemptNumber}`, attemptNumber)),
  );
  const rows = [...beforeRestart, ...afterRestart];

  assert.deepEqual(rows.map(row => row.schemaVersion), [2, 2, 2, 2, 2]);
  assert.ok(rows.every(row => row.schemaVersion === HANDWRITING_SCHEMA_VERSION));
});

test('legacy schema v1 and current schema v2 rows remain readable', async () => {
  const baseRow = {
    id: 'row',
    participantId: null,
    activityId: null,
    targetClass: TARGET_A,
    attemptNumber: null,
    observedClass: null,
    imageUri: null,
    strokesJson: '[]',
    canvasWidth: 200,
    canvasHeight: 200,
    screenWidth: null,
    screenHeight: null,
    pixelRatio: null,
    layoutMode: null,
    appVersion: null,
    durationMs: 0,
    reviewStatus: 'unreviewed',
    visualValid: null,
    strokeValid: null,
    rubricVersion: null,
    createdAt: 1,
  };
  const legacy = await getHandwritingSample(
    databaseReturning({ ...baseRow, id: 'legacy', schemaVersion: 1 }) as any,
    'legacy',
  );
  const current = await getHandwritingSample(
    databaseReturning({ ...baseRow, id: 'current', attemptNumber: 1, schemaVersion: 2 }) as any,
    'current',
  );

  assert.equal(legacy?.schemaVersion, 1);
  assert.equal(legacy?.attemptNumber, null);
  assert.equal(current?.schemaVersion, 2);
  assert.equal(current?.attemptNumber, 1);
});

test('completion and expected attempts derive from the supplied target list', () => {
  const targets = [TARGET_A, TARGET_B] as const;
  const complete: CollectionAttemptIdsByClass = {
    [TARGET_A]: ids('a', ATTEMPTS_PER_CHARACTER),
    [TARGET_B]: ids('b', ATTEMPTS_PER_CHARACTER),
  };

  assert.deepEqual(getCollectionProgress(complete, targets), {
    targetCharacterCount: 2,
    expectedAttemptCount: 2 * ATTEMPTS_PER_CHARACTER,
    completedAttemptCount: 2 * ATTEMPTS_PER_CHARACTER,
    completedCharacterCount: 2,
    isComplete: true,
  });
  assert.equal(getNextIncompleteTarget(complete, targets), null);
});

test('legacy excess attempts are retained but capped for protocol progress', () => {
  const membership: CollectionAttemptIdsByClass = {
    [TARGET_A]: ids('legacy-a', ATTEMPTS_PER_CHARACTER + 2),
  };
  const progress = getCollectionProgress(membership, [TARGET_A, TARGET_B]);

  assert.equal(getAcceptedAttemptCount(membership, TARGET_A), ATTEMPTS_PER_CHARACTER + 2);
  assert.equal(progress.completedAttemptCount, ATTEMPTS_PER_CHARACTER);
  assert.equal(progress.completedCharacterCount, 1);
  assert.equal(progress.isComplete, false);
});

test('legacy session JSON is normalized without losing same-target attempts', async () => {
  const attempts = new Map([
    ['a-1', { attemptId: 'a-1', targetClass: TARGET_A }],
    ['a-2', { attemptId: 'a-2', targetClass: TARGET_A }],
    ['b-1', { attemptId: 'b-1', targetClass: TARGET_B }],
  ]);
  const load = async (attemptId: string) => attempts.get(attemptId) ?? null;

  const flatLegacy = await normalizeCollectionSessionJson(
    JSON.stringify(['a-1', 'a-2', 'b-1', 'missing', 'a-1']),
    load,
  );
  assert.deepEqual(flatLegacy, { a: ['a-1', 'a-2'], b: ['b-1'] });

  const onePerClassLegacy = await normalizeCollectionSessionJson(
    JSON.stringify({ a: 'a-1', b: 'b-1' }),
    load,
  );
  assert.deepEqual(onePerClassLegacy, { a: ['a-1'], b: ['b-1'] });
});

test('normalization rejects stale IDs, target mismatches, and duplicate IDs', async () => {
  const attempts = new Map([
    ['a-1', { attemptId: 'a-1', targetClass: TARGET_A }],
    ['b-1', { attemptId: 'b-1', targetClass: TARGET_B }],
  ]);
  const normalized = await normalizeCollectionSessionJson(
    JSON.stringify({ a: ['a-1', 'a-1', 'b-1', 'missing'] }),
    async attemptId => attempts.get(attemptId) ?? null,
  );

  assert.deepEqual(normalized, { a: ['a-1'] });
});

test('five accepted attempts remain five independent export records and image paths', () => {
  const attempts = ids('a', ATTEMPTS_PER_CHARACTER).map((attemptId, index) =>
    attempt(attemptId, TARGET_A, index + 1),
  );
  const records = attempts.map(buildExportAttemptRecord);

  assert.equal(records.length, ATTEMPTS_PER_CHARACTER);
  assert.equal(new Set(records.map(record => record.attemptId)).size, ATTEMPTS_PER_CHARACTER);
  assert.equal(new Set(records.map(record => record.imageUri)).size, ATTEMPTS_PER_CHARACTER);
  assert.deepEqual(
    records.map(record => record.attemptNumber),
    [1, 2, 3, 4, 5],
  );
  assert.equal(records[0]?.imageUri, `images/${getExportImageFilename('a-1')}`);
});

test('mixed legacy and current attempts export without rewriting schema versions', () => {
  const legacy = { ...attempt('legacy-a', TARGET_A, 1), schemaVersion: 1, attemptNumber: null };
  const current = attempt('current-a', TARGET_A, 2);
  const records = [legacy, current].map(buildExportAttemptRecord);

  assert.deepEqual(records.map(record => record.schemaVersion), [1, 2]);
  assert.deepEqual(records.map(record => record.attemptNumber), [null, 2]);
  assert.equal(legacy.schemaVersion, 1);

  const metadata = buildDatasetMetadata(
    { [TARGET_A]: ['legacy-a', 'current-a'] },
    records.length,
    records.length,
    1234,
    records.map(record => record.schemaVersion),
  );
  assert.deepEqual(metadata.attemptSchemaVersions, [1, 2]);
});

test('dataset metadata reports dynamic protocol totals and full completion', () => {
  const completeMembership = Object.fromEntries(
    BAYBAYIN_CLASSES.map(target => [target, ids(target, ATTEMPTS_PER_CHARACTER)]),
  ) as CollectionAttemptIdsByClass;
  const expected = BAYBAYIN_CLASSES.length * ATTEMPTS_PER_CHARACTER;
  const metadata = buildDatasetMetadata(completeMembership, expected, expected, 1234);

  assert.equal(metadata.exportedAt, 1234);
  assert.equal(metadata.schemaVersion, HANDWRITING_SCHEMA_VERSION);
  assert.deepEqual(metadata.attemptSchemaVersions, [HANDWRITING_SCHEMA_VERSION]);
  assert.equal(metadata.attemptsPerCharacter, ATTEMPTS_PER_CHARACTER);
  assert.equal(metadata.targetCharacterCount, BAYBAYIN_CLASSES.length);
  assert.equal(metadata.expectedAttemptCount, expected);
  assert.equal(metadata.completedAttemptCount, expected);
  assert.equal(metadata.completedCharacterCount, BAYBAYIN_CLASSES.length);
  assert.equal(metadata.attemptCount, expected);
  assert.equal(metadata.imageCount, expected);
  assert.equal(metadata.isComplete, true);
});
