import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

async function generateBrandImages() {
  console.log('--- Generating Brand Images (OG Image & Apple Touch Icon) ---');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Generate OG Image (1200 x 630)
  await page.setViewportSize({ width: 1200, height: 630 });
  const ogHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Manrope:wght@800&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 1200px;
        height: 630px;
        background: radial-gradient(circle at 75% 20%, rgba(166, 255, 77, 0.12), transparent 45%),
                    linear-gradient(135deg, #090a0d 0%, #111318 60%, #0d0f13 100%);
        color: #f5f7fa;
        font-family: 'DM Sans', sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 80px;
        overflow: hidden;
        position: relative;
      }
      .grid-lines {
        position: absolute;
        inset: 0;
        background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
      }
      .glow-orbit {
        position: absolute;
        width: 500px;
        height: 500px;
        right: -100px;
        bottom: -150px;
        background: radial-gradient(circle, rgba(166, 255, 77, 0.18) 0%, transparent 60%);
        filter: blur(40px);
        pointer-events: none;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 2;
      }
      .logo-icon {
        width: 54px;
        height: 54px;
        background: #181b22;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 14px;
        display: grid;
        place-items: center;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      }
      .brand-title {
        font-family: 'Manrope', sans-serif;
        font-size: 38px;
        font-weight: 800;
        letter-spacing: -0.04em;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .version-tag {
        font-size: 13px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 6px;
        background: rgba(166, 255, 77, 0.12);
        color: #a6ff4d;
        border: 1px solid rgba(166, 255, 77, 0.3);
      }
      .content {
        max-width: 820px;
        z-index: 2;
      }
      .content h1 {
        font-family: 'Manrope', sans-serif;
        font-size: 64px;
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.05em;
        margin-bottom: 24px;
      }
      .content h1 span {
        color: #a6ff4d;
      }
      .content p {
        font-size: 24px;
        line-height: 1.45;
        color: #9299a6;
      }
      .footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 28px;
        z-index: 2;
      }
      .badges {
        display: flex;
        gap: 18px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 8px 16px;
        border-radius: 99px;
        font-size: 15px;
        font-weight: 600;
        color: #d2d7e0;
      }
      .badge svg {
        width: 18px;
        height: 18px;
        color: #a6ff4d;
      }
      .url {
        font-size: 16px;
        font-weight: 700;
        color: #6f7681;
      }
    </style>
  </head>
  <body>
    <div class="grid-lines"></div>
    <div class="glow-orbit"></div>
    <div class="header">
      <div class="logo-icon">
        <svg width="34" height="34" viewBox="0 0 64 64">
          <path d="M 18 16 C 18 13 21 11 25 11 L 41 11 C 46 11 48 15 45 19 L 23 45 C 19 45 18 42 18 39 Z" fill="#a6ff4d"/>
          <path d="M 46 48 C 46 51 43 53 39 53 L 23 53 C 18 53 16 49 19 45 L 41 19 C 45 19 46 22 46 25 Z" fill="#ffffff"/>
          <circle cx="32" cy="32" r="3" fill="#a6ff4d"/>
        </svg>
      </div>
      <div class="brand-title">Splitly <span class="version-tag">2.0 Open Source</span></div>
    </div>
    <div class="content">
      <h1>Split videos. Extract audio.<br><span>Keep your files private.</span></h1>
      <p>100% client-side WebAssembly media utility. Fast size-based video splitting and high-fidelity AAC audio extraction for NotebookLM, Discord & WhatsApp.</p>
    </div>
    <div class="footer">
      <div class="badges">
        <div class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Zero Server Uploads
        </div>
        <div class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/></svg>
          FFmpeg WebAssembly
        </div>
        <div class="badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24m-14.14 0 4.24-4.24m5.66-5.66 4.24-4.24"/></svg>
          Bilingual (EN / ES)
        </div>
      </div>
      <div class="url">santi-osp.github.io/DividirVideosNotebookLM</div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(ogHtml, { waitUntil: 'networkidle' });
  const ogPath = path.join(publicDir, 'og-image.png');
  await page.screenshot({ path: ogPath, type: 'png' });
  console.log(`✅ Saved Open Graph image: ${ogPath}`);

  // 2. Generate Apple Touch Icon (180 x 180)
  await page.setViewportSize({ width: 180, height: 180 });
  const appleHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        width: 180px;
        height: 180px;
        background: #090a0d;
        display: grid;
        place-items: center;
      }
      .box {
        width: 156px;
        height: 156px;
        background: linear-gradient(135deg, #1c1f26 0%, #101216 100%);
        border: 2px solid rgba(255,255,255,0.12);
        border-radius: 36px;
        display: grid;
        place-items: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      }
    </style>
  </head>
  <body>
    <div class="box">
      <svg width="100" height="100" viewBox="0 0 64 64">
        <path d="M 18 16 C 18 13 21 11 25 11 L 41 11 C 46 11 48 15 45 19 L 23 45 C 19 45 18 42 18 39 Z" fill="#a6ff4d"/>
        <path d="M 46 48 C 46 51 43 53 39 53 L 23 53 C 18 53 16 49 19 45 L 41 19 C 45 19 46 22 46 25 Z" fill="#ffffff"/>
        <circle cx="32" cy="32" r="3.2" fill="#a6ff4d"/>
      </svg>
    </div>
  </body>
  </html>
  `;
  await page.setContent(appleHtml);
  const applePath = path.join(publicDir, 'apple-touch-icon.png');
  await page.screenshot({ path: applePath, type: 'png' });
  console.log(`✅ Saved Apple Touch Icon: ${applePath}`);

  // 3. Generate favicon.ico (fallback 48x48 PNG)
  await page.setViewportSize({ width: 48, height: 48 });
  const icoPath = path.join(publicDir, 'favicon.ico');
  await page.screenshot({ path: icoPath, type: 'png' });
  console.log(`✅ Saved favicon.ico fallback: ${icoPath}`);

  await browser.close();
}

generateBrandImages().catch(err => {
  console.error('Error generating brand images:', err);
  process.exit(1);
});
