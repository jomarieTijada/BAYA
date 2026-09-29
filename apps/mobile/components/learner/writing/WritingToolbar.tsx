import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Colors, Radius } from '../../../constants/theme';
import { AppIcon } from '../../ui/AppIcon';

export function WritingToolbar({ onClear, onUndo, canEdit, dense = false }: { onClear: () => void; onUndo: () => void; canEdit: boolean; dense?: boolean }) {
  return <View style={styles.row}>
    <Pressable accessibilityLabel="Bawiin ang huling guhit" accessibilityRole="button" accessibilityState={{ disabled: !canEdit }} disabled={!canEdit} hitSlop={6} onPress={onUndo} style={[styles.button, dense && styles.denseButton, !canEdit && styles.disabled]} testID="writing-undo-button">
      <AppIcon name="undo" color="secondaryText" size={dense ? 18 : 22} />
    </Pressable>
    <Pressable accessibilityLabel="Burahin ang lahat ng guhit" accessibilityRole="button" accessibilityState={{ disabled: !canEdit }} disabled={!canEdit} hitSlop={6} onPress={onClear} style={[styles.button, dense && styles.denseButton, !canEdit && styles.disabled]} testID="writing-clear-button">
      <AppIcon name="trash" color="accent" size={dense ? 18 : 22} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  button: { alignItems: 'center', backgroundColor: '#FFF9EF', borderColor: Colors.border, borderRadius: Radius.md, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  denseButton: { height: 34, width: 34 },
  disabled: { opacity: 0.5 },
});
