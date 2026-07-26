# Learning

## Purpose

Reserves version-one HTTP endpoints for versioned Baybayin learning content and progression.

## Responsibilities

Translates authorized versioned requests and responses for Baybayin characters, sounds, kudlit lessons, syllable formation, word construction, simple phrase lessons, lesson progression, and lesson content versions.

## Allowed Contents

Future route declarations, transport validation models, response mapping, status semantics, and API error mapping.

## Excluded Contents

Domain rules, persistence queries, framework-independent entities, evaluator implementations, and orchestration that belongs in use cases.

## Dependencies

Depends on the learning module presentation or application boundary and versioned contracts.

## Related BAYA Requirements

Supports structured lessons, character familiarization, kudlit learning, word construction, and phrase lessons.

## Future Implementation Notes

Handlers must validate transport concerns, call a use case, and map the outcome without containing domain decisions.

