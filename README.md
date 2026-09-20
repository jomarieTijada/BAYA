# BAYA

BAYA is a monorepo for a landscape-first Baybayin handwriting data-collection app and its supporting research tooling.

## Repository structure

- `apps/mobile/` — Expo SDK 57 / React Native Android application.
- `packages/shared-types/` — shared handwriting and collection domain types.
- `packages/db/` — Drizzle SQLite schema, migrations, and repositories.
- `ml/` — MobileNetV2/LSTM preparation, preprocessing, export auditing, and tests.
- `docs/` — project and database documentation.
- `services/` — service-side work kept outside the mobile workspace.
- `infrastructure/` — infrastructure notes and future deployment material.

## Common commands

Run these from the repository root:

```powershell
npm install
npm run mobile
npm run db:generate
```

See `apps/mobile/AGENTS.md` before changing the Expo application and `ml/README.md` for ML validation commands.
