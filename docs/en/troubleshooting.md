# Troubleshooting Guide

This guide covers common issues, browser error messages, and their solutions when using Splitly.

---

## 1. Out of Memory (OOM) / Browser Tab Crash

- **Symptom**: The browser tab suddenly crashes, displays `Error code: Out of Memory`, or Splitly shows the error toast *"Browser ran out of memory"*.
- **Root Cause**: WebAssembly in 32-bit browser environments cannot address more than ~2–3 GB of linear heap. Processing large files (>800 MB) with parallel concurrency (2 at a time) can exceed heap limits.
- **Solution**:
  1. Set Concurrency to **"1 at a time"**.
  2. Close unused browser tabs to free system RAM.
  3. For files approaching 2 GB, consider extracting audio instead of splitting full video, or trimming locally.

---

## 2. "Could not download FFmpeg WebAssembly core"

- **Symptom**: Splitly shows an error when attempting to start processing.
- **Root Cause**: The browser was unable to fetch `ffmpeg-core.js` and `ffmpeg-core.wasm` from the jsDelivr CDN due to network interruption or an ad-blocker blocking script requests.
- **Solution**:
  1. Check your internet connection.
  2. Temporarily disable aggressive ad-blockers or privacy extensions that block third-party CDN scripts.
  3. Reload the page and try again.

---

## 3. Video Metadata Shows "Analyzing…" or Duration is Unknown

- **Symptom**: The video duration displays `Analyzing…` or `—`.
- **Root Cause**: Certain containers (MKV, AVI) or codecs (HEVC/H.265, ProRes) cannot be decoded natively by HTML5 `<video>` tags in certain browsers.
- **Solution**: Splitly applies an automatic 4-second timeout and falls back to container size estimation. The file can still be split by MB size or extracted to audio without issue.

---

## 4. Multi-Download Blocking

- **Symptom**: Only the first output part downloads when clicking "Download all parts".
- **Root Cause**: Some browser security settings block multiple simultaneous file downloads from a single user gesture.
- **Solution**: Splitly automatically introduces a 450 ms interval between downloads. If your browser displays a permission prompt *"Allow this site to download multiple files?"*, click **Allow**.
