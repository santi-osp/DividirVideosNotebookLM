# Splitly 2.0 — Architecture & Design Decisions Record (ADR)

## ADR-001: Retention of Vanilla JS & Modular ES Architecture
- **Context**: The user requested that we do not introduce React, Angular, Vue, or large UI frameworks simply for cosmetic reorganization.
- **Decision**: Evolve Splitly using native modern ECMAScript modules (ESM) structured into single-responsibility domains (`src/core/media.js`, `src/core/queue.js`, `src/core/processing.js`, `src/i18n/`, `src/ffmpeg/`).
- **Consequences**: Minimal bundle size (~52 KB bundled client JS), zero framework churn, high performance, and rapid compilation without heavy toolchains.

---

## ADR-002: Same-Origin Web Worker for GitHub Pages
- **Context**: Loading WebAssembly workers directly from external CDNs (such as jsDelivr) triggers strict browser cross-origin worker security errors (`Failed to construct 'Worker': Script at ... cannot be accessed from origin ...`).
- **Decision**: Keep `src/ffmpeg/worker.js` hosted on the exact same origin as the application, wrapping `@ffmpeg/ffmpeg` dynamically to pass `classWorkerURL`.
- **Consequences**: Reliable execution across static deployments (GitHub Pages, Netlify, Cloudflare Pages, local `http-server`) without requiring CORS proxy servers or cross-origin headers (`COOP`/`COEP` isolation workarounds).

---

## ADR-003: Job State Machine & Deterministic Cancellation
- **Context**: The legacy implementation contained a race condition in `cancelProcessing()` where `state.abortRequested` was cleared synchronously before active worker loops finished, causing subsequent jobs to start or get erroneously marked as failures.
- **Decision**: Introduce explicit lifecycle states (`queued`, `preparing`, `processing`, `completed`, `failed`, `cancelling`, `cancelled`) and an Abort latch that remains locked until all active runners are terminated and promises settled.
- **Consequences**: Predictable job transitions, no phantom executions, and accurate user notifications.

---

## ADR-004: Removal of the 20-Part Audio Extraction Cap
- **Context**: The legacy audio splitting algorithm capped iterations at `aPart <= 20`. Long recordings requiring >20 pieces silently dropped subsequent audio while marking the item 100% complete.
- **Decision**: Dynamically calculate partition counts based on duration, bitrate, and size limits, with a safe iteration ceiling of 500 parts.
- **Consequences**: Complete preservation of audio recordings of any duration without silent truncation.

---

## ADR-005: Zero-Dependency Reactive i18n
- **Context**: The application required 100% bilingual support (English and Spanish) with instant UI switching without page reload or job cancellation.
- **Decision**: Created a lightweight translation store supporting nested key lookup, token replacement, pluralization (`one` / `other`), and reactive change subscriptions.
- **Consequences**: Instant language toggling without canceling ongoing FFmpeg processes or losing queue state.
