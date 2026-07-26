# Domain

## Purpose

the innermost Clean Architecture layer for canvas-based Baybayin handwriting practice

## Responsibilities

business entities, value objects, domain rules, repository and evaluator contracts, and domain errors for stroke capture, preprocessing, evaluator selection, scoring dimensions, version attribution, and fallback evaluation

## Allowed Contents

Future categories include entities, value objects, domain services, repository contracts, evaluator contracts, policies, and domain errors described by the feature vocabulary.

## Excluded Contents

Expo, React Native, FastAPI, Supabase, SQLite, HTTP clients, UI components, storage implementations, and framework-specific models do not belong here.

## Dependencies

This layer depends only on language-level concepts and other explicitly shared domain concepts. All outer layers depend inward on its stable rules.

## Related BAYA Requirements

Supports canvas handwriting, stroke evaluation, and real-time feedback.

## Future Implementation Notes

Keep business decisions testable without devices, networks, databases, or UI frameworks. Every result must record the evaluator algorithm or model version.

