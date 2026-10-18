/**
 * Splitly Media Utilities & Specifications
 * File format inspection, size formatting, presets, duration probing, and progress parsing.
 */

export const BYTES_PER_MB = 1024 * 1024;
export const MAX_BROWSER_FILE_BYTES = 2 * 1024 * 1024 * 1024; // ~2 GB WebAssembly virtual FS limit

/**
 * Official & Verified Limits (as of 2026):
 * - NotebookLM: 200 MB per file limit. Preset: 190 MB (10 MB buffer for container & faststart overhead)
 * - Discord: 25 MB standard file upload limit for free tier
 * - WhatsApp: 16 MB standard media limit, 64 MB document attachment limit
 * - Email: 25 MB standard SMTP attachment limit (Gmail, Outlook)
 */
export const PRESETS = Object.freeze([
  { id: 'notebooklm', labelKey: 'controls.presets.notebooklm', mb: 190, fallback: 'NotebookLM (190 MB)' },
  { id: 'discord', labelKey: 'controls.presets.discord', mb: 25, fallback: 'Discord (25 MB)' },
  { id: 'whatsapp16', labelKey: 'controls.presets.whatsapp16', mb: 16, fallback: 'WhatsApp (16 MB)' },
  { id: 'whatsapp64', labelKey: 'controls.presets.whatsapp64', mb: 64, fallback: 'WhatsApp Doc (64 MB)' },
  { id: 'email', labelKey: 'controls.presets.email', mb: 25, fallback: 'Email (25 MB)' },
]);

export const AUDIO_PROFILES = Object.freeze({
  VOICE: { id: 'voice', bitrate: '96k', label: 'Speech & NotebookLM (96 kbps AAC)' },
  HIGH: { id: 'high', bitrate: '160k', label: 'High Quality (160 kbps AAC)' },
});

export const SUPPORTED_VIDEO_EXTENSIONS = Object.freeze([
  '.mp4', '.mov', '.mkv', '.webm', '.avi', '.m4v', '.mpeg', '.mpg', '.ts', '.wmv', '.flv'
]);

/**
 * Checks if a file is an acceptable video format
 */
export function isVideo(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith('video/')) return true;
  const lowerName = (file.name || '').toLowerCase();
  return SUPPORTED_VIDEO_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

/**
 * Formats byte values into human-readable B, KB, MB, GB
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let val = bytes;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val >= 100 || idx === 0 ? val.toFixed(0) : val.toFixed(1)} ${units[idx]}`;
}

/**
 * Formats duration in seconds into MM:SS or HH:MM:SS
 */
export function formatDuration(seconds, fallbackText = '—') {
  if (!Number.isFinite(seconds) || seconds <= 0) return fallbackText;
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Escapes HTML entities to prevent XSS
 */
export function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;',
  }[c]));
}

/**
 * Returns lowercase extension with leading dot (e.g. '.mp4')
 */
export function ext(name) {
  const m = String(name || '').match(/\.([^.]+)$/);
  return m ? `.${m[1].toLowerCase()}` : '.mp4';
}

/**
 * Returns filename without extension
 */
export function stem(name) {
  return String(name || '').replace(/\.[^.]+$/, '');
}

/**
 * Sanitizes output filenames to avoid shell, OS or URI issues
 */
export function sanitizeFilename(name) {
  return String(name || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * Estimates output part count and size
 */
export function estimateOutput({ mode, fileSize, duration, maxMb }) {
  if (mode === 'audio') {
    if (Number.isFinite(duration) && duration > 0) {
      // 96 kbps AAC = ~12 KB/sec -> duration * 12 / 1024 MB
      const estMb = Math.max(1, Math.round((duration * 12) / 1024));
      return {
        estimatedMb: estMb,
        parts: Math.max(1, Math.ceil(estMb / maxMb)),
        isAudio: true,
      };
    }
    // Fallback if duration unknown: ~8% of video size
    const estMb = Math.max(1, Math.round((fileSize * 0.08) / BYTES_PER_MB));
    return {
      estimatedMb: estMb,
      parts: Math.max(1, Math.ceil(estMb / maxMb)),
      isAudio: true,
    };
  }

  const effectiveMb = Math.max(1, maxMb - 1);
  const parts = Math.max(1, Math.ceil(fileSize / (effectiveMb * BYTES_PER_MB)));
  return {
    estimatedMb: maxMb,
    parts,
    isAudio: false,
  };
}

/**
 * Probes video duration using HTML5 <video> element with a safe timeout
 */
export async function probeMetadata(file, timeoutMs = 4000) {
  return new Promise(resolve => {
    let resolved = false;
    let timer = null;
    let url = null;
    const video = document.createElement('video');

    const finish = duration => {
      if (resolved) return;
      resolved = true;
      if (timer) clearTimeout(timer);
      if (url) URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
      resolve(Number.isFinite(duration) && duration > 0 ? duration : NaN);
    };

    timer = setTimeout(() => finish(NaN), timeoutMs);

    try {
      url = URL.createObjectURL(file);
      video.preload = 'metadata';
      video.onloadedmetadata = () => finish(video.duration);
      video.onerror = () => finish(NaN);
      video.src = url;
    } catch {
      finish(NaN);
    }
  });
}

/**
 * Parses FFmpeg progress duration in microseconds
 */
export function parseProgressDuration(text) {
  if (!text) return NaN;
  const matches = [...String(text).matchAll(/out_time_us=(\d+)/g)];
  return matches.length ? Number(matches.at(-1)[1]) / 1000000 : NaN;
}
