# Scoring and compatibility

Each submitted pair contributes one response at its original source question ID. Answer kind matching-v2 stores targetQuestionId, boardId, boardStart and audioPlayed. Correctness compares the canonical glyph classes after validating topic and activity compatibility. Distractors are never considered authoritative pairs.

submitMatches reads the active owner's attempt inside the existing SQLite transaction, validates a complete bijection, evaluates all relationships, then writes once. Failure rolls back the whole board. Duplicate board submission returns the stored results. advance moves by the saved board size and is idempotent for stale callers.

The outer version-1 attempt envelope and local_app_state key remain unchanged. This is an additive answer union; old choice and writing responses retain their original values, timestamps and score calculation. parseAttempt validates the new board provenance and target ownership. Historical review distinguishes choice letters from matching relationships. A resumed legacy answer already submitted is advanced without changing its score; remaining questions use matching.

Pending DE and RE audio remains null/unscored, never a wrong answer. The summary denominator excludes pending validation, which is reported separately. Existing complete/mastery rules are unchanged: pending records do not earn completion/mastery. No new threshold, XP or stars were introduced.

Submitted boards restore feedback before Next. Provisional connections are intentionally not persisted, consistent with the old unsubmitted selection policy; the shared help bubble states this. Retry preserves history and creates a new attempt after completion.

Research limitation: matching changes difficulty and permits elimination, particularly single-pair boards required by source ordering/ambiguity. A content adviser must review this response-format adaptation before formal research evaluation. No claim of psychometric equivalence is made.
