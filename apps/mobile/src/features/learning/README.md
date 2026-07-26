# Learning

## Purpose

Owns the mobile feature boundary for structured Baybayin instruction.

## Responsibilities

Coordinates Clean Architecture layers concerned with characters, sounds, kudlit, syllables, words, phrases, content versions, and lesson progression.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports structured lessons, character familiarization, and kudlit learning.

## Future Implementation Notes

Keep feature contracts explicit so online and offline behavior remain testable.

