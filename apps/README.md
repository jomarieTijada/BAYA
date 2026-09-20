# Apps

## Purpose

Groups BAYA's future user-facing applications within the monorepo.

## Responsibilities

Defines application boundaries and keeps mobile delivery concerns separate from backend, ML research, contracts, and infrastructure.

## Allowed Contents

Application directories and architecture documentation for each independently delivered client.

## Excluded Contents

Backend modules, research datasets, production credentials, shared contract schemas during this documentation-only stage.

## Dependencies

Applications may depend on versioned contracts and consume backend services; they must not depend on research notebooks or infrastructure internals.

## Related BAYA Requirements

Supports delivery of the BAYA learner experience across onboarding, learning, practice, feedback, gamification, and progress.

## Future Implementation Notes

Only the mobile client is planned initially; add another application only after an architecture decision records the need.

