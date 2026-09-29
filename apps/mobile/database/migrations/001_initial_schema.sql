-- 001_initial_schema.sql
-- BAYA SQLite Schema Creation
-- Derived from ERD-ERD LOCAL.drawio.png

-- Tracking table for migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

-- CONTENT_VERSIONS: Tracks approved curriculum versions
CREATE TABLE IF NOT EXISTS content_versions (
  content_version_id TEXT PRIMARY KEY,
  version_label TEXT NOT NULL,
  validation_status TEXT NOT NULL,
  activated_at TEXT
);

-- LESSONS: BAYA Module maps to LESSONS table
CREATE TABLE IF NOT EXISTS lessons (
  lesson_id TEXT PRIMARY KEY,
  content_version_id TEXT NOT NULL,
  stage_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  FOREIGN KEY (content_version_id) REFERENCES content_versions (content_version_id) ON DELETE RESTRICT
);

-- ACTIVITIES: BAYA Topic maps to ACTIVITIES table
CREATE TABLE IF NOT EXISTS activities (
  activity_id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  sequence_no INTEGER NOT NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons (lesson_id) ON DELETE RESTRICT
);

-- PROFILES: Learner and mentor user profiles
CREATE TABLE IF NOT EXISTS profiles (
  profile_id TEXT PRIMARY KEY,
  auth_user_id TEXT,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'mentor')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- LEARNER_PROGRESS: Lesson-level progress tracking
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

-- ACTIVITY_ATTEMPTS: Attempt logs for writing recognition and practice
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

-- REVIEW_ITEMS: Spaced review and mistake tracking
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

-- MENTOR_PROFILES: Mentor relationship mapping
CREATE TABLE IF NOT EXISTS mentor_profiles (
  mentor_profile_id TEXT PRIMARY KEY,
  learner_profile_id TEXT NOT NULL,
  FOREIGN KEY (learner_profile_id) REFERENCES profiles (profile_id) ON DELETE RESTRICT
);

-- WORKSPACES: Learning cohort / classroom workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id TEXT PRIMARY KEY,
  mentor_profile_id TEXT NOT NULL,
  workspace_code TEXT NOT NULL UNIQUE,
  workspace_name TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles (mentor_profile_id) ON DELETE RESTRICT
);

-- WORKSPACE_MEMBERSHIPS: Learner-to-workspace enrollment
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

-- SYNC_OUTBOX: Future offline synchronization queue
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
