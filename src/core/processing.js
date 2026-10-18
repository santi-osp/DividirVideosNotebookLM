/**
 * Splitly Processing Engine
 * Orchestrates WebAssembly FFmpeg execution, concurrency pool, video splitting,
 * audio extraction, and race-condition-free cancellation.
 */

import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { FFmpeg } from '../ffmpeg/wrapper.js';
import { BYTES_PER_MB, ext, stem, sanitizeFilename, parseProgressDuration } from './media.js';
import { JobStatus } from './queue.js';

const CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
let ffmpegAssetsPromise = null;

async function getFFmpegAssets() {
  if (!ffmpegAssetsPromise) {
    ffmpegAssetsPromise = Promise.all([
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
    ]).catch(err => {
      ffmpegAssetsPromise = null;
      throw err;
    });
  }
  return ffmpegAssetsPromise;
}

async function safeDelete(ffmpeg, path) {
  try {
    await ffmpeg.deleteFile(path);
  } catch {}
}

export class ProcessingEngine {
  constructor({ queue, onUpdate, onToast, onCompleteChime }) {
    this.queue = queue;
    this.onUpdate = onUpdate || (() => {});
    this.onToast = onToast || (() => {});
    this.onCompleteChime = onCompleteChime || (() => {});

    this.isProcessing = false;
    this.abortLatch = false;
    this.activeRunners = new Map(); // itemId -> ffmpeg instance
    this.mode = 'video'; // 'video' | 'audio'
    this.maxMb = 190;
    this.concurrency = 1;
  }

  setMode(mode) {
    if (this.isProcessing) return;
    this.mode = mode;
  }

  setMaxMb(maxMb) {
    if (this.isProcessing) return;
    this.maxMb = Math.min(2000, Math.max(10, Math.round(maxMb)));
  }

  setConcurrency(concurrency) {
    if (this.isProcessing) return;
    this.concurrency = Math.max(1, Math.min(2, concurrency));
  }

  async start() {
    if (this.isProcessing) return;
    const targets = this.queue.getPendingItems();
    if (!targets.length) return;

    this.isProcessing = true;
    this.abortLatch = false;
    this.onUpdate();

    try {
      await this.runPool(targets, this.concurrency);

      const failed = targets.filter(i => i.status === JobStatus.FAILED).length;
      const cancelled = targets.filter(i => i.status === JobStatus.CANCELLED).length;

      if (!this.abortLatch && !cancelled) {
        if (failed > 0) {
          this.onToast({
            type: 'warning',
            key: 'toasts.partialSuccess',
            params: { completed: targets.length - failed, failed },
          });
        } else {
          this.onToast({
            type: 'success',
            key: this.mode === 'audio' ? 'toasts.audioExtracted' : 'toasts.videosSplit',
          });
          this.onCompleteChime();
        }
      }
    } finally {
      this.isProcessing = false;
      this.abortLatch = false;
      this.activeRunners.clear();
      this.onUpdate();
    }
  }

