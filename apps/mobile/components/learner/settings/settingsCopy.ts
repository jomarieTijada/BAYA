import { FilipinoLabels } from '../../../constants/filipinoLabels';

/** One learner-facing wording source for every Settings viewport and state. */
export const SETTINGS_COPY = {
  title: FilipinoLabels.settings,
  workspaceTitle: 'My Workspace',
  workspaceSubtitle: 'Learning progress',
  disconnected: 'No Connection',
  connected: 'Connected',
  disconnectedAccessibility: 'No workspace connected',
  connectedAccessibility: 'Connected to workspace',
  statusTestHint: 'Toggle workspace status for testing',
  independentHeadline: 'You are learning independently.',
  independentDescription: 'Join a workspace to share your learning progress with your mentor.',
  joinWorkspace: 'JOIN WORKSPACE',
  joinAccessibility: 'Join workspace',
  joinDialogTitle: 'Join Workspace',
  joinDialogBody: 'Joining using your mentor\'s workspace code will be available in the next update.',
  independentFooter: 'Your progress will sync when you join using your mentor\'s workspace code.',
  workspaceLabel: 'WORKSPACE',
  workspaceCodeLabel: 'WORKSPACE CODE',
  lastSynchronized: 'Last synced:',
  justNow: 'Just now',
  syncNow: 'SYNC NOW',
  syncAccessibility: 'Sync learning progress',
  syncDialogTitle: 'Synced',
  syncDialogBody: 'Your learning progress is up to date.',
  connectedFooter: 'Your mentor can only see synced learning progress.',
} as const;
