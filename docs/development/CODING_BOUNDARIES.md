# Coding Boundaries

## Current Restriction

This repository stage contains architecture folders and Markdown documentation only. Source, schemas, configurations, migrations, tests, model files, datasets, and executable scripts are intentionally absent.

## Future Mobile Boundaries

- Route and screen code will remain in presentation areas.
- Screens will call application use cases rather than databases, HTTP clients, storage SDKs, or evaluator implementations.
- Domain behavior will not import Expo, React Native, SQLite, Skia, ONNX Runtime, or Supabase.
- Application workflows will depend on ports rather than concrete repositories or device services.
- Canvas infrastructure will capture strokes but will not define correctness.
- Handwriting preprocessing and evaluators will implement stable contracts.
- Shared utilities will not contain feature rules merely to avoid ownership decisions.

## Future Backend Boundaries

- FastAPI routes will validate transport input, establish request context, invoke application use cases, and map outcomes.
- Domain and application layers will not import FastAPI, Supabase, PostgreSQL clients, storage SDKs, or HTTP concerns.
- Persistence models will be mapped explicitly to domain concepts.
- A module will not query or mutate another module's storage directly.
- Cross-module workflows will use documented application interfaces or events.
- Authentication token validity and resource authorization will be evaluated through distinct responsibilities.

## Handwriting Boundaries

Capture, validation, preprocessing, evaluation, feedback, persistence, and synchronization are separate steps. The stable evaluator contract must support replacement and mandatory version attribution.

An evaluator implementation may compute supported scoring dimensions. Presentation may render them. Neither presentation nor transport code may recreate the scoring algorithm.

## NLP and Feedback Boundaries

NLP owns supported deterministic validation and structured errors. Feedback owns error-code-to-message mapping, hints, encouragement, and repeated-error responses. The BAYA guide orchestrates reviewed feedback and is not a general chatbot.

Translation, open-ended generation, advanced general grammar checking, and unsupported free-form language analysis remain outside the implementation boundary.

## Data and Synchronization Boundaries

Local progress is committed before synchronization. The outbox owns pending network intent. Synchronization uses stable operation identity, explicit versions, idempotency, conflict outcomes, and retry-safe acknowledgements.

Reward logic consumes stable eligibility or award identity. Network retries must never become a second XP or achievement grant.

Operational data, ML training data, respondent data, ISO 25010 evidence, and algorithm-comparison results are not interchangeable stores.

## Research and Production Boundaries

Raw datasets are immutable. Derived datasets live in separately versioned stages. Notebooks are exploratory. Reusable selected logic moves into normal modules and receives tests.

Only approved evaluator artifacts with manifests, compatibility evidence, deployment status, and rollback metadata can be consumed by mobile or backend infrastructure.

## Secrets and Privacy

Credentials, private keys, service-role keys, tokens, and secret values never enter source control. Real learner and respondent records do not become fixtures. Logs, error reports, and research exports minimize identities and sensitive content.

## Review Gate

Future changes should be rejected or redesigned if they introduce an outer framework into a domain or application layer, move business rules into screens or routes, bypass module ownership, erase version lineage, weaken offline durability, create duplicate reward risk, expand NLP beyond approved scope, or expose unnecessary identity.
