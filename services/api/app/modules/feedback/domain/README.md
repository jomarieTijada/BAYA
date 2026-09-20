# Domain

## Purpose

Defines framework-independent business meaning for controlled BAYA learning feedback.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing BAYA guide messages, corrective feedback, hints, encouragement, repeated-error responses, feedback templates, and error-code-to-message mapping.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports the in-app BAYA guide, adaptive hints, encouragement, and real-time feedback.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

