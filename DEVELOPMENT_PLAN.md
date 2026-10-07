# Frame Animator development plan

## v0.1.0 — Foundation / image import ✅

- Current `htmlapps-template` structure
- JPEG / PNG / still WebP import
- Multi-select, Drag & Drop, add-more
- 200-frame, 50 MiB/file, 500 MiB total, 50 MP guards
- Animated WebP rejection
- Lightweight thumbnails
- Partial failure report
- Full clear confirmation
- Japanese / English
- Mobile-safe empty/ready states
- No image persistence and no runtime network

Exit: importing a mixed valid/invalid batch leaves valid frames usable and explains rejected items.

## v0.2.0 — Frame sequence editor ✅

- Drag/touch reorder
- Move previous / next controls
- Duplicate
- Delete with Undo
- Undo / Redo architecture
- Natural filename sort ascending / descending
- 100–200 frame interaction pass

Exit: every reorder operation remains possible without relying on Drag & Drop alone.

## v0.3.0 — Timing and live preview ✅

- Default 500 ms/frame
- 20–10,000 ms per frame
- Apply duration to all
- Total duration
- Play / Pause / Restart
- Previous / next frame
- Real variable-duration playback

Exit: uneven frame timings preview correctly without fixed-FPS rounding.

## v0.4.0 — Canvas normalization ✅

- 480 / 720 / 1080 / original / custom sizing
- Fit / Fill
- Transparent / white / black / custom background
- Checkerboard preview
- Portrait/landscape mixed input
- On-demand decoding and bitmap cleanup

Exit: preview geometry matches normalization output for mixed aspect ratios.

## v0.5.0 — Animated GIF export ✅

- Encoder abstraction
- Worker
- progress / cancellation
- per-frame duration
- loop
- 64 / 128 / 256 colors
- dithering
- generated-Blob preview
- editable filename

Mandatory checkpoint: validate photographic and gradient content; do not assume Pixel Animation Studio's compact GIF implementation is sufficient.

## v0.6.0 — Animated WebP export

- Focused local Animated WebP encoder
- quality
- lossless
- effort / compression level
- alpha
- loop
- per-frame duration
- generated-Blob preview
- Worker/progress/cancel

Prefer a dedicated libwebp/WebPAnimEncoder WASM or equally narrow image-sequence build rather than the video decode/demux profile unchanged.

## v0.7.0 — Playback modes and workflow polish

- Forward
- Reverse
- Ping-pong without duplicate endpoints
- Infinite / once / custom loop count
- Clipboard image paste
- stale result invalidation
- heavy-job warning
- format-aware filename extension

## v0.8.0 — Mobile, performance, recovery

- Frames / Preview / Export smartphone page model if appropriate
- safe areas
- 320/360/390 px pass
- 200-frame memory audit
- repeated encode/cancel cleanup
- Blob URL / ImageBitmap / Worker lifecycle audit
- keyboard/accessibility pass
- failure recovery without reload

## v0.9.0 — Release candidate

Stop feature work.

Regression matrix:

- JPEG / PNG / WebP / mixed input
- Drag & Drop / clipboard / multi-select
- timing min/max/global/per-frame
- Fit / Fill / alpha backgrounds
- Forward / Reverse / Ping-pong
- GIF colors/dither/loop
- WebP quality/lossless/alpha/loop
- stale result invalidation
- cancel and retry
- Japanese / English
- desktop / smartphone
- long filenames / Unicode filenames
- corrupt and zero-byte images
- standalone / self-extract / `file://`
- runtime network audit

Prepare final README, Japanese README, favicon, screenshots, changelog, license/notices, and green CI.

## v1.0.0 — Stable

Release when this flow is dependable:

**Add images → arrange → set timing → preview → create GIF/WebP → review generated file → save**

Do not delay v1.0.0 merely because additional editor features are imaginable.
