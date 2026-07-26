# Feedback

## Purpose

Reserves version-one HTTP endpoints for controlled BAYA learning feedback.

## Responsibilities

Translates authorized versioned requests and responses for BAYA guide messages, corrective feedback, hints, encouragement, repeated-error responses, feedback templates, and error-code-to-message mapping.

## Allowed Contents

Future route declarations, transport validation models, response mapping, status semantics, and API error mapping.

## Excluded Contents

Domain rules, persistence queries, framework-independent entities, evaluator implementations, and orchestration that belongs in use cases.

## Dependencies

Depends on the feedback module presentation or application boundary and versioned contracts.

## Related BAYA Requirements

Supports the in-app BAYA guide, adaptive hints, encouragement, and real-time feedback.

## Future Implementation Notes

Handlers must validate transport concerns, call a use case, and map the outcome without containing domain decisions.

