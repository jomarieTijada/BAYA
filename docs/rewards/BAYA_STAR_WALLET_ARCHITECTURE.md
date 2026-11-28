# Local Star wallet

The authoritative ledger is SQLite's `learner_star_transactions`. It stores learner, kind, source ID, signed amount, policy version, creation time and optional assessment attempt and checkpoint. Positive amounts contribute to lifetime earnings. Negative amounts contribute to lifetime spending. The Home counter, wallet dialog and results read this same ledger.

Topic completion and module credit share the educational progress transaction. Assessment submission persists correctness and eligible question credit together. Cursor advancement commits the first checkpoint reward. The achievement insert trigger credits an unlock in the same statement. Existing educational reconciliation retries on subsequent visits.

A unique key on learner, event kind and source protects retries and repeated callbacks. A database trigger checks funds at insertion time. Update and delete guards protect the audit trail while a profile exists. Queries for wallet display validate the active learner and filter by learner ID. Assessment results additionally filter by attempt ID. Reopening a result or replaying the animation only reads these rows.

Home shows available Stars. Its details include available balance, lifetime earnings, spending and the latest 30 transactions. The underlying ledger retains older transactions. The wallet uses the existing local learner identity in guest and workspace practice. The cloud synchronization contract continues to carry its established progress events. Cross-device Star balances would require a separately defined sync protocol.
