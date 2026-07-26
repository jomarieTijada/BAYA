# Technology Boundaries

## Purpose

Planned technologies support BAYA's architecture but do not define its business rules. This document identifies where future technology-specific concerns may enter.

| Planned technology | Intended boundary | Must not leak into |
|---|---|---|
| Expo | Mobile application bootstrap, runtime, routing, and delivery | Mobile feature domain and application rules |
| React Native | Mobile presentation and device integration | Domain entities, scoring rules, NLP rules, reward rules |
| TypeScript | Future mobile implementation language and shared client-side tooling | No permission to collapse feature or layer boundaries |
| Expo SQLite | Mobile infrastructure persistence adapter | Presentation screens and domain entities |
| React Native Skia | Handwriting canvas rendering and input adapter | Evaluator contracts, score policy, progress rules |
| ONNX Runtime | Approved on-device neural evaluator adapter where compatible | Domain selection policy and research experiment ownership |
| Python | Future backend and ML implementation language | No permission to mix production modules with research notebooks |
| FastAPI | Backend API presentation, dependency wiring, and server lifecycle | Module domain rules and framework-independent application use cases |
| Supabase PostgreSQL | Backend infrastructure persistence | Domain entities, API transport models, mobile presentation |
| Supabase Authentication | Identity infrastructure and token validation | Authorization business decisions outside explicit identity policy |
| Supabase Storage | Approved learning content, evaluator artifacts, and controlled export storage | Domain rules and unrestricted research-data access |

## Mobile Boundary

React Native components and Expo routes belong to presentation. Device status, SQLite, canvas, storage, and model runtime access belong to infrastructure adapters. Application use cases depend on ports, and domain rules remain executable in concept without a device runtime.

Screens never import persistence implementations to query progress or content. Canvas rendering never determines handwriting correctness. Local model loading never decides which scoring dimensions matter; it implements an evaluator contract.

## Backend Boundary

FastAPI route handlers validate transport input, establish request context, call application use cases, and map results. Supabase adapters implement authentication, persistence, or storage ports. Persistence records are mapped explicitly to domain concepts.

The modular monolith does not allow a module to bypass another module by importing its database adapter. Framework dependency wiring belongs at composition boundaries, not inside domain logic.

## ML Boundary

Research libraries, notebooks, training runtimes, and experimental artifacts remain under `ml`. A production module may consume an approved export and manifest through an infrastructure adapter; it does not import a research notebook or assume access to research datasets.

ONNX is one possible export form, not an architectural requirement. Template-based or statistical evaluators may be selected if the evidence better satisfies accuracy, latency, compatibility, offline operation, feedback, or integration needs.

## Platform and Secret Boundary

Environment-specific URLs, credentials, private keys, service-role keys, and access tokens are supplied through future secure environment mechanisms and never stored in the repository. Configuration access is mediated through dedicated core or infrastructure boundaries.

## Replacement Expectations

Storage, authentication, persistence, network, canvas, and evaluator implementations should be replaceable without rewriting domain rules. Replacement may require adapter, deployment, and compatibility changes, but stable inner contracts preserve the application behavior.

## Current Status

No listed technology is initialized or configured by this documentation scaffold.
