# BAYA: A Gamified Baybayin Interactive Learning System

## Purpose

BAYA is a thesis project for an interactive learning system that helps learners study Baybayin characters, sounds, kudlit use, syllables, words, and simple structured phrases. The planned experience combines guided lessons, quizzes, canvas-based handwriting practice, explainable corrective feedback, gamification, and progress tracking.

This repository currently establishes the architecture and documentation boundaries only. It is intentionally prepared for later student implementation.

## Responsibilities

The repository keeps learner-facing applications, backend services, comparative ML research, production artifact governance, shared contracts, thesis documentation, operational planning, research evidence, future automation, and integrated testing clearly separated.

## Allowed Contents

At the current stage, only the required folder structure and BAYA-specific Markdown documentation belong here. Future implementation artifacts may be added manually within their documented boundaries after the relevant roadmap prerequisites are met.

## Excluded Contents

The current scaffold excludes application source, framework initialization, schemas, migrations, configuration, executable scripts, tests, datasets, model artifacts, generated files, credentials, private keys, tokens, learner records, and respondent records.

## Dependencies

The monorepo areas coordinate through documented terminology, versioned contracts, reviewed artifacts, and explicit data flows. Inner Clean Architecture layers remain independent of application frameworks and external services.

## Related BAYA Requirements

The repository structure supports onboarding, guided Baybayin learning, character and kudlit practice, assessment, handwriting evaluation, structured NLP checking, controlled feedback, gamification, progress, synchronization, analytics, and thesis evaluation.

## Architectural Style

BAYA is planned as:

- A monorepo containing the mobile application, backend, ML research, contracts, documentation, infrastructure planning, research materials, scripts planning, and cross-system tests.
- A feature-first Clean Architecture mobile application.
- A modular-monolith backend with bounded business modules.
- A local-first mobile experience that remains useful without continuous connectivity.
- A replaceable handwriting evaluation pipeline selected through comparative research.
- A rule-based, explainable, and deliberately limited NLP validation capability.
- A versioned API and shared-contract boundary.
- A separate ML experimentation and production-artifact export lifecycle.

The concise dependency rule is:

Presentation → Application → Domain  
Infrastructure implements interfaces defined by the inner layers.  
Domain must remain independent of frameworks and external services.

## Planned Technology Stack

The future mobile client is planned around Expo, React Native, TypeScript, Expo SQLite, React Native Skia, and ONNX Runtime where an approved evaluator can run on-device. The future backend is planned around Python, FastAPI, Supabase PostgreSQL, Supabase Authentication, and Supabase Storage.

These technologies are architectural context only. No framework has been initialized, no configuration has been generated, and no dependency has been installed.

## Repository Structure

- `apps` defines user-facing application boundaries, beginning with the local-first mobile client.
- `services` defines the future FastAPI modular-monolith backend.
- `ml` separates datasets, comparative algorithms, experiments, evaluation, approved artifacts, and mobile exports.
- `contracts` reserves versioned agreements shared by mobile and backend.
- `docs` contains architecture, requirements, development, ML, NLP, security, data, and testing guidance.
- `infrastructure` documents future environments, database operations, storage, deployment, monitoring, and security.
- `scripts` documents categories for future repeatable automation without containing executable scripts now.
- `research` separates thesis respondent data, instruments, algorithm results, ISO 25010 evidence, ethics, and exports.
- `tests` reserves cross-system verification categories.

Every folder contains a README that states its purpose, responsibilities, permitted contents, exclusions, dependencies, BAYA requirements, and future implementation notes.

## System Boundaries

The mobile application owns learner interaction, navigation, local progress, offline behavior, canvas capture, on-device evaluation where supported, and presentation of feedback. The backend owns secure cross-device data, authoritative content and version distribution, server-side evaluation fallback, synchronization, aggregated progress, rewards, analytics, and artifact governance.

Shared contracts define compatibility rather than implementation. ML research evaluates candidate handwriting approaches but does not own application business rules. Research data is governed separately from operational learner data and ML training data. Infrastructure adapters implement inner-layer interfaces without moving external-service details into domain rules.

## Main BAYA Modules

Mobile features cover onboarding, learning, assessment, handwriting, structured NLP checking, the BAYA guide, gamification, progress, and profile behavior. Backend modules cover identity, learning, assessment, handwriting, NLP, feedback, gamification, progress, synchronization, analytics, and model management.

The BAYA guide is a controlled feedback orchestrator. It consumes structured error codes and the current learning context to select corrective messages, hints, encouragement, and repeated-error responses. It is not an unrestricted chatbot.

## Clean Architecture Dependency Rule

Domain areas contain business entities, value objects, rules, repository or evaluator contracts, and domain errors. They do not depend on Expo, React Native, FastAPI, Supabase, SQLite, HTTP clients, UI components, or external services.

Application areas contain use cases, workflows, commands, queries, input and output models, orchestration, and required ports. Presentation calls application use cases. Infrastructure implements application and domain contracts. Screens and API route handlers remain thin and do not contain core domain rules.

## Local-First Strategy

Learning content needed for active lessons, learner attempts, progress changes, and an offline outbox are planned to persist on the device. Mobile progress is stored locally before synchronization. Network loss must not discard a completed activity.

Synchronization is planned as batched, idempotent, retry-safe, and conflict-aware. Stable operation identifiers prevent repeated retries from awarding XP or achievements twice. The UI will expose pending, synchronized, conflict, and retry states without directly implementing synchronization rules.

## ML Algorithm Comparison Strategy

BAYA will compare DTW, multidimensional DTW, template matching, statistical baselines, and neural candidates under versioned datasets, preprocessing, configurations, and evaluators. Criteria include accuracy, character-level correctness, kudlit placement, false acceptance and rejection, average and high-percentile response time, artifact size, memory use, Android compatibility, offline compatibility, suitability for corrective feedback, and ease of Expo integration.

The handwriting evaluator is replaceable behind a stable contract. Every evaluation result identifies the algorithm, model, template, and relevant preprocessing version used. Experimental candidates remain separate from approved artifacts and mobile-ready exports.

## NLP Scope

NLP is limited to structured, rule-based, and explainable Baybayin validation: tokenization, character arrangement, syllable sequence, kudlit use, word formation, and constrained phrase order. Results return stable error codes, locations, evidence, and learning context suitable for feedback.

NLP is not intended for translation, open-ended text generation, advanced general grammar checking, or general-purpose chatbot behavior.

## Documentation Rules

Architecture changes require an Architecture Decision Record. Mobile and backend contracts and API versions must be explicit. Dataset and evaluator lineage must remain traceable. Documentation must describe responsibilities and constraints without embedding credentials, learner records, respondent data, or implementation secrets.

Production credentials, private keys, service-role keys, access tokens, learner data, and secrets must never be committed. Research exports must minimize identity and use anonymization or pseudonymization where appropriate.

## Current Repository Status

The repository is at the documentation and architecture-scaffolding stage. Required folders and Markdown responsibility documents are present. Application implementation, schemas, migrations, configurations, tests, datasets, model artifacts, and automation have not been generated.

Source code has intentionally not yet been generated. The student will implement it manually in later stages following the documented boundaries and roadmap.

## Future Implementation Notes

Implementation should follow the staged roadmap, update decision and traceability documents as boundaries change, and retain the documentation-only baseline in version history. No application implementation should begin as part of this scaffolding task.
