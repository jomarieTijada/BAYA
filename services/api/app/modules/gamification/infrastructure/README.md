# Infrastructure

## Purpose

Provides technical adapters for motivation and reward mechanics.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for experience points, levels, rewards, badges, achievements, progressive challenges, and duplicate-reward prevention.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports gamification with retry-safe, non-duplicated rewards.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

