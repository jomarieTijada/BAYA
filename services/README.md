# Services

## Purpose

Groups independently deployable or operated BAYA service boundaries.

## Responsibilities

Keeps backend application services distinct from the mobile client, ML research workspace, contracts, and deployment documentation.

## Allowed Contents

Service directories and their architecture documentation.

## Excluded Contents

Mobile presentation, research notebooks, datasets, secrets, and framework-generated scaffolding.

## Dependencies

Services may consume shared versioned contracts and approved ML artifacts while remaining isolated from application clients and research internals.

## Related BAYA Requirements

Supports the server-side capabilities needed for identity, content, evaluation, feedback, progress, synchronization, and analytics.

## Future Implementation Notes

The initial backend is a single API modular monolith; new services require a recorded architecture decision.

