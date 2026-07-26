# Application

## Purpose

Defines use cases and workflows for production evaluator artifact governance.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for model manifests, algorithm versions, template versions, compatibility information, deployment status, rollback metadata, and active evaluator configuration.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports replaceable evaluators, reproducible version attribution, compatible mobile artifacts, and rollback planning.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

