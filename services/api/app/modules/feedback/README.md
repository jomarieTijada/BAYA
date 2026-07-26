# Feedback

## Purpose

Owns the backend module for controlled BAYA learning feedback.

## Responsibilities

Defines BAYA guide messages, corrective feedback, hints, encouragement, repeated-error responses, feedback templates, and error-code-to-message mapping.

## Allowed Contents

Domain, application, infrastructure, presentation, tests, and focused module documentation.

## Excluded Contents

Responsibilities owned by other modules, cross-module persistence access, research-only experiments, and framework concerns in domain rules.

## Dependencies

Follows inward Clean Architecture dependencies and communicates with other modules through explicit contracts, use cases, or events.

## Related BAYA Requirements

Supports the in-app BAYA guide, adaptive hints, encouragement, and real-time feedback.

## Future Implementation Notes

The BAYA guide consumes structured error codes and learning context as a controlled feedback orchestrator, not an unrestricted chatbot.

