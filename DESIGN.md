# Frame Animator — design system

**Surface:** app editor. **Impeccable mode:** Operate. This is a small production tool, not a marketing site.

## Visual direction
White and warm-light-gray surfaces, clear boundaries, subtle radius (8–12px) and no decorative shadow or glass UI. The brand green `#16624F` is reserved for the main action, selected tab and focus-worthy state. The preview canvas may use dark surroundings to separate translucent content. Use installed system sans fonts; do not add any remote font dependency.

## Information architecture
- **No images:** concise heading and a strong choose/drop area. Hide disabled frame controls, blank previews and empty export sections from the page.
- **With images, wide desktop ≥1260px:** three work areas share the first viewport: Frames on the left, the animation Preview in the largest central pane, and GIF/WebP Export on the right. The frame and export rails scroll independently when needed, leaving the actual animation visible.
- **With images, compact desktop 901–1259px:** the preview and export share the left work column; frames form a sticky, scrollable rail to the right.
- **Tablet 641–900px:** vertical panels, without the initial picker after import.
- **Phone ≤640px:** one real page at a time; fixed, low-height, safe-area-aware Frames / Preview / Export navigation. Frame items use horizontal thumbnail + filename + duration rows instead of cramped two-column cards. The source-picker disappears after a successful import; Add is available in Frames. After encoding, the actual generated GIF/WebP becomes the first item in Export and Save sits directly below that preview; encoding settings remain accessible below the result.
- **Partial import failures:** the warning is shown inside the active frame-editing area after the picker disappears; it must not silently vanish.

## Preview-player layout rule

The preview canvas, playback progress and four transport buttons form **one viewer unit**, never separated by output settings or playback configuration. DOM order is canvas → timeline → transport → frame/time readout → short explanatory note. Output size, cropping, background and playback order/loop remain available in a native details disclosure *below* the viewer; it starts collapsed so the actual preview and its next action are never buried behind options. This must be validated on the actual rendered HTML in both languages, not inferred from the DOM alone.

## Completion-state contract

The task ends by inspecting the actual encoded result and then saving it. On phones, the result card rises above the encoding settings only after success; the result's Save button is next to the visible preview rather than beside the Generate control. A completed export scrolls to the result. Changing encoding parameters invalidates the result and returns to configuration without a stale Save action.

## Progression and first viewport

- **Import:** show one obvious file action; no blank previews or results.
- **Frames:** show image order and duration as readable rows on narrow phones and the desktop rail; keep Undo, reorder, duplicate, delete, and partial-import warnings.
- **Preview:** make the real animation and four transport controls primary. A single "Export GIF / WebP" action advances to Export on phones or scrolls to it on desktop.
- **Options:** output-size, fit/fill, background, direction and looping are explicitly discoverable but collapsed by default. The disclosure summary always reflects the current output dimensions, playback direction and loop.
- **Export:** before encoding, show only the actual format-specific fields and Generate, never a large empty result placeholder. After encoding, show the actual file and Save before those settings.

## UI typography and interaction
- 13–15px controls and body; 14px help body with 1.7 line-height.
- 44px tap targets for phone actions; visible focus and named controls.
- Selected vs disabled vs processing vs stale output states must be distinguishable without relying only on green.
- Avoid describing implementation details in main workflows. Preserve accurate format limitations and privacy/help details.
- Native `dialog`, neutral overlay `rgba(18,20,18,.35)`, independently scrollable body, Escape/backdrop close and focus restoration.

## Review floor
Assess empty, ready, encoding, result, failure and cancellation; Japanese/English; 320/390/768/1440 viewport widths; no horizontal overflow; no masked bottom controls; real image imports, GIF/WebP downloads, keyboard and console/network errors. Automated detector is complementary to rendered visual review, not a substitute.

## Tooling
Impeccable project-scope Codex skill (upstream v4.8.1) is a development-only tool, not shipped in HTML. See `docs/IMPECCABLE.md` and `docs/IMPECCABLE-REVIEW.md`.
