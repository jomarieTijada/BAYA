# Presentation

## Purpose

Adapts external requests and responses for durable learner performance and mastery.

## Responsibilities

Maps API inputs to application use cases and use-case outcomes to versioned transport responses for completed lessons, quiz scores, handwriting results, activity performance, mastery records, and learner performance summaries.

## Allowed Contents

Future endpoint-facing controllers, transport mappers, presentation models, and error-to-response mappings.

## Excluded Contents

Domain rules, direct database queries, evaluator implementations, and transaction ownership.

## Dependencies

May depend on module application use cases and versioned shared contracts; it must not bypass the application layer.

## Related BAYA Requirements

Supports learner progress tracking and performance summaries.

## Future Implementation Notes

Route-facing logic remains thin, authorization-aware, and explicit about structured errors.

