# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-18

### Added
- **Full Bilingual Support (i18n)**: 100% UI translation across English (`en`) and Spanish (`es`) with dynamic hot-switching, pluralization, and localStorage preference persistence.
- **Brand Identity**: Original Splitly geometric logo, app icons, favicons (SVG & ICO), Apple touch icon, and Open Graph share card.
- **Queue State Machine**: Deterministic job states (`queued`, `preparing`, `processing`, `completed`, `failed`, `cancelling`, `cancelled`) preventing phantom updates.
- **Robust Cancellation Latch**: Race-condition-free cancellation mechanism that immediately signals workers, clears abort state only after promises settle, and prevents terminated items from falsely reporting errors.
- **Automated Validation Suite**:
  - Vitest unit tests for media formatters, duration parsing, queue states, and i18n interpolation.
  - Automated translation check script (`scripts/check-i18n.js`).
  - Automated documentation parity script (`scripts/check-docs.js`).
  - Synthetic media generator with FFmpeg & FFprobe verification (`scripts/generate-test-media.js`).
  - Automated Playwright screenshot & demo generator (`scripts/capture-screenshots.js`).
- **Comprehensive Bilingual Documentation**:
  - Full guides in `docs/en/` and `docs/es/` (Getting Started, User Guide, FAQ, Troubleshooting, Architecture, Development).
  - Internal technical engineering audit (`docs/development/AUDIT.md`) and design decisions.
- **Open Source Standards**: MIT License, `THIRD_PARTY_NOTICES.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, GitHub issue templates, and pull request template.
- **Deterministic Builds**: Committed `package-lock.json` and updated GitHub Actions CI pipeline using `npm ci`.

### Fixed
- Fixed critical race condition in `cancelProcessing()` where synchronous reset of `abortRequested` caused subsequent queued items to continue processing or report false errors.
- Fixed arbitrary 20-part cap on audio splitting that silently discarded audio for recordings requiring >20 segments.
- Fixed HTML5 video duration probing hanging indefinitely on unsupported containers by introducing a 4-second timeout and graceful fallback.
- Fixed invalid image reference in `README.md` pointing to `index.html`.
- Fixed memory leakage by ensuring Object URLs are revoked upon item removal, retry, or queue clear.

### Changed
- Re-architected monolithic `src/main.js` into modular single-responsibility components (`src/core/media.js`, `src/core/queue.js`, `src/core/processing.js`, `src/i18n/`, `src/ffmpeg/`).
- Updated Discord upload preset with verified platform limits.

---

## [1.0.0] - 2026-10-01

### Added
- Initial release of Splitly client-side video splitting utility.
- Basic WebAssembly integration via `@ffmpeg/ffmpeg`.
- Audio extraction mode for NotebookLM in M4A/AAC format.
- Size-based video splitting with `-fs` parameter.
- Quick presets for NotebookLM, Discord, WhatsApp, and Email.
- Dark theme styling with basic responsive layout.
