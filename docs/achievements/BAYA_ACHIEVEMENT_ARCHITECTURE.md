# Local achievement architecture

The existing Expo SQLite migration registry installs migration 006. Both tables reference profiles. The primary key of learner_achievements is (learner_id, achievement_id). INSERT OR IGNORE preserves the first saved unlock timestamp across retries. achievement_events deduplicates the learner, event type and canonical entity.

Reconciliation reads approved topics, saved assessment attempts, aggregated model results and local events. It validates saved responses through parseAttempt. Invalid attempts supply no evidence. Existing earned rows survive a curriculum or evidence change. Backfilled rows store the reconciliation time and source. Device-wide story acknowledgement cannot establish who read the book. Audio completion and deliberate selections start accumulating when this version is installed.

Home and the collection reconcile on focus. Educational saves also trigger evaluation. The collection displays a grouped announcement that can be dismissed. All data stays in local SQLite.
