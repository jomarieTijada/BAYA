# Infrastructure

## Purpose

Provides technical adapters for rule-based and explainable Baybayin validation.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for Baybayin tokenization, character arrangement, syllable sequence, kudlit usage, word formation, structured phrase order, and explainable error classifications.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports structured word-level and phrase-level checking.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

