# ADR 006: Prefer On-Device Evaluation with Remote Fallback

## Status

Proposed

## Context

BAYA's real-time handwriting feedback benefits from low latency and offline availability, but some evaluators or devices may not support acceptable local execution. Server evaluation can provide capability at the cost of connectivity, transfer, latency, and privacy considerations.

## Decision

Prefer an approved compatible on-device evaluator. Use a versioned remote fallback when local evaluation is unavailable, incompatible, or unsuitable according to documented policy. Both modes return compatible result semantics and mandatory version identity.

## Rationale

This approach supports responsive offline practice while retaining a path for complex models, lower-capability devices, or staged evaluator transitions. A shared contract keeps the learner workflow stable.

## Consequences

Mobile artifact delivery, integrity, size, memory, Android compatibility, and runtime checks become necessary. Remote requests require privacy review and graceful queuing or failure states. Local and remote behavior must be compared and tested.

## Alternatives Considered

Remote-only evaluation was rejected because it undermines local-first learning. Local-only evaluation was rejected because device and evaluator constraints may exclude valid use cases. Shipping every candidate was rejected due to size, complexity, and governance risk.

## Review Conditions

Review if device coverage, runtime support, model size, latency, privacy requirements, or measured local-versus-remote quality changes substantially.
