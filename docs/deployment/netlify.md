# BAYA Netlify Production & PWA Deployment Guide

This document details the configuration, build, deployment, and validation procedures for hosting the **BAYA (Baybayin Interactive Learning System)** web application as an installable Progressive Web Application (PWA) on **Netlify**.

---

## 1. Overview & Architecture

BAYA is architected as an offline-capable React Native Web / Expo application with client-side SQLite persistence and browser-based machine learning inference.

Key runtime components:
- **Client Framework**: React Native Web 0.21.2, Expo SDK 57, Expo Router 57 (Single-Page Application).
- **Client Persistence**: `expo-sqlite@~57.0.3` running `wa-sqlite` over browser **Origin Private File System (OPFS)** via `AccessHandlePoolVFS`. OPFS requires a **Secure Context** (`window.isSecureContext === true`, available on `https://` and `localhost`).
- **Machine Learning**: `onnxruntime-web@1.30.0` executing `Baybayin_EfficientNetB0_BiLSTM_1.1.onnx` (16.38 MiB) using WebAssembly (WASM CPU) with one thread / SIMD.
- **Service Worker / PWA**: Custom versioned Service Worker (`sw.js`) precaching the app shell, static assets, ONNX model, and WASM runtime for offline operation.
- **Routing**: Client-side Single Page Application (SPA) routing where all non-file URLs rewrite to `/index.html` with HTTP 200.

---

## 2. Netlify Dashboard Setup

