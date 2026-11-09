# Frame Animator — Operate review (2026-11-08)

⚠️ DEGRADED: single-context (no sub-agent tool or interactive browser automation available in this session).

## Design critique before implementation
- **P1 — initial task discovery:** several disabled management/preview/export sections appeared before images were chosen; they competed with the only viable task. **Change:** only the picker is displayed while empty.
- **P1 — desktop workflow:** a tall stack of independent panels meant frames and preview could not be assessed together. **Change:** an editor rail and preview workspace share the first desktop row; export follows.
- **P1 — partial failures:** a warning attached to the source-picker could disappear when the picker closed after import. **Change:** move the report into the Frames panel when frames exist.
- **P2 — text density:** small 10–12px help/setting labels were uncomfortable in Japanese and English. **Change:** increase text size and line height; retain exact constraints.
- **P2 — phone navigation:** three oversized raised buttons consumed space. **Change:** lighter, persistent, clearly selected tab strip with safe-area padding.

## 2026-11-09 follow-up: transport proximity missed by the first review

The user supplied a screenshot showing a prominent usability problem: the preview canvas and transport controls were separated by entire configuration sections. This was a **P1 task-flow issue the first manual Operate review and deterministic Impeccable detector did not catch**. The prior claim of a completed, thoroughly evaluated UX was too strong.

- **Root cause:** `.preview-stage` was the first child of `.preview-layout`, but `.preview-transport` and `#previewProgress` were children of `.preview-side` *after* both output-size and playback settings.
- **Fix:** move the stage, timeline, transport and readout into a `.preview-player` unit. Settings remain separately accessible; no media-processing logic changes.
- **Verification:** add real rendered-HTML geometry checks for the exact canvas→progress and progress→transport gaps at 320/390/768/1440px in Japanese and English. Screenshot the Preview view itself, rather than only the Frames/Export pages.
- **Impeccable honesty:** project installation and automated `context`/`detect --json` are confirmed; a full official agent-run `critique` or `audit` was not executed. This follow-up is a source-guided Operate review with automated browser evidence, not a claimed complete Impeccable agent pass.
- **Status (verified):** the built HTML passed Chromium geometry and actual GIF save checks in [run 42494450772](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42494450772). The Preview screenshots captured in [artifact 13622577797](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42494450772/artifacts/13622577797) were inspected at 320/390/768/1440px, Japanese and English. The progress bar and controls now sit immediately below the preview at all four widths. At the time of this first playback layout fix, the source detector still reported six findings. Those findings have since been addressed separately in the follow-up section below; the playback separation itself required rendered-state review.

## 2026-11-09 follow-up: all six deterministic findings resolved

The user's request to resolve the original six detector findings is complete in the source; none were ignored, suppressed, or removed from the detector configuration.

| Original finding | Count | Actual change |
| --- | ---: | --- |
| Broken or placeholder image | 2 | GIF and WebP results no longer contain image nodes without `src` in the initial HTML. A real `<img>` is created only when a valid encoded Blob URL is ready, and is removed when its result is cleared. The localized image alternative text remains editable on language switch. |
| Cramped dialog padding | 2 | Help and confirmation native dialogs now have 10px physical inset, with white rounded inner shells and adjusted vertical limits so the content stays scrollable on phones. |
| Flat type hierarchy | 1 | The dialog title, section headings, help headings and page heading use clearer size relationships, without enlarging marketing copy. |
| Em-dash overuse | 1 | Ambiguous dash placeholders were replaced with meaningful localized unavailable/unknown labels, truthful zero states or empty fields in hidden result cards. |

**Official Impeccable `detect --json`: 0 findings, exit code 0** on [GitHub Actions run 42497144305](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42497144305). The workflow now fails for **any** nonzero detector exit, including findings (2); it does not accept the previous six findings as a successful check.

**Actual processing check:** [Browser regression run 42497144291](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42497144291) passed for GIF/WebP, offline single-HTML, cancellation, rendering, bilingual result image descriptions, dialog sizing and source image loading. New browser checks explicitly verify that result-image DOM nodes are absent before export and valid afterward; 320/390/768/1440px widths were exercised. [Screenshot artifact](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42497144291/artifacts/13624001353).

Automated findings being zero does not mean an agent-run `critique` or `audit` occurred; those agent passes remain **not executed**, and physical iOS/Android and Safari/Firefox remain **unverified**. Visual checks and detector checks are separate.

## 2026-11-09 substantive `critique` and `audit` follow-up

After the user asked for the actual evaluation playbooks rather than only the detector, the installed `critique.md` and `audit.md` procedures were followed. No sub-agent runner is exposed here, so the critique is **DEGRADED single-context** rather than the official dual-agent default; this is explicitly flagged in both reports. Assessments are archived separately in [CRITIQUE](IMPECCABLE-CRITIQUE.md) and [AUDIT](IMPECCABLE-AUDIT.md), with Nielsen **29/40** and technical **15/20** pre-follow-up scores, positive findings, ranked issues, personas, evidence and limitations. The design review uncovered a phone completion-state P1 not found by the zero-finding deterministic scan; its fix puts the actual encoded output and Save ahead of settings. A mobile header tap-size issue was also corrected.

