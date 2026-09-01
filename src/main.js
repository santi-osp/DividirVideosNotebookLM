
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const MB = 1024 * 1024;
const MAX_BROWSER_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const CORE_BASE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
const CLASS_WORKER_URL = new URL('./ffmpeg-worker.js', import.meta.url).href;
let ffmpegAssetsPromise = null;

const state = {
  items: [],
  maxMb: 190,
  concurrency: 1,
  processing: false,
  abortRequested: false,
  activeRunners: new Set(),
};

const icons = {
  upload: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5v2.25A2.25 2.25 0 0 0 7.25 20h9.5A2.25 2.25 0 0 0 19 17.75V15.5"/></svg>`,
  video: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 10.5 19.5 8v8L15 13.5M5 6.5h8A2 2 0 0 1 15 8.5v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-3.5 7-10V5l-7-3-7 3v6c0 6.5 7 10 7 10Z"/><path d="m9.5 11.5 1.6 1.6 3.7-3.7"/></svg>`,
  lightning: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>`,
  download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>`,
  info: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/><path d="M12 10v6m0-9h.01"/></svg>`,
};

const app = document.querySelector('#app');
app.innerHTML = `
  <div class="ambient ambient-one"></div><div class="ambient ambient-two"></div>
  <header class="topbar">
    <a class="brand" href="#" aria-label="Splitly, inicio"><span class="brand-mark">S</span><span>Splitly</span></a>
    <div class="privacy-pill">${icons.shield}<span>Procesamiento local</span></div>
  </header>
  <main class="shell">
    <section class="hero" aria-labelledby="page-title">
      <div class="eyebrow"><span class="status-dot"></span>Privado · rápido · sin subir archivos</div>
      <h1 id="page-title">Divide videos grandes<br><span>sin complicarte.</span></h1>
      <p>Elige uno o varios videos, define el peso máximo de cada parte y deja que tu navegador haga el resto.</p>
    </section>

    <section class="workspace" aria-label="Divisor de videos">
      <div class="dropzone" id="dropzone" tabindex="0" role="button" aria-describedby="drop-help">
        <input id="file-input" type="file" accept="video/*,.mkv,.mov,.avi,.webm,.m4v" multiple hidden>
        <div class="drop-icon">${icons.upload}</div>
        <div class="drop-copy"><strong>Suelta tus videos aquí</strong>
          <span id="drop-help">o <button type="button" class="text-action" id="browse-button">selecciona archivos</button> desde tu equipo</span>
        </div>
        <div class="file-hint">MP4, MOV, MKV, WebM y más · hasta ~2 GB por archivo</div>
      </div>

      <div class="control-panel">
        <div class="control-group">
          <label for="max-size">Tamaño máximo por parte</label>
          <div class="size-control">
            <button class="stepper" id="size-minus" aria-label="Disminuir tamaño">−</button>
            <div class="size-input-wrap"><input id="max-size" inputmode="numeric" type="number" min="10" max="2000" value="190"><span>MB</span></div>
            <button class="stepper" id="size-plus" aria-label="Aumentar tamaño">+</button>
          </div>
          <p>Reservamos 1 MB de margen para que las partes no excedan tu límite.</p>
        </div>
        <div class="divider"></div>
        <div class="control-group">
          <label>Procesamiento</label>
          <div class="segmented" role="radiogroup" aria-label="Modo de procesamiento">
            <button class="segment active" data-concurrency="1" role="radio" aria-checked="true">1 a la vez</button>
            <button class="segment" data-concurrency="2" role="radio" aria-checked="false">2 en paralelo</button>
          </div>
          <p>Dos en paralelo usa más memoria. Recomendado con 8 GB de RAM o más.</p>
        </div>
      </div>

      <div id="queue-section" class="queue-section is-empty" aria-live="polite">
        <div class="queue-head"><div><span class="section-kicker">Cola</span><h2 id="queue-title">Tus videos</h2></div>
          <button id="clear-button" class="ghost-button">${icons.trash}<span>Limpiar</span></button></div>
        <div id="queue-list" class="queue-list"></div>
      </div>

      <div class="action-bar" id="action-bar">
        <div class="action-summary" id="action-summary"><span class="summary-dot"></span><span>Agrega uno o varios videos para comenzar</span></div>
        <div class="action-buttons">
          <button id="add-more" class="secondary-button">Añadir más</button>
          <button id="process-button" class="primary-button" disabled>${icons.lightning}<span>Dividir videos</span></button>
        </div>
      </div>
    </section>

    <section class="trust-grid" aria-label="Ventajas">
      <article>${icons.shield}<div><strong>Tus archivos no salen de tu equipo</strong><span>Todo se procesa localmente en el navegador.</span></div></article>
      <article>${icons.lightning}<div><strong>Sin recodificar cuando es posible</strong><span>División rápida conservando calidad y streams originales.</span></div></article>
      <article>${icons.video}<div><strong>Uno o varios videos</strong><span>Procesa un archivo puntual o una cola completa.</span></div></article>
    </section>
  </main>

  <div id="toast-region" class="toast-region" aria-live="assertive"></div>
  <dialog id="preview-dialog" class="preview-dialog">
    <div class="dialog-head"><div><span class="section-kicker">Vista previa</span><strong id="preview-title">Video</strong></div>
      <button id="preview-close" class="icon-button" aria-label="Cerrar">${icons.close}</button></div>
    <video id="preview-video" controls playsinline></video>
  </dialog>`;

const els = {
  dropzone: document.querySelector('#dropzone'),
  fileInput: document.querySelector('#file-input'),
  browseButton: document.querySelector('#browse-button'),
  maxSize: document.querySelector('#max-size'),
  sizeMinus: document.querySelector('#size-minus'),
  sizePlus: document.querySelector('#size-plus'),
  queueSection: document.querySelector('#queue-section'),
  queueList: document.querySelector('#queue-list'),
  queueTitle: document.querySelector('#queue-title'),
  clearButton: document.querySelector('#clear-button'),
  processButton: document.querySelector('#process-button'),
  addMore: document.querySelector('#add-more'),
  actionSummary: document.querySelector('#action-summary'),
  toastRegion: document.querySelector('#toast-region'),
  previewDialog: document.querySelector('#preview-dialog'),
  previewVideo: document.querySelector('#preview-video'),
  previewTitle: document.querySelector('#preview-title'),
  previewClose: document.querySelector('#preview-close'),
};

const id = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return '—';
  const units = ['B','KB','MB','GB']; let value = bytes; let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i++; }
  return `${value >= 100 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Analizando…';
  const total = Math.round(seconds), h = Math.floor(total/3600), m = Math.floor((total%3600)/60), s = total%60;
  return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
}
function escapeHtml(v) { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function ext(name) { const m=name.match(/\.([^.]+)$/); return m ? `.${m[1].toLowerCase()}` : '.mp4'; }
function stem(name) { return name.replace(/\.[^.]+$/,''); }
function isVideo(file) { return file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v|mpeg|mpg|ts)$/i.test(file.name); }

function toast(message, tone='neutral') {
  const el=document.createElement('div'); el.className=`toast ${tone}`;
  el.innerHTML=`<span class="toast-icon">${tone==='success'?icons.check:icons.info}</span><span>${escapeHtml(message)}</span>`;
  els.toastRegion.appendChild(el); requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{el.classList.remove('show'); setTimeout(()=>el.remove(),260)},3800);
}

