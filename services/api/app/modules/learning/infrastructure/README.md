# Infrastructure

## Purpose

Provides technical adapters for versioned Baybayin learning content and progression.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for Baybayin characters, sounds, kudlit lessons, syllable formation, word construction, simple phrase lessons, lesson progression, and lesson content versions.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports structured lessons, character familiarization, kudlit learning, word construction, and phrase lessons.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

