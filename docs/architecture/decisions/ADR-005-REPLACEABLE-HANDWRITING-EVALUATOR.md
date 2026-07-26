# ADR 005: Use a Replaceable Handwriting Evaluator

## Status

Proposed

## Context

BAYA must compare DTW, multidimensional DTW, template matching, statistical baselines, and neural candidates. The most suitable algorithm cannot be assumed before accuracy, latency, compatibility, resource use, and feedback evidence exists.

## Decision

Define a stable evaluator contract independent of a specific algorithm or runtime. Implement candidates as adapters and require every result to report evaluator, model or template, and preprocessing versions plus supported scoring dimensions.

## Rationale

Replaceability enables fair research, test doubles, future upgrades, local and remote implementations, and rollback without embedding one algorithm in screens or domain workflows.

## Consequences

Input and output semantics must be carefully versioned. Candidate-specific evidence may need mapping to common scoring dimensions. Presentation cannot assume every evaluator offers identical fine-grained feedback beyond declared capabilities.

## Alternatives Considered

Embedding a chosen algorithm directly in the canvas or use case was rejected as premature coupling. Standardizing only an HTTP endpoint was rejected because on-device evaluation and domain-level testability also require a framework-neutral contract.

## Review Conditions

Review the contract when research shows that important evaluator families cannot express useful results without losing essential evidence, while retaining version attribution and replacement capability.

