# TODOS

## P1 — High Priority

### ~~Image / Logo Watermark Support~~ ✓ Done
**Shipped:** Text/Image mode toggle in sidebar. Users upload PNG/SVG/WebP logos (max 5MB). Shared size, opacity, position, and tiled controls work for both modes. Logo images cached for fast re-renders. Templates save/load logo data URIs. Logo preview with checkerboard transparency background and "Remove" button.

---

## P2 — Medium Priority

### ~~Text watermark clipping at corner positions~~ ✓ Done
**Shipped:** Used `ctx.measureText()` to measure text width before placement. Center x/y are clamped to keep text fully within the canvas. For text wider than the canvas, `ctx.fillText` `maxWidth` is used to compress horizontally rather than clip. Commit: ddc54d1



### Shareable Template URLs
**What:** Encode watermark templates as URL query parameters so users can share their exact setup with teammates (e.g., `?text=CONFIDENTIAL&opacity=30&pos=center&tiled=true`).
**Why:** Teams often want consistent watermark settings across members. Without this, each person configures manually.
**Pros:** Zero backend needed; instant team collaboration; URL is bookmarkable.
**Cons:** URL gets long with many parameters; template name visible in browser history.
**Context:** Templates are already stored as JSON in LocalStorage — serializing to URL params is a small step. Add a "Copy link" button next to the template controls.
**Effort:** S (human ~4 hours → CC ~10 min)
**Depends on:** Template system (v1)

### ~~Progressive Web App (PWA) / Offline Support~~ ✓ Done
**Shipped:** Added `vite-plugin-pwa` with `autoUpdate` service worker registration, installable web manifest, dark-theme metadata, and cache-first static asset precache for offline reloads after first visit.
**What:** Add `manifest.json` and a service worker to make the app installable on desktop/mobile and functional offline after first load.
**Why:** The app is already 100% client-side — PWA is a natural extension. Offline support further strengthens the "your files never leave your device" story.
**Pros:** Installable to desktop; works without internet; privacy story strengthens; fast repeat loads.
**Cons:** Service worker caching strategy needs care (cache-busting on new deploys); adds ~100 lines of boilerplate.
**Context:** Use Vite PWA plugin (`vite-plugin-pwa`) — it handles most of the complexity automatically.
**Effort:** S (human ~1 day → CC ~15 min)
**Depends on:** v1 shipping (Vite build setup already in place)
