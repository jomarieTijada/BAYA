# Infrastructure

## Purpose

Provides technical adapters for structured learner activities and scoring.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for character-identification quizzes, syllable-completion exercises, word-construction activities, kudlit-placement exercises, phrase-building activities, attempt scoring, and activity result summaries.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports interactive quizzes, scoring, and activity result summaries.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

