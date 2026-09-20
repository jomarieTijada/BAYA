# Domain

## Purpose

Defines framework-independent business meaning for production evaluator artifact governance.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing model manifests, algorithm versions, template versions, compatibility information, deployment status, rollback metadata, and active evaluator configuration.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports replaceable evaluators, reproducible version attribution, compatible mobile artifacts, and rollback planning.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

