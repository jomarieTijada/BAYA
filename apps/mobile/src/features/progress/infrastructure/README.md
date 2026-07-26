# Infrastructure

## Purpose

the Clean Architecture adapter layer for local-first learner progress tracking

## Responsibilities

technical implementations of application and domain contracts needed for completed lessons, scores, handwriting results, mastery, summaries, and synchronization readiness

## Allowed Contents

Future categories include API clients, SQLite repositories, Supabase adapters, local storage, synchronization adapters, device integration, network status, model loading, and evaluator implementations where relevant.

## Excluded Contents

Core domain decisions, screen composition, navigation behavior, and use-case orchestration do not belong here.

## Dependencies

May depend on domain and application contracts plus future technical frameworks. Inner layers must never depend on this layer.

## Related BAYA Requirements

Supports progress tracking and performance summaries.

## Future Implementation Notes

Adapters must remain replaceable so local persistence, remote services, and evaluation algorithms can evolve independently.

