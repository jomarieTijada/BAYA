# Application

## Purpose

Defines use cases and workflows for motivation and reward mechanics.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for experience points, levels, rewards, badges, achievements, progressive challenges, and duplicate-reward prevention.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports gamification with retry-safe, non-duplicated rewards.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

