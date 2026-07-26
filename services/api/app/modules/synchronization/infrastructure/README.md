# Infrastructure

## Purpose

Provides technical adapters for local-first mobile and backend convergence.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for local-first synchronization, batch synchronization, idempotency, conflict handling, retry-safe operations, and offline outbox processing.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports offline operation, durable local progress, and retry-safe synchronization.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

