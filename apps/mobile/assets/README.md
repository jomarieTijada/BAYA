# Asset ownership

- `branding/app/`: launcher, splash and favicon source assets.
- `branding/baya/idle/`: existing blink/rest frames.
- `branding/baya/expressions/wave/`: existing wave frames. `speaking/` is reserved, with no invented animation.
- `icons/{navigation,lesson,activity}/`: production icons; the shared story tail lives in `lesson/`.
- `illustrations/lessons/module-N/`: approved lesson art, grouped by owning module. Empty until supplied.
- `media/{videos,audio}/`: canonical bundled media. Register stable IDs in `content/mediaCatalog.ts`.
- `backgrounds/`, `placeholders/`: shared visual assets when actually needed. Current fallbacks are code-rendered.

`public/` contains required PWA icons/manifest only; it must not duplicate bundled lesson videos. Root `sandbox/` and `dev-assets/` preserve experiments and original media, are outside the app/public trees, and are blocked by Metro. `docs/cleanup-report.md` records decisions and duplicate hashes. Empty category directories are intentional `.gitkeep` placeholders.
