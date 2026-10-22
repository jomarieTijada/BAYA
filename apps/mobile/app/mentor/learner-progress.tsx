import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MentorBoundary } from '../../components/mentor/WorkspaceScreens';
import { LearnerProgressDetail } from '../../components/progress/LearnerProgressDetail';
export default function LearnerProgressRoute() {
  const { workspaceId, profileId } = useLocalSearchParams<{ workspaceId: string; profileId: string }>();
  return <MentorBoundary><LearnerProgressDetail workspaceId={workspaceId} profileId={profileId} /></MentorBoundary>;
}
