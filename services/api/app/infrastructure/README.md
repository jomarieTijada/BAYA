# Infrastructure

## Purpose

Groups backend-wide technical implementations that serve multiple BAYA modules.

## Responsibilities

Provides shared authentication, persistence, storage, ML runtime, synchronization, and external-service adapters.

## Allowed Contents

Future technical adapter implementations and their mapping documentation.

## Excluded Contents

Module domain rules, API route ownership, research experiments, and committed credentials.

## Dependencies

Implements contracts defined by inner application or domain layers and may use future FastAPI, Supabase, PostgreSQL, storage, or ML runtime technologies.

## Related BAYA Requirements

Supports replaceable technical integrations and a maintainable modular monolith.

## Future Implementation Notes

Prefer a module-owned adapter when it is not genuinely shared.

