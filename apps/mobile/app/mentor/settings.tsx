import { StorybookSettings } from '../../components/landing/StorybookSettings';
import React from 'react';
import { router } from 'expo-router';
import { FeatureScreen } from '../../components/mentor/FeatureScreen';
import { LanguageSelector } from '../../localization/LanguageSelector';
/** Device preference is available offline and does not require authentication. */
export default function Settings() {
  return <FeatureScreen title="Settings" subtitle="" onBack={() => { if (router.canGoBack()) router.back(); else router.replace('/mentor/workspaces'); }}><LanguageSelector compact /><StorybookSettings compact /></FeatureScreen>;
}
