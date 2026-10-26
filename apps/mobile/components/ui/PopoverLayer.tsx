import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

/** Native overlay has no dimming or blur; only the anchored menu is visible. */
export function PopoverLayer({ children, onDismiss }: React.PropsWithChildren<{ onDismiss: () => void }>) {
  return <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable testID="action-menu-backdrop" accessible={false} style={StyleSheet.absoluteFill} onPress={onDismiss} />
      {children}
    </View>
  </Modal>;
}
