# Security Policy

## Supported version

Security fixes target the latest Frame Animator version on the default branch.

## Reporting a vulnerability

Do not publish sensitive vulnerability details in a public issue. Use the repository owner's private security reporting channel when available.

Include the affected commit/version, reproduction steps, expected and actual behavior, security impact, and a minimal test image when file parsing is involved.

## Trust model

Frame Animator is a static, local-first browser application with no conversion backend.

v0.3.0 protections include:

- `connect-src 'none'` at runtime.
- No runtime CDN, external font, analytics, telemetry, or API.
- No automatic upload of selected images.
- No automatic persistence of imported image bytes to localStorage or IndexedDB.
- No declared runtime third-party dependency.
- User-selected JPEG / PNG / WebP files are decoded only in the browser.

The GitHub Pages version naturally requires the initial page request. After the page has loaded, the application itself must not transmit selected image contents.

A downloaded standalone HTML file is executable code. Distribute it through a trusted channel and verify hashes for high-trust workflows.

## Local image handling

Imported files are untrusted input. The application must:

- validate file type and supported container structure where practical
- reject zero-byte and oversized files before expensive decode work
- limit per-file size, total source bytes, frame count, and decoded pixel count
- keep valid files usable when another item in the batch fails
- avoid exposing raw stack traces in user-facing errors
- avoid retaining full-resolution RGBA data for every frame
- revoke generated Blob URLs when they are no longer needed
- release ImageBitmap and other large temporary resources
- invalidate stale asynchronous work when the source set is cleared or replaced

Animated WebP is outside the v0.3.0 input contract and is rejected when detectable from WebP animation metadata.

## Future encoders

GIF / Animated WebP export will add more complex binary processing in later milestones. Before adding an encoder:

- review dependency identity, exact version, license, and notices
- prefer the smallest focused local runtime that satisfies the product need
- embed all runtime assets
- keep encoding off the main thread when practical
- bound memory use
- support cancellation and cleanup
- verify no runtime network request appears
- test malformed and high-load inputs
