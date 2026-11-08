# Frame Animator — design system

**Surface:** app editor. **Impeccable mode:** Operate. This is a small production tool, not a marketing site.

## Visual direction
White and warm-light-gray surfaces, clear boundaries, subtle radius (8–12px) and no decorative shadow or glass UI. The brand green `#16624F` is reserved for the main action, selected tab and focus-worthy state. The preview canvas may use dark surroundings to separate translucent content. Use installed system sans fonts; do not add any remote font dependency.

## Information architecture
- **No images:** concise heading and a strong choose/drop area. Hide disabled frame controls, blank previews and empty export sections from the page.
- **With images, desktop ≥901px:** frame editing rail on the left, animation preview and essential playback/output settings on the right, full-width format/output below. Same working width as the header.
- **Tablet 641–900px:** vertical panels, without the initial picker after import.
- **Phone ≤640px:** one real page at a time; fixed, low-height, safe-area-aware Frames / Preview / Export navigation. The source-picker disappears after a successful import; Add is available in Frames. Save stays beside Generate after a successful export.
- **Partial import failures:** the warning is shown inside the active frame-editing area after the picker disappears; it must not silently vanish.

## Preview-player layout rule

The preview canvas, playback progress and four transport buttons form **one viewer unit**, never separated by output settings or playback configuration. DOM order is canvas → timeline → transport → frame/time readout → short explanatory note. Output sizing and loop/order controls belong in a separate configuration area after the viewer on phones, or in its own adjacent rail on tablets. This must be validated on the actual rendered HTML in both languages, not inferred from the DOM alone.

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
