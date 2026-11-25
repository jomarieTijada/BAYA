import { Image, AccessibilityView } from '../../../localization/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type GestureResponderEvent, type ViewStyle } from 'react-native';
import { WRITING_INPUT_LIMITS } from '../../../content/writingCanvasValidation';
import Svg, { Path } from 'react-native-svg';
import { Colors, Radius } from '../../../constants/theme';
import { appendTouchPoint, strokePath, type StrokeData } from '../../../content/writingEngine';

const inside = (point: { x: number; y: number }) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;

export type WritingCanvasSize = { width: number; height: number };

export function WritingCanvas({ strokes, onChange, onStrokeEnd, onSizeChange, hintImage, compact, dense = false, fillHeight = false, disabled = false, targetRef }: { strokes: StrokeData; onChange: (strokes: StrokeData) => void; onStrokeEnd?: (strokes: StrokeData) => void; onSizeChange?: (size: WritingCanvasSize) => void; hintImage?: number; compact: boolean; dense?: boolean; fillHeight?: boolean; disabled?: boolean; targetRef?: React.RefObject<View | null> }) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const working = useRef<StrokeData>(strokes);
  const activeStroke = useRef(false);
  const surface = useRef<View | null>(null);
  const handlers = useRef({ onChange, onStrokeEnd, disabled });
  useEffect(() => { handlers.current = { onChange, onStrokeEnd, disabled }; }, [onChange, onStrokeEnd, disabled]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = surface.current as unknown as HTMLElement;
    if (!element?.addEventListener) return;
    let pointer: number | null = null;
    let frame: number | null = null;
    let bounds: DOMRect;
    const publish = () => { frame = null; handlers.current.onChange(working.current); };
    const flush = () => { if (frame !== null) { cancelAnimationFrame(frame); publish(); } };
    const capture = (event: PointerEvent) => {
      const point = { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height, t: Date.now() };
      if (!inside(point)) { activeStroke.current = false; return; }
      working.current = appendTouchPoint(working.current, point);
    };
    const finish = () => {
      if (pointer === null) return;
      flush(); activeStroke.current = false;
      const ended = pointer; pointer = null;
      if (element.hasPointerCapture(ended)) element.releasePointerCapture(ended);
      handlers.current.onStrokeEnd?.(working.current);
    };
    const down = (event: PointerEvent) => {
      if (pointer !== null) { finish(); return; }
      if (handlers.current.disabled || !event.isPrimary || event.button !== 0) return;
      if (working.current.reduce((n, stroke) => n + stroke.length, 0) >= WRITING_INPUT_LIMITS.maxPoints) return;
      event.preventDefault(); bounds = element.getBoundingClientRect();
      const point = { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height, t: Date.now() };
      if (!inside(point)) return;
      pointer = event.pointerId; activeStroke.current = true;
      element.setPointerCapture(pointer);
      working.current = [...working.current, [point]];
      publish();
    };
    const movePointer = (event: PointerEvent) => {
      if (event.pointerId !== pointer || !activeStroke.current || handlers.current.disabled) return;
      event.preventDefault();
      const samples = event.getCoalescedEvents?.() ?? [];
      for (const sample of samples.length ? samples : [event]) { if (activeStroke.current) capture(sample); }
      if (frame === null) frame = requestAnimationFrame(publish);
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointer) return;
      if (event.type === 'pointerup' && activeStroke.current && !handlers.current.disabled) { capture(event); if (frame === null) frame = requestAnimationFrame(publish); }
      finish();
    };
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', movePointer);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);
    element.addEventListener('lostpointercapture', up);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      element.removeEventListener('pointerdown', down);
      element.removeEventListener('pointermove', movePointer);
      element.removeEventListener('pointerup', up);
      element.removeEventListener('pointercancel', up);
      element.removeEventListener('lostpointercapture', up);
    };
  }, []);
  useEffect(() => { if (!activeStroke.current || !strokes.length) working.current = strokes; if (!strokes.length) activeStroke.current = false; }, [strokes]);
  /*Normalizes coordinates*/
  const touchPointFromEvent = useCallback((event: GestureResponderEvent) => ({ x: event.nativeEvent.locationX / size.width, y: event.nativeEvent.locationY / size.height, t: Date.now() }), [size]);
  const begin = (event: GestureResponderEvent) => { const point = touchPointFromEvent(event); activeStroke.current = false; if (disabled || event.nativeEvent.touches?.length > 1 || !inside(point) || working.current.reduce((n, stroke) => n + stroke.length, 0) >= WRITING_INPUT_LIMITS.maxPoints) return; activeStroke.current = true; working.current = [...working.current, [point]]; onChange(working.current); };
  const move = (event: GestureResponderEvent) => { const point = touchPointFromEvent(event); if (disabled || !activeStroke.current) return; if (event.nativeEvent.touches?.length > 1) { activeStroke.current = false; return; } if (!inside(point)) { activeStroke.current = false; return; } const next = appendTouchPoint(working.current, point); if (next === working.current) return; working.current = next; onChange(next); };
  return <AccessibilityView
    ref={node => { surface.current = node; if (targetRef) targetRef.current = node; }}
    collapsable={false}
    accessibilityLabel="Lugar ng pagsusulat ng Baybayin"
    onLayout={event => {
      const next = { width: Math.max(1, event.nativeEvent.layout.width), height: Math.max(1, event.nativeEvent.layout.height) };
      if (next.width !== size.width || next.height !== size.height) activeStroke.current = false;
      setSize(next);
      onSizeChange?.(next);
    }}
    onMoveShouldSetResponder={() => false}
    onResponderGrant={begin}
    onResponderMove={move}
    onResponderRelease={() => { activeStroke.current = false; onStrokeEnd?.(working.current); }}
    onResponderTerminate={() => { activeStroke.current = false; onStrokeEnd?.(working.current); }}
    onResponderTerminationRequest={() => false}
    onStartShouldSetResponder={() => Platform.OS !== 'web' && !disabled}
    style={[styles.canvas, !fillHeight && ((() => {
      if (compact) {
        return styles.canvasCompact;
      } else {
        return styles.canvasAspect;
      }
    })()), fillHeight && styles.fillHeight, dense && styles.denseCanvas, Platform.OS === 'web' && ({ touchAction: 'none' } as unknown as ViewStyle)]}
    testID="writing-canvas"
  >
    {hintImage !== undefined && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image accessibilityLabel="Malabong gabay para sundan ang simbolo" resizeMode="contain" source={hintImage} style={styles.traceImage} testID="writing-trace-guide" />
    </View>}
    <Svg height="100%" pointerEvents="none" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 1000 1000" width="100%">
      {strokes.map((stroke, index) => <Path key={index} d={strokePath(stroke)} fill="none" stroke={Colors.textPrimary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={(() => {
        if (compact) {
          return 17;
        } else {
          return 13;
        }
      })()} />)}
    </Svg>
  </AccessibilityView>;
}

const styles = StyleSheet.create({
  canvas: { backgroundColor: '#FFFCF6', borderColor: Colors.border, borderRadius: Radius.lg, borderStyle: 'dashed', borderWidth: 2, minHeight: 220, overflow: 'hidden', position: 'relative', width: '100%' },
  canvasAspect: { aspectRatio: 1.55, minHeight: 250 },
  canvasCompact: { aspectRatio: 1.45, minHeight: 220 },
  fillHeight: { flex: 1 },
  denseCanvas: { minHeight: 145 },
  traceImage: { height: '96%', left: '2%', opacity: 0.13, position: 'absolute', top: '2%', width: '96%' },
});
