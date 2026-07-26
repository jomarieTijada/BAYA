# Modules

## Purpose

Holds the bounded business modules of the BAYA backend modular monolith.

## Responsibilities

Provides independent ownership for identity, learning, assessment, handwriting, NLP, feedback, gamification, progress, synchronization, analytics, and model management.

## Allowed Contents

Module folders with domain, application, infrastructure, presentation, tests, and module-level documentation.

## Excluded Contents

Cross-module database shortcuts, unowned shared logic, route-only business rules, and direct dependencies on research notebooks.

## Dependencies

Modules collaborate through explicit application contracts or events. Each follows Presentation to Application to Domain, with Infrastructure implementing inner interfaces.

## Related BAYA Requirements

Supports the full server-side BAYA capability map while retaining realistic student-thesis manageability.

## Future Implementation Notes

Prefer one deployable backend with strongly documented module boundaries before considering distributed services.

