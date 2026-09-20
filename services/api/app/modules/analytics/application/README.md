# Application

## Purpose

Defines use cases and workflows for privacy-preserving operational and research summaries.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for aggregated learning performance, algorithm evaluation statistics, response-time statistics, error-frequency summaries, research exports, and privacy-preserving analytics.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports performance summaries, comparative algorithm research, and thesis evaluation exports.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

