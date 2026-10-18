/**
 * Splitly 2.0 — Main Application Entry Point
 * Orchestrates UI, i18n localization, drag-and-drop, queue management, and WebAssembly execution.
 */

import { t, setLanguage, getLanguage, onLanguageChange, formatNumber } from './i18n/index.js';
import { QueueManager, JobStatus } from './core/queue.js';
import { ProcessingEngine } from './core/processing.js';
import {
  formatBytes,
  formatDuration,
  escapeHtml,
  isVideo,
  PRESETS,
  probeMetadata,
  estimateOutput,
  MAX_BROWSER_FILE_BYTES,
} from './core/media.js';

// SVG Icon Library
const icons = {
  logoMark: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M 18 16 C 18 13 21 11 25 11 L 41 11 C 46 11 48 15 45 19 L 23 45 C 19 45 18 42 18 39 Z" fill="#a6ff4d"/><path d="M 46 48 C 46 51 43 53 39 53 L 23 53 C 18 53 16 49 19 45 L 41 19 C 45 19 46 22 46 25 Z" fill="#ffffff"/><circle cx="32" cy="32" r="3.2" fill="#a6ff4d"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5v2.25A2.25 2.25 0 0 0 7.25 20h9.5A2.25 2.25 0 0 0 19 17.75V15.5"/></svg>`,
  video: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 10.5 19.5 8v8L15 13.5M5 6.5h8A2 2 0 0 1 15 8.5v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"/></svg>`,
  audio: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-3.5 7-10V5l-7-3-7 3v6c0 6.5 7 10 7 10Z"/><path d="m9.5 11.5 1.6 1.6 3.7-3.7"/></svg>`,
  lightning: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>`,
  download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`,
  info: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="M12 10v6m0-9h.01"/></svg>`,
  github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
};

// Completion chime synthesizer (Web Audio API)
function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch {}
}

// Toast notification manager
function toast(message, tone = 'neutral') {
  const container = document.querySelector('#toast-region');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast ${tone}`;
  el.innerHTML = `
    <span class="toast-icon">
      ${tone === 'success' ? icons.check : tone === 'warning' ? icons.info : icons.info}
    </span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 260);
  }, 3800);
}

// Instantiate Queue and Engine
const queue = new QueueManager();

const engine = new ProcessingEngine({
  queue,
  onUpdate: () => render(),
  onToast: ({ type, key, params }) => toast(t(key, params), type),
  onCompleteChime: playCompletionChime,
});

// App Container Shell Template
const app = document.querySelector('#app');
app.innerHTML = `
  <div class="ambient ambient-one"></div>
  <div class="ambient ambient-two"></div>

  <header class="topbar">
    <a class="brand" href="#" aria-label="Splitly">
      <span class="brand-mark">${icons.logoMark}</span>
      <span id="brand-name">Splitly</span>
    </a>
    <div class="topbar-actions">
      <div class="privacy-pill" id="privacy-pill">
        ${icons.shield}<span id="privacy-text">${escapeHtml(t('app.privacyPill'))}</span>
      </div>
      <div class="lang-switcher" role="group" aria-label="Language selector">
        <button type="button" class="lang-btn ${getLanguage() === 'es' ? 'active' : ''}" data-lang="es" aria-pressed="${getLanguage() === 'es'}">ES</button>
        <button type="button" class="lang-btn ${getLanguage() === 'en' ? 'active' : ''}" data-lang="en" aria-pressed="${getLanguage() === 'en'}">EN</button>
      </div>
      <a class="github-link" href="https://github.com/santi-osp/DividirVideosNotebookLM" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
        ${icons.github}
      </a>
    </div>
  </header>

  <main class="shell">
    <section class="hero" aria-labelledby="page-title">
      <div class="eyebrow" id="hero-eyebrow">
        <span class="status-dot"></span>${escapeHtml(t('app.heroEyebrow'))}
      </div>
      <h1 id="page-title">
        <span id="hero-title-1">${escapeHtml(t('app.heroTitle'))}</span><br>
        <span id="hero-title-2">${escapeHtml(t('app.heroTitleHighlight'))}</span>
      </h1>
      <p id="hero-subtitle">${escapeHtml(t('app.heroSubtitle'))}</p>
    </section>

    <section class="workspace" aria-label="Media Workspace">
      <div class="mode-selector-wrap">
        <div class="mode-segmented" role="radiogroup" aria-label="Processing Mode">
          <button type="button" class="mode-button active" data-mode="video" role="radio" aria-checked="true">
            ${icons.video}
            <div>
              <strong id="mode-video-title">${escapeHtml(t('modes.video.title'))}</strong>
              <span id="mode-video-sub">${escapeHtml(t('modes.video.subtitle'))}</span>
            </div>
          </button>
          <button type="button" class="mode-button" data-mode="audio" role="radio" aria-checked="false">
            ${icons.audio}
            <div>
              <strong id="mode-audio-title">${escapeHtml(t('modes.audio.title'))}</strong>
              <span id="mode-audio-sub">${escapeHtml(t('modes.audio.subtitle'))}</span>
            </div>
          </button>
        </div>
        <div class="mode-hint" id="mode-hint">
          ${escapeHtml(t('modes.video.hint'))}
        </div>
      </div>

      <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-describedby="drop-help">
        <input id="file-input" type="file" accept="video/*,.mkv,.mov,.avi,.webm,.m4v" multiple hidden>
        <div class="drop-icon">${icons.upload}</div>
        <div class="drop-copy">
          <strong id="drop-title">${escapeHtml(t('dropzone.title'))}</strong>
          <span id="drop-help">
            ${t('dropzone.help', {
              browse: `<button type="button" class="text-action" id="browse-button">${escapeHtml(t('dropzone.browse'))}</button>`,
            })}
          </span>
        </div>
        <div class="file-hint" id="file-hint">${escapeHtml(t('dropzone.hint'))}</div>
      </div>

      <div class="control-panel">
        <div class="control-group" id="size-control-group">
          <label for="max-size" id="label-max-size">${escapeHtml(t('controls.maxSizeLabel'))}</label>
          <div class="size-control">
            <button class="stepper" id="size-minus" aria-label="${escapeHtml(t('controls.decreaseSize'))}">−</button>
            <div class="size-input-wrap">
              <input id="max-size" inputmode="numeric" type="number" min="10" max="2000" value="190">
              <span id="size-unit">${escapeHtml(t('controls.unit'))}</span>
            </div>
            <button class="stepper" id="size-plus" aria-label="${escapeHtml(t('controls.increaseSize'))}">+</button>
          </div>
          <div class="presets-row" id="presets-row"></div>
          <p id="size-help">${escapeHtml(t('controls.sizeHelp'))}</p>
        </div>

        <div class="divider"></div>

        <div class="control-group">
          <label id="label-concurrency">${escapeHtml(t('controls.processingLabel'))}</label>
          <div class="segmented" role="radiogroup" aria-label="Concurrency selector">
            <button class="segment active" data-concurrency="1" role="radio" aria-checked="true" id="seg-1">
              ${escapeHtml(t('controls.concurrency1'))}
            </button>
            <button class="segment" data-concurrency="2" role="radio" aria-checked="false" id="seg-2">
              ${escapeHtml(t('controls.concurrency2'))}
            </button>
          </div>
          <p id="concurrency-help">${escapeHtml(t('controls.concurrencyHelp'))}</p>
        </div>
      </div>

      <div id="queue-section" class="queue-section is-empty" aria-live="polite">
        <div class="queue-head">
          <div>
            <span class="section-kicker" id="queue-kicker">${escapeHtml(t('queue.kicker'))}</span>
            <h2 id="queue-title">${escapeHtml(t('queue.title'))}</h2>
          </div>
          <button id="clear-button" class="ghost-button">
            ${icons.trash}<span id="clear-text">${escapeHtml(t('queue.clear'))}</span>
          </button>
        </div>
        <div id="queue-list" class="queue-list"></div>
      </div>

      <div class="action-bar" id="action-bar">
        <div class="action-summary" id="action-summary">
          <span class="summary-dot"></span>
          <span id="summary-text">${escapeHtml(t('actions.summaryEmpty'))}</span>
        </div>
        <div class="action-buttons">
          <button id="cancel-button" class="danger-button" style="display:none;">
            ${icons.close}<span id="cancel-text">${escapeHtml(t('actions.cancel'))}</span>
          </button>
          <button id="add-more" class="secondary-button" id="add-more-text">
            ${escapeHtml(t('actions.addMore'))}
          </button>
          <button id="process-button" class="primary-button" disabled>
            ${icons.lightning}<span id="process-text">${escapeHtml(t('actions.process'))}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="trust-grid" aria-label="Trust & Privacy Highlights">
      <article>
        ${icons.shield}
        <div>
          <strong id="trust-priv-title">${escapeHtml(t('trust.private.title'))}</strong>
          <span id="trust-priv-desc">${escapeHtml(t('trust.private.description'))}</span>
        </div>
      </article>
      <article>
        ${icons.lightning}
        <div>
          <strong id="trust-nlm-title">${escapeHtml(t('trust.notebooklm.title'))}</strong>
          <span id="trust-nlm-desc">${escapeHtml(t('trust.notebooklm.description'))}</span>
        </div>
      </article>
      <article>
        ${icons.video}
        <div>
          <strong id="trust-batch-title">${escapeHtml(t('trust.batch.title'))}</strong>
          <span id="trust-batch-desc">${escapeHtml(t('trust.batch.description'))}</span>
        </div>
      </article>
    </section>
  </main>

  <div id="toast-region" class="toast-region" aria-live="assertive"></div>

  <dialog id="preview-dialog" class="preview-dialog">
    <div class="dialog-head">
      <div>
        <span class="section-kicker">${escapeHtml(t('preview.kicker'))}</span>
        <strong id="preview-title"></strong>
      </div>
      <button id="preview-close" class="icon-button" aria-label="${escapeHtml(t('preview.close'))}">
        ${icons.close}
      </button>
    </div>
    <video id="preview-video" controls playsinline></video>
  </dialog>
`;

const els = {
  dropzone: document.querySelector('#dropzone'),
  fileInput: document.querySelector('#file-input'),
  browseButton: document.querySelector('#browse-button'),
  maxSize: document.querySelector('#max-size'),
  sizeMinus: document.querySelector('#size-minus'),
  sizePlus: document.querySelector('#size-plus'),
  presetsRow: document.querySelector('#presets-row'),
  modeHint: document.querySelector('#mode-hint'),
  queueSection: document.querySelector('#queue-section'),
  queueList: document.querySelector('#queue-list'),
  queueTitle: document.querySelector('#queue-title'),
  clearButton: document.querySelector('#clear-button'),
  processButton: document.querySelector('#process-button'),
  cancelButton: document.querySelector('#cancel-button'),
  addMore: document.querySelector('#add-more'),
  actionSummary: document.querySelector('#action-summary'),
  previewDialog: document.querySelector('#preview-dialog'),
  previewVideo: document.querySelector('#preview-video'),
  previewTitle: document.querySelector('#preview-title'),
  previewClose: document.querySelector('#preview-close'),
};

// Render Presets row dynamically
function renderPresets() {
  els.presetsRow.innerHTML = PRESETS.map(
    p => `
    <button type="button" class="preset-chip ${p.mb === engine.maxMb ? 'active' : ''}" data-mb="${p.mb}">
      ${escapeHtml(t(p.labelKey, {}, null) || p.fallback)}
    </button>
  `
  ).join('');
}

// Format status badge for item
function renderStatusBadge(item) {
  const label = t(`queue.status.${item.status}`);
  return `<span class="status-badge">${escapeHtml(label)}</span>`;
}

// Render Single Queue Item
function renderQueueItem(item) {
  const p = Math.max(0, Math.min(100, item.progress || 0));
  const canRemove =
    ![JobStatus.PROCESSING, JobStatus.PREPARING, JobStatus.CANCELLING].includes(item.status) &&
    !engine.isProcessing;
  const isLarge = item.file.size >= 800 * 1024 * 1024;

  const estimate = estimateOutput({
    mode: engine.mode,
    fileSize: item.file.size,
    duration: item.duration,
    maxMb: engine.maxMb,
  });

  const estimateText =
    engine.mode === 'audio'
      ? `🎙️ ~${estimate.estimatedMb} MB (${t('queue.audioTag')})`
      : `🎬 ~${estimate.parts} ${t('queue.statusText.partsCreated', { count: estimate.parts })}`;

  const outputTotal = item.outputs.reduce((acc, o) => acc + (o.blob ? o.blob.size : 0), 0);

  const partsHtml =
    item.status === JobStatus.COMPLETED && item.outputs.length
      ? `
    <div class="parts-list">
      ${item.outputs
        .map(
          (o, idx) => `
        <div class="part-row">
          <div class="part-index">${String(idx + 1).padStart(2, '0')}</div>
          <div class="part-main">
            <strong>${escapeHtml(o.name)}</strong>
            <span>${formatBytes(o.blob.size)} ${o.isAudio ? `· ${escapeHtml(t('queue.audioTag'))}` : ''}</span>
          </div>
          <button class="mini-button" data-action="preview-part" data-id="${item.id}" data-part="${idx}" aria-label="${escapeHtml(t('queue.preview'))}">${icons.play}</button>
          <button class="mini-button download" data-action="download-part" data-id="${item.id}" data-part="${idx}" aria-label="${escapeHtml(t('queue.download'))}">${icons.download}</button>
        </div>
      `
        )
        .join('')}
      <button class="download-all" data-action="download-all" data-id="${item.id}">
        ${icons.download}
        <span>${escapeHtml(t('queue.downloadAll', { count: item.outputs.length }))}</span>
      </button>
    </div>
  `
      : '';

  const statusText = item.error
    ? t(item.error, { maxMb: engine.maxMb })
    : t(item.statusKey, item.statusParams);

  return `
    <article class="queue-item status-${item.status}" data-id="${item.id}">
      <div class="file-icon">${engine.mode === 'audio' ? icons.audio : icons.video}</div>
      <div class="file-content">
        <div class="file-topline">
          <div class="file-title-wrap">
            <strong class="file-title" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong>
            <div class="file-meta">
              <span>${formatBytes(item.file.size)}</span>
              <i></i><span>${formatDuration(item.duration, t('queue.analyzing'))}</span>
              <i></i><span class="estimate-pill">${escapeHtml(estimateText)}</span>
              ${isLarge ? `<i></i><span class="warn-pill" title="${escapeHtml(t('queue.largeFileWarn'))}">⚠️ >800 MB</span>` : ''}
              ${item.status === JobStatus.COMPLETED ? `<i></i><span>${item.outputs.length} · ${formatBytes(outputTotal)}</span>` : ''}
            </div>
          </div>
          <div class="file-actions">
            ${renderStatusBadge(item)}
            <button class="icon-button remove" data-action="remove" data-id="${item.id}" aria-label="${escapeHtml(t('queue.remove'))}" ${canRemove ? '' : 'disabled'}>
              ${icons.close}
            </button>
          </div>
        </div>
        <div class="progress-block ${item.status === JobStatus.QUEUED ? 'hidden' : ''}">
          <div class="progress-track"><span style="width:${p}%"></span></div>
          <div class="progress-copy">
            <span>${escapeHtml(statusText)}</span>
            <strong>${item.status === JobStatus.COMPLETED ? '100%' : `${Math.round(p)}%`}</strong>
          </div>
        </div>
        ${partsHtml}
      </div>
    </article>
  `;
}

// Global UI Render Loop
function render() {
  const count = queue.items.length;
  els.queueSection.classList.toggle('is-empty', count === 0);
  els.queueTitle.textContent = count ? t('queue.titleCount', { count }) : t('queue.title');
  els.queueList.innerHTML = queue.items.map(renderQueueItem).join('');

  const pending = queue.getPendingItems();
  const completed = queue.getCompletedCount();

  els.processButton.disabled = engine.isProcessing || pending.length === 0;
  els.clearButton.disabled = engine.isProcessing || count === 0;
  els.addMore.disabled = engine.isProcessing;
  [els.maxSize, els.sizeMinus, els.sizePlus].forEach(e => (e.disabled = engine.isProcessing));
  document.querySelectorAll('.segment, .mode-button, .preset-chip').forEach(b => (b.disabled = engine.isProcessing));

  if (engine.isProcessing) {
    els.cancelButton.style.display = 'inline-flex';
  } else {
    els.cancelButton.style.display = 'none';
  }

  // Action summary text
  if (!count) {
    els.actionSummary.innerHTML = `<span class="summary-dot"></span><span>${escapeHtml(t('actions.summaryEmpty'))}</span>`;
  } else if (engine.isProcessing) {
    const active = queue.getActiveItems().length;
    els.actionSummary.innerHTML = `
      <span class="summary-dot active"></span>
      <span>${escapeHtml(t('actions.summaryProcessing', { active: active || 1 }))}</span>
    `;
  } else if (completed === count) {
    els.actionSummary.innerHTML = `
      <span class="summary-dot done"></span>
      <span>${escapeHtml(t('actions.summaryCompleted', { count: completed }))}</span>
    `;
  } else {
    const totalBytes = queue.getTotalBytes();
    els.actionSummary.innerHTML = `
      <span class="summary-dot ready"></span>
      <span>${escapeHtml(t('actions.summaryReady', { count, size: formatBytes(totalBytes) }))}</span>
    `;
  }

  // Primary action button state
  const actionText = engine.mode === 'audio' ? t('actions.processAudio') : t('actions.process');
  els.processButton.innerHTML = engine.isProcessing
    ? `<span class="spinner"></span><span>${escapeHtml(t('actions.processingBtn'))}</span>`
    : `${icons.lightning}<span>${completed && pending.length ? escapeHtml(t('actions.processRemaining', { count: pending.length })) : escapeHtml(actionText)}</span>`;

  renderPresets();
}

// Ingest files into queue
async function addFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const rejected = files.filter(f => !isVideo(f));
  const tooLarge = files.filter(f => f.size >= MAX_BROWSER_FILE_BYTES);
  const valid = files.filter(f => isVideo(f) && f.size < MAX_BROWSER_FILE_BYTES);

  if (rejected.length) {
    toast(t('toasts.rejectedFiles', { count: rejected.length }), 'warning');
  }
  if (tooLarge.length) {
    toast(t('toasts.tooLarge', { count: tooLarge.length }), 'warning');
  }

  for (const file of valid) {
    const item = queue.addItem(file);
    if (!item) continue;
    item.setStatus(
      JobStatus.QUEUED,
      engine.mode === 'audio' ? 'queue.statusText.readyAudio' : 'queue.statusText.readyVideo'
    );
    render();

    // Probe duration asynchronously
    probeMetadata(file).then(dur => {
      item.duration = dur;
      render();
    });
  }

  els.fileInput.value = '';
}

// Mode Selection
function setMode(newMode) {
  if (engine.isProcessing) return;
  engine.setMode(newMode);
  document.querySelectorAll('.mode-button').forEach(btn => {
    const active = btn.dataset.mode === newMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
  });

  if (newMode === 'audio') {
    els.modeHint.classList.add('highlight');
    els.modeHint.innerHTML = `<strong>💡 ${escapeHtml(t('modes.audio.title'))}:</strong> ${escapeHtml(t('modes.audio.hint'))}`;
  } else {
    els.modeHint.classList.remove('highlight');
    els.modeHint.innerHTML = `<strong>🎬 ${escapeHtml(t('modes.video.title'))}:</strong> ${escapeHtml(t('modes.video.hint'))}`;
  }

  // Update default status text for queued items
  for (const item of queue.items) {
    if (item.status === JobStatus.QUEUED) {
      item.statusKey = newMode === 'audio' ? 'queue.statusText.readyAudio' : 'queue.statusText.readyVideo';
    }
  }

  render();
}

// Size Controls & Presets
function clampMaxSize() {
  const v = Math.round(Number(els.maxSize.value) || 190);
  const clamped = Math.min(2000, Math.max(10, v));
  els.maxSize.value = String(clamped);
  engine.setMaxMb(clamped);
  renderPresets();
  return clamped;
}

// Download Helper
function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

// Download All with safe pacing
async function downloadAll(item) {
  toast(t('toasts.downloadStarted', { count: item.outputs.length }));
  for (const o of item.outputs) {
    downloadBlob(o.blob, o.name);
    await new Promise(r => setTimeout(r, 450));
  }
}

// Preview Modal Handlers
function openPreview(item, partIndex) {
  const output = item.outputs[partIndex];
  if (!output) return;
  els.previewTitle.textContent = output.name;
  els.previewVideo.src = output.url;
  els.previewDialog.showModal();
}

function closePreview() {
  els.previewVideo.pause();
  els.previewVideo.removeAttribute('src');
  els.previewVideo.load();
  els.previewDialog.close();
}

// Event Listeners
els.browseButton?.addEventListener('click', e => {
  e.stopPropagation();
  els.fileInput.click();
});
document.querySelector('#drop-help')?.addEventListener('click', e => {
  if (e.target && e.target.id === 'browse-button') {
    e.stopPropagation();
    els.fileInput.click();
  }
});

els.addMore.addEventListener('click', () => els.fileInput.click());

els.dropzone.addEventListener('click', e => {
  if (!e.target.closest('button')) els.fileInput.click();
});

els.dropzone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    els.fileInput.click();
  }
});

els.fileInput.addEventListener('change', () => addFiles(els.fileInput.files));

['dragenter', 'dragover'].forEach(name => {
  els.dropzone.addEventListener(name, e => {
    e.preventDefault();
    els.dropzone.classList.add('dragging');
  });
});

['dragleave', 'drop'].forEach(name => {
  els.dropzone.addEventListener(name, e => {
    e.preventDefault();
    els.dropzone.classList.remove('dragging');
  });
});

els.dropzone.addEventListener('drop', e => {
  addFiles(e.dataTransfer.files);
});

// Mode buttons
document.querySelectorAll('.mode-button').forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// Size steppers
els.sizeMinus.addEventListener('click', () => {
  els.maxSize.value = String(Math.max(10, clampMaxSize() - 10));
  clampMaxSize();
  render();
});

els.sizePlus.addEventListener('click', () => {
  els.maxSize.value = String(Math.min(2000, clampMaxSize() + 10));
  clampMaxSize();
  render();
});

els.maxSize.addEventListener('change', () => {
  clampMaxSize();
  render();
});

els.maxSize.addEventListener('blur', () => {
  clampMaxSize();
  render();
});

// Presets click
els.presetsRow.addEventListener('click', e => {
  const chip = e.target.closest('.preset-chip');
  if (!chip || engine.isProcessing) return;
  const mb = Number(chip.dataset.mb);
  if (!mb) return;
  els.maxSize.value = String(mb);
  clampMaxSize();
  render();
});

// Concurrency selection
document.querySelectorAll('.segment').forEach(btn => {
  btn.addEventListener('click', () => {
    if (engine.isProcessing) return;
    const val = Number(btn.dataset.concurrency);
    engine.setConcurrency(val);
    document.querySelectorAll('.segment').forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-checked', String(active));
    });
  });
});

// Queue List Actions (remove, preview, download)
els.queueList.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const item = queue.getItem(btn.dataset.id);
  if (!item) return;

  const part = Number(btn.dataset.part);
  const action = btn.dataset.action;

  if (action === 'remove') queue.removeItem(item.id);
  if (action === 'download-part') downloadBlob(item.outputs[part].blob, item.outputs[part].name);
  if (action === 'download-all') downloadAll(item);
  if (action === 'preview-part') openPreview(item, part);
});

els.clearButton.addEventListener('click', () => {
  if (engine.isProcessing) return;
  queue.clear();
});

els.processButton.addEventListener('click', () => engine.start());
els.cancelButton.addEventListener('click', () => engine.cancel());

els.previewClose.addEventListener('click', closePreview);
els.previewDialog.addEventListener('click', e => {
  if (e.target === els.previewDialog) closePreview();
});

// Language Switcher Handlers
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    setLanguage(lang);
  });
});

// Reactively update UI when language switches without breaking execution
onLanguageChange(lang => {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  // Re-translate static shell elements
  document.querySelector('#privacy-text').textContent = t('app.privacyPill');
  document.querySelector('#hero-eyebrow').innerHTML = `<span class="status-dot"></span>${escapeHtml(t('app.heroEyebrow'))}`;
  document.querySelector('#hero-title-1').textContent = t('app.heroTitle');
  document.querySelector('#hero-title-2').textContent = t('app.heroTitleHighlight');
  document.querySelector('#hero-subtitle').textContent = t('app.heroSubtitle');

  document.querySelector('#mode-video-title').textContent = t('modes.video.title');
  document.querySelector('#mode-video-sub').textContent = t('modes.video.subtitle');
  document.querySelector('#mode-audio-title').textContent = t('modes.audio.title');
  document.querySelector('#mode-audio-sub').textContent = t('modes.audio.subtitle');

  if (engine.mode === 'audio') {
    els.modeHint.innerHTML = `<strong>💡 ${escapeHtml(t('modes.audio.title'))}:</strong> ${escapeHtml(t('modes.audio.hint'))}`;
  } else {
    els.modeHint.innerHTML = `<strong>🎬 ${escapeHtml(t('modes.video.title'))}:</strong> ${escapeHtml(t('modes.video.hint'))}`;
  }

  document.querySelector('#drop-title').textContent = t('dropzone.title');
  document.querySelector('#drop-help').innerHTML = t('dropzone.help', {
    browse: `<button type="button" class="text-action" id="browse-button">${escapeHtml(t('dropzone.browse'))}</button>`,
  });
  document.querySelector('#file-hint').textContent = t('dropzone.hint');

  document.querySelector('#label-max-size').textContent = t('controls.maxSizeLabel');
  document.querySelector('#size-unit').textContent = t('controls.unit');
  document.querySelector('#size-help').textContent = t('controls.sizeHelp');
  document.querySelector('#label-concurrency').textContent = t('controls.processingLabel');
  document.querySelector('#seg-1').textContent = t('controls.concurrency1');
  document.querySelector('#seg-2').textContent = t('controls.concurrency2');
  document.querySelector('#concurrency-help').textContent = t('controls.concurrencyHelp');

  document.querySelector('#queue-kicker').textContent = t('queue.kicker');
  document.querySelector('#clear-text').textContent = t('queue.clear');
  document.querySelector('#cancel-text').textContent = t('actions.cancel');
  document.querySelector('#add-more').textContent = t('actions.addMore');

  document.querySelector('#trust-priv-title').textContent = t('trust.private.title');
  document.querySelector('#trust-priv-desc').textContent = t('trust.private.description');
  document.querySelector('#trust-nlm-title').textContent = t('trust.notebooklm.title');
  document.querySelector('#trust-nlm-desc').textContent = t('trust.notebooklm.description');
  document.querySelector('#trust-batch-title').textContent = t('trust.batch.title');
  document.querySelector('#trust-batch-desc').textContent = t('trust.batch.description');

  render();
});

// Protect user from accidentally closing tab while processing
window.addEventListener('beforeunload', e => {
  if (engine.isProcessing) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Initial render
render();
