# Domain

## Purpose

Defines framework-independent business meaning for privacy-preserving operational and research summaries.

## Responsibilities

Owns entities, value objects, domain rules, repository or evaluator contracts, and domain errors governing aggregated learning performance, algorithm evaluation statistics, response-time statistics, error-frequency summaries, research exports, and privacy-preserving analytics.

## Allowed Contents

Future entities, value objects, policies, domain services, repository contracts, evaluator contracts where relevant, and domain errors.

## Excluded Contents

FastAPI, Supabase, PostgreSQL, HTTP models, route handlers, persistence models, and external service clients.

## Dependencies

Depends only on language-level concepts and stable shared domain vocabulary; all module outer layers depend inward on it.

## Related BAYA Requirements

Supports performance summaries, comparative algorithm research, and thesis evaluation exports.

## Future Implementation Notes

Domain behavior must be testable without frameworks or infrastructure.

