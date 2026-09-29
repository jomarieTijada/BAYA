CREATE TABLE IF NOT EXISTS activity_content (
  activity_id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL CHECK (revision > 0),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('draft', 'under_review', 'approved', 'deprecated')),
  reviewed_by TEXT,
  reviewed_at TEXT,
  payload_json TEXT NOT NULL,
  FOREIGN KEY (activity_id) REFERENCES activities(activity_id) ON DELETE CASCADE
);
