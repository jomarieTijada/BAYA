# Onboarding

## Purpose

Owns the mobile feature boundary for first-run learner setup and readiness.

## Responsibilities

Coordinates Clean Architecture layers concerned with onboarding state, consent-aware setup, learner preferences, and completion decisions.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports user onboarding.

## Future Implementation Notes

Keep feature contracts explicit so online and offline behavior remain testable.

