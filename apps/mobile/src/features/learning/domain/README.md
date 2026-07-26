# Domain

## Purpose

the innermost Clean Architecture layer for structured Baybayin instruction

## Responsibilities

business entities, value objects, domain rules, repository and evaluator contracts, and domain errors for characters, sounds, kudlit, syllables, words, phrases, content versions, and lesson progression

## Allowed Contents

Future categories include entities, value objects, domain services, repository contracts, evaluator contracts, policies, and domain errors described by the feature vocabulary.

## Excluded Contents

Expo, React Native, FastAPI, Supabase, SQLite, HTTP clients, UI components, storage implementations, and framework-specific models do not belong here.

## Dependencies

This layer depends only on language-level concepts and other explicitly shared domain concepts. All outer layers depend inward on its stable rules.

## Related BAYA Requirements

Supports structured lessons, character familiarization, and kudlit learning.

## Future Implementation Notes

Keep business decisions testable without devices, networks, databases, or UI frameworks.

