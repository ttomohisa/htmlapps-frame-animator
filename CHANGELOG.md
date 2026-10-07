# Changelog

All notable changes to Frame Animator will be documented in this file.

The project uses Semantic Versioning.

## [Unreleased]

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
