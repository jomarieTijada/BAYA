import React, { useState } from 'react';
import { router } from 'expo-router';
import { useCloudServices } from '../../modules/cloud/services';
import { useOperation } from '../../modules/cloud/useOperation';
import { BayaActionMenu, type MenuGroup } from '../ui/BayaActionMenu';
import { BayaDialog } from '../ui/BayaDialog';

export function LearnerActionMenu({ groups }: { groups: MenuGroup[] }) {
  const services = useCloudServices();
  const op = useOperation();
  const [confirm, setConfirm] = useState(false);
  return <>
    <BayaActionMenu label="Settings" groups={[...groups, { label: 'Session', actions: [
      { label: 'Log Out', icon: 'arrowRight', onPress: () => { op.setMessage(''); setConfirm(true); } },
    ] }]} />
    <BayaDialog visible={confirm} title="Leave your learner session?"
      description="Your learning progress stays saved on this device."
      detail={op.message || 'Email accounts will be signed out. Device-only learners return to the start screen with workspace access saved on this device.'}
      onDismiss={() => { if (!op.busy) setConfirm(false); }}
      primaryAction={{ label: 'YES, LOG OUT', loading: op.busy, onPress: () => {
        void op.run(async () => {
          if (!services.learnerAuth) return { ok: true as const, data: undefined };
          const session = await services.learnerAuth.session();
          if (!session.ok) return session;
          // Anonymous credentials are the only way to retain this device's membership.
          if (session.data?.email) return services.learnerAuth.signOut();
          return { ok: true as const, data: undefined };
        }, () => { setConfirm(false); router.replace('/'); });
      } }}
      secondaryAction={{ label: 'CANCEL', onPress: () => setConfirm(false) }} />
  </>;
}
