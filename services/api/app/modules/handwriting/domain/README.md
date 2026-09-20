# Domain

## Purpose

Defines framework-independent business meaning for replaceable stroke-based handwriting evaluation.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing stroke-input validation, handwriting preprocessing, evaluation requests and results, character-formation, stroke-structure, stroke-execution and kudlit-placement scoring, algorithm or model version recording, and remote fallback evaluation.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports canvas handwriting, versioned comparative evaluation, real-time corrective feedback, and remote fallback.

## Future Implementation Notes

Evaluator contracts expose scoring dimensions and mandatory version attribution without selecting a technical algorithm.

