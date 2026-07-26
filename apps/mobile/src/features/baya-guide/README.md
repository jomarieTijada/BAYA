# Baya Guide

## Purpose

Owns the mobile feature boundary for controlled in-app learning guidance.

## Responsibilities

Coordinates Clean Architecture layers concerned with hints, corrective messages, encouragement, repeated-error responses, and error-code-to-message orchestration.

## Allowed Contents

Domain, application, infrastructure, and presentation subfolders plus feature-level architectural documentation.

## Excluded Contents

Unrelated feature rules, backend implementations, research-only experiments, and cross-feature shortcuts.

## Dependencies

Presentation calls application use cases; application depends on domain; infrastructure implements inner contracts. Domain remains framework-independent.

## Related BAYA Requirements

Supports the BAYA guide, adaptive hints, and real-time feedback.

## Future Implementation Notes

The guide is a controlled feedback orchestrator using structured error codes and learning context, never a general-purpose chatbot.

