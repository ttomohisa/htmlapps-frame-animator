# Frame Animator

[![GitHub Pages](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/deploy-pages.yml)
[![Validate standalone HTML](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/build-standalone.yml/badge.svg)](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/build-standalone.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Single HTML](https://img.shields.io/badge/distribution-single%20HTML-16624F)](https://ttomohisa.github.io/htmlapps-frame-animator/)

[日本語版 README](README.ja.md)

Frame Animator turns a sequence of JPEG, PNG, or still WebP images into an **animated GIF or Animated WebP**. Arrange the images, adjust the timing, preview the motion, and save the result—all in your browser, without uploading your images to a conversion server.

No registration or installation is needed to use the ready-made HTML.

## 🚀 Live demo

### [Open Frame Animator on GitHub Pages](https://ttomohisa.github.io/htmlapps-frame-animator/)

GitHub Pages delivers the initial HTML. Once loaded, image decoding, frame editing, preview, GIF/WebP encoding, and saving run in your browser. Images you select are not uploaded by the app.

[![Frame Animator desktop screenshot](assets/screenshot-en.png)](https://ttomohisa.github.io/htmlapps-frame-animator/)

The public GitHub Pages site is deployed from `main`. A new version becomes available after its PR is merged and the automatic Pages workflow successfully deploys.

## Quick start

### Use the web demo

[Open Frame Animator on GitHub Pages](https://ttomohisa.github.io/htmlapps-frame-animator/). No account or installation is needed.


### Open the single HTML file

1. Download [frame-animator.html](frame-animator.html) from this repository.
2. Open it in a current browser, such as Chrome or Edge (including directly from `file://`).
3. Add images and create an animation. The downloaded HTML can be opened offline.

### Build your own offline copy (advanced)

On Windows, download or clone this repository, then run:

```powershell
./build-standalone.ps1
```

The first build downloads the exact pinned WebP encoder package and embeds the necessary JavaScript/WASM in the output. After building, open `dist/index.html` directly without a network connection. Windows PowerShell and `tar.exe` are required for the build; Node.js and Playwright are used only for the optional automated browser tests.

GitHub Pages is enabled for this repository and the deployment workflow is configured on `main`. See the live-demo link above; the single HTML file is available for offline use.

## Screenshots

| Desktop (Japanese) | Desktop (English) |
| --- | --- |
| [![Frame Animator desktop in Japanese](assets/screenshot.png)](https://ttomohisa.github.io/htmlapps-frame-animator/) | [![Frame Animator desktop in English](assets/screenshot-en.png)](https://ttomohisa.github.io/htmlapps-frame-animator/) |

[![Frame Animator mobile](assets/screenshot-mobile.png)](https://ttomohisa.github.io/htmlapps-frame-animator/)

## Features

- Background scrolling pauses while a dialog is open and resumes after dismissal.
- **Import and reorder frames** — Select multiple images, drag and drop files, paste an image from the clipboard, or add more images later. Move cards with a mouse or touch drag handle, previous/next buttons, and natural filename sorting.
- **Set each frame's duration** — Use global presets or adjust individual frames from 20 to 10,000 ms. Use **0.5× Slower / 2× Faster** to scale mixed timings together. Undo/redo also covers sequence and timing changes.
- **Preview the actual sequence** — Play, pause, step through frames, and choose Forward, Reverse, or Ping-pong (without duplicate endpoints). Set infinite, once-only, or custom repeat counts.
- **Fit mixed image sizes** — Use preset or custom canvas dimensions, Fit/Fill placement, and transparent, white, black, or custom backgrounds.
- **Choose GIF or Animated WebP** — GIF supports 64/128/256 colors and optional dithering; WebP supports quality, lossless mode, and encoding effort. Encoding runs locally with progress and cancellation.
- **Inspect before saving** — Preview the generated GIF/WebP file, see its dimensions, frame count, duration and file size, then save it with an editable filename.
- **Mobile-friendly and local** — Three bottom navigation actions (Frames / Preview / Export), Japanese/English UI, responsive layouts, and no file upload.

## Usage

1. Choose multiple JPEG, PNG, or still WebP images, drop them onto the app, or paste an image.
2. Change the order using the card drag handle or previous/next buttons. Duplicate or remove frames as needed.
3. Set a common duration or edit each card's duration. **0.5× Slower** doubles each duration; **2× Faster** halves it. Values round to 10 ms and stay within 20–10,000 ms. `Undo` restores exact previous timings, even when rounding or a limit was applied.
4. Select the output canvas size, Fit/Fill behavior, and background.
5. Play the preview and choose Forward, Reverse, or Ping-pong and the repeat count.
6. Select **GIF** or **Animated WebP**, adjust format-specific settings, and create the result.
7. Check the *generated file* in the results area, edit the suggested filename, and save it.

On smartphones, use the **Frames / Preview / Export** controls in the fixed bottom bar to switch stages. The drag handle is separate from ordinary page scrolling.

### Playback and file format notes

Animated WebP is an **animated image, not an MP4 video**. Some image viewers display only its first frame. Open a saved WebP in a compatible browser to verify its animation. GIF and WebP exports share the same playback order and repeat settings, but each format has its own encoding options.

If you change a setting that affects an existing output, regenerate the file before saving; outdated results are marked invalid. If conversion fails, the imported frames remain available for a retry.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl` / `⌘` + `Z` | Undo |
| `Ctrl` / `⌘` + `Shift` + `Z` | Redo |
| `Ctrl` / `⌘` + `Y` | Redo |

Buttons for moving frames remain available without dragging.

## Input support and limits

**Supported inputs:** JPEG/JPG, PNG, and *still* WebP. Unsupported inputs include animated GIF, Animated WebP, APNG, HEIC/HEIF, AVIF, SVG, video, PDF, and PSD. Export formats are Animated GIF (`.gif`) and Animated WebP (`.webp`); MP4 is not generated.

| Item | Application limit |
| --- | --- |
| Number of frames | 200 |
| File size | 50 MiB per image |
| Total imported source size | 500 MiB |
| Image dimensions | 50 megapixels per image |
| Frame duration | 20–10,000 ms in 10 ms steps |
| Output canvas | 16–4096 px for each dimension |
| Custom play count | 2–100 plays (plus once/infinite) |

These are application safeguards; device memory and browser capabilities may impose additional limits. APNG and Animated WebP are rejected rather than silently flattened, including a WebP renamed as PNG/JPEG. Invalid images are reported separately while successfully imported images remain usable. An invalid-only addition preserves the current frames and any generated result.

## Publish with GitHub Pages

This repository's [Deploy standalone app to GitHub Pages](https://github.com/ttomohisa/htmlapps-frame-animator/actions/workflows/deploy-pages.yml) workflow runs when changes are pushed to `main` or when triggered manually.

1. In **Settings → Pages → Build and deployment**, use **GitHub Actions** as the publishing source.
2. Merge an approved PR into `main`, or run the deployment workflow manually from **Actions**.
3. The workflow builds and verifies the fully embedded HTML, uploads the generated `dist` site, and deploys to [the GitHub Pages URL](https://ttomohisa.github.io/htmlapps-frame-animator/).

The PR Preview is separate from GitHub Pages. The public site's version updates only after a successful deployment from `main`.

## Development and build

```text
.
├─ src/index.template.html           # App implementation and localized UI
├─ app.config.json                   # App identity and version
├─ dependencies.json                 # Pinned runtime assets
├─ dependencies.lock.json            # Package hashes / integrity
├─ build-standalone.ps1              # Windows standalone builder
├─ frame-animator.html               # Repository-root standalone HTML
├─ scripts/rc-browser-test.mjs       # Chromium regression checks
├─ assets/                            # Favicon and screenshots
└─ dist/                              # Generated build outputs
   ├─ index.html
   └─ index.self-extract.html
```

To validate the build and repository contracts on Windows:

```powershell
./scripts/check-repository.ps1
```

Run `node --test scripts/timing-import-test.mjs` for dependency-free timing/import tests. The browser regression script (`scripts/rc-browser-test.mjs`) uses Playwright and Chromium, and is also exercised by a GitHub Actions workflow. See [APP_SPEC.md](APP_SPEC.md), [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md), and [CONTRIBUTING.md](CONTRIBUTING.md) for implementation and contribution details.

## Privacy and offline operation

- Selected files are decoded, resized, animated, and saved **in your browser**. The application does not upload their contents.
- Both readable and self-extracting HTML variants embed their WebP encoder and retain the WASM permission needed for local encoding. Its Content Security Policy includes `connect-src 'none'`; no runtime CDN, analytics, telemetry, or conversion API is used.
- Images are not automatically written to localStorage or IndexedDB. Reloading/closing the page discards the working images; the language preference may be stored locally.
- Opening a hosted page requires downloading the HTML itself. To use the tool without any connection, open the standalone HTML locally.

## Browser support and limitations

Current Chrome and Edge are the primary test targets. Firefox, Safari, iOS Safari, and Android Chrome are best-effort targets; compatibility and performance can vary, particularly for large WASM encoding jobs.

Frame Animator does not accept a video as input, edit individual image pixels, add transitions/audio, or export an MP4. Large canvases and many frames can exhaust memory on some devices, despite the input guards and sequential encoding design.

## Dependencies

| Runtime dependency | Pinned version | License | Purpose |
| --- | --- | --- | --- |
| [@jsquash/webp](https://github.com/jamsinclair/jSquash) / libwebp | 1.5.0 | Apache-2.0 (wrapper); libwebp redistribution terms | Local Animated WebP encoding |

GIF encoding and frame dragging are implemented inside the application. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for full third-party notices.

## Contributing

Issues and improvement proposals are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md) before proposing a change or privately reporting a vulnerability.

## License

Copyright © 2026 ttomohisa. Licensed under the [MIT License](LICENSE).
