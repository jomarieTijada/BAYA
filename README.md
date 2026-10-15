# BAYA

BAYA is a monorepo for a landscape-first Baybayin handwriting data-collection app and its supporting research tooling.

## Repository structure

- `apps/mobile/` — Expo SDK 57 application; the deployed learner recognition path is the web/PWA build.
- `packages/shared-types/` — shared handwriting and collection domain types.
- `packages/db/` — Drizzle SQLite schema, migrations, and repositories.
- `ml/` — EfficientNetB0 + BiLSTM export, preprocessing validation, and raw dataset auditing.
- `docs/` — project and database documentation.
- `services/` — service-side work kept outside the mobile workspace.
- `infrastructure/` — infrastructure notes and future deployment material.

## Common commands

Run these from the repository root:

```powershell
npm install
npm run mobile
npm run web -- --clear
npm run db:generate
```

For web development, `npm run web -- --clear` starts the Expo app in
`apps/mobile` and resets Metro's cache. Stop an existing development server with
Ctrl+C before restarting. Running `npx expo start` directly from `C:\BAYA`
targets the monorepo root, which is not the Expo application and has no `App`
entry file. To use Expo commands directly, first run `cd C:\BAYA\apps\mobile`.

See `apps/mobile/AGENTS.md` before changing the Expo application and `ml/README.md` for ML validation commands.

## Mobile architecture

See [the content architecture guide](apps/mobile/content/README.md) for adding approved modules, topics, activity types and local/remote media. [The cleanup report](cleanup-report.md) records asset moves, experiments retained outside production, and verification results.

## Local research files

Training notebooks (`*.ipynb`) are kept locally and excluded from GitHub. Historical reports may name these notebooks as provenance; reproducing notebook-based model exports requires the original local research files. Runtime models, model contracts, and test fixtures remain versioned.
