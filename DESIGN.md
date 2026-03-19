# Design System — Watermark

## Product Context
- **What this is:** A 100% client-side watermark tool — add text watermarks to images and PDFs, batch process, download as ZIP. Files never leave the browser.
- **Who it's for:** Photographers, legal/HR teams, creators who need to brand or protect files.
- **Space/industry:** Image/document watermarking tools (Watermarkly, Visual Watermark, Make Watermark).
- **Project type:** Web app — utility/tool.

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian — precision tool, not a marketing site. Function-first, dark workspace, clean lines. Think Figma or Linear, not Canva.
- **Decoration level:** Minimal — the user's photos ARE the visual. No gradients, no blobs, no decorative noise. Typography and spacing do all the work.
- **Mood:** Professional, trustworthy, fast. The app should feel like a precision instrument — every element earns its pixels.
- **Reference sites:** Researched Watermarkly, Visual Watermark, Make Watermark. All converge on marketing-heavy pages with gradient blobs. Our differentiator: tool-first design (drop zone IS the homepage), dark workspace, teal accent in a pink/purple-dominated space.

## Typography
- **Display/Hero:** Satoshi — geometric, modern, distinctive without being flashy. Used for headings, the product name, and large UI labels.
- **Body/UI:** Instrument Sans — excellent readability at small sizes, pairs naturally with Satoshi. Used for body text, control labels, descriptions.
- **Data/Tables:** Geist Mono — clean monospace with tabular-nums support. Used for file names, file sizes, progress info, technical data.
- **Code:** Geist Mono
- **Loading:** Satoshi and Instrument Sans via [Fontshare](https://api.fontshare.com). Geist Mono via CDN or bundled.
- **Scale:**
  - H1: 48px / Satoshi Black / -0.03em / 1.1 line-height
  - H2: 28px / Satoshi Bold / -0.02em / 1.2
  - H3: 20px / Satoshi SemiBold / -0.01em / 1.3
  - Body: 15px / Instrument Sans Regular / 1.65
  - Small: 13px / Instrument Sans Regular / 1.5
  - Label: 11px / Geist Mono / uppercase / 0.08em tracking

## Color
- **Approach:** Restrained — one accent + neutrals. Color is rare and meaningful.
- **Primary/Accent:** #0EA5E9 (sky-500) — trustworthy, modern, stands out in a space dominated by pink/purple.
  - Hover: #38BDF8 (sky-400)
  - Muted: rgba(14, 165, 233, 0.12) — for backgrounds, badges, subtle highlights.
- **Neutrals (dark mode — default):**
  - Background: #0A0A0B
  - Surface: #18181B (zinc-900)
  - Surface hover: #1F1F23
  - Border: #27272A (zinc-800)
  - Border subtle: #1E1E21
  - Text primary: #FAFAFA
  - Text secondary: #A1A1AA (zinc-400)
  - Text tertiary: #8B8B94
- **Neutrals (light mode):**
  - Background: #FAFAFA
  - Surface: #FFFFFF
  - Surface hover: #F4F4F5
  - Border: #E4E4E7
  - Border subtle: #F4F4F5
  - Text primary: #09090B
  - Text secondary: #52525B
  - Text tertiary: #6F6F7B
  - Accent: #0284C7 (sky-600, slightly darker for contrast)
  - Accent hover: #0369A1
- **Semantic:**
  - Success: #22C55E
  - Warning: #F59E0B
  - Error: #EF4444
  - Info: #0EA5E9 (same as accent)
- **Dark mode:** Default. Light mode available via toggle. Dark backgrounds prevent color-casting the user's photos — standard for image editing tools.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — breathing room without wasting screen real estate.
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Grid-disciplined — strict workspace layout, nothing floating or overlapping.
- **Primary layout:** Sidebar controls (280px) + central canvas preview (fluid).
- **Grid:** Single-column for controls sidebar, fluid for canvas area.
- **Max content width:** 1120px for any non-workspace pages.
- **Border radius:**
  - sm: 4px — small elements (position grid cells, thumbnails)
  - md: 8px — buttons, inputs, cards
  - lg: 12px — panels, modals, workspace sections
  - full: 9999px — badges, template chips, privacy pill

## Motion
- **Approach:** Minimal-functional — smooth transitions that aid comprehension. No entrance animations, no scroll effects. The tool should feel instant.
- **Easing:** enter: ease-out / exit: ease-in / move: ease-in-out
- **Duration:** micro: 50-100ms / short: 150ms / medium: 250ms / long: 400ms (reserved for batch progress)
- **Rules:**
  - Control changes (hover, focus, toggle): 150ms ease
  - Preview re-render: debounced 150ms, rendered via requestAnimationFrame
  - Progress bars: 300ms ease-in-out
  - No page transitions, no fade-ins, no decorative motion

## Key UI Patterns

### Landing Page (Hybrid Hero)
- The drop zone sits above the fold — tool-first, no scrolling to start using it.
- Content sections below for first-time visitors: Features (with before/after demo), How It Works (3 steps), Privacy/Trust, FAQ accordion.
- Alternating section backgrounds: `--bg` and `--surface` for visual rhythm.
- Section padding: 64px (3xl) top/bottom. Max content width: 1120px.
- Smooth scroll CTAs ("Try it now →") scroll back to the drop zone.
- Floating CTA: pill button (desktop) / full-width bottom bar (mobile) appears when drop zone scrolls out of view (IntersectionObserver).
- Scroll indicator below drop zone: bouncing chevron + "See what it does" in text-tertiary.

### Drop Zone
- Dashed border drop area, centered with icon + "Drop files here to watermark".
- Supported format badges in monospace below: `JPG · PNG · WebP · PDF`
- Privacy badge pill: lock icon + "files never leave your device" in accent-muted.
- Pure component — no header, no page layout. Used as child of LandingPage.

### Editor Workspace
- Left sidebar (280px, surface color): watermark controls stacked vertically.
- Right area (fluid, background color): canvas preview showing the photo/PDF with watermark applied.
- File info in monospace at bottom-right of canvas area.
- Download button at bottom of sidebar, full-width, primary style.

### Position Control
- 3x3 grid of square cells, one active (accent border + muted background).
- Adjacent "Tiled" toggle — when on, position grid disables and watermark repeats diagonally across entire surface.
- Tiled mode shows additional controls: rotation angle, spacing density.

### Batch Processing
- File list with thumbnails, monospace file names, sizes, and status (Done/Processing/Queued).
- Thin progress bar at top of panel (accent color).
- Footer with total size, time estimate, and "Download ZIP" button.

### Templates
- Pill/chip style with accent-muted background for active template.
- "+ Save" chip to save current settings.
- Stored in LocalStorage as JSON.

### Alerts
- Slim horizontal bars with semantic colors (10% opacity background + 20% opacity border).
- Icon + message text. Always actionable — tell the user what to do.

### Toasts
- Position: bottom-center, stacked (max 3).
- Success: auto-dismiss after 4 seconds.
- Errors: sticky until manually dismissed.
- Style: surface background, border, left-colored accent bar matching semantic color.

## Limits & Constraints
- **Batch file limit:** 50 files maximum. Show "Maximum 50 files" when limit reached.
- **File size limit:** 50MB per file. Error: "[filename] is too large (52MB). Maximum file size is 50MB."
- **Supported formats:** JPG, PNG, WebP, PDF. Reject others with specific error.

## Watermark Text Options
- **Fonts:** 5-8 curated options in a dropdown:
  - Satoshi (geometric sans — default)
  - A serif option (e.g., Instrument Serif)
  - A handwritten/script option
  - A monospace option (Geist Mono)
  - 2-3 classic choices (e.g., Georgia, Futura-like)
- **Color:** Color picker with preset swatches (white, black, red, plus custom).
- **Size:** Slider (12px–120px, relative to image dimensions).
- **Opacity:** Slider (0%–100%, warn at 0%).

## Responsive Behavior
| Breakpoint | Layout | Changes |
|------------|--------|---------|
| Desktop (>1024px) | Sidebar (280px) + Canvas (fluid) | Full experience |
| Tablet (768–1024px) | Sidebar (240px) + Canvas (fluid) | Sidebar slightly narrower |
| Mobile (<768px) | Stacked: Controls top, Canvas below | Controls collapse into accordion sections. Canvas gets full width. No drag-to-position — grid only. Touch-friendly: 44px min targets. Download button sticky at bottom. |

## Accessibility
- **Touch targets:** 44px minimum on all interactive elements.
- **Keyboard nav:** Tab through controls in sidebar order. Enter to download. Escape to reset. Arrow keys in position grid.
- **Screen readers:** ARIA labels on canvas ("Preview of [filename] with watermark"), slider values announced, progress bar has aria-valuenow.
- **Color contrast:** All text meets WCAG AA (4.5:1 min). Accent #0EA5E9 on #18181B = 5.2:1 — passes.
- **Focus indicators:** 2px accent outline on focus-visible. No focus ring on mouse click.
- **Reduced motion:** `prefers-reduced-motion: reduce` disables all transitions.

## Interaction States
| Feature | Loading | Empty | Error | Success | Partial |
|---------|---------|-------|-------|---------|---------|
| Drop zone | — | "Drop files here to watermark" + icon + format badges | "Unsupported format. Try JPG, PNG, WebP, or PDF" | Files appear in editor | — |
| File loading | Skeleton thumbnail + spinner | — | "Could not read [filename]. File may be corrupt." | Thumbnail + file info | — |
| Live preview | Spinner in canvas center | — | "Preview unavailable for this file" | Canvas shows watermarked image | — |
| Watermark text | — | Placeholder: "Enter watermark text", download disabled | — | Preview updates in real-time | — |
| Batch processing | Progress bar + per-file status | — | "3 of 5 processed. 2 failed. Download the 3 that succeeded?" | "5 files in 8 seconds. Nice." | ZIP has succeeded files, failed listed |
| PDF processing | "Page 3 of 12..." | — | "PDF is password-protected" / "PDF appears corrupt" | Preview shows first page | — |
| Template save | — | "No saved templates" + "+ Save current" chip | "Storage full — oldest template removed" | Template chip appears | — |
| Download | Button shows "Preparing..." | — | "Processing failed — try a smaller file" | File downloads, toast confirms | — |

## Navigation Flow
```
LANDING PAGE (hero: drop zone + content sections below)
  ├── [drop/click files] ──▶ EDITOR
  ├── [scroll down] ──▶ Features, How It Works, Trust, FAQ
  ├── [click "Try it now"] ──▶ smooth scroll to drop zone
  └── [floating CTA] ──▶ smooth scroll to drop zone

EDITOR (single or first of batch)
  ├── [adjust controls] ──▶ Live preview updates
  ├── [navigate batch] ──▶ ◀/▶ between files
  ├── [Download This] ──▶ file downloads, stay in editor (toast)
  ├── [Download ZIP] ──▶ Processing ──▶ ZIP downloads (toast)
  └── [Start Over] ──▶ back to LANDING PAGE (clear all)
```

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-18 | Initial design system created | Created by /design-consultation. Industrial/utilitarian aesthetic chosen to differentiate from gradient-heavy competitors. Teal accent stands out in a pink/purple space. Dark workspace default prevents color-casting photos. |
| 2026-03-18 | Tool-first homepage (no marketing page) | Drop zone IS the landing page. Users land and are immediately using the product. Bold but intentional — competitors bury their tool behind scrolling marketing content. |
| 2026-03-19 | Hybrid Hero landing page | Tool stays above the fold (tool-first preserved). Content sections added below for first-time visitors: features, how it works, trust, FAQ. Floating CTA for return-to-tool. |
| 2026-03-18 | Satoshi + Instrument Sans + Geist Mono | Geometric display font (Satoshi) pairs with readable body (Instrument Sans). Monospace accents (Geist Mono) for file info add technical trustworthiness. None are overused/blacklisted. |
| 2026-03-18 | 50-file batch limit, 50MB per file | Covers typical photo sessions. Prevents browser OOM on large batches. |
| 2026-03-18 | 5-8 curated watermark fonts | Subtraction default — covers 95% of use cases without overwhelming choice. |
| 2026-03-18 | Bottom-center toasts, 4s auto-dismiss | Least intrusive for workspace layout. Errors are sticky. |
| 2026-03-18 | Functional mobile (stacked layout) | Desktop-first tool, but mobile should not be broken. Accordion controls, full-width canvas. |
| 2026-03-18 | WCAG AA accessibility baseline | 44px targets, keyboard nav, screen reader labels, focus indicators, reduced motion support. |
