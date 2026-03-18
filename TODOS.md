# TODOS

## P1 — High Priority

### Image / Logo Watermark Support
**What:** Allow users to upload a PNG/SVG logo as the watermark overlay instead of (or alongside) text.
**Why:** Text-only watermarks feel amateurish for professional photographers and brand teams. Logo watermarks are the industry standard.
**Pros:** Unlocks the professional photographer use case; SVG logos scale perfectly at any size on Canvas.
**Cons:** Adds UI complexity (two watermark type modes — text vs image); SVG rendering in Canvas has some edge cases (CSS styles stripped).
**Context:** The v1 Canvas architecture already supports `drawImage()` — adding an image watermark is additive, not a rewrite. The main work is the upload UI, aspect-ratio handling, and Canvas compositing mode.
**Effort:** M (human ~3 days → CC ~30 min)
**Depends on:** v1 shipping (Canvas infrastructure already in place)

---

## P2 — Medium Priority

### Shareable Template URLs
**What:** Encode watermark templates as URL query parameters so users can share their exact setup with teammates (e.g., `?text=CONFIDENTIAL&opacity=30&pos=center&tiled=true`).
**Why:** Teams often want consistent watermark settings across members. Without this, each person configures manually.
**Pros:** Zero backend needed; instant team collaboration; URL is bookmarkable.
**Cons:** URL gets long with many parameters; template name visible in browser history.
**Context:** Templates are already stored as JSON in LocalStorage — serializing to URL params is a small step. Add a "Copy link" button next to the template controls.
**Effort:** S (human ~4 hours → CC ~10 min)
**Depends on:** Template system (v1)

### Progressive Web App (PWA) / Offline Support
**What:** Add `manifest.json` and a service worker to make the app installable on desktop/mobile and functional offline after first load.
**Why:** The app is already 100% client-side — PWA is a natural extension. Offline support further strengthens the "your files never leave your device" story.
**Pros:** Installable to desktop; works without internet; privacy story strengthens; fast repeat loads.
**Cons:** Service worker caching strategy needs care (cache-busting on new deploys); adds ~100 lines of boilerplate.
**Context:** Use Vite PWA plugin (`vite-plugin-pwa`) — it handles most of the complexity automatically.
**Effort:** S (human ~1 day → CC ~15 min)
**Depends on:** v1 shipping (Vite build setup already in place)
