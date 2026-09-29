# Local SQLite database

The learner app opens `baya.db` through `expo-sqlite`. `getReadyDatabase()` in
`lifecycle.ts` applies numbered migrations and reconciles the approved
curriculum seed once at startup. The Lessons screens also await this readiness
before reading data.

`001_initial_schema` creates the eleven tables in the local ERD.
`002_indexes` adds lookup indexes. `003_activity_content` stores reviewed
storybook material. `004_local_learner_state` adds the local active-profile
pointer and indexes for the remaining ERD relationships. Migrations preserve
existing rows and are recorded in `schema_migrations`.

The executable migration registry is `migrations/index.ts`. Keep its SQL in
sync with the matching numbered `.sql` files; Metro loads the TypeScript
registry rather than importing raw SQL assets.

The connection uses Expo SDK 57's exclusive transactions on native. Web uses
its supported regular transaction API and requires WASM support plus COEP/COOP
headers on the hosting server. Metro and the Expo Router hosting configuration
include these settings.

`apps/mobile/database` is the learner runtime database. The separate
`packages/db` schema is not loaded by the Expo app.

`content/approvedCurriculum.ts` is the only authority for module and topic
membership, order, and titles. `seed.ts` copies that manifest into SQLite.
Learner profiles and topic completion are stored in `profiles`,
`activity_attempts`, and `learner_progress`. The UI overlays stored completion
onto the approved manifest, so stale or extra rows cannot add learning topics.

The optional workspace code entered during setup is saved locally as pending.
It does not create a workspace membership until a matching mentor workspace
and sync flow are available. The ERD's workspace, review, and sync-outbox
tables are present for those later features; there is no remote sync yet.
