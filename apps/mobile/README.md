# Mobile

## Purpose

Defines the local-first Expo and React Native mobile application boundary planned for BAYA.

## Responsibilities

Owns learner navigation, offline learning, handwriting capture, on-device evaluation when applicable, controlled feedback, gamification, and progress presentation.

## Allowed Contents

Route documentation, feature-first Clean Architecture areas, shared mobile presentation resources, and future mobile implementation artifacts.

## Excluded Contents

Backend business modules, ML experiment notebooks, server migrations, credentials, and unrestricted chatbot behavior.

## Dependencies

May consume versioned contracts and backend APIs. Feature dependencies must point inward from presentation through application to domain, with infrastructure implementing inner contracts.

## Related BAYA Requirements

Supports the complete learner-facing BAYA experience, including offline practice and later retry-safe synchronization.

## Future Implementation Notes

Expo, React Native, SQLite, Skia, and ONNX Runtime are planned technologies only and are not initialized here.

