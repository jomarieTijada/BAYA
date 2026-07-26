# Architecture Overview

## Purpose

This document summarizes the intended system shape of BAYA and the boundaries that keep a student thesis implementation manageable while reflecting realistic software-engineering practice.

## System Context

BAYA serves a learner using a local-first mobile application. The learner studies structured Baybayin content, completes quizzes, writes characters on a canvas, receives explainable feedback, earns retry-safe rewards, and reviews progress. The mobile application can later synchronize with a versioned backend for identity, content, attempts, progress, rewards, analytics, and remote handwriting fallback.

Researchers use governed exports and the separate ML workspace to compare handwriting evaluators. Research activities do not directly query or modify application domain state.

## Monorepo Boundaries

- Mobile delivery belongs under `apps/mobile`.
- The backend modular monolith belongs under `services/api`.
- Comparative algorithms, datasets, experiments, and artifact promotion belong under `ml`.
- Cross-system compatibility agreements belong under `contracts`.
- Architecture and thesis guidance belong under `docs`.
- Operational platform planning belongs under `infrastructure`.
- Thesis research governance and evidence belong under `research`.
- Future automation categories belong under `scripts`.
- Integrated verification belongs under `tests`.

## Mobile Architecture

The mobile client uses feature-first organization. Each main feature has domain, application, infrastructure, and presentation boundaries. Routes under the mobile `app` area remain navigation adapters and delegate behavior to feature presentation and application layers.

Local persistence is a product behavior, not merely a cache optimization. Learning content needed for active use, completed attempts, progress changes, and synchronization operations are planned to survive application restarts and connectivity loss.

## Backend Architecture

The backend is planned as a modular monolith: one deployable API with explicit modules for identity, learning, assessment, handwriting, NLP, feedback, gamification, progress, synchronization, analytics, and model management.

Each module owns its domain rules, application use cases, infrastructure adapters, presentation mapping, and module-focused tests. Modules collaborate through named application interfaces, versioned contracts, or events rather than directly reading one another's persistence records.

## Clean Architecture Layers

Domain is the innermost layer and owns business meaning. Application coordinates domain behavior into use cases. Infrastructure implements the storage, network, authentication, canvas, model-runtime, and external-service interfaces requested by inner layers. Presentation adapts learners or API consumers to application use cases.

Dependencies point inward. Database records, API transport models, and UI state are mapped explicitly and are not treated automatically as domain entities.

## Handwriting Evaluation Boundary

Canvas capture and preprocessing are distinct from scoring. A stable evaluator contract accepts a defined, validated representation and returns scoring dimensions, explainable findings, and mandatory evaluator version identity.

Candidate approaches include DTW, multidimensional DTW, template matching, statistical baselines, and neural models. Approved on-device evaluation is preferred when it meets accuracy, responsiveness, compatibility, memory, and feedback requirements. A versioned remote fallback may be used when local evaluation is unavailable or unsuitable.

## NLP and BAYA Guide Boundaries

The NLP module performs deterministic validation of supported word and structured phrase exercises. It reports structured error classifications rather than generating unrestricted prose.

The BAYA guide maps error codes and learning context to reviewed feedback templates, hints, encouragement, and repeated-error responses. This separation makes the feedback explainable, testable, and safe for the intended learning scope.

## Contracts and Versions

API operations are explicitly versioned. Shared contracts will later describe requests, responses, pagination, domain vocabulary, errors, events, model manifests, and content versions. Contract evolution must preserve deployed-client compatibility or introduce a new explicit version.

Every handwriting result records its evaluator version. Learning content and model artifacts have independent versions so clients can determine compatibility and synchronize safely.

## Research and Production Separation

Raw datasets remain immutable. Processed datasets are derived into separately versioned areas. Every experiment identifies its dataset, preprocessing, configuration, and evaluator versions. Notebooks support exploration but are never the only home of production-reusable logic.

Experimental candidates do not enter application delivery directly. Promotion requires documented evaluation, a manifest, compatibility evidence, approval status, and rollback metadata.

## Security and Privacy Posture

The repository never stores production secrets or unnecessary learner identities. Operational data, ML training data, respondent data, ISO 25010 evidence, and algorithm results have distinct purposes, access rules, retention expectations, and export paths.

Logging and analytics use data minimization. Research exports are privacy-reviewed and anonymized or pseudonymized where appropriate.

## Current Status

This architecture is proposed and documented. It has not yet been implemented or validated as a complete system.
