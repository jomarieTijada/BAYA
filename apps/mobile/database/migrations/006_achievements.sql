CREATE TABLE IF NOT EXISTS learner_achievements (
 learner_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
 achievement_id TEXT NOT NULL, unlocked_at TEXT NOT NULL, definition_version INTEGER NOT NULL,
 unlock_source TEXT NOT NULL, evidence_reference TEXT NOT NULL, notified INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY (learner_id, achievement_id)
);
CREATE TABLE IF NOT EXISTS achievement_events (
 learner_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
 event_type TEXT NOT NULL, entity_id TEXT NOT NULL, occurred_at TEXT NOT NULL,
 PRIMARY KEY (learner_id, event_type, entity_id)
);
