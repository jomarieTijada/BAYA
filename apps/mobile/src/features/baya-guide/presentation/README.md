# Presentation

## Purpose

the Clean Architecture user-interface layer for controlled in-app learning guidance

## Responsibilities

screens, components, view models, presentation hooks, user interaction handling, navigation integration, and visual feedback for hints, corrective messages, encouragement, repeated-error responses, and error-code-to-message orchestration

## Allowed Contents

Future categories include screens, feature components, view-state models, interaction coordinators, accessibility descriptions, and navigation bindings.

## Excluded Contents

Core domain rules, database queries, synchronization mechanics, handwriting scoring, NLP validation rules, and reward-award decisions do not belong here.

## Dependencies

May call application use cases and use shared presentation resources. It must not bypass application boundaries to reach databases or remote services.

## Related BAYA Requirements

Supports the BAYA guide, adaptive hints, and real-time feedback.

## Future Implementation Notes

Present domain outcomes clearly, including offline state and explainable feedback, without reimplementing business rules.

