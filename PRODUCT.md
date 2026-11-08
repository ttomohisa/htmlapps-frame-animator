# Frame Animator — product context

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People assembling a short animated GIF or WebP from still screenshots, drawings or other images in a browser, including users working on phones.

## Product Purpose

Make selecting, sequencing, previewing, encoding and saving an animated image a short, understandable task without creating an account or uploading the source images.

## Positioning

Single-HTML, install-free local processing with real GIF and animated WebP encoding, Japanese/English interface, editable timing and ordering, and locally saved results.

## Operating Context

The user starts from still JPEG/PNG/WebP files or clipboard images, orders them, checks playback, chooses an output format and saves locally. Source files and in-progress images are not persisted between page sessions.

## Capabilities and Constraints

- 200 images maximum, 50 MiB per file, 500 MiB aggregate source limit, 50 megapixels per image.
- Import, reorder, drag/keyboard controls, duplicate/delete, Undo/Redo, per-frame and common timing, 20–10,000 ms durations, 10 ms increments.
- Playback preview, order and repeat options, output size, fit/fill and backgrounds.
- GIF and animated WebP export with format options, encoding progress/cancel/error, actual output preview and local download.
- Video, animated WebP input, APNG, GIF input, HEIC and MP4 output are not supported.
- No runtime network requests, CDN, analytics, external fonts or file upload. CSP `connect-src 'none'`.
- Readable and self-extracting single HTML must run offline with `file://`.
- Japanese/English in the same source; preserve accurate Help, limits, licenses and privacy copy.
- Follow `AGENTS.md`, `APP_SPEC.md`, shared component guidance and the template build contract.

## Brand Commitments

Browser Kitty main color `#16624F`; minimal non-marketing, utility-focused writing. Canonical logo source `assets/favicon.svg` and app name Frame Animator.

## Evidence on Hand

- The actual editor implementation in `src/index.template.html`, specifications `APP_SPEC.md` and existing regression scripts under `scripts/`.
- Representative app screenshots in `assets/screenshot.png`, `assets/screenshot-mobile.png` and `assets/screenshot-en.png`. These predate the unmerged UX change until tests update them.
- No fictional usage figures or sample outputs should be added to the product.

## Product Principles

1. Get users from opening the tool to image selection without navigating inactive UI.
2. Keep frame editing and animation preview easy to compare.
3. Make phone editing a usable workflow rather than a shrunken desktop.
4. Protect work and explain partial import/encoding errors without hiding valid images.
5. Keep every file and encoding step local, and don't trade away honest constraints for short copy.

## Accessibility & Inclusion

Keyboard operation, visible focus, meaningful labels, adequate contrast, reduced motion and touch targets usable on narrow phones are required.
