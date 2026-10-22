import React from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { CloudServicesContext } from '../../../modules/cloud/services';
import { fixtureServices, workspaceFixture } from './fixtures';
import { WorkspaceManageScreen } from '../../mentor/WorkspaceManageScreen';
import { LearnerCloudAccount } from '../../learner/LearnerCloudAccount';
import { progressPreviewServices } from './progressFixtures';
import { MentorDashboard } from '../../progress/MentorDashboard';
import { LearnerProgressDetail } from '../../progress/LearnerProgressDetail';
import { SettingsScreen } from '../../learner/settings/SettingsScreen';
import { AuthScreen, OtpScreen } from '../../mentor/AuthScreen';
import {
  WorkspaceSelectionScreen,
  CreateWorkspaceScreen,
  WorkspaceDetailsScreen,
} from '../../mentor/WorkspaceScreens';
import {
  LearnerJoinWorkspaceScreen,
  LearnerMembershipScreen,
} from '../../learner/LearnerWorkspaceScreens';
export default function WorkspacePreview() {
  const { screen = 'login' } = useLocalSearchParams<{ screen: string }>();
  const services = {
    ...fixtureServices,
    auth: { ...fixtureServices.auth },
    workspaces: { ...fixtureServices.workspaces },
  };
  if (['dashboard', 'progress-detail', 'settings-connected', 'settings-empty'].includes(screen)) {
    services.progress = progressPreviewServices.progress;
    services.workspaces.memberships = screen === 'settings-empty' ? async () => ({ ok: true, data: [] }) : progressPreviewServices.workspaces.memberships;
  }
  if (screen === 'learner-account') services.learnerAuth = { ...fixtureServices.learnerAuth!, session: async () => ({ok:true,data:null}) };
  if (screen === 'manage') {
    services.workspaces.members = async () => ({ok:true,data:[{profileId:'test',displayName:'Sample Learner',active:true}]});
    services.workspaces.update = async (_id,name,status) => ({ok:true,data:{...workspaceFixture,workspace_name:name,status}});
  }
  if (screen === 'reset') {
    services.auth.resetPassword = async () => ({ ok: true, data: undefined });
    services.auth.completePasswordReset = async () => ({ ok: true, data: undefined });
  }
  if (screen === 'empty')
    services.workspaces.listOwned = async () => ({ ok: true, data: [] });
  if (screen === 'loading')
    services.workspaces.listOwned = () => new Promise(() => {});
  if (screen === 'error')
    services.workspaces.listOwned = async () => ({
      ok: false,
      code: 'offline',
    });
  return (
    <CloudServicesContext.Provider value={services}>
      <Text
        style={{ backgroundColor: '#fff1b8', textAlign: 'center', padding: 6 }}
      >
        DEVELOPMENT PREVIEW · TEST DATA ONLY
      </Text>
      {screen === 'learner-account' ? <LearnerCloudAccount /> : screen === 'manage' ? <WorkspaceManageScreen id="preview" /> : screen.startsWith('settings-') ? <SettingsScreen /> : screen === 'dashboard' ? <MentorDashboard id="preview" /> : screen === 'progress-detail' ? <LearnerProgressDetail workspaceId="preview" profileId="preview-learner" /> : screen === 'login' || screen === 'register' || screen === 'reset' ? (
        <AuthScreen mode={screen} />
      ) : screen === 'otp' ? (
        <OtpScreen
          challenge={{ id: 'test-only', email: 'mentor@example.test' }}
          onBack={() => router.back()}
          onOutcome={() => {}}
        />
      ) : screen === 'create' ? (
        <CreateWorkspaceScreen />
      ) : screen === 'details' ? (
        <WorkspaceDetailsScreen id="test-id" />
      ) : screen === 'join' ? (
        <LearnerJoinWorkspaceScreen />
      ) : screen === 'memberships' ? (
        <LearnerMembershipScreen />
      ) : (
        <WorkspaceSelectionScreen />
      )}
    </CloudServicesContext.Provider>
  );
}
