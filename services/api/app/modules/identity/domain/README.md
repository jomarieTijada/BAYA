# Domain

## Purpose

Defines framework-independent business meaning for learner identity and access boundaries.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing learner identity, authentication-token validation, learner profiles, and authorization boundaries.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports authentication, learner profiles, and privacy-aware access.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

