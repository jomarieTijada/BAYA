# Presentation

## Purpose

Adapts external requests and responses for production evaluator artifact governance.

## Responsibilities

Maps API inputs to application use cases and use-case outcomes to versioned transport responses for model manifests, algorithm versions, template versions, compatibility information, deployment status, rollback metadata, and active evaluator configuration.

## Allowed Contents

Future endpoint-facing controllers, transport mappers, presentation models, and error-to-response mappings.

## Excluded Contents

Domain rules, direct database queries, evaluator implementations, and transaction ownership.

## Dependencies

May depend on module application use cases and versioned shared contracts; it must not bypass the application layer.

## Related BAYA Requirements

Supports replaceable evaluators, reproducible version attribution, compatible mobile artifacts, and rollback planning.

## Future Implementation Notes

Route-facing logic remains thin, authorization-aware, and explicit about structured errors.

