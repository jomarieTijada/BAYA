# Infrastructure

## Purpose

Provides technical adapters for controlled BAYA learning feedback.

## Responsibilities

Will implement repositories, storage, external integrations, evaluators, or other ports required for BAYA guide messages, corrective feedback, hints, encouragement, repeated-error responses, feedback templates, and error-code-to-message mapping.

## Allowed Contents

Future Supabase PostgreSQL repositories, storage adapters, authentication adapters, model loaders, evaluator implementations, and external clients as relevant.

## Excluded Contents

Domain policy, API route definitions, UI behavior, and research notebook experiments.

## Dependencies

May depend on module application and domain contracts plus technical frameworks; inner layers never depend on these implementations.

## Related BAYA Requirements

Supports the in-app BAYA guide, adaptive hints, encouragement, and real-time feedback.

## Future Implementation Notes

Map persistence records explicitly; database models must not automatically become domain entities.

