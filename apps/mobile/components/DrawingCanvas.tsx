/**
 * apps/mobile/components/DrawingCanvas.tsx
 *
 * Interactive Baybayin handwriting canvas.
 *
 * Architecture (Principle 4 — Testability):
 *   - The Skia path (visual ink) and the telemetry array are completely
 *     separate concerns. The `skiaPath` shared value drives the GPU render.
 *     The `telemetryRef` accumulates raw [x, y, t] points that are passed to
 *     the ML inference pipeline via the `onStrokeEnd` callback — which can be
 *     unit-tested independently of the React render lifecycle.
 *
 * Gesture threading:
 *   RNGH 3.x exposes `.runOnJS(true)` as a method on BaseGesture to force
 *   gesture callbacks to execute on the JS thread. We call this explicitly
 *   so the intent is clear and future-proof against any RNGH thread changes.
 *
 * Skia path reactivity:
 *   `useSharedValue<SkPath>` holds the accumulated ink path. Because SkPath
 *   is a mutable JSI object, we call `.copy()` on each gesture event and
 *   reassign `.value` to signal Reanimated that the value changed and the
 *   Skia Canvas should re-render. We also call `.setIsVolatile(true)` on
 *   fresh paths to hint to Skia that the path will be modified frequently,
 *   improving rasterisation performance during a live drawing session.
 *
 * Slice 2 additions (minimal — no existing behaviour changed):
 *   - forwardRef exposes DrawingCanvasHandle { captureImage, clear }
 *   - useCanvasRef() kept private inside the component
 *   - <Fill color="white"/> added as first Skia child (white background in captures)
 *   - Optional onGestureBegin/Move/End props for attempt-level recording
 *   - makeImageSnapshotAsync() used for async PNG capture
 *   - Existing onStrokeEnd callback unchanged
 */

