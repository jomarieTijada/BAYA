import React from 'react';
import { Platform, View } from 'react-native';
import { Text } from '../../../localization/components';
import { AppButton } from '../../ui/AppButton';
import { OfflinePackageDetails, useOfflinePackage } from '../OfflinePackageProvider';

export function OfflinePreparation({ compact = false }: { compact?: boolean }) {
  const { state, run, checkUpdate, update } = useOfflinePackage();
  if (Platform.OS !== 'web' || __DEV__) return null;
  const busy = ['preparing', 'verifying', 'downloading', 'validating'].includes(state.phase);
  return <View style={{ padding: compact ? 8 : 16, gap: 12 }}>
    <Text accessibilityRole="header">Offline Learning Resources</Text>
    <OfflinePackageDetails compact={compact} />
    <AppButton accessibilityLabel="Verify Offline Files" label="Verify Offline Files" disabled={busy} onPress={() => run(false)} />
    <AppButton accessibilityLabel="Repair Missing Files" label="Repair Missing Files" disabled={busy} onPress={() => run(true)} />
    <AppButton accessibilityLabel="Download Latest Resources" label="Download Latest Resources" disabled={busy} onPress={checkUpdate} />
    {!!update && <Text>{update}</Text>}
  </View>;
}
