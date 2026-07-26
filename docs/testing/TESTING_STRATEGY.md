# Testing Strategy

## Purpose

This strategy defines how future BAYA verification will connect domain correctness, adapter integration, cross-system behavior, thesis acceptance, and ISO 25010 evaluation. It does not contain tests or claim passing results.

## Testing Principles

- Test inner business behavior without frameworks wherever possible.
- Test technical adapters against the contracts they implement.
- Test versioned boundaries from the consumer's perspective.
- Use synthetic or approved controlled fixtures, never production learner or respondent records.
- Make offline, retry, conflict, duplicate-reward, evaluator-version, and rule-version behavior first-class scenarios.
- Separate automated software tests from respondent-based research instruments and measured thesis outcomes.

## Unit Testing

Future unit tests target domain rules and application use cases for lesson progression, activity scoring, stroke-input decisions, evaluator result interpretation, structured NLP rules, feedback selection, reward eligibility, duplicate prevention, progress mastery, and synchronization state transitions.

Domain tests do not require Expo, React Native, FastAPI, Supabase, SQLite, networks, or model runtimes.

## Integration Testing

Integration tests verify SQLite repositories, Supabase PostgreSQL mappings, authentication adapters, storage adapters, API clients, synchronization persistence, model loading, local evaluators, remote evaluators, and module composition.

Database records are tested through explicit mappings rather than assumed to be domain entities.

## Contract Testing

Contract tests cover explicit API versions, request and response compatibility, pagination, structured errors, synchronization events, content versions, model manifests, and evaluator result semantics. Older supported mobile clients remain part of compatibility scenarios.

## End-to-End Testing

Representative journeys include:

- Onboarding into an offline-capable lesson.
- Character and kudlit learning followed by a quiz.
- Canvas capture through local handwriting feedback.
- Remote fallback when local evaluation is unavailable.
- Word and structured phrase validation through BAYA guide feedback.
- Progress and rewards recorded locally, synchronized, and not duplicated on retry.
- Cross-device or re-authenticated progress recovery where in scope.

## Handwriting Evaluation Testing

Tests cover point validation, normalization, smoothing, resampling, segmentation, kudlit separation, stroke-order preservation, supported scoring dimensions, threshold behavior, algorithm replacement, version attribution, and local-to-remote semantic compatibility.

Research evaluation additionally measures accuracy, character correctness, kudlit placement, false acceptance, false rejection, average and high-percentile latency, size, memory, Android support, offline operation, feedback suitability, and Expo integration feasibility.

## NLP and Feedback Testing

NLP tests cover tokenization, arrangement, syllable sequence, kudlit usage, word formation, structured phrase order, explainable classifications, multiple-error prioritization, unsupported inputs, and rule-set versions.

Feedback tests verify stable error-code mapping, lesson context, adaptive hint level, encouragement, repeated errors, localization, and the exclusion of unrestricted chatbot behavior.

## Synchronization and Reliability Testing

Scenarios include application restart, network loss before and after submission, repeated batches, duplicated acknowledgements, stale versions, conflicts, partial failures, retryable failures, local outbox recovery, and long offline periods.

The same attempt and reward operations are replayed to demonstrate idempotency and duplicate-award prevention.

## Performance Testing

Measure mobile interaction responsiveness, canvas capture, preprocessing, evaluator cold and warm latency, end-to-end feedback time, API response time, synchronization batches, model or template size, memory, and relevant backend resource use. Report averages and high percentiles with device, environment, dataset, and artifact versions.

## Compatibility and Portability Testing

Cover representative Android devices, screen sizes, orientation and text scaling, SQLite behavior, Expo and React Native versions, canvas behavior, ONNX runtime only where selected, reference-template alternatives, offline state, API versions, content versions, and model-manifest compatibility.

## Security and Privacy Testing

Test authentication, authorization, learner ownership, token handling, input validation, storage access, logging redaction, secret exclusion, research-export minimization, and retention behavior. Security review includes mobile, API, storage, synchronization, and ML artifact trust boundaries.

## Usability and Acceptance

Usability research evaluates learner navigation, lesson clarity, canvas interaction, feedback comprehension, accessibility, recovery from mistakes, and perceived responsiveness using approved instruments and ethics controls.

Acceptance tests trace directly to the capability matrix and approved criteria. A capability is not accepted merely because its screen renders.

## Evidence and Reporting

Test evidence records requirement, version, environment, data or fixture source, expected outcome, observed outcome, and limitations. Research measurements and ISO 25010 findings distinguish designed support from demonstrated quality.

## Current Status

Test categories and responsibilities are documented. No test framework, test code, fixtures, datasets, or results are generated.
