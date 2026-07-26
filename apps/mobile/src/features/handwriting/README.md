# Handwriting

## Purpose

Owns the mobile feature boundary for canvas-based Baybayin handwriting practice.

## Responsibilities

Coordinates Clean Architecture layers concerned with stroke capture, preprocessing, evaluator selection, scoring dimensions, version attribution, and fallback evaluation.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports canvas handwriting, stroke evaluation, and real-time feedback.

## Future Implementation Notes

Keep feature contracts explicit so online and offline behavior remain testable.

