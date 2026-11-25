# Production bundle analysis

| Disjoint export category | Before bytes | After bytes | Saved bytes |
| --- | --- | --- | --- |
| animation | 16931436 | 10949292 | 5982144 |
| audio | 1534044 | 1534044 | 0 |
| font | 4076840 | 389724 | 3687116 |
| image | 4645239 | 4645239 | 0 |
| javascript | 3063201 | 2634431 | 428770 |
| litert-runtime | 22638204 | 22638204 | 0 |
| model | 44928344 | 44928344 | 0 |
| other | 641726 | 641726 | 0 |
| video | 23095890 | 23095890 | 0 |

The storybook imported Ionicons from the `@expo/vector-icons` barrel. The fresh baseline shipped 19 fonts (4,076,840 bytes). Direct `@expo/vector-icons/Ionicons` imports leave the same icon family and 389,724 font bytes: 18 families/3,687,116 bytes removed through the bundler. This removes unreachable loaders/glyph maps too. The complete JS category (entry, worker, service worker; LiteRT loaders classified separately) falls from 3,063,201 to 2,634,431 bytes. No dependency package or lockfile entry was removed: native icons still need the package. No font glyphs were subsetted, and Baybayin text rendering is unchanged. CSS is inlined/runtime generated; no separate CSS asset is exported.

The isolated analysis export was made with Expo `--source-maps`; its maps remain under `.codex-tmp/optimization/analysis` and are never deployed/cached. `analyze-bundle.py` attributes generated character spans to source packages. These are approximate minified character contributions, not compressed transfer bytes; original source sizes are separately recorded in `bundle-attribution.json`.

| Package | Mapped generated characters | Source files |
| --- | --- | --- |
| application/workspace | 653260 | 460 |
| expo-router | 439537 | 371 |
| react-native-web | 282337 | 194 |
| react-dom | 178881 | 4 |
| expo-sqlite | 158622 | 28 |
| @supabase/auth-js | 126343 | 18 |
| @litertjs/core | 54794 | 1 |
| react-native-svg | 47250 | 21 |
| @supabase/realtime-js | 39283 | 14 |
| expo-image | 34856 | 28 |
| @supabase/phoenix | 25851 | 1 |
| @supabase/storage-js | 25660 | 1 |
| react-native-url-polyfill | 20891 | 6 |
| @supabase/postgrest-js | 18540 | 1 |
| expo-modules-core | 15669 | 37 |

Router, React DOM/Web, SQLite, Supabase and LiteRT have real route/render/persistence/sync/inference roles. No deletion was justified by import count. Recognition already initializes asynchronously; independent learning already uses local content. Further splitting would require proving that every essential chunk remains available after preparation. No speculative code splitting, dependency upgrade, global cache policy change or rendering abstraction was introduced.
