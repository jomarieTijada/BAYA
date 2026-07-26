# Naming Conventions

## Purpose

These conventions align future BAYA terminology across mobile features, backend modules, contracts, data, ML experiments, documentation, and tests.

## Ubiquitous Language

Use terms defined by the learning and research domain rather than technical substitutes:

- Character for a Baybayin character being learned or evaluated.
- Kudlit for the mark that modifies the associated sound.
- Stroke for one ordered pointer-down-to-pointer-up path.
- Attempt for one learner submission to an activity.
- Evaluation result for the structured output of a handwriting evaluator.
- Validation result for the structured output of rule-based NLP.
- Feedback message for a controlled learner-facing message selected from context.
- Award for a uniquely identifiable XP, badge, achievement, level, or challenge change.
- Content version, rule-set version, preprocessing version, evaluator version, and contract version for independently evolving artifacts.

Avoid using model as a universal term. Distinguish domain model, persistence record, API transport shape, view state, ML model, reference template, and model manifest.

## Folder and Module Names

Feature and module folder names use lowercase words separated by hyphens where more than one word is needed. Names describe ownership, such as `model-management`, `nlp-checking`, and `remote-evaluation`.

Mobile feature names reflect learner capability. Backend module names reflect bounded business ownership. Shared areas are used only for concepts with several named consumers.

## Future Domain Names

Entities use singular domain nouns. Value objects describe meaning rather than storage representation. Use cases start with an explicit learner or system intent. Repository and evaluator contracts describe the domain capability, not a vendor.

Do not name a domain concept after Expo, FastAPI, Supabase, SQLite, PostgreSQL, ONNX, an HTTP status, or a screen.

## Versions and Identifiers

Identifiers should reveal their scope: learner, lesson, content release, attempt, stroke sample, synchronization operation, award, dataset, experiment, evaluator, template, rule set, or manifest.

Version labels are immutable once published. Human-readable release labels do not replace stable identifiers. A result references the exact evaluator and preprocessing versions used, not merely a display name such as latest.

## Error Codes

Error classifications use stable, domain-oriented names and are grouped by handwriting, NLP, assessment, or synchronization ownership. A code states what occurred without embedding learner-facing prose. Feedback maps codes and context to messages.

## Events

Event names describe a completed domain fact, carry a stable event identity, and include a contract version. Reward-producing events also support stable award identity to prevent duplicate effects.

## Documentation Names

Architecture Decision Records use the assigned number and decision title. Requirements and test evidence use stable capability names from the traceability matrix. Experiment and evaluation records identify dataset, split, preprocessing, configuration, algorithm, and environment versions.

## Review Questions

Before accepting a new name, verify that it has one clear owner, does not expose a vendor in an inner layer, distinguishes research from production meaning, avoids ambiguity with ML terminology, and matches the terms used in requirements and learner-facing content.