async function metadata(file) {
  return new Promise(resolve => {
    const video=document.createElement('video'), url=URL.createObjectURL(file);
    const done=d=>{URL.revokeObjectURL(url); video.removeAttribute('src'); video.load(); resolve(d)};
    video.preload='metadata'; video.onloadedmetadata=()=>done(video.duration); video.onerror=()=>done(NaN); video.src=url;
  });
}

async function addFiles(fileList) {
  const files=Array.from(fileList); if(!files.length) return;
  const rejected=files.filter(f=>!isVideo(f)), tooLarge=files.filter(f=>f.size>=MAX_BROWSER_FILE_BYTES);
  const valid=files.filter(f=>isVideo(f)&&f.size<MAX_BROWSER_FILE_BYTES);
  if(rejected.length) toast(`${rejected.length} archivo(s) no parecen ser video y se omitieron.`,'warning');
  if(tooLarge.length) toast(`${tooLarge.length} archivo(s) superan el límite práctico de ~2 GB.`,'warning');
  for (const file of valid) {
    if(state.items.some(x=>x.file.name===file.name&&x.file.size===file.size&&x.file.lastModified===file.lastModified)) continue;
    const item={id:id(),file,duration:NaN,status:'ready',progress:0,statusText:'Listo para dividir',outputs:[],error:null};
    state.items.push(item); render(); item.duration=await metadata(file); render();
  }
  els.fileInput.value='';
}