import React, { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  type ViewStyle,
} from 'react-native';
import {
  Canvas,
  Path,
  Fill,
  Skia,
  ImageFormat,
  useCanvasRef,
  PaintStyle,
  StrokeCap,
  StrokeJoin,
  useImage,
  Image,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  type GestureStateChangeEvent,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import type { StrokePoint, BaybayinClass, RecordedStroke } from '@baya/shared-types';
import { BAYBAYIN_REFERENCE_IMAGES } from '../src/data/baybayinReferenceImages';

// ---------------------------------------------------------------------------
// Public handle (Slice 2)
// ---------------------------------------------------------------------------

/**
 * Imperative handle exposed via forwardRef.
 * Skia internals are NOT leaked — only plain JS types are returned.
 */
export interface DrawingCanvasHandle {
  /**
   * Capture the current canvas content as a PNG Uint8Array.
   *
   * The canvas includes a white <Fill /> background beneath all ink, so the
   * captured PNG has a clean white background regardless of the parent view's
   * background colour.
   *
   * Returns null if the canvas ref is not yet attached or snapshot fails.
   */
  captureImage: () => Promise<Uint8Array | null>;
  /** Clears the canvas ink visually. */
  clear: () => void;
  /** Redraws the canvas from a given set of strokes (used for undo). */
  redraw: (strokes: RecordedStroke[]) => void;
  /** Checks if the canvas has any ink */
  hasInk: () => boolean;
  /** Returns the logical-pixel dimensions used by touch input and capture. */
  getDimensions: () => CanvasDimensions;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DrawingCanvasProps {
  /** Called when the user lifts their finger at the end of a stroke. */
  onStrokeEnd?: (telemetry: StrokePoint[]) => void;
  /** Called when the internal clear button is tapped. */
  onClear?: () => void;
  /** Real rendered canvas width in logical pixels. */
  width: number;
  /** Real rendered canvas height in logical pixels. */
  height: number;
  /** Optional override style for the outer container. */
  containerStyle?: ViewStyle;

  /** Should the target guide be displayed? */
  showGuide?: boolean;
  /** The class string to find the guide for (e.g. 'ba') */
  targetClass?: string;

  // ── Slice 2 — attempt-level gesture callbacks (all optional) ──────────────

  /**
   * Called on touch-down (pan gesture begin) with the initial canvas coordinates.
   * Use this to signal the start of a new stroke to the parent's recorder.
   */
  onGestureBegin?: (x: number, y: number, width: number, height: number) => void;

  /**
   * Called on touch-move (pan gesture change) with updated canvas coordinates.
   * Use this to append points to the parent's recorder.
   */
  onGestureMove?: (x: number, y: number, width: number, height: number) => void;

  /**
   * Called on touch-up (pan gesture end).
   * Use this to finalize the current stroke in the parent's recorder.
   */
  onGestureEnd?: () => void;

  /**
   * Called when the gesture is interrupted or cancelled by the system.
   * Use this to mark the current attempt as invalid.
   */
  onGestureCancel?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas(
    {
      onStrokeEnd,
      width,
      height,
      containerStyle,
      showGuide = true,
      targetClass = '',
      onGestureBegin,
      onGestureMove,
      onGestureEnd,
      onGestureCancel,
      onClear,
    },
    ref,
  ) {
    // Determine the correct reference image asset using the statically mapped registry
    const validClass = targetClass.toLowerCase() as BaybayinClass;
    const guideAssetId = BAYBAYIN_REFERENCE_IMAGES[validClass] ?? null;
    
    // useImage handles loading the static require() asset into a Skia Image.
    // It returns null while loading, which safely hides the guide until ready.
    const guideImage = useImage(guideAssetId);
    // ── Visual state (drives Skia GPU render) ──────────────────────────────
    // A single accumulated SkPath that grows as the user draws.
    // We mark it volatile so Skia skips the immutable-path cache.
    const skiaPath = useSharedValue(
      Skia.Path.Make().setIsVolatile(true)
    );

    // Pipe the shared value into a derived value that Skia's <Path> can consume.
    // useDerivedValue re-evaluates on the UI thread whenever skiaPath.value changes.
    const animatedPath = useDerivedValue(() => skiaPath.value);

    // ── Canvas ref (Slice 2 — private, not leaked to callers) ─────────────
    const canvasRef = useCanvasRef();

    // ── Telemetry state (drives ML inference) ─────────────────────────────
    // Plain ref — no re-renders needed, no Reanimated overhead.
    // Stores the points of the *current stroke* only.
    // Reset on each onBegin so that onStrokeEnd receives a clean single-stroke array.
    const telemetryRef = useRef<StrokePoint[]>([]);

    // ── Pan gesture ───────────────────────────────────────────────────────
      
    const panGesture = Gesture.Pan()
      .runOnJS(true)                   // explicit JS-thread execution (RNGH 3.x method)
      .minDistance(0)                  // activate immediately on touch-down
      .onBegin((e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        // Start of a new stroke — reset the telemetry buffer.
        telemetryRef.current = [];

        // Copy the existing path so Reanimated detects a value change,
        // then add the opening moveTo for this stroke.
        const next = skiaPath.value.copy();
        next.moveTo(e.x, e.y);
        skiaPath.value = next;

        telemetryRef.current.push({ x: e.x, y: e.y, t: Date.now() });

        // Slice 2 — notify parent recorder of gesture begin.
        onGestureBegin?.(e.x, e.y, width, height);
      })
      .onChange((e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
        // Extend the path with a line segment to the latest pointer position.
        const next = skiaPath.value.copy();
        next.lineTo(e.x, e.y);
        skiaPath.value = next;

        telemetryRef.current.push({ x: e.x, y: e.y, t: Date.now() });

        // Slice 2 — notify parent recorder of gesture move.
        onGestureMove?.(e.x, e.y, width, height);
      })
      .onEnd((_e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        // Deliver the completed stroke telemetry to the parent.
        // The path stays on screen so multi-stroke characters accumulate.
        onStrokeEnd?.(telemetryRef.current);

        // Slice 2 — notify parent recorder of gesture end.
        onGestureEnd?.();
      })
      .onFinalize((_e, success) => {
        if (success) {
          // In RNGH v2+, onEnd fires first on success.
          // But if onEnd somehow skipped, this idempotent call ensures the stroke is saved.
          onStrokeEnd?.(telemetryRef.current);
          onGestureEnd?.();
        } else {
          // The gesture failed or was cancelled by the system.
          onGestureCancel?.();
        }
      })
      .onTouchesCancelled(() => {
        // Slice 2 — notify parent of cancellation.
        onGestureCancel?.();
      });

    // ── Clear ─────────────────────────────────────────────────────────────
    const handleClear = useCallback(() => {
      // Replace with a fresh volatile path — both ink and telemetry reset.
      skiaPath.value = Skia.Path.Make().setIsVolatile(true);
      telemetryRef.current = [];
      onClear?.();
    }, [skiaPath, onClear]);

    const handleRedraw = useCallback((strokes: RecordedStroke[]) => {
      const nextPath = Skia.Path.Make().setIsVolatile(true);
      for (const stroke of strokes) {
        if (stroke.points.length > 0) {
          nextPath.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            nextPath.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
        }
      }
      skiaPath.value = nextPath;
      telemetryRef.current = []; // current stroke being drawn is reset
    }, [skiaPath]);

    useImperativeHandle(ref, () => ({
      captureImage: async (): Promise<Uint8Array | null> => {
        try {
          // Off-screen render ensures we only capture the drawn strokes
          // and a clean white background, completely ignoring UI guides!
          // A PNG has integer pixel dimensions. The path remains in the same
          // logical coordinate space as the gesture data and is scaled only
          // for the sub-pixel rounding needed by the raster surface.
          const pixelWidth = Math.max(1, Math.round(width));
          const pixelHeight = Math.max(1, Math.round(height));
          const surface = Skia.Surface.Make(pixelWidth, pixelHeight);
          if (!surface) return null;

          const canvas = surface.getCanvas();
          canvas.clear(Skia.Color('white'));
          canvas.scale(pixelWidth / width, pixelHeight / height);

          const paint = Skia.Paint();
          paint.setColor(Skia.Color('black')); // Save as black strokes for ML
          paint.setStyle(PaintStyle.Stroke);
          paint.setStrokeWidth(getStrokeWidth(width, height));
          paint.setStrokeCap(StrokeCap.Round);
          paint.setStrokeJoin(StrokeJoin.Round);

          canvas.drawPath(skiaPath.value, paint);
          surface.flush();

          const image = surface.makeImageSnapshot();
          return image.encodeToBytes(ImageFormat.PNG);
        } catch (e) {
          console.warn('[DrawingCanvas] captureImage failed:', e);
          return null;
        }
      },
      clear: handleClear,
      redraw: handleRedraw,
      hasInk: () => !skiaPath.value.isEmpty(),
      getDimensions: () => ({ width, height }),
    }), [handleClear, handleRedraw, skiaPath, width, height]);

    // ── Render ────────────────────────────────────────────────────────────
    return (
      <GestureHandlerRootView style={styles.root}>
        {/* Writing pad */}
        <View style={[styles.canvasContainer, { width, height }, containerStyle]}>
          <GestureDetector gesture={panGesture}>
            {/*
             * The Canvas must be the *direct* child of GestureDetector
             * so that RNGH can attach its touch responder to the same
             * native view that Skia renders into.
             */}
            <Canvas ref={canvasRef} style={{ width, height }}>
              {/*
               * White background fill — MUST be the first child so it renders
               * beneath all ink paths.
               */}
              <Fill color="white" />

              {/* 
               * Trace Guide Layer
               * Rendered beneath user strokes. Only drawn on screen, 
               * ignored by off-screen captureImage.
               * opacity is 0.25 so it's a faint ghost reference.
               */}
              {showGuide && guideImage && (
                <Image
                  image={guideImage}
                  x={width * (40 / 350)}
                  y={height * (40 / 350)}
                  width={width * (270 / 350)}
                  height={height * (270 / 350)}
                  opacity={0.25}
                  fit="contain"
                />
              )}

              {/* User Ink Layer */}
              <Path
                path={animatedPath}
                color="black"
                style="stroke"
                strokeWidth={getStrokeWidth(width, height)}
                strokeCap="round"
                strokeJoin="round"
              />
            </Canvas>
          </GestureDetector>

          {/* Grid overlay hint — decorative, helps users centre their strokes */}
          <View style={styles.crosshairH} pointerEvents="none" />
          
          <View style={styles.crosshairV} pointerEvents="none" />
        </View>

        
      </GestureHandlerRootView>


    );
  }
);

export default DrawingCanvas;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CANVAS_BG   = '#1C1630';   // deep indigo — writing pad background
const BORDER_CLR  = '#4A3F7A';   // muted violet border
const GRID_CLR    = '#2A2245';   // subtle grid lines
const BTN_BG      = '#3D3560';
const BTN_TEXT    = '#E8E0FF';
const STROKE_WIDTH_RATIO = 12 / 350;

function getStrokeWidth(width: number, height: number): number {
  return Math.min(18, Math.max(4, Math.min(width, height) * STROKE_WIDTH_RATIO));
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 16,
  },

  // ── Writing pad ──────────────────────────────────────────────────────
  canvasContainer: {
    backgroundColor: CANVAS_BG,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: BORDER_CLR,
    overflow: 'hidden',
    // Subtle inner shadow simulation via elevation (Android) / shadow (iOS)
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },

  // ── Decorative centre-line guides ─────────────────────────────────────
  crosshairH: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: GRID_CLR,
  },
  crosshairV: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: GRID_CLR,
  },

  // ── Clear button ─────────────────────────────────────────────────────
  clearButton: {
    backgroundColor: BTN_BG,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  clearButtonText: {
    color: BTN_TEXT,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
