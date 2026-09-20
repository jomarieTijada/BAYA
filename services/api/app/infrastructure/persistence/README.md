# Persistence

## Purpose

Defines backend-wide database implementations.

## Responsibilities

Plans Supabase PostgreSQL repositories, transaction adapters, mappings, and persistence-specific models.

## Allowed Contents

Future adapters, mappings, resilience policies, and integration documentation for database implementations.

## Excluded Contents

Business rules, route handlers, raw research artifacts, real learner exports, and hard-coded credentials.

## Dependencies

Implements inner-layer contracts and may depend on approved external frameworks or services.

## Related BAYA Requirements

Supports secure and replaceable database implementations across applicable BAYA modules.

## Future Implementation Notes

Credentials, private keys, service-role keys, and access tokens must be supplied outside the repository.