When creating a new site in the [Netlify Dashboard](https://app.netlify.com/):

### Option A: Monorepo Root Setup (Recommended)
This matches the primary `netlify.toml` in the repository root:
- **Repository**: Select your BAYA Git repository (GitHub / GitLab).
- **Base directory**: *(Leave empty / root)*
- **Build command**: `npm run export:web --workspace=apps/mobile` (or `npm run build`)
- **Publish directory**: `apps/mobile/dist`
- **Functions directory**: *(None)*

### Option B: Subdirectory Setup
If you prefer setting the Netlify Base Directory to the mobile app workspace:
- **Base directory**: `apps/mobile`
- **Build command**: `npm run export:web`
- **Publish directory**: `dist`
- **Functions directory**: *(None)*

Both configurations are fully supported because repository-controlled configuration files exist at both levels:
1. `C:\BAYA\netlify.toml` (Monorepo root)
2. `C:\BAYA\apps\mobile\netlify.toml` (Workspace root)
3. `C:\BAYA\apps\mobile\public\_redirects` (Copied to `dist/_redirects`)
4. `C:\BAYA\apps\mobile\public\_headers` (Copied to `dist/_headers`)

---

## 3. Environment Variables

BAYA is an entirely static, client-side application. **No runtime secrets or database credentials are required** for static hosting.

Recommended Netlify build environment variables:
| Variable | Value | Purpose |
|---|---|---|
| `NODE_VERSION` | `22` | Matches modern Node.js runtime for build scripts |
| `NPM_FLAGS` | `--legacy-peer-deps` | Ensures seamless peer dependency resolution across Expo packages |

These are already declared in `netlify.toml` under `[build.environment]`.

---

## 4. Git-Based Auto-Deployment Workflow

Netlify continuously monitors your target branch (e.g., `main` or `master`).

To deploy updates:
```bash
# 1. Check status and ensure working tree is clean
git status

# 2. Stage your changes
git add .

# 3. Commit with a descriptive message
git commit -m "feat(pwa): update Baybayin learning assets"

# 4. Push to remote
git push origin main
```

Upon receiving the push webhook, Netlify will:
1. Clone the repository and install dependencies.
2. Run `npm run export:web --workspace=apps/mobile`.
3. Pre-copy WASM dependencies (`copy:ort-wasm`).
4. Generate the hashed PWA Service Worker (`generate-pwa-service-worker.mjs`).
5. Copy public assets including `_redirects` and `_headers` into `apps/mobile/dist`.
6. Deploy the `dist` directory to your production HTTPS URL (`https://<your-site>.netlify.app`).

---

## 5. Security & Isolation Headers

Multi-threaded WebAssembly (`ort-wasm-simd-threaded.wasm`) and high-performance Web Workers benefit from **Cross-Origin Isolation**. The following headers are automatically applied by Netlify:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

*Note: `Cross-Origin-Embedder-Policy: credentialless` is used instead of `require-corp` to prevent blocking public third-party assets while still enabling `window.crossOriginIsolated === true` in supported browsers.*

---

## 6. Large File Caching & MIME Types

The ONNX model (`16.38 MiB`) and WASM runtime (`14.24 MB`) must be served as immutable binaries without accidental HTML SPA rewrites:

| Route | Content-Type | Cache-Control |
|---|---|---|
| `/models/*` | `application/octet-stream` | `public, max-age=31536000, immutable` |
| `/ort/*.wasm` | `application/wasm` | `public, max-age=31536000, immutable` |
| `/_expo/static/*` | Hashed bundle MIME | `public, max-age=31536000, immutable` |
| `/sw.js` | `application/javascript` | `no-cache, no-store, must-revalidate` |
| `/manifest.json`| `application/manifest+json` | `public, max-age=0, must-revalidate` |
| `/index.html` | `text/html; charset=utf-8` | `no-cache, must-revalidate` |

---

## 7. Verification & Testing Procedures

### A. Testing Production HTTPS URL
Open `https://<site-name>.netlify.app` in desktop Chrome or Edge.
1. Open DevTools (`F12`) -> **Console**.
2. Run the environment verification snippet:
   ```javascript
   console.log({
     isSecureContext: window.isSecureContext,
     crossOriginIsolated: window.crossOriginIsolated,
     hasOPFS: typeof navigator.storage?.getDirectory === 'function',
     serviceWorkerActive: Boolean(navigator.serviceWorker?.controller),
   });
   ```
   **Expected**: All values should be `true`.

### B. Testing Direct Deep Routes (SPA Routing)
Verify that client-side routes can be directly refreshed without Netlify 404 errors:
- `https://<site-name>.netlify.app/learner/home`
- `https://<site-name>.netlify.app/learner/settings`
- `https://<site-name>.netlify.app/learner/lessons`
- `https://<site-name>.netlify.app/learner/activities/topic-3-1`

### C. Testing OPFS & Topic Progress Persistence
1. Navigate to `/learner/activities/topic-1-1`.
2. Press **Next**.
3. Verify the console logs: `[BAYA Progress] topicId=topic-1-1 saveStarted=true` followed by `saveCompleted=true`.
4. Verify **zero** `[Error: Invalid VFS state]` warnings occur.
5. Reload `/learner/home` and confirm that progress reflects Topic 2 of 5.

### D. Testing Machine Learning Inference (Suriin)
1. Navigate to `/learner/activities/topic-3-1` (Vowels Writing Practice).
2. Draw the Baybayin character for **A** (ᜀ).
3. Tap **Suriin**.
4. In DevTools Network tab, verify:
   - `/models/baya/Baybayin_EfficientNetB0_BiLSTM_1.1.onnx` returns HTTP 200 with ~16.38 MiB.
   - `/ort/ort-wasm-simd-threaded.wasm` returns HTTP 200 with ~14.24 MB.
5. In the UI, verify:
   - Recognition result displays Top-1 candidate and confidence percentage.
   - Top-3 candidates list appears below the canvas.

### E. Testing PWA Installation
1. On an Android device or desktop Chrome, open `https://<site-name>.netlify.app`.
2. Chrome will display the **Install BAYA** prompt in the address bar (or under 3-dots menu -> *Install application* / *Add to Home screen*).
3. Install the app and launch it from the Home Screen or App Launcher.
4. Verify that the app launches in **standalone mode** (no browser URL bar or navigation controls).

### F. Testing Offline Mode
1. After opening the app online and navigating to a writing activity once (to let the Service Worker finish caching the 17 MB model and WASM runtime):
2. Disconnect Wi-Fi and mobile data (Airplane Mode).
3. Close the browser tab or PWA window completely.
4. Re-open the PWA or visit the URL.
5. The app shell loads instantly from cache.
6. Navigate to `/learner/activities/topic-3-1`, draw a character, and tap **Suriin**.
7. Inference executes entirely in-browser offline using the cached WASM and ONNX model.
8. Local progress is saved to OPFS SQLite.
