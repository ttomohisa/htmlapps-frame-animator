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

Mandatory checkpoint completed: the built-in encoder was independently exercised with gradient/photo-like data, transparency, 20–10,000 ms delays, one-frame and multi-frame files, infinite and once-only playback. The exact Worker code extracted from the generated standalone HTML encoded a synthetic 720 × 540, 8-frame, 256-color+dithering workload in about 4.0 s in the local Node validation environment with roughly 80 MB peak RSS, and Pillow decoded every generated frame successfully.

## v0.6.0 — Animated WebP export ✅

- Focused local Animated WebP encoder
- quality
- lossless
- effort / compression level
- alpha
- loop
- per-frame duration
- generated-Blob preview
- Worker/progress/cancel

Implemented with pinned `@jsquash/webp@1.5.0` static libwebp encoding plus a local RIFF animation muxer. The video decode/demux profile was deliberately not reused because it does not accept the still-image sequence/variable-duration workflow directly.

Validation completed against the exact `webpWorkerMain` extracted from the CI-generated standalone HTML and the JS/WASM bytes embedded in that same HTML:

- lossy / alpha: 32 × 24, 3 frames, durations 20 / 500 / 10,000 ms, infinite loop; Pillow decoded 3 RGBA frames and direct RIFF parsing confirmed `VP8X` flags `0x12`, loop 0, and the three exact ANMF durations
- lossless / opaque: 32 × 24, 2 frames, durations 100 / 1,500 ms, loop count 1; generated ANMF payloads used `VP8L`, Pillow decoded 2 frames, and direct RIFF parsing confirmed the loop/duration values
- RIFF size fields matched the generated file sizes in both tests

## v0.7.0 — Playback modes and workflow polish ✅

- Forward
- Reverse
- Ping-pong without duplicate endpoints
- Infinite / once / custom loop count
- Clipboard image paste
- stale result invalidation
- heavy-job warning
- format-aware filename extension

## v0.8.0 — Mobile, performance, recovery ✅

- Frames / Preview / Export smartphone page model if appropriate
- safe areas
- 320/360/390 px pass
- 200-frame memory audit
- repeated encode/cancel cleanup
- Blob URL / ImageBitmap / Worker lifecycle audit
- keyboard/accessibility pass
- failure recovery without reload

v0.8 implementation notes: smartphone staged navigation is enabled only at <=640 px; safe-area padding and 44 px touch targets were added; 360 px and below uses one-column frame/export layouts; thumbnail images lazy-decode; single-frame timing edits avoid a full frame-card rerender; GIF/WebP failures leave a persistent retryable state while preserving source frames and settings; existing Worker/Blob cleanup paths remain active on success, cancel, invalidation, retry, and page exit.

v0.8 verification notes: source JavaScript parsed successfully; mobile empty-state/tab reset, safe-area/touch-target CSS, lazy thumbnail decoding, result/Worker Blob URL cleanup, and retryable encoder failure paths were audited; the authoritative standalone build succeeded before the generated root HTML was synchronized.

## v0.9.0 — Release candidate ✅

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


v0.9 RC browser audit completed in Chromium against the generated standalone HTML:

- mixed JPEG/PNG/WebP-compatible import path, partial failure, long/Unicode filenames, natural filename sort, and 20 / 10,000 ms timing boundaries
- zero-byte and non-zero corrupt PNG rejection with valid same-batch files retained
- clipboard image paste through the standard import path and format-aware filename sanitization
- generated GIF/WebP stale-result invalidation after playback settings change
- Forward / Reverse / Ping-pong plus custom finite loop metadata
- generated GIF preview/download and Netscape loop-extension validation
- generated Animated WebP preview/download plus RIFF / ANIM / ANMF structural validation
- 390 / 360 / 320 px staged smartphone workflow with no horizontal overflow
- 200-frame import and single-frame timing update
- GIF cancellation followed by successful retry
- forced GIF/WebP Worker failure followed by retryable recovery without losing frames
- direct `file://` standalone operation for both GIF and Animated WebP
- no external HTTP(S) runtime request during the tested local workflows
- fresh Japanese desktop, English desktop, and smartphone screenshots captured from the RC build

RC regression findings fixed before sign-off:

1. **Controls remained disabled after import completion.** `updateBusy(false)` did not restore all canvas/playback/export controls after `importBusy` cleared. The busy-state synchronizer now restores the full control set.
2. **Animated WebP failed from direct `file://` use.** Chromium rejected the Emscripten encoder's dynamic import from a `blob:null/...` module URL. The embedded WebP encoder JS is now transformed and concatenated into the classic Worker source, with WASM bytes still supplied directly from the standalone asset bundle and no runtime fetch.
3. **The Frames empty state could remain visible after import.** Author CSS overrode the HTML `hidden` attribute. A global `[hidden]{display:none!important}` rule now makes hidden state authoritative.

Final RC screenshot audit confirmed the supplied icon/favicon, clean populated frame list, English/Japanese UI, and smartphone Preview stage without transient toast overlays.

RC review: lifted dragging and FLIP-style movement of adjacent cards; single GIF/WebP format selector; removal of obsolete v0.7.0 copy; non-stretching export settings. Additional regression tests compare the actual decoded pixel content of separate Animated WebP frames rather than relying solely on RIFF/ANMF frame metadata.

## v1.0.0 — Stable

Release when this flow is dependable:

**Add images → arrange → set timing → preview → create GIF/WebP → review generated file → save**

Do not delay v1.0.0 merely because additional editor features are imaginable.
