import React, { useState } from 'react';
import { router } from 'expo-router';
import { useCloudServices } from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { BayaActionMenu, type MenuGroup } from '../ui/BayaActionMenu';
import { BayaDialog } from '../ui/BayaDialog';

export function MentorActionMenu({ groups = [], label = 'Settings' }: { groups?: MenuGroup[]; label?: string }) {
  const services = useCloudServices();
  const op = useOperation();
  const [confirm, setConfirm] = useState(false);
  return <>
    <BayaActionMenu label={label} groups={[...groups, { label: 'Account', actions: [
      { label: 'Log Out', icon: 'arrowRight', disabled: !services.auth.signOut || op.busy, onPress: () => { op.setMessage(''); setConfirm(true); } },
    ] }]} />
    <BayaDialog visible={confirm} title="Log out of BAYA?" description="You can log in again to manage your workspaces."
      detail={op.message || 'Learning progress saved on this device stays here when you log out.'}
      onDismiss={() => { if (!op.busy) setConfirm(false); }}
      primaryAction={{ label: 'YES, LOG OUT', loading: op.busy, disabled: !services.auth.signOut, onPress: () => {
        if (!services.auth.signOut) return;
        void op.run(() => services.auth.signOut!(), () => { setConfirm(false); router.replace('/mentor'); });
      } }}
      secondaryAction={{ label: 'CANCEL', onPress: () => setConfirm(false) }} />
  </>;
}