  async runPool(items, concurrency) {
    let nextIndex = 0;
    const workerPromises = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (nextIndex < items.length) {
        if (this.abortLatch) break;
        const item = items[nextIndex++];
        if (!item || item.status === JobStatus.CANCELLED) continue;
        await this.processItem(item);
      }
    });

    await Promise.all(workerPromises);
  }

  async cancel() {
    if (!this.isProcessing) return;
    this.abortLatch = true;

    // Immediately mark active items as cancelling and pending as cancelled
    for (const item of this.queue.items) {
      if (item.status === JobStatus.PROCESSING || item.status === JobStatus.PREPARING) {
        item.setStatus(JobStatus.CANCELLING, 'queue.status.cancelling');
      } else if (item.status === JobStatus.QUEUED) {
        item.setStatus(JobStatus.CANCELLED, 'queue.statusText.cancelledByUser');
      }
    }
    this.onUpdate();

    // Terminate all active FFmpeg worker runners
    for (const [itemId, runner] of this.activeRunners.entries()) {
      try {
        runner.terminate();
      } catch {}
    }

    this.onToast({ type: 'warning', key: 'toasts.cancelled' });
  }

  async createFFmpeg(item) {
    item.setStatus(JobStatus.PREPARING, 'queue.statusText.preparingEngine');
    item.setProgress(2);
    this.onUpdate();

    const ffmpeg = new FFmpeg();
    this.activeRunners.set(item.id, ffmpeg);

    ffmpeg.on('log', ({ message }) => {
      if (item.status !== JobStatus.PROCESSING || this.abortLatch) return;
      const m = message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (m && Number.isFinite(item.duration) && item.duration > 0) {
        const s = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
        const progress = Math.max(item.progress, Math.min(96, 8 + (s / item.duration) * 88));
        item.setProgress(progress);
        this.onUpdate();
      }
    });

    const [coreURL, wasmURL] = await getFFmpegAssets();
    await ffmpeg.load({ coreURL, wasmURL });
    return ffmpeg;
  }

  async processItem(item) {
    let ffmpeg = null;
    const maxMb = this.maxMb;
    const effectiveMb = Math.max(1, maxMb - 1);
    const allowedBytes = maxMb * BYTES_PER_MB;
    const inputExt = ext(item.file.name);
    const safeExt = /^\.[a-z0-9]{1,5}$/i.test(inputExt) ? inputExt : '.mp4';
    const inputName = `input_${item.id.replace(/[^a-zA-Z0-9]/g, '')}${safeExt}`;

    try {
      item.cleanupOutputs();
      item.error = null;

      if (this.abortLatch) {
        item.setStatus(JobStatus.CANCELLED, 'queue.statusText.cancelledByUser');
        return;
      }

      ffmpeg = await this.createFFmpeg(item);
      if (this.abortLatch) throw new Error('OPERATION_CANCELLED');

      item.setStatus(JobStatus.PROCESSING, 'queue.statusText.loadingFile');
      item.setProgress(6);
      this.onUpdate();

      // Read file into memory and write to virtual FS
      const fileData = await fetchFile(item.file);
      if (this.abortLatch) throw new Error('OPERATION_CANCELLED');

      await ffmpeg.writeFile(inputName, fileData);
      if (this.abortLatch) throw new Error('OPERATION_CANCELLED');

      if (this.mode === 'audio') {
        await this.processAudioMode({ ffmpeg, item, inputName, allowedBytes, effectiveMb, maxMb });
      } else {
        await this.processVideoMode({ ffmpeg, item, inputName, allowedBytes, effectiveMb, maxMb, safeExt });
      }

      if (!item.outputs.length && !this.abortLatch) {
        throw new Error('ZERO_OUTPUTS');
      }

      if (!this.abortLatch) {
        item.setStatus(
          JobStatus.COMPLETED,
          this.mode === 'audio' ? 'queue.statusText.audioReady' : 'queue.statusText.videoReady',
          { count: item.outputs.length }
        );
      }
    } catch (err) {
      if (this.abortLatch || err?.message === 'OPERATION_CANCELLED' || item.status === JobStatus.CANCELLING) {
        item.setStatus(JobStatus.CANCELLED, 'queue.statusText.cancelledByUser');
      } else {
        item.setStatus(JobStatus.FAILED);
        item.error = this.classifyError(err);
      }
    } finally {
      if (ffmpeg) {
        await safeDelete(ffmpeg, inputName);
        try {
          ffmpeg.terminate();
        } catch {}
        this.activeRunners.delete(item.id);
      }
      this.onUpdate();
    }
  }

  async processAudioMode({ ffmpeg, item, inputName, allowedBytes, effectiveMb, maxMb }) {
    item.setStatus(JobStatus.PROCESSING, 'queue.statusText.extractingAudio');
    item.setProgress(20);
    this.onUpdate();

    const outputAudioName = `audio_${item.id.replace(/[^a-zA-Z0-9]/g, '')}.m4a`;
    const progressName = `progress_audio_${item.id.replace(/[^a-zA-Z0-9]/g, '')}.txt`;

    const args = [
      '-y',
      '-i', inputName,
      '-vn',
      '-c:a', 'aac',
      '-b:a', '96k',
      '-movflags', '+faststart',
      '-progress', progressName,
      outputAudioName,
    ];

    const code = await ffmpeg.exec(args);
    if (this.abortLatch) throw new Error('OPERATION_CANCELLED');
    if (code !== 0) throw new Error(`FFMPEG_EXEC_ERROR_${code}`);

    const audioData = await ffmpeg.readFile(outputAudioName);
    if (!audioData || audioData.length === 0) throw new Error('ZERO_OUTPUTS');

    // If entire audio fits within target size (standard case for NotebookLM)
    if (audioData.length <= allowedBytes) {
      const finalName = sanitizeFilename(`${stem(item.file.name)}_audio.m4a`);
      const blob = new Blob([audioData.buffer], { type: 'audio/mp4' });
      item.addOutput({
        name: finalName,
        blob,
        url: URL.createObjectURL(blob),
        isAudio: true,
      });
      await safeDelete(ffmpeg, outputAudioName);
      await safeDelete(ffmpeg, progressName);
    } else {
      // Split large audio file (>4h or small limit)
      item.setStatus(JobStatus.PROCESSING, 'queue.statusText.audioSplitting');
      this.onUpdate();

      let aStart = 0;
      let aPart = 1;
      const aTotal = Number.isFinite(item.duration) && item.duration > 0 ? item.duration : null;
      const maxSafeParts = 500; // Safeguard against infinite loops while removing 20-part cap

      while ((!aTotal || aStart < aTotal - 0.25) && aPart <= maxSafeParts) {
        if (this.abortLatch) throw new Error('OPERATION_CANCELLED');

        const partAudioName = `apart_${aPart}.m4a`;
        const partProgress = `progress_apart_${aPart}.txt`;

        const splitArgs = [
          '-y',
          '-ss', aStart.toFixed(3),
          '-i', outputAudioName,
          '-c', 'copy',
          '-movflags', '+faststart',
          '-fs', String(Math.floor(effectiveMb * BYTES_PER_MB)),
          '-progress', partProgress,
          partAudioName,
        ];

        const splitCode = await ffmpeg.exec(splitArgs);
        if (splitCode !== 0) break;

        const partData = await ffmpeg.readFile(partAudioName);
        if (!partData || !partData.length) break;

        let segDur = NaN;
        try {
          const progTxt = String(await ffmpeg.readFile(partProgress, 'utf8'));
          segDur = parseProgressDuration(progTxt);
        } catch {}

        if (!Number.isFinite(segDur) || segDur <= 0.25) {
          segDur = aTotal ? Math.max(1, (aTotal - aStart) / 2) : 1800;
        }

        const partName = sanitizeFilename(
          `${stem(item.file.name)}_audio_part_${String(aPart).padStart(3, '0')}.m4a`
        );
        const blob = new Blob([partData.buffer], { type: 'audio/mp4' });
        item.addOutput({
          name: partName,
          blob,
          url: URL.createObjectURL(blob),
          isAudio: true,
        });

        await safeDelete(ffmpeg, partAudioName);
        await safeDelete(ffmpeg, partProgress);

        aStart += segDur;
        aPart++;
        if (aTotal && aStart >= aTotal - 0.25) break;
      }

      await safeDelete(ffmpeg, outputAudioName);
      await safeDelete(ffmpeg, progressName);
    }
  }

  async processVideoMode({ ffmpeg, item, inputName, allowedBytes, effectiveMb, maxMb, safeExt }) {
    let start = 0;
    let part = 1;
    const total = Number.isFinite(item.duration) && item.duration > 0 ? item.duration : null;
    const fallbackRatio = item.file.size > 0 ? (effectiveMb * BYTES_PER_MB) / item.file.size : 0.5;
    const expected = Math.max(1, Math.ceil(item.file.size / (effectiveMb * BYTES_PER_MB)));
    const maxSafeLoops = expected + 20;

    while ((!total || start < total - 0.25) && part <= maxSafeLoops) {
      if (this.abortLatch) throw new Error('OPERATION_CANCELLED');

      const outputName = `part_${String(part).padStart(3, '0')}${safeExt}`;
      const progressName = `progress_${part}.txt`;
      let workingMb = effectiveMb;
      let segmentDuration = NaN;
      let data = null;

      item.setStatus(JobStatus.PROCESSING, 'queue.statusText.creatingPart', {
        part,
        total: expected,
      });
      this.onUpdate();

      // Loop to adjust size if keyframe GOP causes output to marginally exceed limit
      while (true) {
        if (this.abortLatch) throw new Error('OPERATION_CANCELLED');

        const args = [
          '-y',
          '-ss', start.toFixed(3),
          '-i', inputName,
          '-map', '0',
          '-c', 'copy',
          '-movflags', '+faststart',
          '-fs', String(Math.floor(workingMb * BYTES_PER_MB)),
          '-avoid_negative_ts', 'make_zero',
          '-progress', progressName,
          outputName,
        ];

        const code = await ffmpeg.exec(args);
        if (this.abortLatch) throw new Error('OPERATION_CANCELLED');
        if (code !== 0) throw new Error(`FFMPEG_EXEC_ERROR_${code}`);

        data = await ffmpeg.readFile(outputName);
        if (!data || data.length === 0) throw new Error('ZERO_OUTPUTS');

        if (data.length <= allowedBytes) break;

        await safeDelete(ffmpeg, outputName);
        await safeDelete(ffmpeg, progressName);

        workingMb--;
        if (workingMb <= 1) {
          throw new Error('SIZE_LIMIT_EXCEEDED');
        }

        item.setStatus(JobStatus.PROCESSING, 'queue.statusText.adjustingPart', { part });
        this.onUpdate();
      }

      try {
        const progTxt = String(await ffmpeg.readFile(progressName, 'utf8'));
        segmentDuration = parseProgressDuration(progTxt);
      } catch {}

      if (!Number.isFinite(segmentDuration) || segmentDuration <= 0.25) {
        if (total) {
          segmentDuration = Math.max(0.5, Math.min(total - start, total * fallbackRatio));
        } else {
          segmentDuration = 10; // Minimum progression to avoid infinite loop
        }
      }

      const blob = new Blob([data.buffer], { type: item.file.type || 'video/mp4' });
      const name = sanitizeFilename(
        `${stem(item.file.name)}_part_${String(part).padStart(3, '0')}${safeExt}`
      );

      item.addOutput({ name, blob, url: URL.createObjectURL(blob), isAudio: false });
      await safeDelete(ffmpeg, outputName);
      await safeDelete(ffmpeg, progressName);

      start += segmentDuration;
      part++;

      const pct = total
        ? Math.min(97, 8 + (start / total) * 89)
        : Math.min(97, 8 + (part / (expected + 1)) * 89);
      item.setProgress(pct, 'queue.statusText.partsCreated', { count: item.outputs.length });
      this.onUpdate();

      if (total && start >= total - 0.25) break;
    }
  }

  classifyError(err) {
    const msg = err?.message || String(err);
    if (/memory|alloc|out of bounds|OOM/i.test(msg)) {
      return 'errors.oom';
    }
    if (/network|fetch|load|import failure/i.test(msg)) {
      return 'errors.network';
    }
    if (/SIZE_LIMIT_EXCEEDED/i.test(msg)) {
      return 'errors.sizeLimitExceeded';
    }
    if (/ZERO_OUTPUTS/i.test(msg)) {
      return 'errors.zeroOutputs';
    }
    if (/no audio|audio stream/i.test(msg)) {
      return 'errors.noAudioTrack';
    }
    return 'errors.generic';
  }
}
