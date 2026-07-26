# Progress

## Purpose

Owns the mobile feature boundary for local-first learner progress tracking.

## Responsibilities

Coordinates Clean Architecture layers concerned with completed lessons, scores, handwriting results, mastery, summaries, and synchronization readiness.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports progress tracking and performance summaries.

## Future Implementation Notes

Keep feature contracts explicit so online and offline behavior remain testable.