function statusLabel(item) {
  return ({ready:'Listo',loading:'Preparando motor',processing:'Dividiendo',done:'Completado',error:'Error',cancelled:'Cancelado'})[item.status]||item.status;
}

function itemTemplate(item) {
  const outputTotal=item.outputs.reduce((s,o)=>s+o.blob.size,0), p=Math.max(0,Math.min(100,item.progress||0));
  const canRemove=!['processing','loading'].includes(item.status)&&!state.processing;
  const parts=item.status==='done'&&item.outputs.length ? `
    <div class="parts-list">${item.outputs.map((o,i)=>`
      <div class="part-row"><div class="part-index">${String(i+1).padStart(2,'0')}</div>
        <div class="part-main"><strong>${escapeHtml(o.name)}</strong><span>${formatBytes(o.blob.size)}</span></div>
        <button class="mini-button" data-action="preview-part" data-id="${item.id}" data-part="${i}" aria-label="Ver parte">${icons.play}</button>
        <button class="mini-button download" data-action="download-part" data-id="${item.id}" data-part="${i}" aria-label="Descargar parte">${icons.download}</button></div>`).join('')}
      <button class="download-all" data-action="download-all" data-id="${item.id}">${icons.download}<span>Descargar ${item.outputs.length===1?'parte':`las ${item.outputs.length} partes`}</span></button>
    </div>` : '';
  return `<article class="queue-item status-${item.status}" data-id="${item.id}">
    <div class="file-icon">${icons.video}</div><div class="file-content">
      <div class="file-topline"><div class="file-title-wrap"><strong class="file-title" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</strong>
        <div class="file-meta"><span>${formatBytes(item.file.size)}</span><i></i><span>${formatDuration(item.duration)}</span>${item.status==='done'?`<i></i><span>${item.outputs.length} ${item.outputs.length===1?'parte':'partes'} · ${formatBytes(outputTotal)}</span>`:''}</div></div>
        <div class="file-actions"><span class="status-badge">${statusLabel(item)}</span><button class="icon-button remove" data-action="remove" data-id="${item.id}" aria-label="Quitar video" ${canRemove?'':'disabled'}>${icons.close}</button></div></div>
      <div class="progress-block ${item.status==='ready'?'hidden':''}"><div class="progress-track"><span style="width:${p}%"></span></div>
        <div class="progress-copy"><span>${escapeHtml(item.error||item.statusText)}</span><strong>${item.status==='done'?'100%':`${Math.round(p)}%`}</strong></div></div>${parts}</div></article>`;
}

