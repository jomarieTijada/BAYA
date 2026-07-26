# ADR 008: Use Versioned Contracts

## Status

Proposed

## Context

The BAYA mobile client, backend, learning content, synchronization events, NLP rules, and evaluator artifacts may be deployed or updated at different times. Uncoordinated shape changes can break offline clients or make results uninterpretable.

## Decision

Make API versions explicit and govern shared requests, responses, errors, events, pagination, content versions, model manifests, and compatibility rules under versioned contracts.

## Rationale

Versioned contracts allow deployed clients to synchronize safely, enable controlled evolution, and preserve interpretation of attempts, feedback, rewards, and evaluator results.

## Consequences

Compatibility review and contract tests become release gates. Breaking changes require a new version or documented transition. Multiple supported versions may temporarily increase maintenance cost.

## Alternatives Considered

Implicit latest-only compatibility was rejected because offline and older clients can reconnect later. Sharing database models was rejected because persistence structures are not stable public contracts or domain entities.

## Review Conditions

Review supported-version windows and migration policy as release cadence, client adoption, security needs, or maintenance cost becomes measurable.
