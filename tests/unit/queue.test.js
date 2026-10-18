import { describe, it, expect, beforeEach } from 'vitest';
import { QueueManager, QueueItem, JobStatus } from '../../src/core/queue.js';

describe('Queue Manager & Job Lifecycle', () => {
  let queue;

  beforeEach(() => {
    queue = new QueueManager();
  });

  it('initializes items in QUEUED status with proper defaults', () => {
    const file = { name: 'talk.mp4', size: 1000000, lastModified: 12345 };
    const item = queue.addItem(file);

    expect(item).toBeInstanceOf(QueueItem);
    expect(item.status).toBe(JobStatus.QUEUED);
    expect(item.progress).toBe(0);
    expect(item.outputs).toEqual([]);
    expect(item.error).toBeNull();
  });

  it('prevents exact duplicate file additions', () => {
    const file1 = { name: 'talk.mp4', size: 1000000, lastModified: 12345 };
    const file2 = { name: 'talk.mp4', size: 1000000, lastModified: 12345 };
    const item1 = queue.addItem(file1);
    const item2 = queue.addItem(file2);

    expect(item1).not.toBeNull();
    expect(item2).toBeNull();
    expect(queue.items.length).toBe(1);
  });

  it('transitions through status states correctly', () => {
    const file = { name: 'talk.mp4', size: 1000000, lastModified: 12345 };
    const item = queue.addItem(file);

    item.setStatus(JobStatus.PREPARING, 'queue.statusText.preparingEngine');
    expect(item.status).toBe(JobStatus.PREPARING);

    item.setStatus(JobStatus.PROCESSING, 'queue.statusText.loadingFile');
    expect(item.status).toBe(JobStatus.PROCESSING);

    item.setProgress(55);
    expect(item.progress).toBe(55);

    item.setStatus(JobStatus.COMPLETED);
    expect(item.status).toBe(JobStatus.COMPLETED);
    expect(item.progress).toBe(100);
  });

  it('notifies subscribers on queue modifications', () => {
    let callCount = 0;
    queue.subscribe(() => {
      callCount++;
    });

    const file = { name: 'video.mp4', size: 500, lastModified: 10 };
    const item = queue.addItem(file);
    expect(callCount).toBe(1);

    queue.removeItem(item.id);
    expect(callCount).toBe(2);
    expect(queue.items.length).toBe(0);
  });

  it('retrieves pending and active items accurately', () => {
    const f1 = queue.addItem({ name: 'f1.mp4', size: 10, lastModified: 1 });
    const f2 = queue.addItem({ name: 'f2.mp4', size: 20, lastModified: 2 });
    const f3 = queue.addItem({ name: 'f3.mp4', size: 30, lastModified: 3 });

    f1.setStatus(JobStatus.COMPLETED);
    f2.setStatus(JobStatus.PROCESSING);
    // f3 remains QUEUED

    expect(queue.getCompletedCount()).toBe(1);
    expect(queue.getActiveItems()).toEqual([f2]);
    expect(queue.getPendingItems()).toEqual([f3]);
  });
});
