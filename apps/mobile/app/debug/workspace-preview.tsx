import React from 'react';
import { Redirect } from 'expo-router';
export default function WorkspacePreviewRoute() {
  if (__DEV__) {
    // Keep test fixtures out of the production dependency graph.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Preview = require('../../components/debug/workspaces/WorkspacePreview').default;
    return <Preview />;
  }
  return <Redirect href="/" />;
}
