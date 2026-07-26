# ADR 001: Use a Monorepo

## Status

Proposed

## Context

BAYA combines a mobile client, backend API, shared contracts, comparative handwriting research, production evaluator exports, thesis research, infrastructure planning, and cross-system tests. These areas evolve together and require consistent terminology and traceability, but they have different data and dependency boundaries.

## Decision

Maintain these areas in one repository with explicit top-level ownership for applications, services, ML, contracts, documentation, infrastructure, scripts, research, and tests. A common repository does not permit arbitrary cross-area imports or shared data access.

## Rationale

A monorepo makes architecture decisions, contract changes, thesis evidence, and implementation evolution visible in one review boundary. It reduces coordination overhead for a student project while retaining realistic separation through folder ownership and dependency rules.

## Consequences

Cross-system changes can be reviewed together and documentation is easier to keep aligned. The repository becomes broad, so boundaries, secret exclusion, dataset governance, and targeted validation must be enforced deliberately.

## Alternatives Considered

Separate repositories for mobile, backend, ML, and research were considered but would add version and coordination overhead. A single unstructured project folder was rejected because it would obscure ownership and encourage framework and research leakage.

## Review Conditions

Review if independent teams, release cycles, access-control requirements, repository size, dataset governance, or deployment constraints make separate repositories materially safer or more efficient.

