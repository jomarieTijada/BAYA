# Infrastructure

## Purpose

Provides technical adapters for replaceable stroke-based handwriting evaluation.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for stroke-input validation, handwriting preprocessing, evaluation requests and results, character-formation, stroke-structure, stroke-execution and kudlit-placement scoring, algorithm or model version recording, and remote fallback evaluation.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports canvas handwriting, versioned comparative evaluation, real-time corrective feedback, and remote fallback.

## Future Implementation Notes

Production evaluators must be selectable, compatibility-checked, rollback-aware, and version-recording.

