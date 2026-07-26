# Core

## Purpose

Documents mobile-wide technical capabilities that support multiple BAYA features.

## Responsibilities

Coordinates boundaries for API access, authentication, configuration, local persistence, error handling, diagnostics, device storage, and synchronization.

## Allowed Contents

Future cross-cutting adapters and policies with no single feature owner.

## Excluded Contents

Feature-specific domain rules, screens, scoring logic, lesson progression, and reward decisions.

## Dependencies

Core adapters may implement application or domain ports. Feature domain layers must not depend on technical core implementations.

## Related BAYA Requirements

Supports local-first operation, versioned API access, privacy-aware diagnostics, authentication, and retry-safe synchronization.

## Future Implementation Notes

Prefer feature ownership unless a capability is demonstrably cross-cutting.

