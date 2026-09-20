/**
 * apps/mobile/src/components/StrokeReplayCanvas.tsx
 *
 * Debug/developer component that animates a saved HandwritingAttempt replay.
 *
 * Design rules:
 *   - Each stroke is rendered as a SEPARATE SkPath so strokes are never
 *     connected by a line (a new moveTo begins each stroke).
 *   - Replay speed matches original timing using RecordedStroke point.t deltas.
 *   - Shows targetClass, observedClass, and reviewStatus to prove the label
 *     stayed attached to the telemetry across persistence.
 *   - No navigation — renders inline below the practice canvas.
 *   - Replay restarts automatically when the `attempt` prop changes.
 *
 * Skia path rendering approach:
 *   We maintain one SkPath per stroke in a SharedValue<SkPath[]>.
 *   To avoid calling useDerivedValue inside .map() (which violates React's
 *   Rules of Hooks), each stroke's path is rendered by a <ReplayStrokePath>
 *   sub-component that owns exactly one useDerivedValue call at the top level.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Canvas, Path, Fill, Skia } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { HandwritingAttempt, RecordedStroke } from '@baya/shared-types';
import type { SkPath } from '@shopify/react-native-skia';

// ---------------------------------------------------------------------------
// Sub-component — one Path per stroke, owns its own useDerivedValue
// ---------------------------------------------------------------------------

interface ReplayStrokePathProps {
  strokePaths: SharedValue<SkPath[]>;
  index:       number;
  width?:      number;
}

/**
 * Renders a single stroke path. Each instance owns exactly one
 * useDerivedValue so React's Rules of Hooks are respected.
 */
