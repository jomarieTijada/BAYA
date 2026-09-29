-- 002_indexes.sql
-- Indexes for query performance and relational traversal
-- Derived from ERD-ERD LOCAL.drawio.png requirements

-- LESSONS indexes
CREATE INDEX IF NOT EXISTS idx_lessons_content_version_id ON lessons(content_version_id);

-- ACTIVITIES indexes
CREATE INDEX IF NOT EXISTS idx_activities_lesson_id ON activities(lesson_id);

-- LEARNER_PROGRESS indexes
CREATE INDEX IF NOT EXISTS idx_learner_progress_profile ON learner_progress(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_learner_progress_lesson ON learner_progress(lesson_id);

-- ACTIVITY_ATTEMPTS indexes
CREATE INDEX IF NOT EXISTS idx_activity_attempts_profile ON activity_attempts(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_activity ON activity_attempts(activity_id);

-- WORKSPACE_MEMBERSHIPS indexes
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_profile ON workspace_memberships(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_workspace_memberships_workspace ON workspace_memberships(workspace_id);

-- SYNC_OUTBOX indexes
CREATE INDEX IF NOT EXISTS idx_sync_outbox_profile ON sync_outbox(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox(sync_status);
