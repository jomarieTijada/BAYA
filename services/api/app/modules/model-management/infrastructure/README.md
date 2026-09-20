# Infrastructure

## Purpose

Provides technical adapters for production evaluator artifact governance.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for model manifests, algorithm versions, template versions, compatibility information, deployment status, rollback metadata, and active evaluator configuration.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports replaceable evaluators, reproducible version attribution, compatible mobile artifacts, and rollback planning.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

