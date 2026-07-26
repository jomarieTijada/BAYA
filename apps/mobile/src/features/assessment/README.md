# Assessment

## Purpose

Owns the mobile feature boundary for interactive learning assessment.

## Responsibilities

Coordinates Clean Architecture layers concerned with quiz attempts, exercise prompts, scoring rules, result summaries, and assessment feedback inputs.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports interactive quizzes and activity performance.

## Future Implementation Notes

Keep feature contracts explicit so online and offline behavior remain testable.

