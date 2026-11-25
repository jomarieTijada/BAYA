import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../ui/AppButton';

export function StoryNavigation({
  onPrevious,
  onNext,
  isLast,
  previousAccessibilityLabel,
  nextAccessibilityLabel,
  nextLabel,
  disabled = false,
}: {
  onPrevious?: () => void;
  onNext: () => void;
  isLast: boolean;
  previousAccessibilityLabel?: string;
  nextAccessibilityLabel?: string;
  nextLabel?: string;
  disabled?: boolean;
}) {

  return (
    <View
      pointerEvents="box-none"
      style={styles.navigation}
      testID="story-navigation"
    >
      <AppButton
        accessibilityLabel={previousAccessibilityLabel ?? 'Bumalik sa nakaraang paksa'}
        compact
        disabled={disabled || !onPrevious}
        fullWidth={false}
        label=""
        icon="chevronLeft"
        tone="outlinePrimary"
        onPress={() => onPrevious?.()}
        pill
        style={styles.button}
      />
      <AppButton
        accessibilityLabel={nextAccessibilityLabel ?? nextLabel ?? ((() => {
          if (isLast) {
            return 'Bumalik sa mga paksa';
          } else {
            return 'Susunod na paksa';
          }
        })())}
        compact
        disabled={disabled}
        fullWidth={false}
        label=""
        icon={isLast ? "check" : "chevronRight"}
        onPress={onNext}
        pill
        style={styles.button}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  navigation: { position: 'absolute', left: 5, right: 5, top: '50%', marginTop: -20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 6 },
  button: { width: 38, height: 40, minHeight: 40, paddingHorizontal: 0, borderWidth: 1 },
});
