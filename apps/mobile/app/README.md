# App

## Purpose

Reserves the route-facing presentation boundary for BAYA mobile navigation.

## Responsibilities

Maps learner journeys to feature presentation entry points and keeps route composition thin.

## Allowed Contents

Future route groups, navigation entry points, layouts, and route-level presentation metadata.

## Excluded Contents

Domain rules, handwriting scoring, NLP validation, repository access, and synchronization logic.

## Dependencies

Depends on feature presentation surfaces and shared navigation conventions; it must not directly call databases or technical adapters.

## Related BAYA Requirements

Supports clear navigation among onboarding, lessons, activities, handwriting, progress, achievements, profile, and settings.

## Future Implementation Notes

Routes should delegate behavior to feature presentation and application layers when implementation begins.

