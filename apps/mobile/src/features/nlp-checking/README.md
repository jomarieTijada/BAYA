# Nlp Checking

## Purpose

Owns the mobile feature boundary for structured Baybayin word and phrase validation.

## Responsibilities

Coordinates Clean Architecture layers concerned with token, arrangement, syllable, kudlit, word-formation, phrase-order, and explainable error decisions.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports word-level and phrase-level NLP checking.

## Future Implementation Notes

Keep feature contracts explicit so online and offline behavior remain testable.

