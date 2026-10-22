import React from "react";
import {
  MentorBoundary,
  CreateWorkspaceScreen,
} from "../../../components/mentor/WorkspaceScreens";
export default function Create() {
  return (
    <MentorBoundary>
      <CreateWorkspaceScreen />
    </MentorBoundary>
  );
}