## 2026-11-09: preview-first workbench follow-up (reviewed in Chromium)

The previous critique/audit scores describe a **pre-redesign baseline** and are not automatically upgraded because the source scanner returned 0. A separate screenshot-backed UI review of actual generated HTML exposed workflow-level issues not detected by the CLI. This revision addresses them structurally rather than by adding more decorative CSS:

| Current issue found in real render | Implemented resolution | How verified |
| --- | --- | --- |
| Desktop preview, frames, and export were separated into large stacked panels | At ≥1260px display Frames / Preview / Export as a single left-to-right workbench, with the preview widest and both editing/encoding rails scrollable independently; 901–1259px uses a two-column layout | Chromium screenshots and computed layout checks at 1024/1280/1440px; desktop Generate is visible in the initial viewport |
| Phone Preview contained more configuration than animation | Collapse output size, fit/fill, background, playback order/loop into a native `details`, exposing live dimension/order/loop summary; keep the actual large animation, progress, transport and next-step Export action visible first | Screenshots and toggle/selection tests at 320/390px in Japanese and English |
| Two-column phone frame cards made filename and per-frame duration hard to scan | Use a single horizontal thumbnail + two-line filename + duration row followed by 44px action targets; apply compact editing rail to desktop | Actual frame-state screenshots and computed thumbnail/info geometry; 44px targets |
| Unneeded introduction and placeholder result took up the first screen | Present one picker with concise copy when empty; omit large dashed export result until encoding completes | Empty ja/en screenshots at six widths and real generated-result checks |
| Result metadata separated Save from the actual output | Put Save directly beneath the generated GIF/WebP, before measurements; retain filename/options and invalidation on changes | Real GIF/WebP encoding, localized result preview, Save/download and layout regression tests |

**Current substantive checklist:** initial picker; frame edit; output-size/loop disclosure; preview and playback; format switch; progress/cancel/error; generated result; download; Help/licenses; no unexpected external requests; CSP and offline single-HTML behavior. Existing logic remains; no new CDN/font/API. On large desktops the Export rail scrolls back to its real encoded result at completion.

**Impeccable provenance:** project-scope Codex skill and hook (v4.8.1) installed; official `context`/`detect --json` runs in Actions as a strict check. This is **not** a two-subagent `critique` run; the separate critique/audit reports are explicitly **DEGRADED single-context**, using the official evaluation playbooks and actual screenshots. No source warnings suppressed. A detector result of zero does not guarantee good UX.

**Remaining independent verification:** physical Android/iPhone, Safari/Firefox, assistive technology, 200% browser zoom and maximum-data memory stress. Preview deployment and browser CI evidence are linked in PR #19. No merge, tag or release.

## Preserved
Reorder/drag/duplicate/delete, Undo/Redo, global and per-frame timing, preview playback, size/fit/fill/background, order/loops, GIF/WebP settings, local workers, progress/cancel/error, both output files, actual result previews and save, i18n, privacy, limits, native Help and confirmation.

## Engineering evaluation
`connect-src 'none'` remains; no runtime dependencies introduced. Source remains `src/index.template.html`; build output is generated, not hand-edited. New Playwright script exercises the built standalone HTML at 320, 390, 768, 1440 px, real PNG import, help, language, partial errors and GIF download. Existing browser tests cover dragging, timing, GIF/WebP, cancellations, failures and file://. These tests must pass in CI before declaring verified.

## Verification record
- Official CLI manual installation attempted in assistant container: **unavailable** (npm network/DNS and cold cache). Separately **successful in GitHub Actions**: Impeccable 4.8.1 installed with Codex project scope and `hooks on`; see run [42491019184](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42491019184).
- Manual Impeccable Operate and craft-floor principles: **reviewed**.
- `critique` subagent run: **not executed** (unavailable); this document is a degraded independent design review.
- `context` and `detect --json`: **executed in CI** (see run [42491263569](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42491263569)). **Historical** detector exit **2** (six findings), subsequently fixed as described above: two `broken-image` warnings for intentionally empty result `<img>` elements populated only after export (likely source-scanner false positives); two `cramped-padding` on dialog wrappers (must verify in real render); one `flat-type-hierarchy` on scanner-extracted role sizes, despite CSS-resolved larger editor headings (must visually verify); one advisory `em-dash-overuse` from non-prose UI dash placeholders. That historical run was not clean; the latest strict run reports 0.
- Direct interactive control of a desktop/mobile browser in this assistant session: **not available**. However the built standalone HTML was exercised by headless Chromium and the resulting **real screenshots were manually inspected** at all target widths and both locales, including the actual Preview page (not a mockup).
- Physical phones, Safari/Firefox, huge input and memory stress: **not verified**.

The current built-HTML browser tests, standalone validation, strict design detector, and PR preview deployment have passed; hardware browsers outside Chromium are not verified.