function render() {
  const count=state.items.length;
  els.queueSection.classList.toggle('is-empty',count===0); els.queueTitle.textContent=count?`${count} ${count===1?'video':'videos'}`:'Tus videos';
  els.queueList.innerHTML=state.items.map(itemTemplate).join('');
  const unfinished=state.items.filter(i=>['ready','error','cancelled'].includes(i.status)), done=state.items.filter(i=>i.status==='done').length;
  els.processButton.disabled=state.processing||unfinished.length===0; els.clearButton.disabled=state.processing||count===0; els.addMore.disabled=state.processing;
  [els.maxSize,els.sizeMinus,els.sizePlus].forEach(e=>e.disabled=state.processing); document.querySelectorAll('.segment').forEach(b=>b.disabled=state.processing);
  if(!count) els.actionSummary.innerHTML='<span class="summary-dot"></span><span>Agrega uno o varios videos para comenzar</span>';
  else if(state.processing) { const a=state.items.filter(i=>['loading','processing'].includes(i.status)).length; els.actionSummary.innerHTML=`<span class="summary-dot active"></span><span>Procesando ${a||1} ${a===1?'video':'videos'} · mantén esta pestaña abierta</span>`; }
  else if(done===count) els.actionSummary.innerHTML=`<span class="summary-dot done"></span><span>Todo listo · ${done} ${done===1?'video procesado':'videos procesados'}</span>`;
  else { const total=state.items.reduce((s,i)=>s+i.file.size,0); els.actionSummary.innerHTML=`<span class="summary-dot ready"></span><span>${count} ${count===1?'video':'videos'} · ${formatBytes(total)} en total</span>`; }
  els.processButton.innerHTML=state.processing?'<span class="spinner"></span><span>Procesando…</span>':`${icons.lightning}<span>${done&&unfinished.length?'Procesar pendientes':'Dividir videos'}</span>`;
}

let renderTimer=null;
function renderThrottled(){ if(renderTimer)return; renderTimer=setTimeout(()=>{renderTimer=null;render()},140); }

async function getFFmpegAssets() {
  if (!ffmpegAssetsPromise) {
    ffmpegAssetsPromise = Promise.all([
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`,'text/javascript'),
      toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`,'application/wasm')
    ]).catch(error => {
      ffmpegAssetsPromise = null;
      throw error;
    });
  }
  return ffmpegAssetsPromise;
}

