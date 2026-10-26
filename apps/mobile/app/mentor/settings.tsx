import React from 'react';
import { Redirect } from 'expo-router';
// Keep old links usable without an extra settings screen.
export default function Settings() { return <Redirect href="/mentor/workspaces" />; }
