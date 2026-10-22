import React from "react";
import {
  MentorBoundary,
  WorkspaceSelectionScreen,
} from "../../../components/mentor/WorkspaceScreens";
export default function Workspaces() {
  return (
    <MentorBoundary>
      <WorkspaceSelectionScreen />
    </MentorBoundary>
  );
}
