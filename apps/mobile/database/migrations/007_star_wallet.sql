CREATE TABLE learner_star_transactions (
 id INTEGER PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN ('topic','module','matching','writing','checkpoint','achievement','hint')),
 source_id TEXT NOT NULL, attempt_id TEXT, checkpoint_id TEXT,
 amount INTEGER NOT NULL CHECK(typeof(amount)='integer' AND ((kind='hint' AND amount<0) OR (kind!='hint' AND amount>0))),
 policy_version INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(learner_id,kind,source_id)
);
CREATE INDEX star_attempt ON learner_star_transactions(learner_id,attempt_id);
CREATE TRIGGER star_credit_immutable BEFORE UPDATE ON learner_star_transactions
 BEGIN SELECT RAISE(ABORT,'Immutable Star transaction'); END;
CREATE TRIGGER star_no_delete BEFORE DELETE ON learner_star_transactions WHEN EXISTS(SELECT 1 FROM profiles WHERE profile_id=OLD.learner_id)
 BEGIN SELECT RAISE(ABORT,'Immutable Star transaction'); END;
CREATE TRIGGER star_funds BEFORE INSERT ON learner_star_transactions
 WHEN NEW.amount<0 AND COALESCE((SELECT SUM(amount) FROM learner_star_transactions WHERE learner_id=NEW.learner_id),0)+NEW.amount<0
 BEGIN SELECT RAISE(ABORT,'Insufficient Stars'); END;
CREATE TABLE learner_hint_usage (
 transaction_id INTEGER PRIMARY KEY REFERENCES learner_star_transactions(id) ON DELETE CASCADE,
 learner_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE, attempt_id TEXT NOT NULL,
 question_id TEXT NOT NULL, level TEXT NOT NULL CHECK(level IN ('clue','answer-revealed')), payload TEXT NOT NULL,
 UNIQUE(learner_id,attempt_id,question_id)
);
ALTER TABLE learner_achievements ADD COLUMN reward_amount INTEGER;
ALTER TABLE learner_achievements ADD COLUMN reward_attempt_id TEXT;
ALTER TABLE learner_achievements ADD COLUMN reward_checkpoint_id TEXT;
CREATE TRIGGER achievement_star_grant AFTER INSERT ON learner_achievements WHEN NEW.reward_amount>0
 BEGIN INSERT INTO learner_star_transactions(learner_id,kind,source_id,amount,attempt_id,checkpoint_id,policy_version)
 VALUES(NEW.learner_id,'achievement',NEW.achievement_id,NEW.reward_amount,NEW.reward_attempt_id,NEW.reward_checkpoint_id,1)
 ON CONFLICT(learner_id,kind,source_id) DO NOTHING; END;
