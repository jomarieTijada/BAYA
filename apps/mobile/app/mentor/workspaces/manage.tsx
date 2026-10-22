import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MentorBoundary } from '../../../components/mentor/WorkspaceScreens';
import { WorkspaceManageScreen } from '../../../components/mentor/WorkspaceManageScreen';
export default function ManageWorkspace() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MentorBoundary><WorkspaceManageScreen key={id} id={id || ''} /></MentorBoundary>;
}
