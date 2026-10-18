# Splitly Development Guide

This document provides developer instructions for building, testing, contributing, and releasing Splitly.

---

## 1. Project Scripts Reference

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite local development server with Hot Module Replacement (HMR). |
| `npm run build` | Compiles production assets into the `dist/` directory. |
| `npm run preview` | Starts local HTTP server previewing the `dist/` production build. |
| `npm run test` | Runs the Vitest automated unit test suite. |
| `npm run check:i18n` | Verifies translation dictionary parity between `en.json` and `es.json`. |
| `npm run check:docs` | Verifies bilingual document pair completeness and visual assets. |
| `npm run fixtures` | Generates synthetic MP4 and WebM fixtures using local FFmpeg and FFprobe. |
| `npm run screenshots` | Runs Playwright to capture UI states and renders the demo GIF/MP4. |

---

## 2. Directory Layout

```text
DividirVideosNotebookLM/
├── assets/
│   └── branding/              # Vector logos, icons, wordmarks, brand guidelines
├── docs/
│   ├── assets/                # Screenshots and animated demo GIF/MP4
│   ├── development/           # AUDIT.md, DESIGN_DECISIONS.md, TESTING.md
│   ├── en/                    # English documentation
│   └── es/                    # Spanish documentation
├── public/                    # Static favicons, touch icon, Open Graph share card
├── scripts/                   # Verification and generation scripts
├── src/
│   ├── core/                  # Media utils, Queue manager, Processing engine
│   ├── ffmpeg/                # Same-origin wrapper and worker
│   ├── i18n/                  # Reactive i18n store and locale JSONs
│   ├── main.js                # App entrypoint and UI orchestration
│   └── styles.css             # Theme, layout, and component styling
└── tests/
    ├── fixtures/              # Synthetic test media generated via FFmpeg
    └── unit/                  # Unit tests (media, queue, i18n)
```

---

## 3. Adding New Features or Bug Fixes

1. Always write unit tests in `tests/unit/` for new media calculations, state logic, or format parsing.
2. If adding user-visible strings, update both `src/i18n/locales/en.json` and `src/i18n/locales/es.json`.
3. Run `npm run test && npm run check:i18n && npm run check:docs` before committing.
4. Keep all processing client-side. Do not introduce remote server calls or analytics.
