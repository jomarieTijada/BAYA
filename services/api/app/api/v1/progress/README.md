# Progress

## Purpose

Reserves version-one HTTP endpoints for durable learner performance and mastery.

## Responsibilities

Translates authorized versioned requests and responses for completed lessons, quiz scores, handwriting results, activity performance, mastery records, and learner performance summaries.

## Allowed Contents

Future route declarations, transport validation models, response mapping, status semantics, and API error mapping.

## Excluded Contents

Domain rules, persistence queries, framework-independent entities, evaluator implementations, and orchestration that belongs in use cases.

## Dependencies

Depends on the progress module presentation or application boundary and versioned contracts.

## Related BAYA Requirements

Supports learner progress tracking and performance summaries.

## Future Implementation Notes

Handlers must validate transport concerns, call a use case, and map the outcome without containing domain decisions.

