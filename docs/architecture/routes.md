# Application routes

`apps/mobile/app` is the Expo Router entry tree. Routes compose feature screens,
read navigation parameters and connect navigation. Keep database operations in
`database` and `modules/cloud`, recognition in `ml`, curriculum in `content`, and
reusable presentation in `components`.

- `_layout.tsx`: root providers and navigation.
- `index.tsx`: role selection and saved learner entry.
- `learner/`: onboarding, home, profile, achievements, settings, lessons,
  dynamic lesson/activity routes and workspace entry/account routes.
- `mentor/`: authentication, registration, verification, recovery and progress.
- `mentor/workspaces/`: selection, creation, management and dynamic dashboard.
- `debug/`: development diagnostics. Database inspection additionally requires
  `EXPO_PUBLIC_ENABLE_DB_INSPECTOR=true`; production cannot enable it.

The former top-level achievements, activities, authentication, handwriting, home,
lessons, onboarding, profile, progress and settings folders held planning READMEs,
not routes. Their responsibilities are implemented under the learner and mentor
trees. No actual route was deleted or renamed in this cleanup.

Preserve dynamic route names, layouts, deep links and authentication redirects.
Do not infer that a route is unused from ordinary import counts.
