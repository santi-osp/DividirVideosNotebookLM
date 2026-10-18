import { FFmpeg as CDNFFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js';

const CLASS_WORKER_URL = new URL('./worker.js', import.meta.url).href;

// Same-origin wrapper ensures the Web Worker is instantiated from the current origin (e.g. GitHub Pages)
// while allowing the rest of the app to interact with the standard FFmpeg 0.12.x API.
export class FFmpeg extends CDNFFmpeg {
  load(config = {}, options = {}) {
    return super.load({ ...config, classWorkerURL: CLASS_WORKER_URL }, options);
  }
}
