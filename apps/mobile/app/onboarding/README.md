# Onboarding

## Purpose

Reserves mobile routes for first-run setup and learner readiness in BAYA.

## Responsibilities

Defines the future navigation entry points and route-level states for first-run setup and learner readiness.

## Allowed Contents

Future route screens, layouts, navigation parameters, and presentation-only loading or error boundaries.

## Excluded Contents

Database queries, domain decisions, handwriting scoring, NLP rules, and backend transport implementations.

## Dependencies

May depend on the corresponding feature presentation layer and shared navigation resources, then invoke application use cases through that presentation boundary.

## Related BAYA Requirements

Supports first-run setup and learner readiness.

## Future Implementation Notes

Keep route files thin and accessibility-aware; offline status should be presented without embedding synchronization rules.

