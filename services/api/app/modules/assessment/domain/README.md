# Domain

## Purpose

Defines framework-independent business meaning for structured learner activities and scoring.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing character-identification quizzes, syllable-completion exercises, word-construction activities, kudlit-placement exercises, phrase-building activities, attempt scoring, and activity result summaries.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports interactive quizzes, scoring, and activity result summaries.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

