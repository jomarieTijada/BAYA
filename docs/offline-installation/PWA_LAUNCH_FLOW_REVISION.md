# Install welcome and loading-flow revision — 2026-11-26

The earlier full preparation card has been replaced with two separate experiences:

1. Browser: existing BAYA wordmark and tagline, approved waving mascot, install speech bubble, native Install action where available, and manual install help otherwise. Only bootstrap/UI resources are cached. A browser continuation option is available.
2. Installed app: automatic full offline preparation, a single game-style progress bar and short category-driven loading text. Once file and runtime checks pass, normal onboarding/navigation opens automatically.

Returning installations use a small persistent UI hint to avoid flashing setup, while actual cache verification continues. Missing files still trigger loading/repair. The redundant VERIFY-then-PREPARE scan is removed. File lists, version, and diagnostics remain in Settings. Normal downloading no longer labels outstanding files as needing repair. No learner records or onboarding preferences are reset.

Primary files: `OfflinePackageProvider.tsx`, `PwaLaunchScreen.tsx`, `usePwaInstall.ts`, localization dictionaries, and the existing worker generator (small mascot resources in bootstrap).

Verification: TypeScript, ESLint, production export/manifest check, generator/worker tests, `scripts/testing/pwa-launch-flow.mjs`, and the adapted complete offline browser regression. Evidence and screenshots: `docs/verification/pwa-launch/`. Full offline regression evidence: `docs/verification/offline-installation/browser-results.json` and `docs/verification/pwa-launch-offline-regression.log`.

The launch-flow browser test simulates standalone display mode and installation events to exercise the app's boundary. Native phone installation UI is not automated, and no physical mobile-device result is claimed. The actual asset downloads, cache checks, offline runtime/media, and repeated-launch behavior use the production build. The live Netlify site has not been redeployed by this change.


## Compact layout and installation correction

The download view is now a bounded flex View rather than a ScrollView. Layout dimensions account for safe-area insets and reserve room for language controls, branding, speech bubble, mascot and download state. Landscape uses two compact columns. Verified no overflow at 844×320, 780×300, 915×360, 1024×600, 390×680, 360×540 and 320×480.

The worker install event now performs zero cache/download operations. The browser still loads the web page and its visible welcome UI normally, but registration and native installation no longer wait for shell/font/mascot precaching. The opened standalone app prepares the complete package, including its shell. Browser fullscreen is no longer treated as installed-app mode. Previously verified resources are reused, never deleted to manufacture progress.

Download percentage measures completion of resources actually missing at the start of that preparation run. Cached-file checks and final runtime validation have separate status text/spinners. The artificial 99% cap is removed. A previously downloaded package correctly shows checking rather than pretending to download again.

Evidence: `docs/verification/pwa-compact/results.json` and screenshots in that directory. The browser test observed zero cached resources after registration, no model/runtime/video/audio requests before standalone launch, actual preparation after launch, and automatic continuation after runtime validation. TypeScript, ESLint, production build/manifest check and 9 focused Jest tests pass. Standalone media queries were simulated; native OS installer speed and physical phone layout remain unmeasured. No live deployment was performed.
