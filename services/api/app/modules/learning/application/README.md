# Application

## Purpose

Defines use cases and workflows for versioned Baybayin learning content and progression.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for Baybayin characters, sounds, kudlit lessons, syllable formation, word construction, simple phrase lessons, lesson progression, and lesson content versions.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports structured lessons, character familiarization, kudlit learning, word construction, and phrase lessons.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

