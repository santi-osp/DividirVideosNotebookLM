# Splitly Documentation (English)

Welcome to the official documentation for **Splitly 2.0**, a 100% client-side web utility for splitting videos by size and extracting high-fidelity audio for NotebookLM, Discord, and messaging apps.

---

## Documentation Sections

1. [Getting Started](getting-started.md) — How to use Splitly immediately via web or local server.
2. [User Guide](user-guide.md) — Step-by-step instructions for splitting videos, extracting audio, and managing presets.
3. [Frequently Asked Questions (FAQ)](faq.md) — Privacy, limits, NotebookLM optimization, and file safety.
4. [Troubleshooting](troubleshooting.md) — Resolving memory exhaustion, format incompatibility, and browser issues.
5. [Architecture](architecture.md) — WebAssembly execution, Worker lifecycle, and queue management.
6. [Development](development.md) — Local development, contributing, running tests, and building for production.

---

## Core Principles

- **100% Client-Side Privacy**: Media files are processed in your browser memory via WebAssembly. Zero video bytes are transmitted to any external backend.
- **Optimized for NotebookLM**: Convert multi-gigabyte video recordings into ultra-lightweight M4A audio files that easily fit into NotebookLM source limits.
- **Fast Size-Based Splitting**: Break large video files into parts respecting platform limits (16 MB, 25 MB, 64 MB, 190 MB, or custom).
