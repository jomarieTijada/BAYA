# Environment Configuration

## Local setup

From `C:\BAYA` in PowerShell, copy the template once:

```powershell
Copy-Item apps/mobile/.env.example apps/mobile/.env
npm run web -- --clear
```

Skip the copy if `.env` already exists and has your settings. The real `.env` stays
local and ignored; `.env.example` is intentionally safe to share and should be
committed. Neither belongs in `apps/mobile/public/`. No root `.env` is needed.

## Supported client configuration

| Variable | Purpose | Required? | Public/private | Current usage |
|---|---|---|---|---|
| `EXPO_PUBLIC_ENABLE_DB_INSPECTOR` | Enable the existing SQLite inspector | No; default `false` | Public | `app/debug/database.tsx` gates `/debug/database` |

Only the exact string `true` enables the inspector. Missing, empty, `false`, or
invalid values disable it without crashing. The template and local setup default
to `false`. Enable it only when you intend to expose the local debugging tool.
This public flag is not authentication or authorization and must not be used to
protect server data. No environment identifier or unused backend keys are added.

## Loading and build behavior

The root `start`, `mobile`, `web`, `build`, and `export:web` npm scripts delegate to
the `apps/mobile` workspace. npm runs those scripts with that workspace as the
working directory. `metro.config.js` also uses `__dirname` as the project root.
Expo's installed `@expo/env` loader resolves files relative to that project root.
Thus local startup and the Netlify workspace export both use `apps/mobile/.env`.
Running Expo directly from `C:\BAYA` targets the wrong project.

The installed SDK 57 loader resolves development files in this priority order:
`.env.development.local`, `.env.local`, `.env.development`, `.env`. Production uses
the corresponding `.production` variants. Existing shell/build environment values
take precedence over file values. Keep the single `.env` for normal local setup;
these standard variants are also ignored if needed. `.env.example` is never loaded.

Use literal dot notation, as in
`process.env.EXPO_PUBLIC_ENABLE_DB_INSPECTOR`. Expo replaces these references while
bundling; computed keys, destructuring, and optional chaining are not used.
After changes, stop Expo, restart with `npm run web -- --clear`, and reload the
development client so it uses the updated value. Re-export/rebuild production artifacts
after changes: these values are not fetched from a server at browser runtime.
One route consumes this flag, so a separate configuration module is unnecessary.

## Audit of existing configuration

- `app.json` at the repository root contains an Android package setting; the actual
  Expo configuration is `apps/mobile/app.json`. It contains app identity, plugins,
  and web settings, with no inspector override or credentials. There is no dynamic
  app config or custom Babel config. Metro uses Expo defaults plus existing asset
  and sandbox exclusions.
- The inspector previously looked in `expoConfig.extra` and used optional chaining
  on `process.env`. No `extra` flag was configured. The route now uses the single
  static environment lookup supported by Expo.
- `NODE_ENV` is already used by mascot/story components to disable autoplay in
  tests. It remains framework-controlled and is not added to `.env`.
- `BAYA_WEB_OUTPUT_DIR` is an optional Node-only service-worker generation/test
  override (default `dist`). `BAYA_PWA_REPORT` and `BAYA_PARITY_OPTIMIZATION` are
  optional verification-script settings. Python research tools use `TF_*` settings
  and optional `BAYA_CUSTOM_NOTEBOOK`; local notebooks also use dataset/work paths.
  These are tooling inputs, not frontend settings, and are left unchanged. Standalone
  Node/Python scripts do not automatically inherit values from the Expo `.env`.
- UI themes, local SQLite schema/database settings, model contracts, model URLs,
  WASM paths, and bundled learning assets remain source-controlled constants. They
  describe this app's behavior/assets and do not need environment overrides.
- `services/api` and Supabase integration are documentation/planned architecture;
  no Supabase client or configured backend was found. SQLite uses local storage,
  not a remote database connection string.
- Root `netlify.toml` retains Node 22, npm flags, workspace export, `apps/mobile/dist`,
  redirects, and headers. `.gitlab-ci.yml` only validates repository structure;
  no GitHub Actions configuration was found.
- The existing root `.gitignore` protects nested `.env` and `.env.*` while allowing
  `.env.example`. The mobile rules now explicitly do the same. No real environment
  files were tracked at the start of this change.
- A targeted scan of tracked source/configuration/documentation found no credential
  literals or recognizable secret tokens. This is not a full Git-history audit.

## Public configuration and future backend credentials

Every `EXPO_PUBLIC_` value can be read from the shipped JavaScript, even when the
source `.env` is ignored. Never store passwords, access tokens, database credentials,
private keys, signing secrets, Supabase service-role keys, or Supabase secret keys
in public client configuration. Do not log complete environment objects.

