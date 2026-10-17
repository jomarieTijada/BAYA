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

## Environment Configuration

The Expo app uses `apps/mobile/.env`. From `C:\BAYA`, create it once from the
public template (the command copies over an existing file, so skip it if already configured):

```powershell
Copy-Item apps/mobile/.env.example apps/mobile/.env
npm run web -- --clear
```

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `EXPO_PUBLIC_ENABLE_DB_INSPECTOR` | No | `false` | Set to lowercase `true` to enable the existing `/debug/database` tool for local debugging. |

Missing, empty, or unsupported values leave the inspector disabled. No backend
credentials are required. Keep the flag false for shared and production builds;
it controls a debugging screen, not authentication or authorization.

Root npm scripts run Expo inside `apps/mobile`, where Expo loads `.env` and
inlines static `process.env.EXPO_PUBLIC_*` references into client JavaScript.
After changes, stop Expo, restart with the command above, and reload the app. Production
changes require a new export. Do not create a second `.env` at the repository root.

Never put secrets in frontend configuration: `EXPO_PUBLIC_` values are public in
the built app. `.env` is Git-ignored to keep local settings and any accidentally
added credentials off GitHub. Commit `.env.example`: it intentionally contains
only a safe default and explanatory comments and is safe to share publicly.

Netlify builds work without a local `.env`. If an override is needed, configure
the variable in Netlify's environment settings for the appropriate deploy context
and make it available to builds, then rebuild. Leave the inspector unset or false
in production. Existing Node/npm settings stay in `netlify.toml`.

See [environment configuration details](docs/development/environment.md) for the
configuration audit, loading rules, security boundaries, and verification commands.

## Mobile architecture

See [the content architecture guide](apps/mobile/content/README.md) for adding approved modules, topics, activity types and local/remote media. [The cleanup report](cleanup-report.md) records asset moves, experiments retained outside production, and verification results.

## Local research files

Training notebooks (`*.ipynb`) are kept locally and excluded from GitHub. Historical reports may name these notebooks as provenance; reproducing notebook-based model exports requires the original local research files. Runtime models, model contracts, and test fixtures remain versioned.
