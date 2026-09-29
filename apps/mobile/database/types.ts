/**
 * apps/mobile/database/types.ts
 *
 * Strongly-typed domain interfaces for BAYA SQLite database foundation.
 * Derived strictly from ERD-ERD LOCAL.drawio.png.
 */

// ---------------------------------------------------------------------------
// Migration & System Types
// ---------------------------------------------------------------------------
export interface SchemaMigration {
  id: number;
  version: number;
  name: string;
  applied_at: string;
}

export interface MigrationDefinition {
  version: number;
  name: string;
  sql: string;
}

// ---------------------------------------------------------------------------
// Curriculum & Content Versioning
// ---------------------------------------------------------------------------
export type ValidationStatus = 'draft' | 'under_review' | 'approved' | 'deprecated';

export interface ContentVersion {
  content_version_id: string; // UUID PRIMARY KEY
  version_label: string;
  validation_status: ValidationStatus | string;
  activated_at: string | null; // ISO-8601 string
}

export interface Lesson {
  lesson_id: string; // UUID PRIMARY KEY
  content_version_id: string; // FOREIGN KEY -> content_versions(content_version_id)
  stage_number: number;
  title: string;
  description: string | null;
}

export type ActivityType =
  | 'video'
  | 'concept'
  | 'lesson'
  | 'guided lesson'
  | 'writing'
  | 'practice'
  | 'checking'
  | 'review'
  | 'dashboard';

export interface Activity {
  activity_id: string; // UUID PRIMARY KEY
  lesson_id: string; // FOREIGN KEY -> lessons(lesson_id)
  activity_type: ActivityType | string;
  title: string;
  sequence_no: number;
}

// ---------------------------------------------------------------------------
// Profiles & Roles
// ---------------------------------------------------------------------------
export type ProfileRole = 'learner' | 'mentor';

export interface Profile {
  profile_id: string; // UUID PRIMARY KEY
  auth_user_id: string | null;
  display_name: string;
  role: ProfileRole;
  created_at: string; // ISO-8601 string
  updated_at: string; // ISO-8601 string
}

export interface MentorProfile {
  mentor_profile_id: string; // UUID PRIMARY KEY
  learner_profile_id: string; // FOREIGN KEY -> profiles(profile_id)
}

// ---------------------------------------------------------------------------
// Learner Progress & History
// ---------------------------------------------------------------------------
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'locked';

export interface LearnerProgress {
  learner_progress_id: string; // UUID PRIMARY KEY
  learner_profile_id: string; // FOREIGN KEY -> profiles(profile_id)
  lesson_id: string; // FOREIGN KEY -> lessons(lesson_id)
  status: ProgressStatus | string;
  completed_at: string | null; // ISO-8601 string
  last_activity_at: string | null; // ISO-8601 string
  updated_at: string; // ISO-8601 string
}

export type AttemptResultStatus =
  | 'completed'
  | 'correct'
  | 'incorrect'
  | 'passed'
  | 'failed'
  | 'needs_practice';

export interface ActivityAttempt {
  attempt_id: string; // UUID PRIMARY KEY
  learner_profile_id: string; // FOREIGN KEY -> profiles(profile_id)
  activity_id: string; // FOREIGN KEY -> activities(activity_id)
  result_status: AttemptResultStatus | string;
  recognized_result: string | null;
  confidence_value: number | null;
  feedback_code: string | null;
  attempted_at: string; // ISO-8601 string
}

export type ReviewItemStatus = 'pending' | 'resolved' | 'dismissed';

export interface ReviewItem {
  review_item_id: string; // UUID PRIMARY KEY
  learner_profile_id: string; // FOREIGN KEY -> profiles(profile_id)
  activity_id: string; // FOREIGN KEY -> activities(activity_id)
  reason: string;
  status: ReviewItemStatus | string;
  created_at: string; // ISO-8601 string
  resolved_at: string | null; // ISO-8601 string
}

// ---------------------------------------------------------------------------
// Workspaces & Mentorship
// ---------------------------------------------------------------------------
export type WorkspaceStatus = 'active' | 'archived' | 'pending';

export interface Workspace {
  workspace_id: string; // UUID PRIMARY KEY
  mentor_profile_id: string; // FOREIGN KEY -> mentor_profiles(mentor_profile_id)
  workspace_code: string;
  workspace_name: string;
  status: WorkspaceStatus | string;
  created_at: string; // ISO-8601 string
}

export interface WorkspaceMembership {
  membership_id: string; // UUID PRIMARY KEY
  learner_profile_id: string; // FOREIGN KEY -> profiles(profile_id)
  workspace_id: string; // FOREIGN KEY -> workspaces(workspace_id)
  joined_at: string; // ISO-8601 string
  last_synced_at: string | null; // ISO-8601 string
  is_active: number; // 0 | 1 in SQLite
}

// ---------------------------------------------------------------------------
// Synchronization Outbox
// ---------------------------------------------------------------------------
export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'pending' | 'in_progress' | 'synced' | 'failed';

export interface SyncOutbox {
  outbox_id: string; // UUID PRIMARY KEY
  learner_profile_id: string; // FOREIGN KEY -> profiles(profile_id)
  entity_name: string;
  entity_id: string;
  operation: SyncOperation | string;
  sync_status: SyncStatus | string;
  queued_at: string; // ISO-8601 string
  last_attempt_at: string | null; // ISO-8601 string
}

// ---------------------------------------------------------------------------
// Database Connection Interface
// ---------------------------------------------------------------------------
export interface DatabaseConnection {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getFirstAsync<T>(source: string, params?: unknown[]): Promise<T | null>;
  getAllAsync<T>(source: string, params?: unknown[]): Promise<T[]>;
  withTransactionAsync?<T>(action: (transactionDb: DatabaseConnection) => Promise<T>): Promise<T>;
  closeAsync?(): Promise<void>;
}
