# Frame Animator — product context

Frame Animator is a no-account, single-HTML browser utility for turning a sequence of still images into an animated GIF or Animated WebP. It is not a marketing landing page.

## Audience and job
People with screenshots, drawings, or photographed frames want a short path from selecting several images to saving a usable animation. A phone is a full editing device, not a desktop fallback.

## Supported workflow
1. Choose, drop, or paste still JPEG, PNG or WebP images. Do not imply video, animated WebP, APNG or GIF input.
2. Arrange or duplicate frames, choose per-frame or common duration, use Undo/Redo.
3. Preview order, repeat mode, sizing, fit/fill placement and background.
4. Generate GIF or Animated WebP. Review the actual generated result, then download. Cancellation and partial failures must not destroy valid frames.

## Constraints
- Browser Kitty main color: `#16624F`; mostly neutral light surfaces.
- Japanese and English in the same source; plain language in both.
- No runtime network requests, CDN, analytics, external fonts or file upload. CSP has `connect-src 'none'`.
- Standalone readable and gzip self-extracting HTML run with `file://`.
- Do not remove existing user features, processing controls, limits, licenses, Help content or error behavior.
- Follow `AGENTS.md`, `APP_SPEC.md`, shared component guidance and build contract.

## UX outcome
Initial state focuses on file selection. Ready state makes frames and a large preview visible together on desktops; phones expose Frames / Preview / Export as clear real pages. Outputs remain secondary until frames exist, and generated results are checked before save.
