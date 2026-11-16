# Physical Android follow-up (not performed in this audit)

`adb devices -l` returned no connected device. These instructions must not be interpreted as a hardware pass.

1. Connect an authorized, unlocked physical device with Chrome. Do not reset it or clear personal browsing data. Confirm its serial with `adb devices -l`.
2. From C:\BAYA, run `node scripts/serve-dist.mjs` in a dedicated terminal after the production export completes. Do not rebuild while this server is serving an export.
3. Run `powershell -File scripts/testing/baya-storybook-android.ps1 -Serial YOUR_SERIAL`. The wrapper records model, Android/Chrome versions, display and total RAM, rejects an emulator, and uses the existing device-browser helper. The helper creates/reverses a localhost port, opens a test tab, and removes its port forwarding and tab on completion. The browser script retains real device metrics rather than applying desktop viewport emulation. Outputs go under `physical/`.
4. Automated injected browser input does not replace finger/assistive-technology checks. In a separate local preview tab, personally tap the invitation, navigate all five pages and back, scroll long credits, close and reopen, and repeat in English and Tagalog. Rotate portrait↔landscape during reading and during a turn. Confirm the same page remains and that vertical scrolling does not navigate.
5. If TalkBack is already available or the device owner chooses to enable it, check dialog naming, order (illustration/credit then story then navigation), current-page announcement, disabled Previous, and focus return. Record that actual result separately from the Chrome accessibility-tree inspection.
6. After the first online cache installation, use DevTools offline network emulation for an offline reload and repeat both languages. Do not modify personal Wi-Fi or other settings merely for this test.
7. Record perceived stutter, time to open, turn duration using DevTools tracing, orientation, DPR, and any retained memory growth after repeated openings. Do not report FPS or memory measurements without the actual trace/measurement. A device's total RAM is not browser memory consumption.

The script can inspect browser logic, sources and offline navigation. Human touch, installed-PWA behavior, screen-reader speech and physical rotation remain explicit manual follow-ups. Native app builds retain their pre-existing landscape orientation and are outside this web/PWA verification.
