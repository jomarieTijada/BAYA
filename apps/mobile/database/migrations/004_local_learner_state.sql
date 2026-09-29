-- Local device state is separate from the validator-owned curriculum tables.
CREATE TABLE IF NOT EXISTS local_app_state (
  state_key TEXT PRIMARY KEY,
  state_value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_review_items_profile_status
  ON review_items(learner_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_review_items_activity
  ON review_items(activity_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_learner
  ON mentor_profiles(learner_profile_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_mentor
  ON workspaces(mentor_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_attempts_profile_activity_result
  ON activity_attempts(learner_profile_id, activity_id, result_status);
