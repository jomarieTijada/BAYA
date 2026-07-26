# ADR 002: Apply Clean Architecture

## Status

Proposed

## Context

BAYA must combine mobile and backend frameworks with stable learning, scoring, progress, reward, synchronization, and evaluator rules. Framework choices and technical adapters may change during a thesis, especially as algorithm evidence emerges.

## Decision

Organize relevant mobile features and backend modules into domain, application, infrastructure, and presentation boundaries. Dependencies point inward: presentation calls application, application depends on domain, and infrastructure implements inner contracts.

## Rationale

Framework-independent business rules are easier to test, explain, and preserve while Expo, FastAPI, Supabase, SQLite, canvas, and evaluator implementations evolve. Explicit layers also prevent screens, routes, and persistence models from silently becoming the business model.

## Consequences

More mapping and interfaces are expected than in a framework-first prototype. Ownership and dependency reviews are required. The benefit is replaceability, isolated tests, clearer thesis reasoning, and reduced coupling to services.

## Alternatives Considered

A simple controller-service-repository layout was considered but does not sufficiently protect domain rules from frameworks. A fully event-sourced or microkernel design was rejected as unnecessary complexity for the project scope.

## Review Conditions

Review if layer ceremony consistently exceeds value for a narrowly bounded module, while preserving the rules that domain remains framework-independent and outer technologies remain replaceable.

