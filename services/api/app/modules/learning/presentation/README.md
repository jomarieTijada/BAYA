# Presentation

## Purpose

Adapts external requests and responses for versioned Baybayin learning content and progression.

## Responsibilities

Maps API inputs to application use cases and use-case outcomes to versioned transport responses for Baybayin characters, sounds, kudlit lessons, syllable formation, word construction, simple phrase lessons, lesson progression, and lesson content versions.

## Allowed Contents

Future endpoint-facing controllers, transport mappers, presentation models, and error-to-response mappings.

## Excluded Contents

Domain rules, direct database queries, evaluator implementations, and transaction ownership.

## Dependencies

May depend on module application use cases and versioned shared contracts; it must not bypass the application layer.

## Related BAYA Requirements

Supports structured lessons, character familiarization, kudlit learning, word construction, and phrase lessons.

## Future Implementation Notes

Route-facing logic remains thin, authorization-aware, and explicit about structured errors.

