import { useState } from 'react';
import { Platform, type NativeSyntheticEvent, type TargetedEvent } from 'react-native';

/** Show a focus indicator for keyboard navigation, not pointer/touch presses. */
export function useKeyboardFocus() {
  const [focused, setFocused] = useState(false);
  return {
    focused,
    onFocus: (event: NativeSyntheticEvent<TargetedEvent>) => {
      const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
      setFocused(Platform.OS === 'web' && Boolean(target?.matches?.(':focus-visible')));
    },
    onBlur: () => setFocused(false),
    onPressIn: () => setFocused(false),
  };
}
