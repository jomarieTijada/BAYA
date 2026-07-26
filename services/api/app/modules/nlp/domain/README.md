# Domain

## Purpose

Defines framework-independent business meaning for rule-based and explainable Baybayin validation.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing Baybayin tokenization, character arrangement, syllable sequence, kudlit usage, word formation, structured phrase order, and explainable error classifications.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports structured word-level and phrase-level checking.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

