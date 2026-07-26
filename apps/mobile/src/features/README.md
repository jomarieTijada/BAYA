# Features

## Purpose

Organizes BAYA mobile behavior by learner-facing feature while preserving Clean Architecture inside each feature.

## Responsibilities

Provides bounded ownership for onboarding, learning, assessment, handwriting, structured NLP checking, the BAYA guide, gamification, progress, and profile behavior.

## Allowed Contents

Feature folders containing domain, application, infrastructure, and presentation boundaries.

## Excluded Contents

Unowned cross-feature utilities, backend modules, research notebooks, and framework initialization.

## Dependencies

Features may share deliberately stable contracts but should communicate through application-level boundaries rather than reaching into one another's adapters.

## Related BAYA Requirements

Maps the mobile application directly to BAYA's functional capabilities.

## Future Implementation Notes

A feature should remain cohesive enough to change without forcing unrelated features to change.

