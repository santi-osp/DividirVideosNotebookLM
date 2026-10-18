# Frequently Asked Questions (FAQ)

### 1. Are my videos or audio files uploaded to any server?
**No.** Splitly operates 100% on the client side. Media processing, cutting, and encoding happen in your browser's local memory using WebAssembly (`@ffmpeg/ffmpeg`). Your files never leave your computer.

### 2. Why does Splitly need an internet connection on first load?
Splitly downloads the WebAssembly engine (`ffmpeg-core.js` and `ffmpeg-core.wasm`, approximately 31 MB) from a public CDN (jsDelivr) when you first start processing. Once cached by your browser, processing requires no active file transmission.

### 3. What is the maximum file size Splitly can process?
Splitly supports video files up to approximately **2 GB**. This is due to the 32-bit linear memory architecture of WebAssembly virtual filesystems. For stability, processing 1 file at a time is strongly recommended for files over 300 MB.

### 4. Why does the browser consume significant RAM during processing?
FFmpeg.wasm creates an in-memory virtual filesystem. Reading a 1 GB file into browser memory and executing demuxing/remuxing requires holding memory buffers. Splitly automatically revokes object URLs and clears temporary files to prevent long-term memory leaks.

### 5. Why do video parts sometimes differ slightly in size or duration?
When splitting videos without re-encoding (`-c copy`), cuts can only occur at **Keyframes (I-frames)**. If a video has a long keyframe interval (GOP size of 5–10 seconds), FFmpeg seeks to the nearest keyframe before the cut point, which can cause slight duration variations.

### 6. Can I use Splitly without an account or payment?
**Yes.** Splitly is 100% free and open source software (FOSS) released under the MIT License. There are no subscriptions, paywalls, or accounts.

### 7. Does NotebookLM support video uploads?
NotebookLM accepts audio files (MP3, M4A, WAV), Google Docs, PDFs, and text, but does not natively extract audio from large uploaded video files. Splitly's **Extract Audio** mode extracts the audio track into a lightweight M4A file (~35 MB for 1.5 hours) that imports cleanly into NotebookLM without hitting file or source limits.

### 8. Is Splitly officially affiliated with Google, NotebookLM, or Discord?
**No.** Splitly is an independent, community-driven open source project created by Santiago Ospina Arango. It is not affiliated with, endorsed by, or sponsored by Google, Discord, or WhatsApp.
