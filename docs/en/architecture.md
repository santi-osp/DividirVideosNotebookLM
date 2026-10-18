# Splitly 2.0 — System Architecture

Splitly is built on a modular, client-side WebAssembly architecture designed to deliver deterministic, memory-safe media processing without server infrastructure.

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    UI["Frontend Interface (Vanilla JS + Vite)"] --> I18N["i18n Engine (Reactive Localizer)"]
    UI --> QM["Queue Manager (State Machine)"]
    QM --> PE["Processing Engine (Pool & Cancellation Latch)"]
    PE --> FW["FFmpeg Same-Origin Wrapper"]
    FW --> WW["Same-Origin Web Worker (ffmpeg-worker.js)"]
    WW --> WASM["FFmpeg Core WebAssembly (.wasm)"]
    WASM --> VFS["In-Memory Virtual Filesystem (FS)"]
    VFS --> BLOB["Local Blob Generation & Object URLs"]
    BLOB --> DL["Browser File Download"]
```

---

## 2. Core Modules

### `src/i18n/` (Internationalization)
- **`index.js`**: Reactive store with pluralization parser (`one` / `other`), token replacement, language detection (localStorage -> navigator.language -> English fallback), and document title/lang synchronization.
- **`locales/en.json` & `locales/es.json`**: Translation dictionaries with 100% key parity verified by automated CI checks.

### `src/core/`
- **`media.js`**: Media inspection, size and duration formatters, HTML5 metadata probing with safe timeouts, filename sanitization, and output estimations.
- **`queue.js`**: `QueueItem` state machine and `QueueManager` handling item addition, duplicate rejection, and resource disposal (`URL.revokeObjectURL`).
- **`processing.js`**: `ProcessingEngine` concurrency pool with an Abort latch, stream copy video splitting, and AAC M4A audio extraction.

### `src/ffmpeg/`
- **`wrapper.js`**: Subclass of `@ffmpeg/ffmpeg` that supplies `classWorkerURL` pointing to the local origin.
- **`worker.js`**: Same-origin Web Worker implementing message routing (`LOAD`, `EXEC`, `WRITE_FILE`, `READ_FILE`, `DELETE_FILE`, `PROGRESS`, `LOG`) to prevent browser CORS worker rejection on GitHub Pages.

---

## 3. Queue State Machine

```mermaid
stateDiagram-v2
    [*] --> queued
    queued --> preparing: Start Engine
    preparing --> processing: Ingest Media
    processing --> completed: Success (Outputs > 0)
    processing --> cancelling: User Cancel
    preparing --> cancelling: User Cancel
    cancelling --> cancelled: Worker Terminated & Cleaned
    processing --> failed: Execution Error / OOM
    failed --> queued: Retry
    cancelled --> queued: Retry
```

---

## 4. Cancellation Flow

```mermaid
sequenceDiagram
    actor User
    participant Engine as ProcessingEngine
    participant Item as QueueItem
    participant Worker as FFmpeg Worker

    User->>Engine: Click Cancel
    Engine->>Engine: Set abortLatch = true
    Engine->>Item: Transition to 'cancelling'
    Engine->>Worker: runner.terminate()
    Worker-->>Engine: Worker stopped
    Engine->>Item: Transition to 'cancelled'
    Engine->>Engine: Reset abortLatch = false
    Engine->>User: Update UI & Display Warning Toast
```
