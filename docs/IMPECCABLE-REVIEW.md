# Frame Animator — Operate review (2026-11-08)

⚠️ DEGRADED: single-context (no sub-agent tool or interactive browser automation available in this session).

## Design critique before implementation
- **P1 — initial task discovery:** several disabled management/preview/export sections appeared before images were chosen; they competed with the only viable task. **Change:** only the picker is displayed while empty.
- **P1 — desktop workflow:** a tall stack of independent panels meant frames and preview could not be assessed together. **Change:** an editor rail and preview workspace share the first desktop row; export follows.
- **P1 — partial failures:** a warning attached to the source-picker could disappear when the picker closed after import. **Change:** move the report into the Frames panel when frames exist.
- **P2 — text density:** small 10–12px help/setting labels were uncomfortable in Japanese and English. **Change:** increase text size and line height; retain exact constraints.
- **P2 — phone navigation:** three oversized raised buttons consumed space. **Change:** lighter, persistent, clearly selected tab strip with safe-area padding.

## Preserved
Reorder/drag/duplicate/delete, Undo/Redo, global and per-frame timing, preview playback, size/fit/fill/background, order/loops, GIF/WebP settings, local workers, progress/cancel/error, both output files, actual result previews and save, i18n, privacy, limits, native Help and confirmation.

## Engineering evaluation
`connect-src 'none'` remains; no runtime dependencies introduced. Source remains `src/index.template.html`; build output is generated, not hand-edited. New Playwright script exercises the built standalone HTML at 320, 390, 768, 1440 px, real PNG import, help, language, partial errors and GIF download. Existing browser tests cover dragging, timing, GIF/WebP, cancellations, failures and file://. These tests must pass in CI before declaring verified.

## Verification record
- Official CLI manual installation attempted in container: **unavailable** (npm network/DNS and cold cache).
- Manual Impeccable Operate and craft-floor principles: **reviewed**.
- `critique` subagent run: **not executed** (unavailable); this document is a degraded independent design review.
- `detect --json`: **CI pending** until run results are inspected.
- Real visual review in interactive desktop/mobile browser: **not executed in this session**; automated headless Chromium is included in CI.
- Physical phones, Safari/Firefox, huge input and memory stress: **not verified**.

No statement of completion should be made until build, browser tests, CI and preview results have been checked.
