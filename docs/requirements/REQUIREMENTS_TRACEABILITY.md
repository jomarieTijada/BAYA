# Requirements Traceability

## Purpose

This documentation-only matrix assigns each requested BAYA capability to its primary architectural boundaries. It guides later requirements, design, implementation, and test evidence; it does not describe source-level classes or schemas.

## Capability Mapping

| Capability | Responsible mobile feature | Responsible backend module | Related data area | Relevant contract area | Relevant test category | Offline expected | ML or NLP involvement |
|---|---|---|---|---|---|---|---|
| User onboarding | Onboarding | Identity | Local onboarding state and learner profile | API v1 requests and responses | End-to-end and acceptance | Yes for initial informational flow; identity completion may wait for network | Neither |
| BAYA in-app learning guide | BAYA Guide | Feedback | Feedback templates, learning context, and repeated-error state | Error codes and API responses | End-to-end, acceptance, and usability | Yes for bundled feedback rules and templates | Consumes ML or NLP results; does not perform either |
| Structured Baybayin lessons | Learning | Learning | Versioned lesson content and local completion | Domain learning and API v1 | End-to-end, contract, and offline behavior | Yes for downloaded or bundled content | Neither |
| Character familiarization | Learning | Learning | Character, sound, lesson, and mastery data | Domain learning | Acceptance and offline behavior | Yes | Neither |
| Kudlit learning | Learning | Learning | Kudlit lesson content, exercises, and mastery | Domain learning | Acceptance and compatibility | Yes | May use handwriting or structured NLP in later practice |
| Interactive quizzes | Assessment | Assessment | Attempts, item versions, scores, and result summaries | Assessment errors and attempt events | End-to-end and acceptance | Yes; results queue for synchronization | Neither unless an item explicitly uses handwriting or NLP |
| Canvas-based handwriting | Handwriting | Handwriting | Ordered stroke points, timing, canvas context, and local attempt | Domain handwriting | Handwriting evaluation, compatibility, and usability | Yes for capture | Provides input to ML or algorithmic evaluation |
| Stroke-based evaluation | Handwriting | Handwriting and Model Management | Preprocessing version, evaluator version, dimension scores, and result | Domain handwriting, handwriting errors, and model manifest | Handwriting evaluation and performance | Expected on-device when compatible; remote fallback otherwise | Comparative algorithm or approved ML evaluator |
| Real-time feedback | Handwriting, Assessment, NLP Checking, and BAYA Guide | Handwriting, Assessment, NLP, and Feedback | Structured errors, scores, feedback context, and selected message | Error codes and responses | End-to-end, performance, and usability | Yes for supported local rules and evaluators | May consume ML and NLP outcomes |
| Word-level NLP checking | NLP Checking | NLP | Token sequence, kudlit use, word-formation result, and rule version | Domain NLP and NLP errors | NLP validation and acceptance | Yes for locally available rule versions | Rule-based NLP |
| Phrase-level NLP checking | NLP Checking | NLP | Structured phrase input, order result, and rule version | Domain NLP and NLP errors | NLP validation and acceptance | Yes for supported structured phrase patterns | Rule-based NLP |
| Gamification | Gamification | Gamification | XP, level, reward, badge, achievement, challenge, and stable award identity | Domain gamification and reward events | Synchronization, end-to-end, and acceptance | Yes for eligible local progress, subject to reconciliation policy | Neither |
| Learner progress tracking | Progress | Progress | Lesson completion, scores, handwriting results, activity performance, and mastery | Domain progress and progress events | Synchronization, offline behavior, and acceptance | Yes; local commit precedes synchronization | May summarize ML or NLP-backed attempts |
| Adaptive hints | BAYA Guide | Feedback | Error history, learning context, hint level, and template version | Error codes and responses | End-to-end, usability, and acceptance | Yes for available rules and templates | Consumes structured ML or NLP classifications where relevant |
| Navigation | Mobile routes and shared navigation presentation | No primary business module; backend supplies authorized destinations and data | Local route state and learner session context | API v1 only where data is required | End-to-end, usability, and compatibility | Yes for locally available destinations | Neither |
| Performance summaries | Progress | Progress and Analytics | Aggregated completion, scores, mastery, evaluator results, and privacy-safe statistics | Domain progress and API responses | Contract, performance, acceptance, and privacy review | Yes for local summaries; cross-device aggregation requires sync | May aggregate ML or NLP-backed outcomes |

## Traceability Rules

1. A capability may collaborate with several boundaries, but one mobile feature and one backend module should remain the primary owner where applicable.
2. Offline support means the learner's completed work is durable locally; it does not imply every server-only capability can run offline.
3. Each synchronized mutation requires a stable operation identifier and contract version.
4. Each handwriting result requires algorithm, model or template, and preprocessing version identity.
5. Each NLP result requires a rule-set version and structured explainable errors.
6. Reward-producing operations require stable award identity so retries do not duplicate XP or achievements.
7. Research and analytics use privacy-reviewed exports rather than unnecessary learner identity.

## Maintenance

When a capability, module owner, contract, data purpose, or offline expectation changes, update this matrix together with the relevant Architecture Decision Record, module documentation, acceptance criteria, and testing strategy.
