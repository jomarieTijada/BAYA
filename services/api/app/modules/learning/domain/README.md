# Domain

## Purpose

Defines framework-independent business meaning for versioned Baybayin learning content and progression.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing Baybayin characters, sounds, kudlit lessons, syllable formation, word construction, simple phrase lessons, lesson progression, and lesson content versions.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports structured lessons, character familiarization, kudlit learning, word construction, and phrase lessons.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

