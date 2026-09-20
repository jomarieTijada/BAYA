# Infrastructure

## Purpose

Provides technical adapters for durable learner performance and mastery.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for completed lessons, quiz scores, handwriting results, activity performance, mastery records, and learner performance summaries.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports learner progress tracking and performance summaries.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

