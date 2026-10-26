# Repository verification tools

Run scripts from the repository root. Application build helpers are in
`apps/mobile/scripts`; conversion tools are in `ml/deployment/onnx`.

- `test-cloud-db.mjs`, `test-cloud-management.mjs`, `test-cloud-progress.mjs`,
  `test-workspace-approval.mjs`: isolated PGlite migration, authorization and
  progress checks. These do not access hosted Supabase.
- `test-workspace-approval-integration.mjs`: requires an explicitly isolated
  Supabase test project and refuses the production BAYA project.
- `verify-resnet18-browser.mjs`: active model browser parity verification.
- Other model-specific verification and rollback benchmarks: research comparisons
  using retained checkpoints, fixtures and archived adapters.
- UI/PWA/browser scripts: developer diagnostics requiring a browser and local
  server. Review prerequisites and target URLs before running them.
- `serve-dist.mjs`, `verify-netlify-assets.mjs`: export/server checks.

Do not use scripts to bypass disabled browser access or point mutation-oriented
integration scripts at production. Cleanup does not deploy the application.
