# Application

## Purpose

the Clean Architecture use-case layer for local-first learner progress tracking

## Responsibilities

use cases, workflows, commands and queries, input and output models, orchestration of domain objects, and ports required for completed lessons, scores, handwriting results, mastery, summaries, and synchronization readiness

## Allowed Contents

Future categories include use-case descriptions, command and query handlers, application input and output models, workflow coordinators, and required ports.

## Excluded Contents

Screens, navigation, React Native concerns, direct database access, API client implementations, and Supabase or SQLite details do not belong here.

## Dependencies

May depend on the feature domain layer and shared application contracts. Technical adapters and presentation code depend on this layer, not the reverse.

## Related BAYA Requirements

Supports progress tracking and performance summaries.

## Future Implementation Notes

Application workflows must preserve domain independence and expose clear outcomes for online and offline execution.

