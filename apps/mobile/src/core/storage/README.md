# Storage

## Purpose

Defines the boundary for device storage abstractions in the BAYA mobile client.

## Responsibilities

Plans durable preferences, cached learning content, model metadata, and safe artifact locations.

## Allowed Contents

Future interfaces, adapters, policies, and documentation directly concerned with device storage abstractions.

## Excluded Contents

Feature domain rules, UI composition, learning-content ownership, handwriting scoring decisions, and NLP rule definitions.

## Dependencies

May implement ports defined by application or domain layers and may use future platform services; inner layers remain independent.

## Related BAYA Requirements

Supports device storage abstractions, especially dependable local-first learning and controlled recovery behavior.

## Future Implementation Notes

No credentials or sensitive learner data may be embedded in configuration, logs, or storage documentation.

