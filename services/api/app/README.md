# App

## Purpose

Contains the future backend application boundary organized as a modular monolith.

## Responsibilities

Separates API adapters, cross-cutting core services, feature modules, technical infrastructure, and intentionally shared Clean Architecture concerns.

## Allowed Contents

Future application source categories after implementation begins.

## Excluded Contents

Research experiments, client screens, credentials, and framework scaffolding in this documentation-only phase.

## Dependencies

API presentation calls module application use cases; infrastructure implements inner contracts; domain remains framework-independent.

## Related BAYA Requirements

Supports maintainable backend ownership across all BAYA server modules.

## Future Implementation Notes

Module boundaries should be enforceable in tests even while deployed as one process.

