import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Radius } from '../../../constants/theme';
import { AppButton } from '../../ui/AppButton';
import { useLoadingEllipsis } from './useLoadingEllipsis';

export type WritingActionPhase = 'ready' | 'checking' | 'retry' | 'complete';
type WritingNavigationProps = {
  phase: WritingActionPhase;
  busy: boolean;
  canCheck: boolean;
  canEdit: boolean;
  canAdvance: boolean;
  isLast: boolean;
  targetRef?: React.RefObject<View | null>;
  onCheck: () => void;
  onNext: () => void;
  onRetry: () => void;
  compact: boolean;
};

/** Exactly one primary next action, derived from the authoritative screen state. */
export function WritingNavigation({ phase, busy, canCheck, canEdit, canAdvance, isLast, targetRef, onCheck, onNext, onRetry, compact }: WritingNavigationProps) {
  const loadingDots = useLoadingEllipsis(busy);
  let primary;
  if (phase === 'complete') {
    primary = { label: (() => {
      if (busy) {
        return `Sandali${loadingDots}`;
      } else {
        if (isLast) {
          return 'Mga Paksa';
        } else {
          return 'Susunod';
        }
      }
    })(), accessibilityLabel: (() => {
      if (isLast) {
        return 'Bumalik sa mga paksa';
      } else {
        return 'Susunod na simbolo';
      }
    })(), onPress: onNext, disabled: !canAdvance || busy };
  } else {
    if (phase === 'retry') {
      primary = { label: 'Ulitin', accessibilityLabel: 'Ulitin ang pagsulat', onPress: onRetry, disabled: !canEdit || busy };
    } else {
      primary = { label: (() => {
        if (phase === 'checking') {
          return `Sinusuri${loadingDots}`;
        } else {
          return 'Suriin';
        }
      })(), accessibilityLabel: 'Suriin ang isinulat', onPress: onCheck, disabled: !canCheck || busy };
    }
  }
  return <View ref={targetRef} collapsable={false} style={styles.container} testID="writing-navigation">
    <AppButton {...primary} compact fullWidth={false} style={[styles.action, compact && styles.compactAction]} />
  </View>;
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', flexShrink: 0, maxWidth: 280, width: '100%' },
  action: { width: '100%', minWidth: 0, height: 48, minHeight: 48, maxHeight: 48, paddingHorizontal: 12, borderWidth: 2, borderRadius: Radius.lg },
  compactAction: { height: 44, minHeight: 44, maxHeight: 44 },
});
