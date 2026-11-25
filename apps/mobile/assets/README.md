# Asset ownership

- `branding/app/`: launcher, splash and favicon source assets.
- `branding/baya/animations/v1.1/{blink,wave}/`: approved PNG sequences and central manifest; both begin at `frame-000`.
- `branding/baya-web/animations/v1.1/{blink,wave}/`: generated lossless web derivatives. `branding/baya/speaking/` remains reserved.
- `icons/{navigation,lesson,activity}/`: production icons; the shared story tail lives in `lesson/`.
- `illustrations/lessons/module-N/`: approved lesson art, grouped by owning module. Empty until supplied.
- `media/{videos,audio}/`: canonical bundled media. Register stable IDs in `content/mediaCatalog.ts`.
- `backgrounds/`, `placeholders/`: shared visual assets when actually needed. Current fallbacks are code-rendered.

`public/` contains required PWA icons/manifest only; it must not duplicate bundled lesson videos. Root `sandbox/` and `dev-assets/` preserve experiments and original media, are outside the app/public trees, and are blocked by Metro. `docs/cleanup-report.md` records decisions and duplicate hashes. Empty category directories are intentional `.gitkeep` placeholders.
