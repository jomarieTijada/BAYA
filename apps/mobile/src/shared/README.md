# Shared

## Purpose

Holds mobile resources that are intentionally reusable across multiple BAYA feature presentation areas.

## Responsibilities

Provides consistent components, constants, presentation hooks, localization, theme, shared types, utilities, and input validation.

## Allowed Contents

Small stable resources with demonstrated cross-feature value.

## Excluded Contents

Feature domain rules, scoring algorithms, API implementations, repositories, and a miscellaneous dumping ground.

## Dependencies

May be consumed by feature presentation or other appropriate outer layers; it must not create reverse dependencies into features.

## Related BAYA Requirements

Supports consistent, accessible, localized, and maintainable learner experiences.

## Future Implementation Notes

Keep domain vocabulary in its owning domain and promote items here only when cross-feature stability is clear.

