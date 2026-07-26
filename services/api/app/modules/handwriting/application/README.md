# Application

## Purpose

Defines use cases and workflows for replaceable stroke-based handwriting evaluation.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for stroke-input validation, handwriting preprocessing, evaluation requests and results, character-formation, stroke-structure, stroke-execution and kudlit-placement scoring, algorithm or model version recording, and remote fallback evaluation.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports canvas handwriting, versioned comparative evaluation, real-time corrective feedback, and remote fallback.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

