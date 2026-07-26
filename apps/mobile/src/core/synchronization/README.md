# Synchronization

## Purpose

Defines the boundary for offline-to-backend coordination in the BAYA mobile client.

## Responsibilities

Plans outbox behavior, batching, retries, conflicts, idempotency keys, and sync status.

## Allowed Contents

Future interfaces, adapters, policies, and documentation directly concerned with offline-to-backend coordination.

## Excluded Contents

Feature domain rules, UI composition, learning-content ownership, handwriting scoring decisions, and NLP rule definitions.

## Dependencies

May implement ports defined by application or domain layers and may use future platform services; inner layers remain independent.

## Related BAYA Requirements

Supports offline-to-backend coordination, especially dependable local-first learning and controlled recovery behavior.

## Future Implementation Notes

No credentials or sensitive learner data may be embedded in configuration, logs, or storage documentation.

