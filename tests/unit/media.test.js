import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDuration,
  escapeHtml,
  ext,
  stem,
  sanitizeFilename,
  isVideo,
  estimateOutput,
  parseProgressDuration,
  PRESETS,
} from '../../src/core/media.js';

describe('Media Utilities', () => {
  describe('formatBytes', () => {
    it('formats bytes, kilobytes, megabytes, and gigabytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
      expect(formatBytes(1024 * 1024 * 50)).toBe('50.0 MB');
      expect(formatBytes(1024 * 1024 * 120)).toBe('120 MB');
      expect(formatBytes(1024 * 1024 * 1024 * 1.5)).toBe('1.5 GB');
    });

    it('handles negative or invalid values gracefully', () => {
      expect(formatBytes(-100)).toBe('—');
      expect(formatBytes(NaN)).toBe('—');
      expect(formatBytes(Infinity)).toBe('—');
    });
  });

  describe('formatDuration', () => {
    it('formats MM:SS and HH:MM:SS accurately', () => {
      expect(formatDuration(45)).toBe('0:45');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(7200)).toBe('2:00:00');
    });

    it('handles invalid or zero duration with fallback text', () => {
      expect(formatDuration(0)).toBe('—');
      expect(formatDuration(NaN, 'Analyzing…')).toBe('Analyzing…');
    });
  });

  describe('escapeHtml', () => {
    it('escapes dangerous HTML characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });
  });

  describe('ext and stem', () => {
    it('extracts lowercased file extensions', () => {
      expect(ext('Lecture.MP4')).toBe('.mp4');
      expect(ext('recording.mkv')).toBe('.mkv');
      expect(ext('sample')).toBe('.mp4');
    });

    it('extracts filename stem without extension', () => {
      expect(stem('Lecture.MP4')).toBe('Lecture');
      expect(stem('my.video.2026.webm')).toBe('my.video.2026');
    });
  });

  describe('sanitizeFilename', () => {
    it('replaces dangerous characters with underscores', () => {
      expect(sanitizeFilename('my:video*sample?.mp4')).toBe('my_video_sample_.mp4');
      expect(sanitizeFilename('file with   spaces.m4a')).toBe('file_with_spaces.m4a');
    });
  });

  describe('isVideo', () => {
    it('identifies supported video files by mime type or extension', () => {
      expect(isVideo({ type: 'video/mp4', name: 'clip.mp4' })).toBe(true);
      expect(isVideo({ type: '', name: 'conference.mkv' })).toBe(true);
      expect(isVideo({ type: '', name: 'meeting.mov' })).toBe(true);
      expect(isVideo({ type: '', name: 'presentation.webm' })).toBe(true);
      expect(isVideo({ type: 'audio/mp3', name: 'song.mp3' })).toBe(false);
      expect(isVideo({ type: 'image/png', name: 'photo.png' })).toBe(false);
    });
  });

  describe('estimateOutput', () => {
    it('estimates parts count for video mode', () => {
      const est = estimateOutput({
        mode: 'video',
        fileSize: 500 * 1024 * 1024, // 500 MB
        duration: 3600,
        maxMb: 190,
      });
      expect(est.isAudio).toBe(false);
      expect(est.parts).toBe(3); // 500 / 189 = 2.64 -> 3 parts
    });

    it('estimates audio output for NotebookLM mode', () => {
      const est = estimateOutput({
        mode: 'audio',
        fileSize: 1024 * 1024 * 1024, // 1 GB video
        duration: 5400, // 1.5 hours = 5400 sec
        maxMb: 190,
      });
      expect(est.isAudio).toBe(true);
      // 5400 * 12 / 1024 ~= 63 MB
      expect(est.estimatedMb).toBeGreaterThanOrEqual(60);
      expect(est.estimatedMb).toBeLessThanOrEqual(70);
      expect(est.parts).toBe(1); // Fits comfortably in 190 MB NotebookLM limit
    });
  });

  describe('parseProgressDuration', () => {
    it('extracts out_time_us from FFmpeg progress log', () => {
      const log = 'frame=120\nfps=60\nout_time_us=54000000\nprogress=continue';
      expect(parseProgressDuration(log)).toBe(54.0);
    });

    it('returns NaN for empty or malformed log', () => {
      expect(parseProgressDuration('')).toBeNaN();
      expect(parseProgressDuration('frame=10\nfps=30')).toBeNaN();
    });
  });

  describe('PRESETS verification', () => {
    it('contains all required official 2026 presets', () => {
      const ids = PRESETS.map(p => p.id);
      expect(ids).toContain('notebooklm');
      expect(ids).toContain('discord');
      expect(ids).toContain('whatsapp16');
      expect(ids).toContain('whatsapp64');
      expect(ids).toContain('email');

      const nlm = PRESETS.find(p => p.id === 'notebooklm');
      expect(nlm.mb).toBe(190); // 10 MB safe buffer below official 200 MB limit
    });
  });
});
