import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FilipinoLabels } from '../../../constants/filipinoLabels';
import { AppButton } from '../../ui/AppButton';
import { useLoadingEllipsis } from './useLoadingEllipsis';

type WritingNavigationProps = {
  canCheck: boolean;
  canAdvance: boolean;
  hasAttempt: boolean;
  isResult: boolean;
  isLast: boolean;
  analyzing: boolean;
  onCheck: () => void;
  onBackToWriting: () => void;
  onNext: () => void;
  onRetry: () => void;
  compact: boolean;
  dense?: boolean;
};

export function WritingNavigation({ canCheck, canAdvance, hasAttempt, isResult, isLast, analyzing, onBackToWriting, onCheck, onNext, onRetry, compact, dense = false }: WritingNavigationProps) {
  const loadingDots = useLoadingEllipsis(analyzing);
  return <View style={styles.container} testID="writing-navigation">
    {isResult ? <>
      {hasAttempt && <AppButton
        accessibilityLabel={isLast ? 'Bumalik sa mga paksa' : 'Susunod na simbolo'}
        compact={compact}
        disabled={!canAdvance}
        label={isLast ? 'Mga Paksa' : 'Susunod'}
        onPress={onNext}
        style={[styles.resultPrimary, dense && styles.denseResultButton]}
      />}
      <View style={styles.secondaryRow}>
        <AppButton accessibilityLabel="Ulitin ang pagsulat" compact={compact} disabled={!canCheck} fullWidth={false} label="Ulitin" onPress={onRetry} style={[styles.secondaryButton, dense && styles.denseResultButton]} tone="outlinePrimary" />
        <AppButton accessibilityLabel="Bumalik sa naunang simbolo" compact={compact} disabled={!canCheck} fullWidth={false} icon="back" iconPosition="leading" label={FilipinoLabels.back} onPress={onBackToWriting} style={[styles.secondaryButton, styles.backAction, dense && styles.denseResultButton]} tone="outlinePrimary" />
      </View>
    </> : <>
      <AppButton
        accessibilityLabel="Suriin ang isinulat"
        compact={compact}
        disabled={!canCheck || analyzing}
        label={analyzing ? `Sinusuri${loadingDots}` : 'Suriin'}
        onPress={onCheck}
        style={[styles.checkButton, compact && styles.compactCheckButton, dense && styles.denseCheckButton]}
      />
      {hasAttempt && <View style={styles.secondaryRow}>
        <AppButton accessibilityLabel="Ulitin ang pagsulat" compact={compact} disabled={!canCheck} fullWidth={false} label="Ulitin" onPress={onRetry} style={[styles.secondaryButton, dense && styles.denseResultButton]} tone="outlinePrimary" />
        <AppButton accessibilityLabel={isLast ? 'Bumalik sa mga paksa' : 'Susunod na simbolo'} compact={compact} disabled={!canAdvance} fullWidth={false} label={isLast ? 'Mga Paksa' : 'Susunod'} onPress={onNext} style={[styles.secondaryButton, dense && styles.denseResultButton]} />
      </View>}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: 8, width: '100%' },
  checkButton: { height: 64, maxHeight: 64, minHeight: 64 },
  compactCheckButton: { height: 48, maxHeight: 48, minHeight: 48 },
  denseCheckButton: { height: 38, maxHeight: 38, minHeight: 38, paddingHorizontal: 3 },
  resultPrimary: { height: 52, maxHeight: 52, minHeight: 52 },
  denseResultButton: { height: 38, maxHeight: 38, minHeight: 38, paddingHorizontal: 3 },
  secondaryRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between', width: '100%' },
  secondaryButton: { flex: 1, height: 48, maxHeight: 48, minHeight: 48, minWidth: 0 },
  backAction: { flex: 1.5 },
});
