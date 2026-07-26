# Dependency Rules

## Core Direction

The governing direction is:

Presentation → Application → Domain

Infrastructure implements interfaces defined by the inner layers. Domain remains independent of frameworks and external services.

## Layer Rules

### Domain

Domain contains entities, value objects, business rules, repository contracts, evaluator contracts, domain services, and domain errors. It must not depend on Expo, React Native, FastAPI, Supabase, SQLite, PostgreSQL, HTTP clients, UI components, ML runtimes, storage SDKs, or framework-specific models.

### Application

Application contains use cases, workflows, commands, queries, application input and output models, orchestration, and required ports. It may depend on domain. It must not directly depend on UI frameworks, route libraries, database implementations, Supabase clients, or device APIs.

### Infrastructure

Infrastructure implements ports with API clients, SQLite or PostgreSQL repositories, Supabase adapters, local storage, synchronization, canvas integration, preprocessing, evaluator implementations, model loading, and network status adapters. It may depend on application and domain contracts.

### Presentation

Presentation contains screens, components, view models, hooks, navigation integration, route adapters, API controllers, and user or client feedback mapping. It may call application use cases. It must not contain core domain rules or directly query databases.

## Mobile Rules

1. Screens do not contain handwriting-scoring logic.
2. Routes remain thin and delegate to feature presentation behavior.
3. Presentation does not directly query SQLite, Supabase, or HTTP clients.
4. Mobile progress is stored locally before synchronization is attempted.
5. Infrastructure reports offline, pending, synchronized, conflict, and failure states through application-level outcomes.
6. Feature modules do not reach into another feature's infrastructure implementation.
7. Shared mobile resources require multiple clear consumers and must not become a miscellaneous dependency area.

## Backend Rules

1. API route handlers do not contain domain rules.
2. API handlers call application use cases and map transport input and output.
3. Database models do not automatically become domain entities; explicit mapping preserves domain independence.
4. Modules do not query another module's tables as a shortcut.
5. Cross-module behavior uses named application interfaces, events, or deliberately shared contracts.
6. Authentication token validation and authorization policy remain distinct: a valid identity does not imply permission for every resource.
7. API versions are explicit and breaking compatibility changes require a new version or a reviewed transition plan.

## Handwriting and ML Rules

1. The handwriting evaluator is replaceable through a stable domain or application contract.
2. Canvas capture, preprocessing, evaluator execution, and feedback mapping are separate responsibilities.
3. Every handwriting result identifies its algorithm, model, template, and applicable preprocessing version.
4. On-device and remote evaluators return compatible result semantics.
5. ML research code remains separate from mobile and backend business logic.
6. Raw datasets remain immutable.
7. Processed datasets never overwrite raw data and retain full lineage.
8. Every experiment identifies its dataset, split, preprocessing, configuration, and evaluator versions.
9. Notebooks are exploratory; reusable selected logic moves into normal modules with tests.
10. Only approved artifacts with manifests, compatibility evidence, and rollback metadata may enter production export areas.

## NLP and Feedback Rules

1. NLP validation returns structured and explainable errors, including a stable classification and relevant context.
2. NLP is limited to supported character, syllable, kudlit, word, and structured phrase checks.
3. Translation, unrestricted generation, advanced general grammar checking, and general chatbot behavior are outside scope.
4. The BAYA guide consumes error codes and learning context.
5. The BAYA guide is a controlled feedback orchestrator, not an unrestricted chatbot.
6. Feedback templates do not redefine NLP, assessment, or handwriting rules.

## Synchronization and Gamification Rules

1. Synchronization operations are idempotent and retry-safe.
2. Each locally queued operation has a stable identity.
3. Conflicts are explicit outcomes rather than silent overwrites.
4. XP, badges, achievements, and challenge progress are not awarded twice because of retries.
5. Mobile and backend contracts, synchronization events, and content versions are versioned.

## Research, Security, and Governance Rules

1. Operational application data, ML training data, respondent data, ISO 25010 evidence, and algorithm-comparison results remain distinct.
2. Research exports do not expose unnecessary learner identities.
3. Personal and research data is anonymized or pseudonymized where appropriate.
4. Production credentials, private keys, service-role keys, access tokens, and secrets never enter the repository.
5. Logs avoid raw strokes, tokens, respondent identity, and learner content unless a reviewed requirement justifies collection.
6. Architecture changes are recorded through decision documents.
7. Requirements traceability and relevant module documentation are updated when responsibilities change.

## Enforcement Plan

Future enforcement should combine code review, dependency checks, module-focused tests, contract tests, documentation review, secret scanning, and architecture decision records. The current repository documents these rules but does not yet claim automated enforcement.
