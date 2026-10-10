# Changelog

## 1.0.3 - 2026-10-10

- Prevent background scrolling while a native modal is open and restore it on dismissal.
- Preserve current media processing, export, dependencies and privacy boundaries.

All notable changes to Frame Animator will be documented in this file.

The project uses Semantic Versioning.

## [1.0.2] - 2026-10-09

### Fixed
- Normalize the canonical app icon to `#16624f` with exact 25% background corner radii, preserving existing artwork and padding.
- Keep the app header, favicon, and generated standalone variants synchronized.

## [Unreleased]

## [1.0.1] - 2026-10-09

### Added

- One-click 0.5× slower / 2× faster timing controls scale every frame's current duration together, including mixed timings, with Undo/Redo.
- Regression coverage for mixed-timing exports, APNG and renamed Animated WebP rejection, local file variants, and reload privacy.

### Fixed

- Restore export-format tabs immediately after import and report the actual accepted count for partially successful batches.
- Preserve the source app's narrow WASM permission in the self-extract loader CSP, fixing Animated WebP export from that variant without enabling general JavaScript eval or network access.
- Reject APNG before decoding instead of silently importing its first frame, including PNGs with large metadata chunks.
- Identify animated WebP by file contents even when its filename or MIME type says PNG/JPEG. Invalid additions preserve existing frames, timings, and generated results.
- Give the EN/JA switch a destination tooltip in the current UI language and localize the duration preset group label.

### Notes

- Speed changes round to 10 ms and retain the existing 20–10,000 ms duration limits. Undo restores the exact previous values; opposite speed buttons are not a lossless inverse at rounding/limit boundaries.

## [1.0.0] - 2026-10-08

### Stable release

- Finalized the complete local still-image to Animated GIF/Animated WebP workflow: import, reorder, set timing, preview, export, inspect and save.
- Stabilized lifted-card dragging with a placeholder and smooth movement of neighboring cards.
- Aligned smartphone bottom navigation with Browser Kitty's Signal Screen visual conventions, using SVG icons and larger tap targets.
- Published concise Japanese and English README documentation following PDF Organizer's practical quick-start, features, usage, build, privacy, and limitations structure.
- Updated the stable app version, specification, security policy, and third-party notices.
- Added Windows Chromium browser regression coverage for dragging, mobile geometry, clipboard, GIF/WebP playback and downloads, encoder failures, file:// operation, and no-network processing.
- Regenerated distribution HTML and desktop/mobile screenshots from the verified build.

### Compatibility

- Supports JPEG/JPG, PNG, and still WebP inputs; outputs animated GIF or Animated WebP. No MP4 output or animated-image input.
- Retains pinned @jsquash/webp@1.5.0, Content Security Policy connect-src 'none', and standalone/offline operation.


## [0.9.0] - 2026-10-08

### RC review fixes (after first preview)

- Lifted frame cards follow the pointer during drag; neighboring cards animate into their reordered positions.
- GIF and Animated WebP now use a single export-format selector instead of two stacked export panels.
- Fixed the export settings column stretching vertically to match the generated preview.
- Removed obsolete v0.7.0 upcoming-feature copy.
- Clarified that Animated WebP is an animated image, and some image viewers display only one still frame.
- Added browser regression coverage for card dragging, export-format switching, and decoded Animated WebP frame differences.


### Changed

- Entered release-candidate feature freeze for v1.0.0.
- Added an automated Chromium RC regression suite covering desktop, mobile, 200-frame import, GIF/WebP generation, cancellation/retry, forced encoder failure recovery, direct local-file usage, and runtime network checks.
- RC browser tests generate fresh Japanese desktop, English desktop, and smartphone screenshots from the built standalone HTML.
- README files now describe the complete RC workflow and include current screenshots.

### Verified

