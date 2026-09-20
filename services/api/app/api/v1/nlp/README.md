# Nlp

## Purpose

Reserves version-one HTTP endpoints for rule-based and explainable Baybayin validation.

## Responsibilities

Translates authorized versioned requests and responses for Baybayin tokenization, character arrangement, syllable sequence, kudlit usage, word formation, structured phrase order, and explainable error classifications.

## Allowed Contents

Future route declarations, transport validation models, response mapping, status semantics, and API error mapping.

## Excluded Contents

Domain rules, persistence queries, framework-independent entities, evaluator implementations, and orchestration that belongs in use cases.

## Dependencies

Depends on the nlp module presentation or application boundary and versioned contracts.

## Related BAYA Requirements

Supports structured word-level and phrase-level checking.

## Future Implementation Notes

Handlers must validate transport concerns, call a use case, and map the outcome without containing domain decisions.

