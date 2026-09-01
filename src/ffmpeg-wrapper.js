import { FFmpeg as CDNFFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js';

const CLASS_WORKER_URL = new URL('./ffmpeg-worker.js', import.meta.url).href;

// The CDN package itself is safe to import as an ES module, but the Worker it
// creates must come from the same origin as this page. Inject the local worker
// transparently so the rest of the app can keep using the normal FFmpeg API.
export class FFmpeg extends CDNFFmpeg {
  load(config = {}, options = {}) {
    return super.load({ ...config, classWorkerURL: CLASS_WORKER_URL }, options);
  }
}
