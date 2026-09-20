# Domain

## Purpose

Defines framework-independent cross-module concepts for the BAYA backend.

## Responsibilities

Plans shared value objects, domain event vocabulary, and invariant concepts without taking ownership away from bounded modules.

## Allowed Contents

Future framework-independent cross-module concepts with multiple named module consumers.

## Excluded Contents

Feature-specific policy, speculative abstractions, credentials, and dependencies that violate inward Clean Architecture rules.

## Dependencies

Depends only on language-level concepts.

## Related BAYA Requirements

Supports consistent modular-monolith collaboration where a concept is truly cross-cutting.

## Future Implementation Notes

Document ownership and consumers before adding a shared concept.

