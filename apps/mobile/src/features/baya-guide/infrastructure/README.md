# Infrastructure

## Purpose

the Clean Architecture adapter layer for controlled in-app learning guidance

## Responsibilities

technical implementations of application and domain contracts needed for hints, corrective messages, encouragement, repeated-error responses, and error-code-to-message orchestration

## Allowed Contents

Future categories include API clients, SQLite repositories, Supabase adapters, local storage, synchronization adapters, device integration, network status, model loading, and evaluator implementations where relevant.

## Excluded Contents

Core domain decisions, screen composition, navigation behavior, and use-case orchestration do not belong here.

## Dependencies

May depend on domain and application contracts plus future technical frameworks. Inner layers must never depend on this layer.

## Related BAYA Requirements

Supports the BAYA guide, adaptive hints, and real-time feedback.

## Future Implementation Notes

Adapters must remain replaceable so local persistence, remote services, and evaluation algorithms can evolve independently.

