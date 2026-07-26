# Handwriting

## Purpose

Owns the backend module for replaceable stroke-based handwriting evaluation.

## Responsibilities

Defines stroke-input validation, handwriting preprocessing, evaluation requests and results, character-formation, stroke-structure, stroke-execution and kudlit-placement scoring, algorithm or model version recording, and remote fallback evaluation.

## Allowed Contents

Domain, application, infrastructure, presentation, tests, and focused module documentation.

## Excluded Contents

Responsibilities owned by other modules, cross-module persistence access, research-only experiments, and framework concerns in domain rules.

## Dependencies

Follows inward Clean Architecture dependencies and communicates with other modules through explicit contracts, use cases, or events.

## Related BAYA Requirements

Supports canvas handwriting, versioned comparative evaluation, real-time corrective feedback, and remote fallback.

## Future Implementation Notes

Every evaluation result must identify its algorithm, model, or template version; the evaluator remains replaceable behind a stable contract.

