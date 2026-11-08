⚠️ DEGRADED: single-context (spawn_agent is unavailable; Assessment A and B were run sequentially)

# Impeccable critique — Frame Animator / Operate

**Target:** `src/index.template.html` on PR #19. **Date:** 2026-11-09. **Method:** Followed the installed Impeccable v4.8.1 `reference/critique.md` playbook. Assessment A was written first from actual PR Chromium screenshots, `PRODUCT.md`, `DESIGN.md`, and the source. Assessment B used the separate source detector and Chromium evidence. No claim of the default isolated dual-subagent method or an in-browser Impeccable overlay.

## Design specificity

The interface belongs to this product: image sequence management, frame durations, preview transport, GIF/WebP-specific encoding, and download are visible. It is not a generic dashboard. The weakest experience in the verified initial screenshots was the **post-generation phone state**: the output was below the encoding form, whereas Save appeared beside Generate before users could see what they would save.

## Nielsen's ten heuristics — before follow-up fixes

| # | Heuristic | Score / 4 | Evidence |
| --- | --- | ---: | --- |
| 1 | System status | 3 | Progress and completion messages exist; the resulting image was below the phone viewport |
| 2 | Real-world language | 3 | File-oriented labels are clear; dithering still needs its inline help |
| 3 | Control and freedom | 3 | Undo/Redo, Cancel and format change are available; review-before-save was weak |
| 4 | Consistency | 3 | Controls are consistent, but save placement differed by viewport |
| 5 | Error prevention | 3 | Import limits and destructive confirmation are present |
| 6 | Recognition over recall | 2 | Preview and export require switching pages on phones; result was not prominent |
| 7 | Flexibility / efficiency | 3 | Batch import, reorder, duplicate, durations and shortcuts |
| 8 | Minimalist design | 3 | Task-first initial screen; configuration still competes with the generated output |
| 9 | Error recovery | 3 | Partial failures stay visible and work is preserved |
| 10 | Help | 3 | Full bilingual limits/privacy/license explanations, independently scrollable |
| **Total** | | **29/40 — Good** | Solid foundation, a significant completion-state weakness |

### Cognitive load and emotional journey

**3/8 checklist failures (moderate):** single focus after encoding, recognition across tabs, progressive disclosure of configuration. Images are easy to import; frame editing is tangible; after generating, the user previously had to scroll to find the actual result. That failure happened at the final moment of an otherwise useful workflow.

### What's working

1. Empty state shows only the viable first action instead of irrelevant disabled controls.
2. Preview timeline and four transport controls are physically grouped below the canvas in actual 320/390/768/1440px screenshots.
3. Partial import errors, licenses, bilingual explanation, offline semantics and detailed export status remain accessible.

## Priority issues and corrective actions

| Severity | Issue and impact | Action | Status |
| --- | --- | --- | --- |
| **P1** | Generated GIF/WebP appears after the export form on phones; Save was offered before inspection | **`$impeccable layout` / `harden`**: when a valid result exists, place the actual result first, show Save immediately after its preview, retain settings underneath, and scroll result into view after completion | **Implemented and verified in Chromium** |
| **P2** | At ≤360px header controls had a late CSS override lowering tap width from 44 to 40px | **`$impeccable adapt`**: keep the 44px minimum for language and Help at 320px without covering the app/version | **Implemented; browser geometry required** |
| **P2** | Dense frame metadata and output options may still require careful reading on small phones | **`$impeccable clarify` / `polish`**: retain the task-first grouping and test actual 200% text scaling | **Partially assessed; hardware/zoom unverified** |
| **P3** | Multiple historical responsive CSS overrides complicate refinement | **`$impeccable polish`**: consolidate when semantics and browser tests can be held constant | **Deferred to avoid unrelated regressions** |

### Persona red flags

- **First-time GIF maker:** after clicking Generate, the file was not the visual focus; risks downloading unreviewed media. Follow-up displays actual encoded result before settings.
- **Distracted phone user:** small header targets at 320px; 44px minima restored.
- **Keyboard-dependent editor:** core buttons, native selects/dialog, visible focus and Undo/Redo exist; end-to-end screen-reader testing is still required.

### Questions to consider

Would a short side-by-side comparison between the editor canvas and encoded output help users catch GIF's 256-color and transparency differences without adding more controls? This is an idea, not a new promised feature.

## Assessment B synthesis and run notes

The installed `impeccable detect --json src/index.template.html` reported **0 source-level findings** on the preceding verified PR head. This **did not** identify the result-first phone workflow flaw or establish overall usability. Its outcome is independent of the above design review. Re-run it and browser tests on the changed head.

- **Launcher context:** unavailable locally; the repo skill, `PRODUCT.md` and `DESIGN.md` were read directly.
- **Two-agent method:** unavailable (no `spawn_agent` / Task tool); assessments were sequential.
- **Target slug / official critique snapshot:** the local `critique-storage` command could not run. This repository document is the manual durable archive, not an official CLI snapshot.
- **Ignore list:** no ignore rules were applied; no design findings suppressed.
- **Browser evidence:** real CI Chromium screenshots from the built standalone HTML at 320/390/768/1440px, Japanese/English. Not a hand-drawn mockup. No interactive live overlay was injected.
- **Servers/temp files:** no local development server started; screenshot extracts used only for review.
- **Remaining:** physical mobile, Safari/Firefox, larger input stress and 200% text zoom unverified. An actual Impeccable dual-subagent critique remains unavailable in this environment.

**Recommended sequence:** `$impeccable layout` → `$impeccable adapt` → `$impeccable audit` → `$impeccable polish`.

**Questions skipped:** this was an explicit fix-and-verify request, so no further user input is needed for the two confirmed issues.

## Post-fix rendered review

The built result-first phone experience was re-inspected in the 320px and 390px output screenshots from [Chromium run 42527472882](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42527472882). The actual encoded preview, Save, result measurements and the encoding form now follow the intended visual priority. A further [strict regression run 42527895061](https://github.com/ttomohisa/htmlapps-frame-animator/actions/runs/42527895061) verified generated output and Save fit between the phone header and fixed bottom navigation at 320px and 390px. The review's 29/40 score is retained as the **pre-fix baseline** rather than retroactively inflated. Remaining device/zoom concerns are explicitly unverified.
