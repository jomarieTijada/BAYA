# Compliance #1 browser evidence

Run commands from the repository root. Requires Node with built-in WebSocket, Chrome at the Windows path in `browser-server.mjs`, and Python/Pillow only for contact sheets.

1. `npm run export:web --workspace apps/mobile`
2. In a separate terminal: `node scripts/testing/compliance-01/browser-server.mjs`. This serves the production build on 127.0.0.1:5071 with isolation headers and starts headless Chrome on debugging port 9349 with a new temporary profile. Close the process and its test Chrome when finished.
3. `node scripts/testing/compliance-01/verify-browser.mjs`
4. For the existing mentor fixture, start Expo web on port 8083 with `EXPO_PUBLIC_ENABLE_DB_INSPECTOR=true`, then run `node scripts/testing/compliance-01/extra-browser.mjs`. It uses the existing `/debug/workspace-preview?screen=dashboard` route with test data; it does not authenticate or perform workspace mutations.
5. `node scripts/testing/compliance-01/verify-writing-navigation.mjs` verifies a real drawn stroke survives Settings and Back.
6. `python scripts/testing/compliance-01/contact-sheets.py`

Outputs overwrite `docs/verification/compliance-01/`. Main capture checks seven screens, five viewport sizes and both languages (70 PNGs), persistence, keyboard selection, offline reload in both languages and offline lesson access. Additional capture checks the real Join workspace modal and mentor dashboard fixture (20 PNGs). Reports fail the command for observed page overflow or failed checks. Visually inspect contact sheets and individual captures; automated overflow checks alone cannot verify layout quality. The welcome logo's individual decorative letters can report internal overflow even though the full wordmark is visible.

These scripts are local test tools. They do not publish, deploy, or connect to a live mentor account. Language switching changes only the test profile's local preference. Existing `*-join-*` captures from the initial audit show the redirect destination, not the modal; use `*-join-modal-*` for modal evidence.
