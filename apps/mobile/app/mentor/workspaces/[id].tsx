import React from "react";
import { useLocalSearchParams } from "expo-router";
import {
  MentorBoundary,
} from "../../../components/mentor/WorkspaceScreens";
import { MentorDashboard } from '../../../components/progress/MentorDashboard';
export default function Details() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <MentorBoundary>
      <MentorDashboard key={id} id={id} />
    </MentorBoundary>
  );
}
