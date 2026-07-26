# Presentation

## Purpose

the Clean Architecture user-interface layer for structured Baybayin word and phrase validation

## Responsibilities

screens, components, view models, presentation hooks, user interaction handling, navigation integration, and visual feedback for token, arrangement, syllable, kudlit, word-formation, phrase-order, and explainable error decisions

## Allowed Contents

Future categories include screens, feature components, view-state models, interaction coordinators, accessibility descriptions, and navigation bindings.

## Excluded Contents

Core domain rules, database queries, synchronization mechanics, handwriting scoring, NLP validation rules, and reward-award decisions do not belong here.

## Dependencies

May call application use cases and use shared presentation resources. It must not bypass application boundaries to reach databases or remote services.

## Related BAYA Requirements

Supports word-level and phrase-level NLP checking.

## Future Implementation Notes

Present domain outcomes clearly, including offline state and explainable feedback, without reimplementing business rules. Validation returns structured, explainable errors and is limited to guided word and phrase checking.

