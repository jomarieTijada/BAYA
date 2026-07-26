# NLP Scope

## Purpose

BAYA uses bounded, rule-based NLP to check structured Baybayin learning exercises and produce explainable errors. It is an educational validation component, not a general language system.

## Supported Scope

The planned NLP module may validate:

- Baybayin token recognition within the supported lesson inventory.
- Character arrangement against the expected structured exercise.
- Syllable sequences.
- Kudlit presence, type, and placement.
- Word formation for approved lesson vocabulary and patterns.
- Phrase order for deliberately structured simple phrase exercises.
- Required or unsupported symbols in a controlled input context.

Each rule belongs to a versioned rule set and identifies the lesson or activity contexts in which it applies.

## Result Requirements

A validation result should communicate:

- Whether the supported input is valid.
- Stable error classifications for each relevant issue.
- The location or token span associated with the issue.
- Evidence or observed condition used by the rule.
- The expected learning concept without exposing implementation details.
- Rule-set version.
- Whether the input was unsupported rather than incorrect.

Errors are structured first. Learner-facing prose is selected later by the Feedback module or mobile BAYA Guide using the error code, lesson context, learner progress, repeated-error state, and available template version.

## Explicit Exclusions

The NLP module is not for:

- Translation between Baybayin, Filipino, English, or another language.
- Open-ended text generation.
- Advanced or general-purpose grammar checking.
- Unrestricted sentence interpretation.
- General-purpose chatbot behavior.
- Unreviewed cultural, historical, or linguistic claims.
- Guessing correctness when the exercise context is unsupported.

An unsupported input produces an explicit structured outcome rather than silently expanding the scope.

## Rule Organization

Rules are grouped by tokenization, character arrangement, syllable sequence, kudlit use, word formation, and structured phrase order. A rule has a stable identity, version, purpose, supported context, expected input assumptions, explainable outcomes, and test examples.

Rule order and combination behavior are documented so one error does not unpredictably hide another. When several errors occur, prioritization supports useful instruction without changing the factual classifications.

## Mobile and Backend Use

Approved rules may run locally for offline feedback when their content and rule-set versions are available. The backend may provide authoritative rule distribution, server validation, analytics, or compatibility checks.

Local and backend results follow the same contract semantics. Version differences are visible and synchronized with the attempt record.

## Relationship to Handwriting

Handwriting evaluation assesses stroke input and character formation. NLP validates the resulting selected or recognized structured token sequence. One module does not replace the other, and their errors retain distinct ownership.

## Relationship to the BAYA Guide

The BAYA guide consumes NLP error codes and learning context. It selects reviewed corrective feedback, hints, encouragement, or repeated-error responses. It does not invent new validation rules, translate text, or conduct unrestricted conversation.

## Privacy and Observability

Diagnostics prefer rule identifiers, versions, structured classifications, and minimized context. Logs and research exports avoid unnecessary learner identity and free-form learner content.

## Validation Plan

Future tests cover valid cases, each error category, multiple-error prioritization, unsupported inputs, rule-set compatibility, offline equivalence, and error-code-to-feedback mapping. Linguistic and instructional review is required before a rule set is approved.

## Current Status

This scope is proposed. No tokenizer, rule engine, schema, or NLP implementation has been generated.
