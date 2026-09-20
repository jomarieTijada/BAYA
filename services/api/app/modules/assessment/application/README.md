# Application

## Purpose

Defines use cases and workflows for structured learner activities and scoring.

## Responsibilities

Coordinates commands, queries, input and output models, domain objects, and required ports for character-identification quizzes, syllable-completion exercises, word-construction activities, kudlit-placement exercises, phrase-building activities, attempt scoring, and activity result summaries.

## Allowed Contents

Future use cases, command and query handlers, workflow coordinators, application models, and required ports.

## Excluded Contents

FastAPI routes, direct database access, Supabase clients, persistence models, and UI concerns.

## Dependencies

May depend on the module domain and stable shared application contracts; infrastructure and presentation depend on it.

## Related BAYA Requirements

Supports interactive quizzes, scoring, and activity result summaries.

## Future Implementation Notes

Use cases establish transaction and idempotency intent while leaving technical execution to adapters.

