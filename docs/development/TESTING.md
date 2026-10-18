# Splitly 2.0 — Testing & Quality Assurance Guide

Splitly features a multi-tiered test and validation pipeline covering unit logic, i18n parity, documentation integrity, synthetic media generation, and end-to-end browser automation.

---

## 1. Test Suite Architecture

```
Tests & Verification Pipeline
 │
 ├── Unit Tests (Vitest)
 │     ├── tests/unit/media.test.js      # Formatters, durations, presets, progress parser
 │     ├── tests/unit/queue.test.js      # State machine, deduplication, item lifecycle
 │     └── tests/unit/i18n.test.js       # Translations, plurals, tokens, fallback
 │
 ├── Scripted Integrity Checks (Node.js)
 │     ├── scripts/check-i18n.js         # 100% key and parameter token parity
 │     └── scripts/check-docs.js         # Bilingual doc pairs & screenshot verification
 │
 ├── Media Validation (FFmpeg + FFprobe)
 │     └── scripts/generate-test-media.js # Synthetic H.264, VP8, and AAC fixture generation
 │
 └── Automated Browser Screenshots (Playwright)
       └── scripts/capture-screenshots.js # Authentic UI captures (EN/ES) & demo GIF/MP4
```

---

## 2. Running Automated Tests

### Unit Tests
```bash
npm run test
```
Executes all unit tests with Vitest in ~300ms.

### Translation Parity
```bash
npm run check:i18n
```
Verifies that `src/i18n/locales/en.json` and `src/i18n/locales/es.json` have identical keys, non-empty values, and matching interpolation parameters.

### Documentation Integrity
```bash
npm run check:docs
```
Validates that every English documentation guide in `docs/en/` has an active Spanish counterpart in `docs/es/`, and that all visual assets exist.

### Generating Test Media Fixtures
```bash
npm run fixtures
```
Uses the native FFmpeg CLI to generate:
- `synthetic-sample.mp4`: 10-second H.264 video with 440 Hz AAC audio tone.
- `synthetic-no-audio.mp4`: 5-second video with no audio track.
- `synthetic-sample.webm`: 5-second VP8 video with Vorbis audio.

Files are automatically inspected via `ffprobe` to verify streams, container metadata, duration, and codecs.

### Automated Screenshot Capture
```bash
npm run screenshots
```
Starts Vite preview, loads Playwright Chromium in high-DPI mode, switches between English and Spanish, captures authentic states (`overview`, `video-mode`, `audio-mode`, `queue`, `results`), and compiles an optimized demo GIF and MP4 using FFmpeg.
