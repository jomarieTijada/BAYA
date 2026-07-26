# Presentation

## Purpose

Adapts external requests and responses for structured learner activities and scoring.

## Responsibilities

Maps API inputs to application use cases and use-case outcomes to versioned transport responses for character-identification quizzes, syllable-completion exercises, word-construction activities, kudlit-placement exercises, phrase-building activities, attempt scoring, and activity result summaries.

## Allowed Contents

Future endpoint-facing controllers, transport mappers, presentation models, and error-to-response mappings.

## Excluded Contents

Domain rules, direct database queries, evaluator implementations, and transaction ownership.

## Dependencies

May depend on module application use cases and versioned shared contracts; it must not bypass the application layer.

## Related BAYA Requirements

Supports interactive quizzes, scoring, and activity result summaries.

## Future Implementation Notes

Route-facing logic remains thin, authorization-aware, and explicit about structured errors.

