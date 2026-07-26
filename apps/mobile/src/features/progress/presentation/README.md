# Presentation

## Purpose

the Clean Architecture user-interface layer for local-first learner progress tracking

## Responsibilities

screens, components, view models, presentation hooks, user interaction handling, navigation integration, and visual feedback for completed lessons, scores, handwriting results, mastery, summaries, and synchronization readiness

## Allowed Contents

Future categories include screens, feature components, view-state models, interaction coordinators, accessibility descriptions, and navigation bindings.

## Excluded Contents

Core domain rules, database queries, synchronization mechanics, handwriting scoring, NLP validation rules, and reward-award decisions do not belong here.

## Dependencies

May call application use cases and use shared presentation resources. It must not bypass application boundaries to reach databases or remote services.

## Related BAYA Requirements

Supports progress tracking and performance summaries.

## Future Implementation Notes

Present domain outcomes clearly, including offline state and explainable feedback, without reimplementing business rules.

