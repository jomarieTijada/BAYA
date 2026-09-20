# Infrastructure

## Purpose

Defines shared technical adapters for the BAYA backend.

## Responsibilities

Plans technical implementations used consistently by several modules without taking ownership away from bounded modules.

## Allowed Contents

Future shared technical adapters with multiple named module consumers.

## Excluded Contents

Feature-specific policy, speculative abstractions, credentials, and dependencies that violate inward Clean Architecture rules.

## Dependencies

May depend on shared application and domain contracts.

## Related BAYA Requirements

Supports consistent modular-monolith collaboration where a concept is truly cross-cutting.

## Future Implementation Notes

Document ownership and consumers before adding a shared concept.

