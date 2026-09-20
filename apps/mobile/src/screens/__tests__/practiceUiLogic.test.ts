import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATTEMPTS_PER_CHARACTER,
  type BaybayinClass,
  type CollectionAttemptIdsByClass,
  type HandwritingAttempt,
} from '../../../../../packages/shared-types/src/index';
import {
  DATA_GATHERING_HEADER,
  buildCharacterProgressView,
  buildGroupedHistory,
  calculateResponsiveUI,
  findHistoryAttemptById,
  getAttemptDetailMetrics,
  runExclusiveOperation,
} from '../practiceUiLogic';

const TARGETS = ['a', 'b'] as const;

function ids(target: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${target}-${index + 1}`);
}

function attempt(
  attemptId: string,
  targetClass: BaybayinClass,
  attemptNumber: number,
  pointCount = 2,
): HandwritingAttempt {
  return {
    schemaVersion: 2,
    attemptId,
    attemptNumber,
    participantId: null,
    activityId: null,
    targetClass,
    observedClass: null,
    canvasWidth: 200,
    canvasHeight: 200,
    screenWidth: 800,
    screenHeight: 360,
    pixelRatio: 3,
    layoutMode: 'compact',
    durationMs: 1420,
    strokes: [{
      strokeId: 0,
      startedAtMs: 0,
      endedAtMs: 1420,
      points: Array.from({ length: pointCount }, (_, index) => ({
        x: 20 + index,
        y: 30 + index,
        t: index * 20,
      })),
    }],
    imageUri: `file:///attempt_${attemptId}.png`,
    reviewStatus: 'unreviewed',
    visualValid: null,
    strokeValid: null,
    rubricVersion: null,
    createdAt: attemptNumber,
  };
}

test('header model contains only DATA GATHERING and no global counters', () => {
  assert.deepEqual(DATA_GATHERING_HEADER, { title: 'DATA GATHERING' });
  const renderedHeaderText = Object.values(DATA_GATHERING_HEADER).join(' ');
  assert.doesNotMatch(renderedHeaderText, /Characters\s+\d/i);
  assert.doesNotMatch(renderedHeaderText, /Attempts\s+\d/i);
});

test('completed-character progress changes only with persisted five-attempt membership', () => {
  const persisted: CollectionAttemptIdsByClass = {
    a: ids('a', 5),
    b: ids('b', 3),
  };
  assert.equal(buildCharacterProgressView(persisted, TARGETS).label, '1 / 2 complete');

  // Review -> Retry and failed Done do not change persisted membership.
  assert.equal(buildCharacterProgressView(persisted, TARGETS).completedCharacterCount, 1);
  assert.equal(buildCharacterProgressView(persisted, TARGETS).completedCharacterCount, 1);

  const beforeFifth: CollectionAttemptIdsByClass = { ...persisted, b: ids('b', 4) };
  const afterFifth: CollectionAttemptIdsByClass = { ...persisted, b: ids('b', 5) };
  assert.equal(buildCharacterProgressView(beforeFifth, TARGETS).completedCharacterCount, 1);
  assert.equal(buildCharacterProgressView(afterFifth, TARGETS).completedCharacterCount, 2);

  const afterDelete: CollectionAttemptIdsByClass = { ...afterFifth, b: ids('b', 4) };
  assert.equal(buildCharacterProgressView(afterDelete, TARGETS).completedCharacterCount, 1);
});

test('History groups persisted attempts once per target in canonical order', () => {
  const membership: CollectionAttemptIdsByClass = {
    a: ids('a', ATTEMPTS_PER_CHARACTER),
    b: ids('b', 3),
  };
  const attempts = [
    ...ids('b', 3).map((id, index) => attempt(id, 'b', index + 1)),
    ...ids('a', 5).map((id, index) => attempt(id, 'a', index + 1)),
  ];
  const groups = buildGroupedHistory(attempts, membership, TARGETS);

  assert.deepEqual(groups.map(group => group.targetClass), ['a', 'b']);
  assert.equal(groups.filter(group => group.targetClass === 'a').length, 1);
  assert.equal(groups[0]?.savedCount, 5);
  assert.deepEqual(groups[0]?.attempts.map(item => item.attemptId), ids('a', 5));
  assert.equal(groups[1]?.savedCount, 3);

  const selected = findHistoryAttemptById(groups, 'a-4');
  assert.equal(selected?.attemptId, 'a-4');
  assert.equal(selected?.attemptNumber, 4);
});

test('History reconstruction after restart preserves counts and exact attempt identity', () => {
  const membership: CollectionAttemptIdsByClass = { a: ids('a', 5), b: ids('b', 1) };
  const attempts = [
    ...ids('a', 5).map((id, index) => attempt(id, 'a', index + 1)),
    attempt('b-1', 'b', 1),
  ];
  const beforeRestart = buildGroupedHistory(attempts, membership, TARGETS);
  const afterRestart = buildGroupedHistory(attempts, membership, TARGETS);

  assert.deepEqual(
    afterRestart.map(group => [group.targetClass, group.savedCount]),
    beforeRestart.map(group => [group.targetClass, group.savedCount]),
  );
  assert.equal(findHistoryAttemptById(afterRestart, 'b-1')?.attemptId, 'b-1');
});

test('unsaved Review candidate metrics come from its current raw strokes', () => {
  const candidate = attempt('pending-current', 'b', 4, 7);
  candidate.imageUri = null;
  candidate.strokes.push({
    strokeId: 1,
    startedAtMs: 800,
    endedAtMs: 1420,
    points: [{ x: 80, y: 90, t: 800 }],
  });

  const metrics = getAttemptDetailMetrics(candidate);
  assert.equal(candidate.attemptId, 'pending-current');
  assert.equal(metrics.strokeCount, 2);
  assert.equal(metrics.pointCount, 8);
  assert.equal(metrics.durationSeconds, 1.42);
});

test('rapid export taps acquire only one single-flight operation', async () => {
  const gate = { running: false };
  let exportCount = 0;
  let releaseTask!: () => void;
  const taskBlocked = new Promise<void>(resolve => {
    releaseTask = resolve;
  });

  const tapExport = async () => {
    await runExclusiveOperation(gate, async () => {
      exportCount += 1;
      await taskBlocked;
    });
  };

  const first = tapExport();
  const second = tapExport();
  assert.equal(exportCount, 1);
  releaseTask();
  await Promise.all([first, second]);
  assert.equal(gate.running, false);
});

test('failed export operations release the guard for a retry', async () => {
  const gate = { running: false };
  await assert.rejects(
    runExclusiveOperation(gate, async () => {
      throw new Error('share failed');
    }),
    /share failed/,
  );
  assert.equal(gate.running, false);
  assert.equal(await runExclusiveOperation(gate, async () => {}), true);
});

test('responsive calculations preserve three columns and a usable canvas', () => {
  const viewports = [
    [800, 360],
    [915, 412],
    [960, 432],
    [1080, 480],
    [1280, 720],
    [1280, 800],
    [1920, 1200],
  ] as const;
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };

  for (const [width, height] of viewports) {
    const ui = calculateResponsiveUI(width, height, insets, 2);
    assert.equal(ui.leftFlex, 1);
    assert.equal(ui.rightFlex, 1);
    assert.ok(ui.centerFlex >= 2);
    assert.ok(ui.canvasSize >= 150);
    assert.ok(ui.canvasSize <= 450);
  }
});
