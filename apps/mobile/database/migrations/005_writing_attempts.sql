-- Per-character handwriting samples linked to the ERD activity_attempts table.
CREATE TABLE IF NOT EXISTS writing_attempts (
  attempt_id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  stroke_json TEXT NOT NULL,
  image_data TEXT,
  scoring_method TEXT NOT NULL,
  FOREIGN KEY (attempt_id) REFERENCES activity_attempts(attempt_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_writing_attempts_character ON writing_attempts(character_id);
