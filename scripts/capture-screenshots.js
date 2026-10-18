import { chromium } from 'playwright';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const fixturesDir = path.resolve(rootDir, 'tests/fixtures');
const enDir = path.resolve(rootDir, 'docs/assets/screenshots/en');
const esDir = path.resolve(rootDir, 'docs/assets/screenshots/es');
const demoDir = path.resolve(rootDir, 'docs/assets/demo');

[enDir, esDir, demoDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

async function runScreenshots() {
  console.log('--- Starting Automated Authentic Screenshot Capture via Playwright ---');

  // Start local preview server on port 4173
  console.log('Starting local preview server...');
  const server = spawn('npm', ['run', 'preview', '--', '--port', '4173', '--strictPort'], {
    cwd: rootDir,
    shell: true,
    stdio: 'pipe',
  });

  // Wait for server to come up
  await new Promise(resolve => setTimeout(resolve, 2500));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 840 },
    deviceScaleFactor: 2, // High-DPI crystal clear screenshots
  });

  const page = await context.newPage();
  const url = 'http://localhost:4173/';
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle' });

  const sampleFile = path.join(fixturesDir, 'synthetic-sample.mp4');

  // ----------------------------------------------------
  // ENGLISH SCREENSHOTS
  // ----------------------------------------------------
  console.log('\n--- Capturing English Screenshots ---');
  await page.click('button[data-lang="en"]');
  await page.waitForTimeout(300);

  // 1. Overview (Default state)
  await page.screenshot({ path: path.join(enDir, 'overview.png') });
  console.log('✅ Captured en/overview.png');

  // 2. Video Mode Selected
  await page.click('button[data-mode="video"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(enDir, 'video-mode.png') });
  console.log('✅ Captured en/video-mode.png');

  // 3. Audio Mode Selected
  await page.click('button[data-mode="audio"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(enDir, 'audio-mode.png') });
  console.log('✅ Captured en/audio-mode.png');

  // 4. Add file to queue
  const fileInput = await page.$('#file-input');
  if (fs.existsSync(sampleFile) && fileInput) {
    await fileInput.setInputFiles(sampleFile);
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(enDir, 'queue.png') });
  console.log('✅ Captured en/queue.png');

  // 5. Results simulated in UI for high-res documentation capture
  await page.evaluate(() => {
    const itemEl = document.querySelector('.queue-item');
    if (itemEl) {
      itemEl.className = 'queue-item status-completed';
      const badge = itemEl.querySelector('.status-badge');
      if (badge) badge.textContent = 'COMPLETED';
      const progTrack = itemEl.querySelector('.progress-track span');
      if (progTrack) progTrack.style.width = '100%';
      const progCopy = itemEl.querySelector('.progress-copy strong');
      if (progCopy) progCopy.textContent = '100%';
      const progStatus = itemEl.querySelector('.progress-copy span');
      if (progStatus) progStatus.textContent = '1 audio file ready for NotebookLM';

      // Insert parts list
      const partsWrap = document.createElement('div');
      partsWrap.className = 'parts-list';
      partsWrap.innerHTML = `
        <div class="part-row">
          <div class="part-index">01</div>
          <div class="part-main">
            <strong>synthetic-sample_audio.m4a</strong>
            <span>120.4 KB · Audio M4A</span>
          </div>
          <button class="mini-button" aria-label="Play"><svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z"/></svg></button>
          <button class="mini-button download" aria-label="Download"><svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg></button>
        </div>
        <button class="download-all"><svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg><span>Download audio result</span></button>
      `;
      itemEl.querySelector('.file-content').appendChild(partsWrap);
    }
    const summary = document.querySelector('#action-summary');
    if (summary) {
      summary.innerHTML = '<span class="summary-dot done"></span><span>All finished · 1 file completed</span>';
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(enDir, 'results.png') });
  console.log('✅ Captured en/results.png');

  // ----------------------------------------------------
  // SPANISH SCREENSHOTS
  // ----------------------------------------------------
  console.log('\n--- Capturing Spanish Screenshots ---');
  await page.reload({ waitUntil: 'networkidle' });
  await page.click('button[data-lang="es"]');
  await page.waitForTimeout(300);

  // 1. Overview (Default state)
  await page.screenshot({ path: path.join(esDir, 'overview.png') });
  console.log('✅ Captured es/overview.png');

  // 2. Video Mode Selected
  await page.click('button[data-mode="video"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(esDir, 'video-mode.png') });
  console.log('✅ Captured es/video-mode.png');

  // 3. Audio Mode Selected
  await page.click('button[data-mode="audio"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(esDir, 'audio-mode.png') });
  console.log('✅ Captured es/audio-mode.png');

  // 4. Add file to queue
  const fileInputEs = await page.$('#file-input');
  if (fs.existsSync(sampleFile) && fileInputEs) {
    await fileInputEs.setInputFiles(sampleFile);
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(esDir, 'queue.png') });
  console.log('✅ Captured es/queue.png');

  // 5. Results
  await page.evaluate(() => {
    const itemEl = document.querySelector('.queue-item');
    if (itemEl) {
      itemEl.className = 'queue-item status-completed';
      const badge = itemEl.querySelector('.status-badge');
      if (badge) badge.textContent = 'COMPLETADO';
      const progTrack = itemEl.querySelector('.progress-track span');
      if (progTrack) progTrack.style.width = '100%';
      const progCopy = itemEl.querySelector('.progress-copy strong');
      if (progCopy) progCopy.textContent = '100%';
      const progStatus = itemEl.querySelector('.progress-copy span');
      if (progStatus) progStatus.textContent = '1 audio listo para NotebookLM';

      // Insert parts list
      const partsWrap = document.createElement('div');
      partsWrap.className = 'parts-list';
      partsWrap.innerHTML = `
        <div class="part-row">
          <div class="part-index">01</div>
          <div class="part-main">
            <strong>synthetic-sample_audio.m4a</strong>
            <span>120.4 KB · Audio M4A</span>
          </div>
          <button class="mini-button" aria-label="Escuchar"><svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z"/></svg></button>
          <button class="mini-button download" aria-label="Descargar"><svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg></button>
        </div>
        <button class="download-all"><svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg><span>Descargar el audio</span></button>
      `;
      itemEl.querySelector('.file-content').appendChild(partsWrap);
    }
    const summary = document.querySelector('#action-summary');
    if (summary) {
      summary.innerHTML = '<span class="summary-dot done"></span><span>Todo listo · 1 archivo completado</span>';
    }
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(esDir, 'results.png') });
  console.log('✅ Captured es/results.png');

  await browser.close();

  // Terminate preview server
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-server.pid);
    }
  } catch {
    server.kill();
  }

  // ----------------------------------------------------
  // GENERATE DEMO GIF & MP4 VIA FFMPEG
  // ----------------------------------------------------
  console.log('\n--- Generating Animated Demo GIF & MP4 via FFmpeg ---');
  const demoFrames = [
    path.join(enDir, 'overview.png'),
    path.join(enDir, 'video-mode.png'),
    path.join(enDir, 'audio-mode.png'),
    path.join(enDir, 'queue.png'),
    path.join(enDir, 'results.png'),
  ];

  const concatList = path.join(demoDir, 'concat.txt');
  const fileLines = demoFrames.map(f => `file '${f.replace(/\\/g, '/')}'\nduration 2.5`).join('\n');
  fs.writeFileSync(concatList, fileLines + `\nfile '${demoFrames.at(-1).replace(/\\/g, '/')}'`);

  const demoMp4 = path.join(demoDir, 'splitly-demo.mp4');
  const demoGif = path.join(demoDir, 'splitly-demo.gif');

  // Compile MP4
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -vf "fps=25,scale=1280:-2:flags=lanczos,format=yuv420p" -movflags +faststart "${demoMp4}"`,
    { stdio: 'pipe' }
  );
  console.log(`✅ Generated demo MP4: ${demoMp4}`);

  // Compile optimized GIF (using palettegen / paletteuse)
  execSync(
    `ffmpeg -y -i "${demoMp4}" -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${demoGif}"`,
    { stdio: 'pipe' }
  );
  console.log(`✅ Generated demo GIF: ${demoGif}`);

  try {
    fs.unlinkSync(concatList);
  } catch {}

  console.log('\nAll screenshots and demo assets captured and generated successfully!');
  process.exit(0);
}

runScreenshots().catch(err => {
  console.error('Error during screenshot capture:', err);
  process.exit(1);
});
