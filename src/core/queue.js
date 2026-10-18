/**
 * Splitly Queue Manager & Job Lifecycle
 * Deterministic state transitions, memory-safe object cleanup, and item tracking.
 */

export const JobStatus = Object.freeze({
  QUEUED: 'queued',
  PREPARING: 'preparing',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLING: 'cancelling',
  CANCELLED: 'cancelled',
});

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class QueueItem {
  constructor(file) {
    this.id = generateId();
    this.file = file;
    this.duration = NaN;
    this.status = JobStatus.QUEUED;
    this.progress = 0;
    this.statusKey = 'queue.statusText.readyVideo';
    this.statusParams = {};
    this.outputs = []; // Array of { name, blob, url, isAudio, duration }
    this.error = null;
    this.createdAt = Date.now();
  }

  setStatus(newStatus, key = null, params = {}) {
    this.status = newStatus;
    if (key) {
      this.statusKey = key;
      this.statusParams = params;
    }
    if (newStatus === JobStatus.COMPLETED) {
      this.progress = 100;
      this.error = null;
    } else if (newStatus === JobStatus.CANCELLED || newStatus === JobStatus.FAILED) {
      this.progress = 0;
    }
  }

  setProgress(percentage, key = null, params = {}) {
    this.progress = Math.max(0, Math.min(100, percentage));
    if (key) {
      this.statusKey = key;
      this.statusParams = params;
    }
  }

  addOutput(output) {
    this.outputs.push(output);
  }

  cleanupOutputs() {
    for (const o of this.outputs) {
      if (o.url) {
        try {
          URL.revokeObjectURL(o.url);
        } catch {}
      }
    }
    this.outputs = [];
  }

  reset() {
    this.cleanupOutputs();
    this.status = JobStatus.QUEUED;
    this.progress = 0;
    this.error = null;
    this.statusKey = 'queue.statusText.readyVideo';
    this.statusParams = {};
  }
}

export class QueueManager {
  constructor() {
    this.items = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.items);
      } catch (err) {
        console.error('Queue notification error:', err);
      }
    }
  }

  addItem(file) {
    // Avoid exact duplicate additions (name + size + lastModified)
    const exists = this.items.some(
      x => x.file.name === file.name && x.file.size === file.size && x.file.lastModified === file.lastModified
    );
    if (exists) return null;

    const item = new QueueItem(file);
    this.items.push(item);
    this.notify();
    return item;
  }

  removeItem(id) {
    const idx = this.items.findIndex(x => x.id === id);
    if (idx >= 0) {
      const [item] = this.items.splice(idx, 1);
      item.cleanupOutputs();
      this.notify();
      return true;
    }
    return false;
  }

  clear() {
    for (const item of this.items) {
      item.cleanupOutputs();
    }
    this.items = [];
    this.notify();
  }

  getItem(id) {
    return this.items.find(x => x.id === id) || null;
  }

  getPendingItems() {
    return this.items.filter(i =>
      [JobStatus.QUEUED, JobStatus.FAILED, JobStatus.CANCELLED].includes(i.status)
    );
  }

  getActiveItems() {
    return this.items.filter(i =>
      [JobStatus.PREPARING, JobStatus.PROCESSING, JobStatus.CANCELLING].includes(i.status)
    );
  }

  getCompletedCount() {
    return this.items.filter(i => i.status === JobStatus.COMPLETED).length;
  }

  getTotalBytes() {
    return this.items.reduce((acc, i) => acc + (i.file ? i.file.size : 0), 0);
  }
}
