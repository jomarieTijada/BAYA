import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, StyleSheet, View, type GestureResponderEvent, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, Radius } from '../../../constants/theme';
import { appendStrokePoint, clampPoint, strokePath, type StrokeData } from '../../../content/writingEngine';

export type WritingCanvasSize = { width: number; height: number };

export function WritingCanvas({ strokes, onChange, onSizeChange, hintImage, compact, dense = false, fillHeight = false }: { strokes: StrokeData; onChange: (strokes: StrokeData) => void; onSizeChange?: (size: WritingCanvasSize) => void; hintImage: number; compact: boolean; dense?: boolean; fillHeight?: boolean }) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const working = useRef<StrokeData>(strokes);
  useEffect(() => { working.current = strokes; }, [strokes]);
  const pointFromEvent = useCallback((event: GestureResponderEvent) => clampPoint(event.nativeEvent.locationX / size.width, event.nativeEvent.locationY / size.height, Date.now()), [size]);
  const begin = (event: GestureResponderEvent) => { working.current = [...working.current, [pointFromEvent(event)]]; onChange(working.current); };
  const move = (event: GestureResponderEvent) => { working.current = appendStrokePoint(working.current, pointFromEvent(event)); onChange(working.current); };
  return <View
    accessibilityLabel="Lugar ng pagsusulat ng Baybayin"
    onLayout={event => {
      const next = { width: Math.max(1, event.nativeEvent.layout.width), height: Math.max(1, event.nativeEvent.layout.height) };
      setSize(next);
      onSizeChange?.(next);
    }}
    onMoveShouldSetResponder={() => true}
    onResponderGrant={begin}
    onResponderMove={move}
    onResponderTerminationRequest={() => false}
    onStartShouldSetResponder={() => true}
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