Supabase is not initialized by this change. A future integration may introduce a
public project URL and publishable/anon key when they are actually consumed.
Authentication and Row Level Security must enforce access; hiding a public key
cannot provide authorization. Server credentials must be configured separately
under the future trusted backend/deployment, never through Expo's public variables.

## Netlify

Git-based builds do not receive the developer's ignored `.env`. The default app
works without it. Leave the inspector flag unset or `false` in production. For a
deliberate override, use Netlify environment settings with the appropriate deploy
context and build availability, then trigger a new build. Keep Node/npm settings
in `netlify.toml`; do not move them into `.env` or upload a local environment file.

## Verification commands

Run from `C:\BAYA`:

```powershell
git check-ignore -v apps/mobile/.env
git check-ignore -v apps/mobile/.env.example
git ls-files --error-unmatch apps/mobile/.env
git status --short --untracked-files=all
node node_modules/typescript/bin/tsc --noEmit -p apps/mobile/tsconfig.json
npm run test --workspace=apps/mobile -- --runInBand components/debug/__tests__/DebugDatabaseRoute.test.tsx
npm run export:web --workspace=apps/mobile
```

The template may show an `!.env.example` negation in verbose `check-ignore` output;
that means it is allowed, not ignored. `git ls-files --error-unmatch` should fail
for the real `.env`, confirming it is untracked. Route tests use deterministic
values and restore the prior setting; they do not require local credentials.

## Validation record: 2026-10-17

| Check | Result |
|---|---|
| Root `npm run web -- --clear --port 8097 --localhost` | Expo reported `C:\BAYA\apps\mobile`, loaded `.env`, and exported the supported public variable |
| Development browser, flag `false` and then `true` after restart | Correct disabled/enabled inspector screen; SQLite reached READY in both cases |
| Missing/invalid flag | Five disabled cases and one enabled case passed in route tests |
| TypeScript | `tsc --noEmit -p apps/mobile/tsconfig.json` passed |
| Focused ESLint | Zero errors; one existing warning for the lazy `require()` in the debug route |
| Automated regression checks | Six suites, 65 tests passed: route flag, database connection, database operations, inspector service, PWA registration, and cache generation |
| Production export | `npm run export:web --workspace=apps/mobile` passed with `EXPO_NO_DOTENV=1` and the public flag unset, verifying independence from the local file |
| Production Chromium smoke check | Landing page and disabled inspector loaded; SQLite READY; service worker active; offline reload and SQLite initialization passed; no browser errors/warnings |
| Existing PWA browser verification | 164 assets precached; ONNX and WASM fetched offline; three offline inference runs passed |
| Export inspection | 170 files; no `.env` files; no recognizable secret tokens or private test marker in generated text assets |
| Git protection | Local `.env` ignored and untracked; template allowed; nested backend environment variants protected |
| Final local state | `.env` restored to the template's `false` default; no commits, pushes, or deployment performed |

The combined database test run leaves three existing `BroadcastChannel` message
ports open in `database/ownership.ts`. A diagnostic rerun with
`--detectOpenHandles --forceExit --silent` passed all 65 tests and identified the
handles in the existing database, connection, and inspector suites. This test
cleanup issue is outside the environment change. Development also reports existing
shadow-style and SQLite package-export warnings; the production browser checks
completed without errors. Netlify configuration, dependencies, SQLite schemas,
learner data, and ML source were not changed.

The export check used a synthetic non-public environment marker and verified that
its value was absent from generated text assets. No actual credentials were used.
Secret scanning covered current tracked source/configuration/documentation and
exported text, not historical commits or every possible secret format.

## Commit and upload the public configuration

At verification, the branch is `feature/learning-pwa`. The `github` remote points
to `https://github.com/jomarieTijada/BAYA.git`; `origin` points to GitLab. From
`C:\BAYA`, review and commit the implementation with these commands:

```powershell
git add -- README.md apps/mobile/.gitignore apps/mobile/.env.example
git add -- apps/mobile/app/debug/database.tsx apps/mobile/components/debug/__tests__/DebugDatabaseRoute.test.tsx
git add -- docs/development/environment.md docs/deployment/netlify.md
git diff --cached --stat
git commit -m "Configure Expo environment variables"
```

These explicit paths include the public template and exclude the real `.env`.
The template has been created, not committed automatically. To upload the commit
to the existing GitHub remote when ready:

```powershell
git push github feature/learning-pwa
```

References: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
[Expo environment variables](https://docs.expo.dev/guides/environment-variables/),
and [Netlify environment variables](https://docs.netlify.com/build/environment-variables/overview/).
The installed SDK 57 loader was also inspected because current online guides
include behavior for later SDK releases.