- Mixed image import, partial failure handling, long/Unicode filenames, natural sort, and 20/10,000 ms frame durations.
- Zero-byte and non-zero corrupt PNG rejection while valid files in the same batch remain usable.
- Clipboard image paste through the normal import-validation path.
- GIF/WebP stale-result invalidation after output-affecting settings change.
- Forward / Reverse / Ping-pong playback and custom finite loops.
- Generated GIF download structure and Netscape loop metadata.
- Generated Animated WebP RIFF/ANIM/ANMF structure and finite loop metadata.
- 390 / 360 / 320 px smartphone staged navigation without horizontal overflow.
- 200-frame import and single-frame timing update.
- GIF cancel then retry, and forced GIF/WebP Worker failure recovery without losing source frames.
- Direct local-file workflow and no external HTTP(S) runtime requests during the tested flows.

## [0.8.0] - 2026-10-08

### Added

- Smartphone-only Frames / Preview / Export staged navigation at widths up to 640 px.
- Keyboard navigation and tab/tabpanel semantics for the smartphone workflow.
- Safe-area-aware header, main content, footer, and sticky workflow navigation.
- 44 px mobile touch targets for primary controls and frame actions.
- Persistent retryable GIF/WebP failure states.
- Frame position accessibility metadata with `aria-posinset` and `aria-setsize`.

### Changed

- 360 px and narrower layouts use one-column export options and one-column frame cards.
- Frame thumbnails use lazy loading and asynchronous decoding.
- Temporary thumbnail canvases are immediately shrunk after the thumbnail Blob is created.
- Editing one frame duration updates timing/preview UI without rebuilding all frame cards.
- Live preview pauses when the page becomes hidden.
- Mobile workflow scroll respects `prefers-reduced-motion`.
- Clearing all frames resets the smartphone workflow to Frames, avoiding stale empty-page state.

## [0.7.0] - 2026-10-08

### Added

- Shared Forward / Reverse / Ping-pong playback order for preview, GIF, and WebP.
- Ping-pong derivation without duplicate endpoints.
- Shared infinite / once / custom 2–100 playback count.
- Finite preview-loop completion and restart-from-beginning behavior.
- Clipboard image paste for supported still-image types outside editable controls.
- Deterministic clipboard image filenames passed through the normal import-validation flow.
- Advisory heavy-export warning for large resolved canvas / derived-frame workloads.

### Changed

- Preview, GIF, and WebP now use the same derived playback sequence.
- GIF loop metadata maps finite play count to Netscape repeat count.
- Animated WebP loop metadata stores the requested finite play count directly.
- Generated-result duration includes configured finite playback repetition.
- Playback setting changes invalidate both generated output formats.
- Filename fields retain fixed visible format suffixes while stripping mistakenly typed GIF/WebP extensions from the filename base.
- The frame summary now reports one-pass duration because finite/infinite looping is controlled separately.

## [0.6.0] - 2026-10-08

### Added

- Animated WebP export with per-frame millisecond durations.
- Pinned `@jsquash/webp@1.5.0` / libwebp WASM assets embedded in the standalone HTML.
- Quality 1–100, Lossless, Effort 0–6, infinite-loop, and play-once WebP settings.
- Local RIFF/WebP animation muxing with `VP8X`, `ANIM`, and full-canvas `ANMF` chunks.
- Generated Animated WebP preview, dimensions, frame count, duration, file size, cancellation, and local save.
- Exact generated-worker validation for lossy/alpha and lossless WebP, including RIFF loop and per-frame duration fields.
- User-supplied Frame Animator SVG as the canonical app icon and favicon.

### Changed

- The image drop area becomes compact after at least one image is loaded while remaining a working drop target and file-picker entry point.
- The embedded-asset helper now follows the current template dependencyId / assetKey model.
- Shared frame, timing, and canvas changes invalidate both GIF and WebP results.
- CSP now permits embedded WebAssembly evaluation while retaining `connect-src 'none'`.
- The next development milestone is playback-order and workflow polish.

## [0.5.0] - 2026-10-07

### Added

- Local GIF89a encoding from the current normalized output canvas.
- First-party weighted histogram / median-cut color quantization for photographic and gradient content.
- Floyd–Steinberg dithering with a default-on toggle.
- 64 / 128 / 256-color GIF output.
- Infinite-loop and play-once GIF modes.
- Per-frame GIF delays derived from the existing frame durations.
- 1-bit GIF transparency when the output canvas background is transparent.
- Blob Worker execution for quantization, dithering, and LZW compression.
- Sequential full-resolution frame normalization with transferable RGBA buffers instead of retaining all frames in memory.
- Per-frame conversion progress and cancellation.
- Actual generated GIF preview before saving.
- Generated dimensions, frame count, total duration, and file-size reporting.
- Editable and sanitized GIF output filename.
- Stale-result invalidation when output-affecting settings change.

