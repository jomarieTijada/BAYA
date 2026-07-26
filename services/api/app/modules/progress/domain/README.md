# Domain

## Purpose

Defines framework-independent business meaning for durable learner performance and mastery.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing completed lessons, quiz scores, handwriting results, activity performance, mastery records, and learner performance summaries.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports learner progress tracking and performance summaries.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

