# Localization maintenance

BAYA bundles English (`en`, default) and Tagalog (`tl`) in the application. `LocalizationProvider` owns the active language and loads `interface_language` from the existing SQLite `local_app_state` table before mounting the app. The preference is device-wide, including guest use, and is not synchronized to Supabase. Both resources work offline once the app is cached.

For new UI, use `useLocalization().t(key, variables)` with an entry in `en.ts` and the matching `tl.ts` entry. Keys are TypeScript checked. Use complete sentences and named variables; do not concatenate translated sentence fragments. Use the provider date, number and learner-count helpers for formatted presentation.

Existing screens use the `Text`, `Pressable`, `TextInput`, `AccessibilityView` and `Image` presentation adapters in `components.tsx`. These resolve application-owned source phrases through the same resources without changing native component identities or data records. Full dynamic phrases live in `messages.ts`; captured values are inserted verbatim. Unknown source phrases fall back to their original text. Add new source phrases explicitly; fallback is not a substitute for translation coverage.

Mark user names, workspace names/codes and Baybayin glyphs as `<Text verbatim>`. For user-authored accessible names, use `<Pressable verbatim>`. Never translate controlled input values, identifiers, database records, scoring values or model labels. Translate complete explanatory paragraphs before splitting them into highlighted spans.

`education.ts` contains presentation translations derived from the existing curriculum. Every entry is marked `pending-subject-matter-review`; these are drafts, not validated curriculum. Keep original curriculum, IDs, glyph mappings and assessment data intact. See `docs/COMPLIANCE-01-ENGLISH-TAGALOG.md` for the review scope and terminology.

The provider changes context without re-keying children. Do not add language to activity/session keys or use it to reset effects. Preference writes are serialized; storage failure is shown accessibly while the current session keeps the selected language. Use `useLocalizedAlert` for native dialogs and subscribe to the context for screen-reader announcements.

Run the mobile tests, lint and TypeScript checks after resource or integration changes. The browser evidence workflow is in `scripts/testing/compliance-01/README.md`.