### Changed

- Output-affecting editing controls are locked while GIF encoding is running.
- Worker, Blob URL, pending request, and result URL lifecycles are explicitly cleaned up on completion, cancellation, invalidation, and page exit.
- The next development milestone is Animated WebP export.

## [0.4.0] - 2026-10-07

### Added

- Output-canvas normalization for mixed image sizes and aspect ratios.
- Auto canvas sizing using the first frame aspect ratio with a long edge up to 720 px without upscaling smaller first frames.
- 480 / 720 / 1080 long-edge presets, original-equivalent sizing, and 16–4096 px custom width/height.
- Fit placement to preserve the complete image and Fill placement to center-crop while filling the canvas.
- Transparent, white, black, and custom-color backgrounds.
- Checkerboard transparency preview and resolved canvas-size readout.
- Shared geometry helpers for canvas sizing and Fit / Fill placement.
- On-demand lightweight preview decoding with ImageBitmap cleanup.

### Changed

- Live animation preview now renders onto the normalized output canvas instead of directly displaying thumbnail images.
- Preset canvas sizes automatically follow the first active frame aspect ratio when sequence order changes.
- Preview copy now distinguishes lightweight preview pixels from the geometry that will be reused for final encoding.

## [0.3.0] - 2026-10-07

### Added

- Default 500 ms duration for newly imported frames.
- Per-frame duration editing from 20 to 10,000 ms in 10 ms steps.
- Apply-to-all timing presets for 100 / 200 / 500 / 1000 ms plus a custom duration.
- Total animation duration display.
- Live motion preview driven by each frame's actual duration rather than a fixed FPS.
- Play / Pause, Restart, Previous, and Next preview controls.
- Current frame, elapsed playback position, total duration, and progress display.
- Timing changes integrated with the bounded Undo / Redo history.

### Changed

- Duplicated frames now inherit the source frame duration.
- Timing edits made during playback reset the active frame timing and resume playback.
- Sequence edits and history actions stop stale preview schedules before rendering the new sequence.
- In-app help and milestone copy now describe timing and preview behavior.

## [0.2.0] - 2026-10-07

### Added

- Mouse and touch frame reordering through a dedicated drag handle.
- Earlier/later frame buttons as an accessible non-drag alternative.
- Frame duplication and single-frame deletion with Undo.
- Bounded Undo / Redo history for imports and sequence edits, including keyboard shortcuts.
- Natural filename sorting in ascending and descending order with Undo support.
- Sequence resource tracking so thumbnail Blob URLs can be released after they fall out of active state and history.

### Changed

- Language switch now shows compact `EN` / `JA` labels.
- Source-total size counts unique active source images, so duplicating a frame does not imply duplicate source-file bytes.
- In-app help and milestone copy now describe the v0.2.0 sequence editor.

## [0.1.0] - 2026-10-07

### Added

- Initial Frame Animator application built on the current Browser Kitty `htmlapps-template`.
- Local multi-image import for JPEG, PNG, and still WebP.
- File selection, Drag & Drop, and add-more workflow.
- Thumbnail cards with filename, dimensions, megapixels, and source byte size.
- Animated WebP detection and rejection for detectable RIFF/VP8X/ANIM files.
- Safety limits for frame count, individual file size, total source bytes, and decoded pixel count.
- Partial import failure reporting without discarding valid files from the same batch.
- Explicit confirmation before clearing all imported images.
- Japanese / English interface and help content.
- Responsive desktop and smartphone layouts.
- Local-only runtime policy with `connect-src 'none'` and no runtime third-party dependency.

### Notes

- v0.1.0 intentionally does not implement frame reordering, timing, animation preview, or GIF/WebP export yet. Those capabilities are staged in `DEVELOPMENT_PLAN.md`.