async function createFFmpeg(item) {
  item.status='loading'; item.statusText='Cargando motor de video…'; item.progress=2; render();
  const ffmpeg=new FFmpeg(); state.activeRunners.add(ffmpeg);
  ffmpeg.on('log',({message})=>{
    if(item.status!=='processing')return;
    const m=message.match(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if(m&&Number.isFinite(item.duration)&&item.duration>0){ const s=Number(m[1])*3600+Number(m[2])*60+Number(m[3]); item.progress=Math.max(item.progress,Math.min(96,8+(s/item.duration)*88)); renderThrottled(); }
  });
  const [coreURL,wasmURL]=await getFFmpegAssets();
  await ffmpeg.load({coreURL,wasmURL,classWorkerURL:CLASS_WORKER_URL});
  return ffmpeg;
}

function parseProgressDuration(text) {
  const matches=[...text.matchAll(/out_time_us=(\d+)/g)];
  return matches.length ? Number(matches.at(-1)[1])/1_000_000 : NaN;
}
async function safeDelete(ffmpeg,path){try{await ffmpeg.deleteFile(path)}catch{}}

async function processItem(item) {
  let ffmpeg; const maxMb=state.maxMb, effectiveMb=Math.max(1,maxMb-1), allowedBytes=maxMb*MB;
  const inputExt=ext(item.file.name), safeExt=/^\.[a-z0-9]{1,5}$/i.test(inputExt)?inputExt:'.mp4', inputName=`input_${item.id.replaceAll('-','')}${safeExt}`;
  try {
    item.outputs.forEach(o=>URL.revokeObjectURL(o.url)); item.outputs=[]; item.error=null; ffmpeg=await createFFmpeg(item);
    item.status='processing'; item.statusText='Copiando video al motor local…'; item.progress=6; render();
    await ffmpeg.writeFile(inputName,await fetchFile(item.file));
    let start=0, part=1; const total=Number.isFinite(item.duration)&&item.duration>0?item.duration:null;
    const fallbackRatio=item.file.size>0?(effectiveMb*MB)/item.file.size:.5, expected=Math.max(1,Math.ceil(item.file.size/(effectiveMb*MB)));
    while((!total||start<total-.25)&&part<=Math.max(2,expected+8)) {
      const outputName=`parte_${String(part).padStart(3,'0')}${safeExt}`, progressName=`progress_${part}.txt`; let workingMb=effectiveMb, segmentDuration=NaN, data;
      item.statusText=`Creando parte ${part}…`; render();
      while(true){
        const args=['-y','-ss',start.toFixed(3),'-i',inputName,'-map','0','-c','copy','-fs',String(Math.floor(workingMb*MB)),'-avoid_negative_ts','make_zero','-progress',progressName,outputName];
        const code=await ffmpeg.exec(args); if(code!==0)throw new Error(`FFmpeg terminó con código ${code}.`);
        data=await ffmpeg.readFile(outputName); if(!data||data.length===0)throw new Error('No se pudo generar una parte válida.');
        if(data.length<=allowedBytes)break;
        await safeDelete(ffmpeg,outputName); await safeDelete(ffmpeg,progressName); workingMb--;
        if(workingMb<=1)throw new Error(`No fue posible mantener una parte por debajo de ${maxMb} MB.`);
        item.statusText=`Ajustando parte ${part} al límite…`; render();
      }
      try{segmentDuration=parseProgressDuration(String(await ffmpeg.readFile(progressName,'utf8')))}catch{}
      if(!Number.isFinite(segmentDuration)||segmentDuration<=.25){
        if(total)segmentDuration=Math.max(.5,Math.min(total-start,total*fallbackRatio)); else throw new Error('No se pudo calcular la duración de la parte generada.');
      }
      const blob=new Blob([data.buffer],{type:item.file.type||'video/mp4'}), name=`${stem(item.file.name)}_parte_${String(part).padStart(3,'0')}${safeExt}`;
      item.outputs.push({name,blob,url:URL.createObjectURL(blob)}); await safeDelete(ffmpeg,outputName); await safeDelete(ffmpeg,progressName);
      start+=segmentDuration; part++; item.progress=Math.max(item.progress,total?Math.min(97,8+(start/total)*89):Math.min(97,8+(part/(expected+1))*89));
      item.statusText=`${item.outputs.length} ${item.outputs.length===1?'parte creada':'partes creadas'}…`; render();
      if(total&&start>=total-.25)break;
    }
    if(!item.outputs.length)throw new Error('No se generó ninguna parte.');
    item.status='done'; item.progress=100; item.statusText=`${item.outputs.length} ${item.outputs.length===1?'parte lista':'partes listas'}`; render();
  } catch(error) {
    item.status='error'; item.error=friendlyError(error); item.progress=0; render();
  } finally {
    if(ffmpeg){await safeDelete(ffmpeg,inputName); try{ffmpeg.terminate()}catch{} state.activeRunners.delete(ffmpeg);}
  }
}

function friendlyError(error){
  const m=error?.message||String(error);
  if(/memory|alloc|out of bounds|OOM/i.test(m))return 'El navegador se quedó sin memoria. Prueba “1 a la vez”, cierra pestañas o usa un video más pequeño.';
  if(/fetch|network|load/i.test(m))return 'No se pudo cargar FFmpeg. Revisa tu conexión y vuelve a intentarlo.';
  return m.length>180?'No se pudo dividir este video. Revisa el formato o vuelve a intentarlo.':m;
}

async function runPool(items, concurrency){
  let next=0;
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},async()=>{while(next<items.length){const item=items[next++];await processItem(item)}}));
}
async function processQueue(){
  const targets=state.items.filter(i=>['ready','error','cancelled'].includes(i.status)); if(!targets.length||state.processing)return;
  state.maxMb=clampMaxSize(); state.processing=true; render();
  try{await runPool(targets,state.concurrency); const failed=targets.filter(i=>i.status==='error').length; failed?toast(`${targets.length-failed} procesados y ${failed} con error.`,'warning'):toast('Videos divididos correctamente.','success')}
  finally{state.processing=false;render()}
}
function clampMaxSize(){const v=Math.round(Number(els.maxSize.value)||190), c=Math.min(2000,Math.max(10,v)); els.maxSize.value=String(c); state.maxMb=c; return c}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
async function downloadAll(item){toast(`Iniciando ${item.outputs.length} descargas. El navegador puede pedir permiso para múltiples archivos.`);for(const o of item.outputs){downloadBlob(o.blob,o.name);await new Promise(r=>setTimeout(r,450))}}
function removeItem(itemId){const i=state.items.findIndex(x=>x.id===itemId);if(i<0)return;state.items[i].outputs.forEach(o=>URL.revokeObjectURL(o.url));state.items.splice(i,1);render()}
function clearQueue(){state.items.forEach(i=>i.outputs.forEach(o=>URL.revokeObjectURL(o.url)));state.items=[];render()}
function openPreview(item,part){const o=item.outputs[part];if(!o)return;els.previewTitle.textContent=o.name;els.previewVideo.src=o.url;els.previewDialog.showModal()}
function closePreview(){els.previewVideo.pause();els.previewVideo.removeAttribute('src');els.previewVideo.load();els.previewDialog.close()}

