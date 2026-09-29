/**
 * apps/mobile/database/migrations/index.ts
 *
 * Migration registry for BAYA SQLite database.
 * Orders migrations sequentially and provides SQL definitions.
 */

import type { MigrationDefinition } from '../types';

export const MIGRATION_001_INITIAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_versions (
  content_version_id TEXT PRIMARY KEY,
  version_label TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  activated_at TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
  lesson_id TEXT PRIMARY KEY,
  content_version_id TEXT NOT NULL,
  stage_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY (content_version_id) REFERENCES content_versions (content_version_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS activities (
  activity_id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons (lesson_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS profiles (
  profile_id TEXT PRIMARY KEY,
  auth_user_id TEXT,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'mentor')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS learner_progress (
  learner_progress_id TEXT PRIMARY KEY,
  learner_profile_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  status TEXT NOT NULL,
  completed_at TEXT,
  last_activity_at TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (learner_profile_id) REFERENCES profiles (profile_id) ON DELETE RESTRICT,
  FOREIGN KEY (lesson_id) REFERENCES lessons (lesson_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS activity_attempts (
  attempt_id TEXT PRIMARY KEY,
  learner_profile_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  result_status TEXT NOT NULL,
  recognized_result TEXT,
  confidence_value REAL,
  feedback_code TEXT,
  attempted_at TEXT NOT NULL,
  FOREIGN KEY (learner_profile_id) REFERENCES profiles (profile_id) ON DELETE RESTRICT,
  FOREIGN KEY (activity_id) REFERENCES activities (activity_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS review_items (
  review_item_id TEXT PRIMARY KEY,
  learner_profile_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (learner_profile_id) REFERENCES profiles (profile_id) ON DELETE RESTRICT,
  FOREIGN KEY (activity_id) REFERENCES activities (activity_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS mentor_profiles (
  mentor_profile_id TEXT PRIMARY KEY,
  learner_profile_id TEXT NOT NULL,
  FOREIGN KEY (learner_profile_id) REFERENCES profiles (profile_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id TEXT PRIMARY KEY,
  mentor_profile_id TEXT NOT NULL,
  workspace_code TEXT NOT NULL UNIQUE,
  workspace_name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles (mentor_profile_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS workspace_memberships (
  membership_id TEXT PRIMARY KEY,
  learner_profile_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  last_synced_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  FOREIGN KEY (learner_profile_id) REFERENCES profiles (profile_id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces (workspace_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  outbox_id TEXT PRIMARY KEY,
  learner_profile_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  queued_at TEXT NOT NULL,
  last_attempt_at TEXT,
  FOREIGN KEY (learner_profile_id) REFERENCES profiles (profile_id) ON DELETE CASCADE
);
`;

export const MIGRATION_002_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_lessons_content_version_id ON lessons(content_version_id);
CREATE INDEX IF NOT EXISTS idx_activities_lesson_id ON activities(lesson_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_profile ON learner_progress(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_lesson ON learner_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_profile ON activity_attempts(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_activity ON activity_attempts(activity_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_profile ON workspace_memberships(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_workspace ON workspace_memberships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_profile ON sync_outbox(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox(sync_status);
`;

export const MIGRATION_003_ACTIVITY_CONTENT = `
CREATE TABLE IF NOT EXISTS activity_content (
  activity_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK (revision > 0),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('draft', 'under_review', 'approved', 'deprecated')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  payload_json TEXT NOT NULL,
  FOREIGN KEY (activity_id) REFERENCES activities(activity_id) ON DELETE CASCADE
);
`;

export const MIGRATION_004_LOCAL_LEARNER_STATE = `
CREATE TABLE IF NOT EXISTS local_app_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_review_items_profile_status ON review_items(learner_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_review_items_activity ON review_items(activity_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_learner ON mentor_profiles(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_mentor ON workspaces(mentor_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_profile_activity_result ON activity_attempts(learner_profile_id, activity_id, result_status);
`;

export const MIGRATION_005_WRITING_ATTEMPTS = `
CREATE TABLE IF NOT EXISTS writing_attempts (
  attempt_id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  stroke_json TEXT NOT NULL,
  image_data TEXT,
  scoring_method TEXT NOT NULL,
  FOREIGN KEY (attempt_id) REFERENCES activity_attempts(attempt_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_writing_attempts_character ON writing_attempts(character_id);
`;

export const MIGRATIONS: readonly MigrationDefinition[] = [
  {
    version: 1,
    name: '001_initial_schema',
    sql: MIGRATION_001_INITIAL_SCHEMA,
  },
  {
    version: 2,
    name: '002_indexes',
    sql: MIGRATION_002_INDEXES,
  },
  { version: 3, name: '003_activity_content', sql: MIGRATION_003_ACTIVITY_CONTENT },
  { version: 4, name: '004_local_learner_state', sql: MIGRATION_004_LOCAL_LEARNER_STATE },
  { version: 5, name: '005_writing_attempts', sql: MIGRATION_005_WRITING_ATTEMPTS },
];
