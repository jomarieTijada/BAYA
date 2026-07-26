# Src

## Purpose

Holds the future internal mobile implementation organized by Clean Architecture and feature ownership.

## Responsibilities

Separates cross-cutting core adapters, feature modules, and deliberately shared presentation resources.

## Allowed Contents

Future mobile source categories under core, features, and shared after the documentation phase.

## Excluded Contents

Server modules, research-only algorithms, datasets, credentials, and generated framework scaffolding.

## Dependencies

Feature layers follow the inward dependency rule; core technical services satisfy contracts without leaking framework details inward.

## Related BAYA Requirements

Supports maintainable delivery of all BAYA mobile capabilities.

## Future Implementation Notes

No source files are created during this architecture-scaffolding task.

