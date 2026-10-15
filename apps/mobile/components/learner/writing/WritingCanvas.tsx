import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View, type GestureResponderEvent, type ViewStyle } from 'react-native';
import { WRITING_INPUT_LIMITS } from '../../../content/writingCanvasValidation';
import Svg, { Path } from 'react-native-svg';
import { Colors, Radius } from '../../../constants/theme';
import { appendStrokePoint, strokePath, type StrokeData } from '../../../content/writingEngine';

export type WritingCanvasSize = { width: number; height: number };

export function WritingCanvas({ strokes, onChange, onSizeChange, hintImage, compact, dense = false, fillHeight = false, disabled = false }: { strokes: StrokeData; onChange: (strokes: StrokeData) => void; onSizeChange?: (size: WritingCanvasSize) => void; hintImage: number; compact: boolean; dense?: boolean; fillHeight?: boolean; disabled?: boolean }) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const working = useRef<StrokeData>(strokes);
  const activeStroke = useRef(false);
  useEffect(() => { working.current = strokes; if (!strokes.length) activeStroke.current = false; }, [strokes]);
  const pointFromEvent = useCallback((event: GestureResponderEvent) => ({ x: event.nativeEvent.locationX / size.width, y: event.nativeEvent.locationY / size.height, t: Date.now() }), [size]);
  const inside = (point: { x: number; y: number }) => Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
  const begin = (event: GestureResponderEvent) => { const point = pointFromEvent(event); activeStroke.current = false; if (disabled || !inside(point) || working.current.reduce((n, stroke) => n + stroke.length, 0) >= WRITING_INPUT_LIMITS.maxPoints) return; activeStroke.current = true; working.current = [...working.current, [point]]; onChange(working.current); };
  const move = (event: GestureResponderEvent) => { const point = pointFromEvent(event); if (disabled || !activeStroke.current) return; if (!inside(point)) { activeStroke.current = false; return; } const next = appendStrokePoint(working.current, point); if (next === working.current) return; working.current = next; onChange(next); };
  return <View
    accessibilityLabel="Lugar ng pagsusulat ng Baybayin"
    onLayout={event => {
      const next = { width: Math.max(1, event.nativeEvent.layout.width), height: Math.max(1, event.nativeEvent.layout.height) };
      setSize(next);
      onSizeChange?.(next);
    }}
    onMoveShouldSetResponder={() => false}
    onResponderGrant={begin}
    onResponderMove={move}
    onResponderRelease={() => { activeStroke.current = false; }}
    onResponderTerminate={() => { activeStroke.current = false; }}
    onResponderTerminationRequest={() => false}
    onStartShouldSetResponder={() => !disabled}
    style={[styles.canvas, !fillHeight && (compact ? styles.canvasCompact : styles.canvasAspect), fillHeight && styles.fillHeight, dense && styles.denseCanvas, Platform.OS === 'web' && ({ touchAction: 'none' } as unknown as ViewStyle)]}
    testID="writing-canvas"
  >
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image accessibilityLabel="Malabong gabay para sundan ang simbolo" resizeMode="contain" source={hintImage} style={styles.traceImage} testID="writing-trace-guide" />
    </View>
    <Svg height="100%" pointerEvents="none" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 1000 1000" width="100%">
      {strokes.map((stroke, index) => <Path key={index} d={strokePath(stroke)} fill="none" stroke={Colors.textPrimary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={compact ? 17 : 13} />)}
    </Svg>
  </View>;
}

const styles = StyleSheet.create({
  canvas: { backgroundColor: '#FFFCF6', borderColor: Colors.border, borderRadius: Radius.lg, borderStyle: 'dashed', borderWidth: 2, minHeight: 220, overflow: 'hidden', position: 'relative', width: '100%' },
  canvasAspect: { aspectRatio: 1.55, minHeight: 250 },
  canvasCompact: { aspectRatio: 1.45, minHeight: 220 },
  fillHeight: { flex: 1 },
  denseCanvas: { minHeight: 145 },
  traceImage: { height: '96%', left: '2%', opacity: 0.13, position: 'absolute', top: '2%', width: '96%' },
});
