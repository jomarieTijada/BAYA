# Data Flow

## Learning Content Flow

1. A versioned learning-content release is governed by the backend Learning module.
2. The mobile core API adapter obtains content through an explicit API version.
3. The mobile Learning infrastructure validates compatibility and stores content locally.
4. The Learning application layer selects content for the learner's current progression.
5. Presentation renders the lesson without querying storage directly.
6. The recorded attempt or completion is stored locally before any synchronization attempt.

## Assessment and Progress Flow

1. Presentation sends a learner action to an Assessment use case.
2. Domain rules evaluate the supported activity.
3. The result is persisted locally with a stable attempt identifier.
4. Progress is updated through an explicit application collaboration.
5. An eligible reward request carries a stable award identity.
6. The synchronization outbox records versioned events for later delivery.
7. Backend modules process the batch idempotently, preventing duplicate results and rewards.

## Handwriting Flow

1. The canvas adapter captures ordered strokes, points, timing, and canvas context.
2. Input validation rejects or classifies incomplete or invalid traces.
3. Preprocessing performs versioned normalization, smoothing, resampling, segmentation, and kudlit separation while preserving stroke order.
4. The Handwriting application use case selects a compatible evaluator through a stable contract.
5. An approved local evaluator is preferred when supported.
6. If local execution is unavailable or unsuitable, a versioned remote request may be queued or sent according to activity policy.
7. The evaluator returns character-formation, stroke-structure, stroke-execution, and kudlit-placement findings supported by that evaluator.
8. The result records the algorithm, model or template, and preprocessing versions.
9. Feedback consumes structured findings and learning context; presentation renders the response.
10. The attempt and progress impact are stored locally before synchronization.

## Structured NLP Flow

1. A word or supported phrase exercise supplies structured input and lesson context.
2. NLP validation applies versioned token, arrangement, syllable, kudlit, word-formation, or phrase-order rules.
3. The result returns stable classifications, locations, evidence, and expected learning concepts.
4. The BAYA guide maps the errors and learner context to reviewed corrective messages or hints.
5. The result is stored as an activity attempt and may contribute to progress.

No step translates open-ended text or invokes unrestricted chatbot behavior.

## Synchronization Flow

1. Each local mutation is committed to local storage with a stable operation identifier.
2. The outbox groups eligible operations into a versioned batch.
3. The backend validates identity, authorization, contract version, and idempotency.
4. Modules process accepted operations within their ownership boundaries.
5. The response acknowledges accepted operations and reports conflicts or retryable failures explicitly.
6. The mobile client marks only acknowledged operations as synchronized.
7. Retried operations preserve their original identifiers.

## Model Promotion Flow

1. Research uses an identified immutable raw dataset version and derived processed version.
2. Experiments identify preprocessing, configuration, split, and algorithm versions.
3. Evaluation records accuracy, error rates, latency, size, memory, compatibility, offline feasibility, and feedback suitability.
4. A candidate is reviewed against documented approval criteria.
5. An approved artifact receives a manifest, compatibility information, deployment status, and rollback metadata.
6. Model Management selects an active evaluator configuration.
7. Mobile or backend infrastructure loads only compatible approved exports and reports their versions with results.

## Research Export Flow

Operational modules prepare minimized, purpose-specific aggregates or pseudonymized records. Analytics applies approved privacy and export rules. Research areas receive the export without unnecessary learner identity and keep it separate from ML training data, respondent data, ISO 25010 evidence, and algorithm results.

## Failure and Observability Flow

Technical failures are translated into stable application outcomes. Presentation receives user-safe states; logs and metrics receive privacy-aware diagnostic context and version identity. Raw tokens, secrets, respondent identity, and unnecessary learner content are excluded.
