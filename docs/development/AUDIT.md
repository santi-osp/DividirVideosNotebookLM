# Splitly 2.0 — Technical Audit & System Assessment

**Audit Date**: October 2026  
**Auditor**: Splitly Engineering Team (DevSecOps, Media, Frontend, QA)  
**Target Repository**: [santi-osp/DividirVideosNotebookLM](https://github.com/santi-osp/DividirVideosNotebookLM)  
**Active Working Branch**: `feat/splitly-open-source-2`  
**Current Baseline Version**: `1.0.0`

---

## 1. Executive Summary

This document presents a comprehensive technical audit of the Splitly repository. Splitly is a client-side web utility designed to process video and audio files locally within the browser using WebAssembly (`@ffmpeg/ffmpeg`) without transmitting media files to external servers.

While the core concept and original user flow are highly valuable, the initial codebase contained critical architectural, reliability, internationalization, and community readiness issues that prevent it from functioning as a dependable, production-ready open source project.

---

## 2. Current Architecture Overview

```
Browser Client (Vanilla JS + Vite)
 │
 ├── HTML / CSS UI Layer (Single-file monolithic styles.css & inline main.js templates)
 │
 ├── File Ingestion (HTML5 File API / Drag-and-Drop)
 │     └── HTML5 <video> metadata probing (duration extraction)
 │
 ├── Job Dispatcher (Unbounded promises & naive concurrency pool)
 │
 └── FFmpeg WebAssembly Layer
       ├── ffmpeg-wrapper.js (Subclass of @ffmpeg/ffmpeg overriding worker URL)
       ├── ffmpeg-worker.js (Custom same-origin Web Worker implementing message protocol)
       └── CDN Assets (jsdelivr: ffmpeg-core.js, ffmpeg-core.wasm ~31MB)
```

### Verified Functionality
- WebAssembly execution runs locally within modern desktop browsers.
- Static hosting works on GitHub Pages without requiring server infrastructure.
- Audio extraction using FFmpeg's `aac` encoder at 96 kbps generates compact `.m4a` files.
- Basic video splitting using `-c copy` and `-fs` generates partial segments for compatible formats.
- Visual dark-theme UI with lime accent colors and desktop styling.

---

## 3. Discovered Defects & Vulnerability Assessment

### Issue 1: Race Condition in `cancelProcessing()`
- **Severity**: **CRITICAL**
- **Evidence**: In `src/main.js` (lines 743–765):
  ```javascript
  function cancelProcessing() {
    if (!state.processing) return;
    state.abortRequested = true;
    for (const runner of state.activeRunners) {
      try { runner.terminate(); } catch {}
    }
    state.activeRunners.clear();
    // ...
    state.processing = false;
    state.abortRequested = false; // <--- Cleared synchronously!
    render();
  }
  ```
- **Technical Impact**:
  1. `runPool()` is asynchronous and awaits pending jobs. Because `state.abortRequested` is reset to `false` immediately within the synchronous execution of `cancelProcessing()`, any queued worker loop continues to pick up the next items in the queue instead of aborting.
  2. Workers terminated mid-command throw errors caught in `processItem()`. Because `state.abortRequested` is already `false`, items get classified as `error` rather than `cancelled`, triggering misleading error notifications ("N fallaron") and chime sounds.
- **Remediation**: Implement an explicit job state machine (`queued`, `preparing`, `processing`, `completed`, `failed`, `cancelling`, `cancelled`) and an AbortController/cancellation token pattern that remains latched until all active promises have settled.

---

### Issue 2: Audio Split Arbitrary 20-Part Hard Limit
- **Severity**: **HIGH**
- **Evidence**: In `src/main.js` (line 576):
  ```javascript
  while ((!aTotal || aStart < aTotal - 0.25) && aPart <= 20) {
    // ...
  }
  item.status = 'done';
  item.progress = 100;
  ```
- **Technical Impact**: For long recordings (e.g. 8-hour lectures, conferences, audiobooks) split with small presets (e.g. 16 MB WhatsApp or 25 MB Discord), if the output requires more than 20 segments, the loop quietly exits at part 20 and marks the job as `done` 100%. The remaining audio is silently discarded without user warning.
- **Remediation**: Dynamically calculate the required parts based on actual duration and bitrate, allow dynamic iteration up to safe container limits, and flag an error if boundaries cannot be satisfied.

---

### Issue 3: Video Splitting Inaccuracies with `-c copy` and `-fs`
- **Severity**: **HIGH**
- **Evidence**: In `src/main.js` (lines 654–665):
  ```javascript
  const args = [
    '-y',
    '-ss', start.toFixed(3),
    '-i', inputName,
    '-map', '0',
    '-c', 'copy',
    '-movflags', '+faststart',
    '-fs', String(Math.floor(workingMb * MB)),
    '-avoid_negative_ts', 'make_zero',
    '-progress', progressName,
    outputName,
  ];
  ```
- **Technical Impact**:
  1. `-c copy` (stream copy) can only cut cleanly on **Keyframes (I-frames)**.
  2. Seeking with `-ss` before `-i` snaps to the nearest keyframe preceding the timestamp. When combined with `-fs`, FFmpeg stops writing when the byte threshold is reached.
  3. If GOP (Group of Pictures) is long (e.g., 5–10 seconds), segment durations can deviate, causing slight overlaps or timestamp jumps if progress tracking does not inspect the actual keyframe boundaries.
  4. If `segmentDuration <= 0.25`, fallback relies on rough file size ratios that can produce unplayable micro-fragments.
- **Remediation**: Provide robust duration extraction, validate generated chunks using probe metadata, ensure segment duration advances by at least keyframe interval, and clearly document the physical reality of GOP stream copy versus transcoding.

---

### Issue 4: Memory Leakage & Unbounded Buffer Retentions
- **Severity**: **HIGH**
- **Evidence**:
  1. Every item creates a new `new FFmpeg()` instance and reloads WASM core files into memory.
  2. `fetchFile()` reads the full file into browser memory as an ArrayBuffer, copies it to WASM virtual FS with `writeFile()`, and `readFile()` makes an additional Uint8Array copy.
  3. `new Blob([data.buffer])` duplicates references.
  4. With concurrency = 2, two 800 MB files easily exceed 3.2 GB of heap, triggering immediate browser tab Out-Of-Memory (OOM) crashes.
- **Remediation**: Enforce single-worker serialization for large files, revoke object URLs on item removal/cleanup, ensure `safeDelete()` runs across all intermediate files, and provide active memory warnings.

---

### Issue 5: Metadata Reading Fragility
- **Severity**: **MEDIUM**
- **Evidence**: `metadata(file)` attaches an object URL to an HTML5 `<video>` tag.
- **Technical Impact**: Containers like MKV or codecs like HEVC/ProRes/AV1 that lack native browser demuxing fail with `video.onerror`, setting `item.duration = NaN`. The UI displays "Analizando…" indefinitely and disables accurate time-based part estimations.
- **Remediation**: Implement a 5-second timeout for HTML5 probing, fallback to container size-based estimation, and display informative status badges rather than perpetual "Analizando…".

---

### Issue 6: Zero Internationalization (Hardcoded Spanish)
- **Severity**: **MEDIUM**
- **Evidence**: All titles, button labels, toasts, ARIA attributes, error handlers, and status pills in `index.html` and `src/main.js` are in Spanish.
- **Remediation**: Build a modular, reactive i18n architecture supporting English (`en`) and Spanish (`es`), with automatic browser detection, explicit selector, and localStorage persistence.

---

### Issue 7: Package Management & CI/CD Non-Reproducibility
- **Severity**: **MEDIUM**
- **Evidence**:
  1. `.gitignore` contains `package-lock.json`.
  2. `.github/workflows/deploy.yml` runs `npm ci || npm install`.
- **Technical Impact**: Builds are non-deterministic; transient dependency updates could break production deployments silently.
- **Remediation**: Remove `package-lock.json` from `.gitignore`, commit the lockfile, enforce `npm ci`, and add a comprehensive CI pipeline running tests and linters before deployment.

---

### Issue 8: Documentation & Open Source Community Artifacts
- **Severity**: **MEDIUM**
- **Evidence**:
  1. `README.md` references an invalid image URL pointing to `index.html`.
  2. No `LICENSE` file in repository root.
  3. No `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, or issue templates.
  4. No bilingual documentation (`README.es.md`).
- **Remediation**: Author complete, professional open source guidelines, dual-language documentation, and generate real screenshots.

---

## 4. Remediation Plan & Architecture Decisions

| Phase | Focus Area | Action Items | Status |
|---|---|---|---|
| **Phase 1** | Audit & Diagnosis | Author `AUDIT.md` with complete vulnerability analysis | **Completed** |
| **Phase 2** | Media & Queue Engine | Modularize core (`queue.js`, `media.js`, `processing.js`), fix cancellation latch, fix 20-part audio limit | **In Progress** |
| **Phase 3** | Memory & Stability | Resource cleanup, ObjectURL management, buffer lifecycle | **Planned** |
| **Phase 4** | Internationalization | Lightweight reactive i18n engine (`en`, `es`), full string extraction | **Planned** |
| **Phase 5** | Visual Identity & UI | Original Splitly logo, branding guide, SVG icons, WCAG 2.2 AA compliance | **Planned** |
| **Phase 6** | Automated Testing | Vitest unit tests, FFmpeg/FFprobe synthetic media fixtures, Playwright E2E | **Planned** |
| **Phase 7** | Open Source Standards | MIT License, Third-Party Notices, Contributing, Security, Code of Conduct | **Planned** |
| **Phase 8** | Bilingual Documentation | `README.md` & `README.es.md`, full `/docs/` guides, authentic screenshots | **Planned** |
| **Phase 9** | CI/CD & Verification | Deterministic `npm ci`, GitHub Actions CI + Pages deploy, final PR | **Planned** |

---

## 5. Architectural Decisions (ADR Summary)

1. **Retain Vanilla JS + Vite**: Do not introduce heavy frontend frameworks (React, Angular). Modularize native ES modules into clean Single Responsibility classes.
2. **Same-Origin Class Worker**: Preserve the local `ffmpeg-worker.js` to ensure 100% compliance with GitHub Pages CORS rules while importing `@ffmpeg/ffmpeg` safely.
3. **Reactive i18n without Bundle Bloat**: A custom zero-dependency translation store with `Intl` integration, parameter interpolation, and hot UI updating without page reload.
4. **State Machine for Processing Queue**: Deterministic state transitions (`queued` → `preparing` → `processing` → `completed` / `failed` / `cancelling` → `cancelled`) preventing phantom updates after abort.