els.browseButton.addEventListener('click',e=>{e.stopPropagation();els.fileInput.click()}); els.addMore.addEventListener('click',()=>els.fileInput.click());
els.dropzone.addEventListener('click',e=>{if(!e.target.closest('button'))els.fileInput.click()});
els.dropzone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();els.fileInput.click()}});
els.fileInput.addEventListener('change',()=>addFiles(els.fileInput.files));
['dragenter','dragover'].forEach(n=>els.dropzone.addEventListener(n,e=>{e.preventDefault();els.dropzone.classList.add('dragging')}));
['dragleave','drop'].forEach(n=>els.dropzone.addEventListener(n,e=>{e.preventDefault();els.dropzone.classList.remove('dragging')}));
els.dropzone.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
els.sizeMinus.addEventListener('click',()=>{els.maxSize.value=String(Math.max(10,clampMaxSize()-10));clampMaxSize()});
els.sizePlus.addEventListener('click',()=>{els.maxSize.value=String(Math.min(2000,clampMaxSize()+10));clampMaxSize()});
els.maxSize.addEventListener('change',clampMaxSize); els.maxSize.addEventListener('blur',clampMaxSize);
document.querySelectorAll('.segment').forEach(b=>b.addEventListener('click',()=>{state.concurrency=Number(b.dataset.concurrency);document.querySelectorAll('.segment').forEach(o=>{const active=o===b;o.classList.toggle('active',active);o.setAttribute('aria-checked',String(active))})}));
els.queueList.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const item=state.items.find(x=>x.id===b.dataset.id);if(!item)return;const part=Number(b.dataset.part);if(b.dataset.action==='remove')removeItem(item.id);if(b.dataset.action==='download-part')downloadBlob(item.outputs[part].blob,item.outputs[part].name);if(b.dataset.action==='download-all')downloadAll(item);if(b.dataset.action==='preview-part')openPreview(item,part)});
els.clearButton.addEventListener('click',clearQueue); els.processButton.addEventListener('click',processQueue); els.previewClose.addEventListener('click',closePreview); els.previewDialog.addEventListener('click',e=>{if(e.target===els.previewDialog)closePreview()});
window.addEventListener('beforeunload',e=>{if(state.processing){e.preventDefault();e.returnValue=''}});
render();
