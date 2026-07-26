# Models

## Purpose

Reserves version-one HTTP endpoints for production evaluator artifact governance.

## Responsibilities

Translates authorized versioned requests and responses for model manifests, algorithm versions, template versions, compatibility information, deployment status, rollback metadata, and active evaluator configuration.

## Allowed Contents

Future route declarations, transport validation models, response mapping, status semantics, and API error mapping.

## Excluded Contents

Domain rules, persistence queries, framework-independent entities, evaluator implementations, and orchestration that belongs in use cases.

## Dependencies

Depends on the model-management module presentation or application boundary and versioned contracts.

## Related BAYA Requirements

Supports replaceable evaluators, reproducible version attribution, compatible mobile artifacts, and rollback planning.

## Future Implementation Notes

Handlers must validate transport concerns, call a use case, and map the outcome without containing domain decisions.

