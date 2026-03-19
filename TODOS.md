# TODOS

## P1 — High Priority

### ~~Image / Logo Watermark Support~~ ✓ Done
**Shipped:** Text/Image mode toggle in sidebar. Users upload PNG/SVG/WebP logos (max 5MB). Shared size, opacity, position, and tiled controls work for both modes. Logo images cached for fast re-renders. Templates save/load logo data URIs. Logo preview with checkerboard transparency background and "Remove" button.

---

## P2 — Medium Priority

### ~~Text watermark clipping at corner positions~~ ✓ Done
**Shipped:** Used `ctx.measureText()` to measure text width before placement. Center x/y are clamped to keep text fully within the canvas. For text wider than the canvas, `ctx.fillText` `maxWidth` is used to compress horizontally rather than clip. Commit: ddc54d1



### ~~Shareable Template URLs~~ ✓ Done
**Shipped:** "Copy link" button in template panel encodes current watermark settings as compact URL params (short keys: `t`, `f`, `s`, `o`, `c`, `p`, `tl`, `ta`, `ts`, `m`). Only non-default values included to keep URLs short. URL params parsed on app mount and applied to watermark state, then cleaned from the address bar. Logo data URIs excluded (too large for URLs). Full input validation with clamping. 21 tests covering encode, parse, roundtrip, and edge cases.

### Lightweight Analytics (Privacy-Respecting)
**What:** Add privacy-respecting analytics (e.g., Plausible, Umami, or simple custom event tracking) to understand which landing page sections users engage with and measure conversion (scroll → upload).
**Why:** The landing page has multiple CTAs and sections. Without data, we can't know if sections are working or if the floating CTA drives uploads.
**Pros:** Data-driven iteration on landing page content; understand user journey.
**Cons:** Any analytics is a deviation from the "zero external requests" story; needs careful framing.
**Context:** The app is 100% client-side with a strong privacy story. Analytics must be self-hosted or privacy-first (no cookies, no PII). Consider Plausible Cloud or self-hosted Umami.
**Effort:** S (human ~4 hours → CC ~15 min)
**Depends on:** Landing page shipped

### Real Demo Images for Landing Page
**What:** Replace SVG placeholder before/after images on the landing page with real watermarked photo examples.
**Why:** The current SVG placeholders look like dark rectangles and don't communicate the watermarking feature effectively to first-time visitors.
**Pros:** Better first impression; clearer feature communication; more professional landing page.
**Cons:** Needs a real photo with appropriate licensing; requires manual asset creation.
**Context:** Found by /design-review (FINDING-005, deferred). Use WebP format, <100KB each, `loading="lazy"`. The component already has `onError` fallback handlers. Replace `public/demo/before.svg` and `public/demo/after.svg`.
**Effort:** S (human ~2 hours → CC ~10 min, once a source photo is provided)
**Depends on:** A source photo with appropriate usage rights

### ~~Progressive Web App (PWA) / Offline Support~~ ✓ Done
**Shipped:** Added `vite-plugin-pwa` with `autoUpdate` service worker registration, installable web manifest, dark-theme metadata, and cache-first static asset precache for offline reloads after first visit.
**What:** Add `manifest.json` and a service worker to make the app installable on desktop/mobile and functional offline after first load.
**Why:** The app is already 100% client-side — PWA is a natural extension. Offline support further strengthens the "your files never leave your device" story.
**Pros:** Installable to desktop; works without internet; privacy story strengthens; fast repeat loads.
**Cons:** Service worker caching strategy needs care (cache-busting on new deploys); adds ~100 lines of boilerplate.
**Context:** Use Vite PWA plugin (`vite-plugin-pwa`) — it handles most of the complexity automatically.
**Effort:** S (human ~1 day → CC ~15 min)
**Depends on:** v1 shipping (Vite build setup already in place)
