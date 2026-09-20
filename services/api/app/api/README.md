# Api

## Purpose

Documents the HTTP-facing API presentation boundary.

## Responsibilities

Owns explicit API versions, request and response translation, authentication context handoff, and transport-safe error mapping.

## Allowed Contents

Future route registration, transport models, dependency wiring, and API documentation categories.

## Excluded Contents

Business rules, database queries, evaluator algorithms, reward decisions, and persistence models used as domain entities.

## Dependencies

May depend on module presentation and application interfaces plus shared API contracts; never directly owns domain policy.

## Related BAYA Requirements

Supports a stable mobile-to-backend boundary with explainable errors.

## Future Implementation Notes

Route handlers must remain thin and API versions must be explicit.

