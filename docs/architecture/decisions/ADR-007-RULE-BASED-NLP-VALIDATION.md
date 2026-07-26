# ADR 007: Use Rule-Based NLP Validation

## Status

Proposed

## Context

BAYA needs explainable checking for controlled Baybayin word and simple phrase exercises. Learners and researchers must be able to understand why input was classified as incorrect, and the thesis does not require open-ended language generation.

## Decision

Implement versioned deterministic rules for tokenization, character arrangement, syllable sequence, kudlit use, word formation, and structured phrase order. Return stable error codes, locations, and evidence. Keep translation, open-ended generation, advanced grammar checking, and general chatbot behavior outside scope.

## Rationale

Rule-based validation matches the constrained curriculum, supports offline execution, creates testable error taxonomies, and enables reviewed corrective feedback without opaque generation.

## Consequences

Coverage is limited to documented vocabulary and patterns. Linguistic and instructional review is required. Unsupported inputs must be reported explicitly, and rule-set versions accompany results.

## Alternatives Considered

A large-language-model chatbot was rejected because it expands scope, reduces determinism and offline feasibility, and complicates explanation and safety. Pure exact-string matching was rejected because it cannot express useful structured error classifications.

## Review Conditions

Review if approved curriculum requirements exceed maintainable deterministic rules and a candidate alternative can preserve explainability, privacy, offline expectations, versioning, and bounded behavior.

