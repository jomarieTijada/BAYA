const assert = require('assert');
import {
  createInitialState,
  handleTouchBegin,
  handleTouchMove,
  handleTouchEnd,
  handleTouchCancel,
  handleReset,
  handleUndo,
  getDurationMs,
  validateRecordedStrokes,
} from '../strokeRecorderLogic';
import type { RecordedStroke } from '@baya/shared-types';

function runTests() {
  console.log('Running pure recorder logic tests...');
  const phoneCanvas = 200;

  // Test 1: First touch
  let state = createInitialState();
  state = handleTouchBegin(state, 10, 20, 1000, phoneCanvas, phoneCanvas);
  assert.strictEqual(state.attemptStart, 1000);
  assert.strictEqual(state.activeStroke?.startedAtMs, 0);
  assert.strictEqual(state.activeStroke?.points[0].t, 0);
  console.log('✓ Test 1: First touch sets attemptStart and point.t = 0');

  // Test 2: Immediate touch begin + touch end (one-point stroke preserved)
  state = createInitialState();
  state = handleTouchBegin(state, 50, 50, 2000, phoneCanvas, phoneCanvas);
  state = handleTouchEnd(state, 2000);
  assert.strictEqual(state.strokes.length, 1);
  assert.strictEqual(state.strokes[0].points.length, 1);
  assert.strictEqual(state.strokes[0].startedAtMs, 0);
  assert.strictEqual(state.strokes[0].endedAtMs, 0);
  console.log('✓ Test 2: One-point tap/dot stroke preserved');

  // Test 3 & 4 & 5: Multiple strokes, pause, duration
  state = createInitialState();
  // Stroke 1
  state = handleTouchBegin(state, 10, 10, 5000, phoneCanvas, phoneCanvas); // attemptStart = 5000
  state = handleTouchMove(state, 15, 15, 5050, phoneCanvas, phoneCanvas);  // t = 50
  state = handleTouchEnd(state, 5100);           // t = 100
  
  // Pause for 400ms
  // Stroke 2
  state = handleTouchBegin(state, 20, 20, 5500, phoneCanvas, phoneCanvas); // t = 500
  state = handleTouchMove(state, 25, 25, 5550, phoneCanvas, phoneCanvas);  // t = 550
  state = handleTouchEnd(state, 5600);           // t = 600

  assert.strictEqual(state.strokes.length, 2);
  assert.strictEqual(state.strokes[0].strokeId, 0);
  assert.strictEqual(state.strokes[1].strokeId, 1);
  assert.strictEqual(state.strokes[1].startedAtMs, 500);
  assert.strictEqual(state.strokes[1].points[0].t, 500);
  assert.strictEqual(getDurationMs(state), 600);
  console.log('✓ Test 3, 4, 5: Multiple strokes, pause preserved, duration equals final endedAtMs');

  // Test 6: Clear/reset
  state = handleReset();
  assert.strictEqual(state.attemptStart, null);
  assert.strictEqual(state.strokes.length, 0);
  console.log('✓ Test 6: Reset clears state');

  // Test 7: Cancellation
  state = createInitialState();
  state = handleTouchBegin(state, 10, 10, 1000, phoneCanvas, phoneCanvas);
  state = handleTouchCancel(state);
  assert.strictEqual(state.isCancelled, true);
  assert.strictEqual(state.activeStroke, null);
  
  // Should ignore further touches
  state = handleTouchBegin(state, 20, 20, 1100, phoneCanvas, phoneCanvas);
  assert.strictEqual(state.activeStroke, null);
  console.log('✓ Test 7: Cancellation blocks further input');

  // Test 8: Serialization
  state = createInitialState();
  state = handleTouchBegin(state, 10, 10, 1000, phoneCanvas, phoneCanvas);
  state = handleTouchEnd(state, 1050);
  const json = JSON.stringify(state.strokes);
  const parsed: RecordedStroke[] = JSON.parse(json);
  assert.strictEqual(parsed[0].endedAtMs, 50);
  console.log('✓ Test 8: Serialization succeeds');

  // Test 9: Canvas dimensions are locked at first touch.
  state = createInitialState();
  state = handleTouchBegin(state, 50, 50, 1000, 200, 200);
  state = handleTouchMove(state, 100, 100, 1050, 400, 400);
  assert.strictEqual(state.isCancelled, true);
  console.log('✓ Test 9: Mid-attempt canvas resize invalidates the trace');

  // Test 10: Raw coordinate validation uses the attempt's actual dimensions.
  state = createInitialState();
  state = handleTouchBegin(state, 50, 50, 1000, 200, 200);
  state = handleTouchMove(state, 100, 100, 1050, 200, 200);
  state = handleTouchEnd(state, 1100);
  assert.deepStrictEqual(validateRecordedStrokes(state.strokes, 200, 200), []);
  assert.strictEqual(validateRecordedStrokes(state.strokes, 80, 80).length > 0, true);
  console.log('✓ Test 10: Coordinate bounds are validated against real canvas dimensions');

  // Test 11: Undoing the only stroke resets the attempt coordinate space.
  state = handleUndo(state);
  assert.strictEqual(state.attemptStart, null);
  assert.strictEqual(state.canvasWidth, null);
  assert.strictEqual(state.canvasHeight, null);
  console.log('✓ Test 11: Undo-to-empty resets the locked canvas dimensions');

  console.log('All tests passed!');
}

runTests();
