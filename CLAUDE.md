# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `bun run dev` — start Vite dev server
- `bun run build` — production build to /dist
- `bun run lint` — ESLint
- `bun run preview` — preview production build

## Architecture

Client-side React watermark tool. Users drop images (JPG/PNG/WebP) or PDFs, configure watermark settings, preview in real-time, and download watermarked files. Nothing leaves the browser.

### Key layers

- **App.jsx** — root state owner. Holds watermark config, file list, active file index, toasts. Routes between DropZone (no files) and Editor (files loaded).
- **Editor.jsx** — workspace orchestrator. Sidebar controls on the left, canvas preview in the center. Handles single download and batch ZIP export.
- **src/lib/** — processing logic, pure JS (no React):
  - `watermarkRenderer.js` — shared watermark drawing function (positions, tiling, fonts). Used by both image and PDF processors.
  - `imageProcessor.js` — full-res processing (`processImage`) and preview generation (`generatePreview`, max 800px).
  - `pdfProcessor.js` — PDF reading via pdfjs-dist, watermarking, and output via pdf-lib. Pages rendered at 2x, embedded as PNGs in a new PDF.
  - `batchCoordinator.js` — processes files in chunks of 5, creates ZIP via jszip with DEFLATE compression.
  - `templateManager.js` — LocalStorage CRUD for watermark templates (max 20, oldest evicted).

### Data flow

1. Files dropped → App validates (50 files max, 50MB each) → Editor renders
2. Watermark controls update state → Preview.jsx debounces (150ms) → canvas redraws
3. Download → processImage/processPdf → Blob → browser download (or batch → ZIP)

### State management

Plain React hooks (useState/useCallback/useEffect/useRef). No Redux or Context. All state lives in App.jsx and flows down via props.

### Styling

CSS custom properties in `src/styles/globals.css`. Dark mode default. Design tokens for colors, fonts, spacing (4px base). Light mode via `[data-theme="light"]`. Fonts loaded from CDN in index.html (Satoshi, Instrument Sans, Geist Mono).

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available gstack skills:
- `/plan-ceo-review` — CEO-level plan review
- `/plan-eng-review` — Engineering plan review
- `/plan-design-review` — Design plan review
- `/design-consultation` — Design consultation
- `/review` — General review
- `/ship` — Ship a feature
- `/browse` — Headless browser for web browsing and QA
- `/qa` — Full QA flow
- `/qa-only` — QA without design review
- `/qa-design-review` — QA with design review
- `/setup-browser-cookies` — Set up browser cookies
- `/retro` — Retrospective
- `/document-release` — Document a release

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

## Design System

Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
