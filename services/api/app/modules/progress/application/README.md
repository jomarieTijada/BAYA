# Application

## Purpose

Defines use cases and workflows for durable learner performance and mastery.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for completed lessons, quiz scores, handwriting results, activity performance, mastery records, and learner performance summaries.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports learner progress tracking and performance summaries.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

