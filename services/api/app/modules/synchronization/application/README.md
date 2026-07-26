# Application

## Purpose

Defines use cases and workflows for local-first mobile and backend convergence.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for local-first synchronization, batch synchronization, idempotency, conflict handling, retry-safe operations, and offline outbox processing.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports offline operation, durable local progress, and retry-safe synchronization.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

