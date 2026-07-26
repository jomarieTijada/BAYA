# ADR 010: Plan Supabase as the Data Platform

## Status

Proposed

## Context

BAYA needs future relational persistence, learner authentication, object storage for approved content or evaluator artifacts, and realistic but manageable operations for a student thesis.

## Decision

Plan Supabase PostgreSQL, Supabase Authentication, and Supabase Storage as infrastructure adapters behind application and domain contracts. Keep access policy, migration, storage, and secret concerns outside inner layers.

## Rationale

The platform can provide several needed managed capabilities with lower operational overhead while retaining PostgreSQL semantics and explicit adapter boundaries.

## Consequences

The implementation must manage row-level access policy, token validation, migrations, storage permissions, service-role isolation, environment separation, and platform availability. Domain behavior remains portable only if adapters and mappings stay explicit.

## Alternatives Considered

Self-managed PostgreSQL plus separate authentication and storage was considered but adds operations burden. Direct Supabase calls from screens or domain rules were rejected because they create vendor coupling and weaken authorization and test boundaries.

## Review Conditions

Review before implementation and again if cost, availability, data residency, security, portability, offline synchronization, or thesis deployment constraints make another platform more appropriate.

