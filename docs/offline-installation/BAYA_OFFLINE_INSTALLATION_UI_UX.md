# BAYA install welcome and asset loading

Updated 2026-11-26 following the install-flow revision.

## Browser visit

A lightweight welcome displays the existing colored BAYA wordmark, the existing “Mabuhay! Let's learn Baybayin together!” tagline, approved waving Bayani animation, and a speech bubble explaining installation. Install BAYA invokes a captured browser installation prompt only on user action. Where no prompt is available, instructions explain the browser menu/Share → Install app/Add to Home Screen route. An installation event changes the welcome message to opening BAYA from the home screen; it does not start the full download in the browser tab.

The install event does not cache or download any resources. The browser only loads the welcome web page and its visible UI normally. The model, videos, audio, and complete learning package are not prepared automatically in the browser. Continue in browser remains available, remembered in that tab's session. Browser users may explicitly prepare resources from Settings.

## Installed-app launch

Standalone display mode (including iOS navigator.standalone) starts real asset preparation. The screen uses the same logo, tagline, waving mascot and speech bubble, plus a single framed progress bar. The bounded view fits the safe-area height without scrolling in portrait or landscape. Short category-driven messages include Loading lessons, Loading sounds, Loading videos, Loading Bayani, Preparing handwriting, and Getting everything ready. There is no category checklist, technical version, repair-file count, language card, or second completion screen.

Verified completion of the missing-resource download drives progress; it is not a timed animation. Initial cached-file checking and final runtime validation show a spinner and clear status without a percentage. The app opens its existing landing/onboarding flow automatically when validation succeeds. Error UI offers Retry and continuing with available lessons; resource details and manual management remain in Settings. English/Tagalog controls are compact text buttons.

A stored hint suppresses the returning-launch splash while the worker checks cached resources in the background. The hint never establishes readiness. Missing files reveal the repair/loading screen at launch and are downloaded again only as needed. Valid packages are reused. Preparation now runs one verification pass rather than VERIFY followed by a redundant PREPARE verification. Reconnection recovery is preserved.

## Evidence

`docs/verification/pwa-launch/` contains install-phone, install-tagalog, manual-install-help, installed-open-app, loading-phone and loading-landscape screenshots plus browser results. The test simulates the standalone media query to exercise the application boundary; native OS installation UI was not automated. Existing full offline validation remains in `docs/verification/offline-installation/`.
