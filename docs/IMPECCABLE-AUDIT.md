⚠️ DEGRADED: single-context (no independent sub-agent or local executable launcher; reviewed source, product brief and real Chromium captures)

# Impeccable audit — Frame Animator / Operate

**Target:** `src/index.template.html`, PR #19. **Date:** 2026-11-09. Followed installed Impeccable 4.8.1 `reference/audit.md` web playbook. A technical audit is distinct from the `detect` scanner and from the `critique`'s visual design assessment.

## Implementation integrity verdict

**PASS WITH FOLLOW-UPS:** The interface is specifically an offline GIF/Animated WebP editor: actual image frames, per-frame duration, worker encoding, real file previews and downloaded outputs. No unrelated decoration, cloud upload, CDN dependency, or invented feature was observed. Automated findings being zero does not prove usability; this audit found a phone completion-state error that the scanner did not detect.

## Health score, before follow-up fixes

| Dimension | Score / 4 | Grounded evidence |
| --- | ---: | --- |
| Accessibility | 3 | Named controls, native dialog, focus states; inspected contrast ratios of main tokens meet AA. ≤360px header late override shrank a 44px target to 40px. Screen reader/zoom not tested |
| Performance | 3 | Heavy GIF/WebP on Worker/WASM, cached preview images, Blob URL cleanup; large-frame memory stress not measured |
| Theming | 3 | Brand green `#16624F`, neutral surfaces and consistent tokens; some intentionally hardcoded checkerboard colors |
| Responsive | 3 | 320/390/768/1440 Chromium screenshots, safe-area bottom nav, no overflow in regression; post-export review originally below fold |
| Implementation integrity | 3 | Coherent format-specific workflow and restrictive CSP; historical responsive overrides and result-first issue |
| **Total** | **15/20 — Good** | Fix confirmed product-specific issues; test the changed HTML |

**Contrast samples** (WCAG relative luminance, basic opaque surfaces): `#666963` on white **5.58:1**, on `#f5f5f2` **5.11:1**; white on `#16624F` **7.26:1**. These are tested combinations, not a claim that every state or dynamic overlay passes WCAG AA.

## Findings, ranked

### [P1] Reviewable generated output was not the focus
- **Location:** `#gifExportPanel` / `#webpExportPanel`, `src/index.template.html` mobile layout and `renderGifResult` / `renderWebpResult`.
- **Category:** Responsive / Implementation integrity.
- **Impact:** the user could be offered Save before seeing the encoded result, particularly problematic for color reduction or animated WebP quality.
- **Remedy:** position the real result before settings on phones after generation, keep the Save action immediately below that output preview, and scroll to it when complete.
- **Command:** `$impeccable layout`, then `$impeccable harden`.
- **Status:** implemented; enforce with phone browser checks.

### [P2] Undersized phone header targets at 320px
- **Location:** late `@media(max-width:360px)` override of `.header-actions .header-icon-button,.language-button`.
- **Category:** Responsive / Accessibility.
- **Impact:** 40px wide language and Help actions do not meet the project's 44px touch floor (though WCAG 2.5.8 generally only requires 24px with exceptions); tight touch action under one-handed use.
- **Remedy:** retain 44px width and height and verify title/version do not overlap at 320px.
- **Command:** `$impeccable adapt`.
- **Status:** implemented; browser geometry must pass.

### [P2] Screen reader and text scaling unverified
- **Location:** dynamic result preview, native Help/confirmation modal, long file names.
- **Category:** Accessibility.
- **Impact:** Chromium geometry and test-generated alt labels are not a screen-reader or 200% zoom test.
- **Remedy:** perform manual NVDA/VoiceOver and zoom tests before full release certification.
- **Command:** `$impeccable audit`.
- **Status:** unverified; not counted as a failure.

### [P2] Maximum-size performance unverified
- **Location:** large image import, worker rendering and embedded WASM.
- **Category:** Performance.
- **Impact:** memory pressure may differ on low-RAM devices.
- **Remedy:** run 200-frame and max-output stress on actual low-end phone, observe cancellation and memory.
- **Command:** `$impeccable optimize`.
- **Status:** unverified; existing functional cancellation tests pass.

## Positive findings / systemic patterns

Actual export is handled in Workers, with cancellation and worker/object-URL cleanup. Privacy is supported by `connect-src 'none'` and CI's external-request capture. The no-images state is lean and accessible, and import failures remain visible even after successful partial import. Responsive structure is explicit. A caveat is the accumulated override CSS: later changes should consolidate it while preserving the tested responsive contract.

## Technical checks and evidence

- Previously verified strict Impeccable `detect --json`: **0** findings, CI exit code **0**. Re-run after this follow-up; reject any nonzero findings.
- Existing Playwright CI opens actual built standalone HTML and checks four widths, language, errors, GIF and WebP output, download, Help, network, no horizontal overflow, self-extract and `file://`.
- New test checks should assert result-before-settings, Save in the visible result, 44px header control bounds and no regressions to GIF/WebP.
- **Not tested:** physical iOS/Android, Safari/Firefox, full assistive technology, 200% text zoom, maximum memory and CPU load. Never equate this evidence with universal WCAG or performance certification.

## Recommended actions

1. **[P1] `$impeccable layout`**: keep generated output and Save together.
2. **[P2] `$impeccable adapt`**: 44px phone header touch targets.
3. **[P2] `$impeccable harden`**: verify dynamic state/alt text in every supported language.
4. **[P2] `$impeccable optimize`**: hardware memory/CPU tests before release.
5. **[P3] `$impeccable polish`**: finish review after all fixes and real screenshots.

**Interpretation:** This is a substantive, project-specific technical audit performed using the Impeccable playbook. It is **not** a claim that `$impeccable audit` ran in an independent Codex sub-agent, nor that the official launcher executed locally.
