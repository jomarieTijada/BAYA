# Domain

## Purpose

Defines framework-independent business meaning for local-first mobile and backend convergence.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing local-first synchronization, batch synchronization, idempotency, conflict handling, retry-safe operations, and offline outbox processing.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports offline operation, durable local progress, and retry-safe synchronization.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

