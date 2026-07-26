# Application

## Purpose

the Clean Architecture use-case layer for controlled in-app learning guidance

## Responsibilities

use cases, workflows, commands and queries, input and output models, orchestration of domain objects, and ports required for hints, corrective messages, encouragement, repeated-error responses, and error-code-to-message orchestration

## Allowed Contents

Future categories include use-case descriptions, command and query handlers, application input and output models, workflow coordinators, and required ports.

## Excluded Contents

Screens, navigation, React Native concerns, direct database access, API client implementations, and Supabase or SQLite details do not belong here.

## Dependencies

May depend on the feature domain layer and shared application contracts. Technical adapters and presentation code depend on this layer, not the reverse.

## Related BAYA Requirements

Supports the BAYA guide, adaptive hints, and real-time feedback.

## Future Implementation Notes

Application workflows must preserve domain independence and expose clear outcomes for online and offline execution.

