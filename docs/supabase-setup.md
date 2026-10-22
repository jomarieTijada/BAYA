# BAYA Supabase setup

## Current status — 2026-10-22

Project `xqtsrsxhfylfldtfbuhe` is live in Singapore. All four migrations in `supabase/migrations` have been applied through the SQL Editor. A live read-only check confirmed workspace-management functions, email-learner account creation, and RLS on all ten tables. SQL Editor execution does not register CLI migration history: do not rerun the initial schema because the migration-history page is empty.

Gmail SMTP is configured by the user; the user confirmed the test email arrived. Confirmation, recovery and returning-learner OTP templates use `{{ .Token }}` so the code can be entered in BAYA. Anonymous sign-ins remain **disabled**, as requested. No SMTP password, database password or privileged key is in the application.

The local ignored `apps/mobile/.env` and `netlify.toml` contain the public project URL/publishable key. The next Netlify build can therefore connect without depending on an ignored local file. The current changes have not been pushed or deployed to Netlify.

## Account and data flow

- Mentors register with name, email and password, then confirm an emailed code. Confirmed accounts log in with email/password. An unconfirmed login resends confirmation. Password recovery uses an emailed code and an ephemeral recovery client.
- Learners create/select their local profile, open Settings → Learner cloud account (or Join Workspace), and verify their own email code. Use a separate email from a mentor account. No anonymous account is created.
- An Auth trigger creates the stored role once. Signup metadata can request the restricted learner role; changing metadata later cannot promote a learner. Mentor self-registration is not administrative teacher approval.
- Each local learner has a separate stored Supabase session. After email verification, the local profile is bound to that Auth user. Re-authenticating with another account cannot upload the profile's saved progress. Signing out does not erase local learning.
- Learners join by the full server-generated workspace code and can sync saved topic completion. Initial join attempts a sync; failed uploads can be retried from Settings.
- Mentors create, list, rename, archive/restore workspaces and remove/restore learner access. These are reversible state changes; no learning history is deleted. Removed learners cannot rejoin themselves. Archived workspaces reject joining and synchronization.
- Dashboard and per-learner details read real synchronized completion. The approved curriculum is 3 modules and 9 topics, not the illustrative 10-stage wireframe. Manual sync shares progress with active joined workspaces.

`MENTOR_PROFILES.profile_id` links to the mentor's own `PROFILES` row. This intentionally corrects the ERD's ambiguous `learner_profile_id` label. Cloud ownership comes from `auth.uid()`; a caller's local UUID never authorizes a cloud row. Web tokens use project/profile-scoped localStorage; native tokens use SecureStore.

## Setup for a fresh project

1. Apply migrations 001, 002, 003 and 004 in filename order to a new empty schema, before creating accounts. Never drop existing tables to force a migration through.
2. Enable email signup/confirmation, keep anonymous signup disabled, and configure SMTP. The app supports the project's eight-digit codes and minimum eight-character password policy.
3. Set Confirm Signup to `supabase/templates/confirmation.html`, Reset Password to `recovery.html`, and Magic Link or OTP to `magic-link.html`.
4. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the desired project. These values are public client configuration. Never use a service-role/secret key in the client.
5. Rebuild with `npm run export:web --workspace=apps/mobile -- --clear`. Native installations need a build containing the SecureStore plugin.

## Validation and remaining checks

- 91 PostgreSQL assertions pass across base schema, progress and management/email-role scripts using actual migrations in PGlite.
- 67 focused Jest tests pass for auth, mentor/workspace UI, learner verification, settings and progress. They test SDK boundaries with mocks, not live email exchanges.
- TypeScript and targeted lint pass. Production Expo web export and PWA generation pass.
- The wider repository test run had 589 passing and 8 failing tests; the failures are in the existing separately edited storybook layout suite, not this feature.
- Live deployment verification confirms functions/RLS; earlier live REST checks confirm public curriculum reads and denied anonymous profile reads. The user confirmed SMTP delivery. Full real-account signup → join → sync → mentor-view testing and native-device testing remain outstanding.

Run from the repository root:

```powershell
node scripts/test-cloud-db.mjs
node scripts/test-cloud-progress.mjs
node scripts/test-cloud-management.mjs
npx tsc --noEmit -p apps/mobile/tsconfig.json
```

Run focused UI/service tests from `apps/mobile`:

```powershell
npx jest --runInBand --forceExit modules/cloud modules/progress components/mentor components/progress components/learner/settings
```

Limits: email confirmation is not email MFA on every password login. The app does not claim that extra factor. Sync uploads topic completions, not raw handwriting/strokes or review histories; it does not download cloud progress into a new device. Signing in on a new local profile recovers cloud identity/memberships, while offline progress remains local. Public CAPTCHA enforcement has not been enabled or implemented. Gmail SMTP delivery/quotas still depend on the configured provider.