function ReplayStrokePath({ strokePaths, index, width = 350 }: ReplayStrokePathProps) {
  const animatedPath = useDerivedValue(() => {
    const p = strokePaths.value[index];
    return p ?? Skia.Path.Make();
  });

  return (
    <Path
      path={animatedPath}
      color="#C9B8FF"
      style="stroke"
      strokeWidth={Math.max(4, (width / 350) * 12)}
      strokeCap="round"
      strokeJoin="round"
    />
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StrokeReplayCanvasProps {
  attempt?: HandwritingAttempt;
  strokes?: RecordedStroke[];
  width?:  number;
  height?: number;
  sourceWidth?: number;
  sourceHeight?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimum delay between rendered points (ms). Prevents invisible instant jumps. */
const MIN_POINT_DELAY_MS = 16;

/** Scale factor applied to original timing for comfortable viewing speed. */
const REPLAY_SPEED = 1.0; // 1.0 = real speed; <1.0 = faster

/**
 * Flatten all strokes into an ordered list of "draw actions" for replay.
 */
interface DrawAction {
  type:      'begin' | 'point';
  strokeIdx: number;
  x:         number;
  y:         number;
  delayMs:   number;
}

function buildDrawActions(
  strokes: RecordedStroke[],
  scaleX = 1,
  scaleY = 1,
  offsetX = 0,
  offsetY = 0,
): DrawAction[] {
  const actions: DrawAction[] = [];

  for (let si = 0; si < strokes.length; si++) {
    const stroke = strokes[si];
    if (stroke == null || stroke.points.length === 0) continue;

    for (let pi = 0; pi < stroke.points.length; pi++) {
      const point = stroke.points[pi];
      if (point == null) continue;

      if (pi === 0) {
        // First point of stroke — moveTo action.
        const prevStroke = si > 0 ? strokes[si - 1] : null;
        const prevLastT  =
          prevStroke != null && prevStroke.points.length > 0
            ? (prevStroke.points[prevStroke.points.length - 1]?.t ?? 0)
            : 0;
        const interStrokeDelay =
          si === 0
            ? 0
            : Math.max(MIN_POINT_DELAY_MS, (point.t - prevLastT) * REPLAY_SPEED);

        actions.push({
          type:      'begin',
          strokeIdx: si,
          x:         (point.x * scaleX) + offsetX,
          y:         (point.y * scaleY) + offsetY,
          delayMs:   interStrokeDelay,
        });
      } else {
        // Subsequent points — lineTo action.
        const prevT   = stroke.points[pi - 1]?.t ?? point.t;
        const delayMs = Math.max(MIN_POINT_DELAY_MS, (point.t - prevT) * REPLAY_SPEED);
        actions.push({
          type:      'point',
          strokeIdx: si,
          x:         (point.x * scaleX) + offsetX,
          y:         (point.y * scaleY) + offsetY,
          delayMs,
        });
      }
    }
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StrokeReplayCanvas({
  attempt,
  strokes: strokesProp,
  width  = 350,
  height = 350,
  sourceWidth,
  sourceHeight,
}: StrokeReplayCanvasProps) {
  const strokes = attempt?.strokes ?? strokesProp ?? [];
  const strokeCount = strokes.length;
  const originalWidth = sourceWidth ?? attempt?.canvasWidth ?? width;
  const originalHeight = sourceHeight ?? attempt?.canvasHeight ?? height;
  const scale = originalWidth > 0 && originalHeight > 0
    ? Math.min(width / originalWidth, height / originalHeight)
    : 1;
  const offsetX = (width - (originalWidth * scale)) / 2;
  const offsetY = (height - (originalHeight * scale)) / 2;

  // Shared value holds one SkPath per stroke.
  const strokePaths = useSharedValue<SkPath[]>(
    Array.from({ length: strokeCount }, () => Skia.Path.Make())
  );

  // Timer ref to cancel an in-progress replay when attempt changes.
  const replayTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReplayingRef  = useRef(false);

  const startReplay = useCallback(() => {
    // Cancel any existing replay.
    if (replayTimerRef.current != null) clearTimeout(replayTimerRef.current);
    isReplayingRef.current = false;

    // Reset all paths to empty.
    strokePaths.value = Array.from(
      { length: strokes.length },
      () => Skia.Path.Make()
    );

    const actions = buildDrawActions(strokes, scale, scale, offsetX, offsetY);
    if (actions.length === 0) return;

    isReplayingRef.current = true;
    let actionIdx = 0;

    function scheduleNext() {
      if (!isReplayingRef.current || actionIdx >= actions.length) return;

      const action = actions[actionIdx];
      if (action == null) { actionIdx++; scheduleNext(); return; }

      replayTimerRef.current = setTimeout(() => {
        if (!isReplayingRef.current) return;

        const currentPaths = strokePaths.value;
        const strokePath   = currentPaths[action.strokeIdx];
        if (strokePath == null) { actionIdx++; scheduleNext(); return; }

        // Copy + mutate + reassign array to trigger Reanimated update.
        const pathCopy = strokePath.copy();
        if (action.type === 'begin') {
          pathCopy.moveTo(action.x, action.y);
        } else {
          pathCopy.lineTo(action.x, action.y);
        }

        const nextPaths = [...currentPaths];
        nextPaths[action.strokeIdx] = pathCopy;
        // Assign a fresh array reference so Reanimated detects the change.
        strokePaths.value = nextPaths;

        actionIdx++;
        scheduleNext();
      }, action.delayMs);
    }

    scheduleNext();
  }, [offsetX, offsetY, scale, strokes, strokePaths]);

  // Start replay whenever `strokes` changes.
  useEffect(() => {
    startReplay();
    return () => {
      if (replayTimerRef.current != null) clearTimeout(replayTimerRef.current);
      isReplayingRef.current = false;
    };
  }, [startReplay]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Metadata — proves label survived persistence */}
      {attempt && (
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>
            Replay  •  Target:{' '}
            <Text style={styles.infoValue}>{attempt.targetClass}</Text>
            {'  '}Observed:{' '}
            <Text style={styles.infoValue}>
              {attempt.observedClass ?? 'null'}
            </Text>
            {'  '}Status:{' '}
            <Text style={styles.infoValue}>{attempt.reviewStatus}</Text>
          </Text>
        </View>
      )}

      {/* Replay canvas */}
      <View style={[styles.canvasContainer, { width, height }]}>
        <Canvas style={{ width, height }}>
          <Fill color="white" />
          {/*
           * One <ReplayStrokePath> per stroke. Each sub-component owns its own
           * useDerivedValue — never called inside .map() in this component,
           * which would violate React's Rules of Hooks.
           */}
          {Array.from({ length: strokeCount }, (_, idx) => (
            <ReplayStrokePath
              key={idx}
              strokePaths={strokePaths}
              index={idx}
              width={width}
            />
          ))}
        </Canvas>
      </View>

      {/* Replay button */}
      <TouchableOpacity
        style={styles.replayButton}
        onPress={startReplay}
        activeOpacity={0.75}
      >
        <Text style={styles.replayButtonText}>▶  Replay</Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const PURPLE_MID = '#9A8FC0';
const PURPLE_DIM = '#5A5080';
const BTN_BG     = '#3D3560';
const BTN_TEXT   = '#E8E0FF';
const CANVAS_BG  = '#1C1630';
const BORDER_CLR = '#4A3F7A';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  infoRow: {
    backgroundColor: '#1A1530',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E2850',
    paddingVertical: 6,
    paddingHorizontal: 12,
    maxWidth: 370,
    width: '100%',
  },
  infoText: {
    color: PURPLE_DIM,
    fontSize: 11,
    lineHeight: 16,
  },
  infoValue: {
    color: PURPLE_MID,
    fontWeight: '600',
  },
  canvasContainer: {
    backgroundColor: CANVAS_BG,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BORDER_CLR,
    overflow: 'hidden',
  },
  replayButton: {
    backgroundColor: BTN_BG,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  replayButtonText: {
    color: BTN_TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
});
