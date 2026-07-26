# ADR 004: Adopt a Local-First Mobile Strategy

## Status

Proposed

## Context

BAYA learners may have intermittent or unavailable connectivity. Lessons, quizzes, handwriting practice, feedback, and progress should remain useful, and completed work must not disappear when a request cannot reach the backend.

## Decision

Store required content and learner mutations locally. Commit attempts and progress locally before synchronization, queue versioned operations in an outbox, and reconcile through idempotent, retry-safe, conflict-aware backend workflows.

## Rationale

Local-first behavior improves availability and perceived responsiveness and supports classroom or home use with unreliable connectivity. Explicit synchronization semantics make offline behavior testable rather than incidental.

## Consequences

Local schema evolution, outbox identity, conflict policy, data retention, and user-visible sync state become first-class responsibilities. Some server-only capabilities may be delayed, and duplicate-reward prevention requires stable operation and award identities.

## Alternatives Considered

Online-only operation was rejected because it risks blocking learning and losing work. Cache-only offline support was rejected because it does not protect learner mutations. Full peer-to-peer synchronization was outside the project scope.

## Review Conditions

Review the boundary of offline capabilities when security, storage size, content licensing, evaluator runtime, or product requirements change.
