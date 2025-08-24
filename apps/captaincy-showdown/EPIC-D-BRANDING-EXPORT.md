# EPIC D — Branding & Export

Goal: Make the app stream/social ready with brandable visuals and image export.

## Scope
- D4.1 Logo & Watermark Slot
- D4.2 Theme Toggle (dark/light)
- D5.1 Export to Canvas (1080x1080 Instagram preset)

## Acceptance Criteria
- Logo/Watermark
  - A configurable image URL renders on all player cards and exported images.
  - Safe placement on small and large layouts; does not occlude key stats.
- Theme Toggle
  - Switch between dark and light themes using Tailwind tokens.
  - Theme persists in URL or localStorage and updates cards instantly.
- Export
  - One-click export generates a 1080x1080 PNG capturing the current comparison (1–2 players).
  - Fonts/colors/layout match on-screen (or controlled export theme).
  - Works without external servers (client-only).

## Tasks
- [ ] Add theme tokens and CSS variables; wire a toggle in `EnhancedApp`.
- [ ] Add logo/watermark slot to `EnhancedPlayerCard` with prop + config.
- [ ] Create `useExportCanvas` hook using html-to-image or dom-to-image-more.
- [ ] Export button in UI with resolution presets (1080×1080 initially).
- [ ] Tests: snapshot export DOM; verify presence of watermark; basic a11y.
- [ ] Docs: short README section with usage and troubleshooting.

## Risks
- Html-to-image quirks (fonts, cross-origin images). Mitigate with inline fonts and CORS-friendly assets.
- Tailwind v4 tokens compatibility for theme switching. Validate via preview.

## Metrics
- Export time < 2s on mid-range laptop.
- Visual diff acceptable within minor anti-aliasing variance.
