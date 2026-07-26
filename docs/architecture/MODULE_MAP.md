# Module Map

## Purpose

This map identifies primary ownership and expected collaborations. It is not a source-level call graph.

| Capability | Mobile ownership | Backend ownership | Contract ownership | Important collaboration |
|---|---|---|---|---|
| Learner setup | Onboarding | Identity | API v1 and domain identity concepts when later added | Profile and consent-aware setup feed local preferences |
| Authentication | Core authentication and profile | Identity | API v1 requests and responses | Token validation is separate from authorization |
| Baybayin lessons | Learning | Learning | Domain learning and content versions | Versioned content is cached for offline study |
| Quizzes and activities | Assessment | Assessment | Domain learning, assessment errors, attempt events | Results update progress and may trigger feedback or rewards |
| Canvas handwriting | Handwriting | Handwriting | Domain handwriting and handwriting errors | Ordered strokes pass through preprocessing before replaceable evaluation |
| Structured word and phrase checks | NLP Checking | NLP | Domain NLP and NLP errors | Rule outcomes are structured and explainable |
| Learner guidance | BAYA Guide | Feedback | Error codes and relevant responses | Error code plus learning context selects controlled feedback |
| XP and achievements | Gamification | Gamification | Domain gamification and reward events | Stable award identity prevents duplicate rewards |
| Progress and mastery | Progress | Progress | Domain progress and progress events | Local changes persist before synchronization |
| Profile | Profile | Identity | API v1 | Learner-owned data follows authorization boundaries |
| Offline synchronization | Core synchronization and feature repositories | Synchronization | Domain synchronization, errors, and events | Batches are idempotent, conflict-aware, and retry-safe |
| Learning analytics | Progress presentation where appropriate | Analytics | Privacy-reviewed event and response contracts | Analytics receives minimized or aggregated data |
| Evaluator governance | Handwriting infrastructure | Model Management | Model-manifest structures | Active configuration references approved artifact versions |

## Backend Module Ownership

- Identity owns learner identity, token validation, profiles, and authorization boundaries.
- Learning owns Baybayin content, progression, and content versions.
- Assessment owns structured exercises, attempts, scoring, and summaries.
- Handwriting owns evaluation requests, scoring semantics, results, version attribution, and fallback policy.
- NLP owns the supported validation rules and structured classifications.
- Feedback owns guide templates and context-aware message selection.
- Gamification owns reward rules and duplicate-award prevention.
- Progress owns completion, mastery, scores, handwriting performance, and summaries.
- Synchronization owns batch ingestion, idempotency, conflict handling, retry safety, and acknowledgements.
- Analytics owns privacy-preserving aggregated statistics and research-export preparation.
- Model Management owns manifests, versions, compatibility, deployment status, active configuration, and rollback metadata.

## Collaboration Constraints

Assessment may request feedback and progress updates through application contracts but does not write their persistence directly. Handwriting and NLP produce structured outcomes; Feedback converts those outcomes into learner-facing guidance. Gamification reacts to eligible learning or assessment outcomes using stable award identities. Analytics receives approved, minimized events or read models rather than unrestricted access to every module's data.

## Change Rule

When responsibility moves between modules, update this map, requirements traceability, related contracts, tests, and an Architecture Decision Record when the change is significant.
