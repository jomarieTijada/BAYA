# ADR 003: Use a Modular Monolith for the Backend

## Status

Proposed

## Context

The BAYA backend responsibilities include identity, content, assessment, handwriting, NLP, feedback, rewards, progress, synchronization, analytics, and model management. They have meaningful boundaries but a student thesis does not need the deployment and operations burden of distributed services.

## Decision

Implement one backend deployment with explicit business modules. Each module owns domain, application, infrastructure, presentation, and tests, and collaborates through named application interfaces, contracts, or events rather than direct persistence access.

## Rationale

A modular monolith provides realistic separation and testability without network coordination, distributed transactions, service discovery, or multi-service operations. It allows later extraction if evidence justifies it.

## Consequences

Module discipline must be enforced within one process. A shared database does not permit cross-module table access. Deployment remains simpler, but a failure can affect the whole backend and scaling is initially process-level.

## Alternatives Considered

Microservices were rejected because operational complexity outweighs expected thesis value. A single undivided backend was rejected because identity, learning, evaluation, feedback, and synchronization would become tightly coupled.

## Review Conditions

Review if a module develops independent scaling, security, availability, release, or technology requirements that cannot be met reasonably inside the monolith.
