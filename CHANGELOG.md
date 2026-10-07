# Changelog

All notable changes to Frame Animator will be documented in this file.

The project uses Semantic Versioning.

## [Unreleased]

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

