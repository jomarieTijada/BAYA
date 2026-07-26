# Infrastructure

## Purpose

the Clean Architecture adapter layer for structured Baybayin instruction

## Responsibilities

technical implementations of application and domain contracts needed for characters, sounds, kudlit, syllables, words, phrases, content versions, and lesson progression

## Allowed Contents

Future categories include API clients, SQLite repositories, Supabase adapters, local storage, synchronization adapters, device integration, network status, model loading, and evaluator implementations where relevant.

## Excluded Contents

Core domain decisions, screen composition, navigation behavior, and use-case orchestration do not belong here.

## Dependencies

May depend on domain and application contracts plus future technical frameworks. Inner layers must never depend on this layer.

## Related BAYA Requirements

Supports structured lessons, character familiarization, and kudlit learning.

## Future Implementation Notes

Adapters must remain replaceable so local persistence, remote services, and evaluation algorithms can evolve independently.

