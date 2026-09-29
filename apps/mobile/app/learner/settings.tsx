import React from 'react';
import { Stack } from 'expo-router';

import { SettingsScreen } from '../../components/learner/settings/SettingsScreen';
import { SETTINGS_COPY } from '../../components/learner/settings/settingsCopy';

export default function LearnerSettingsRoute() {
  return (
    <>
      <Stack.Screen options={{ title: `BAYA · ${SETTINGS_COPY.title}` }} />
      <SettingsScreen />
    </>
  );
}
