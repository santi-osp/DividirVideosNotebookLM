# Splitly User Guide

This guide explains how to split video files, extract optimized audio tracks, configure size presets, and manage your processing queue.

---

## 1. Selecting a Mode

Splitly offers two primary operating modes:

### 🎬 Split Video Mode
Splits full video files by maximum size (MB) while preserving both video and audio streams using stream copy (`-c copy`) without quality loss whenever possible.

### 🎙️ Extract Audio Mode (NotebookLM Optimized)
Extracts the audio track and encodes it into high-fidelity, compact AAC inside an M4A container at 96 kbps with `+faststart`.
- **Use Case**: A 1.5-hour recording (~1 GB video) extracts into a single lightweight ~35–45 MB M4A audio file.
- **Why**: NotebookLM sources are capped at 200 MB per file, and processing pure audio is up to 10× faster while saving source quotas.

---

## 2. Ingesting Video Files

- **Drag and Drop**: Drag one or multiple video files into the central dropzone.
- **File Picker**: Click **"browse files"** to select files using your system file dialog.
- **Supported Formats**: MP4, MOV, MKV, WebM, AVI, M4V, TS, MPG.
- **File Size Limit**: Up to ~2 GB per file (the practical browser linear memory limit for 32-bit WebAssembly virtual filesystems).

---

## 3. Configuring Part Limits & Presets

In **Split Video** mode, configure the maximum size per segment:
- **NotebookLM (190 MB)**: Designed for Google NotebookLM (200 MB official limit minus a 10 MB safety buffer for MP4 container metadata).
- **Discord (25 MB)**: Standard file limit for Discord free tier uploads.
- **WhatsApp (16 MB / 64 MB)**: 16 MB for standard media sharing; 64 MB for document attachments.
- **Email (25 MB)**: Standard attachment threshold for Gmail and Outlook.
- **Custom Size**: Adjust the number input or use the **−** and **+** buttons (between 10 MB and 2000 MB).

---

## 4. Processing Concurrency

- **1 at a time (Recommended)**: Minimizes browser memory footprint. Essential for files larger than 300 MB.
- **2 in parallel**: Available for machines with 8 GB+ RAM processing multiple smaller clips.

---

## 5. Controlling the Queue & Cancelling

- **Start**: Click **"Split videos"** or **"Extract audio"**.
- **Real-Time Progress**: The progress bar reflects decoding time, and the status badge indicates the current phase (`Preparing engine`, `Copying file`, `Extracting audio`, `Creating part N`).
- **Immediate Cancellation**: Click the red **"Cancel"** button at any time. Splitly terminates the WebAssembly worker immediately, frees memory, and marks the item as cancelled without triggering false error notifications.
- **Retry**: Cancelled or failed jobs can be restarted by clicking **"Process remaining"**.

---

## 6. Downloading Results

- **Individual Downloads**: Click the download button next to any part in the output list.
- **Download All**: Click **"Download all N parts"**. Splitly paces downloads at safe 450 ms intervals to prevent modern browsers from blocking multiple automated file saves.
- **In-Browser Preview**: Click the play icon on any segment to preview the video or listen to the extracted audio in the built-in modal player.
