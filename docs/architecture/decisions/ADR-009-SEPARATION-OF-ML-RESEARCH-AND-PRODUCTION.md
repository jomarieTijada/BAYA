# ADR 009: Separate ML Research from Production Logic

## Status

Proposed

## Context

BAYA's comparative experiments need flexible data processing, notebooks, candidate algorithms, and repeated evaluation. Production mobile and backend behavior requires stable, reviewed, testable, compatible artifacts and must not depend on research datasets or notebook state.

## Decision

Keep datasets, preprocessing research, algorithms, experiments, evaluation, candidates, and notebooks under the ML boundary. Promote only approved versioned exports and manifests to production-facing adapters. Move reusable selected logic into normal modules with tests.

## Rationale

Separation preserves reproducibility and experimentation speed while protecting production reliability, privacy, dependency control, and architecture clarity.

## Consequences

Promotion requires explicit evaluation, manifest, compatibility, integrity, approval, and rollback steps. Some logic may be translated or packaged twice: first for research and later as a production adapter.

## Alternatives Considered

Using notebooks directly in the API was rejected because it makes behavior difficult to test, deploy, version, and secure. Keeping all ML work inside the mobile feature was rejected because it mixes research governance with product business logic.

## Review Conditions

Review when the evaluator approach stabilizes, while retaining dataset lineage, candidate-versus-approved states, production tests, and independence from exploratory notebooks.
