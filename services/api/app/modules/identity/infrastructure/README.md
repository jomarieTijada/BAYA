# Infrastructure

## Purpose

Provides technical adapters for learner identity and access boundaries.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for learner identity, authentication-token validation, learner profiles, and authorization boundaries.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports authentication, learner profiles, and privacy-aware access.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

