# Ml

## Purpose

Separates BAYA handwriting ML research, comparative algorithms, evaluation, registry governance, and production export preparation from application business logic.

## Responsibilities

Maintains traceable datasets, ethical collection guidance, reusable preprocessing research, fair algorithm experiments, defined evaluation criteria, approved artifact lifecycle, and exploratory notebooks.

## Allowed Contents

Documentation now; future research datasets, experiment configurations, research logic, results, and approved artifacts only under their governed areas.

## Excluded Contents

Mobile or backend domain rules, operational learner data, unapproved production dependencies, credentials, and any model files or datasets during this task.

## Dependencies

Research may consume governed research data and publish only approved versioned artifacts and manifests to production-facing boundaries. Application modules must not depend on notebooks.

## Related BAYA Requirements

Supports comparative handwriting evaluation using accuracy, character correctness, kudlit placement, false acceptance and rejection, average and high-percentile response time, artifact size, memory use, Android and offline compatibility, corrective-feedback suitability, and Expo integration ease.

## Future Implementation Notes

Raw data remains immutable; processed data never overwrites it. Every experiment identifies its dataset version, and every evaluated attempt identifies its algorithm or model version.

