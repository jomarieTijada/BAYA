# Application

## Purpose

Defines use cases and workflows for controlled BAYA learning feedback.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for BAYA guide messages, corrective feedback, hints, encouragement, repeated-error responses, feedback templates, and error-code-to-message mapping.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports the in-app BAYA guide, adaptive hints, encouragement, and real-time feedback.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

