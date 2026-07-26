# Profile

## Purpose

Owns the mobile feature boundary for learner profile management.

## Responsibilities

Coordinates Clean Architecture layers concerned with profile presentation, learner preferences, identity linkage, and privacy-aware profile updates.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports learner profile and settings.

## Future Implementation Notes

Keep feature contracts explicit so online and offline behavior remain testable.

