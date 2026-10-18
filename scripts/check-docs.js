import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.resolve(rootDir, 'docs');

console.log('--- Checking Documentation Parity & Integrity ---');

const expectedPairs = [
  { en: 'index.md', es: 'index.md' },
  { en: 'getting-started.md', es: 'primeros-pasos.md' },
  { en: 'user-guide.md', es: 'guia-de-usuario.md' },
  { en: 'faq.md', es: 'preguntas-frecuentes.md' },
  { en: 'troubleshooting.md', es: 'solucion-de-problemas.md' },
  { en: 'architecture.md', es: 'arquitectura.md' },
  { en: 'development.md', es: 'desarrollo.md' },
];

let errors = 0;

// 1. Check Root README files
const rootFiles = ['README.md', 'README.es.md', 'LICENSE', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'SECURITY.md', 'CHANGELOG.md', 'THIRD_PARTY_NOTICES.md'];
for (const file of rootFiles) {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing root documentation file: ${file}`);
    errors++;
  } else if (fs.statSync(p).size < 50) {
    console.error(`❌ Root documentation file is empty or too short: ${file}`);
    errors++;
  } else {
    console.log(`✅ Root file verified: ${file}`);
  }
}

// 2. Check bilingual documentation pairs in docs/en and docs/es
console.log('\nVerifying bilingual guide parity:');
for (const pair of expectedPairs) {
  const enPath = path.join(docsDir, 'en', pair.en);
  const esPath = path.join(docsDir, 'es', pair.es);

  if (!fs.existsSync(enPath)) {
    console.error(`❌ Missing English doc: docs/en/${pair.en}`);
    errors++;
  } else if (fs.statSync(enPath).size < 100) {
    console.error(`❌ English doc is unexpectedly short: docs/en/${pair.en}`);
    errors++;
  }

  if (!fs.existsSync(esPath)) {
    console.error(`❌ Missing Spanish counterpart: docs/es/${pair.es}`);
    errors++;
  } else if (fs.statSync(esPath).size < 100) {
    console.error(`❌ Spanish doc is unexpectedly short: docs/es/${pair.es}`);
    errors++;
  }

  if (fs.existsSync(enPath) && fs.existsSync(esPath)) {
    console.log(`✅ Verified pair: docs/en/${pair.en} <==> docs/es/${pair.es}`);
  }
}

// 3. Check development documentation in docs/development
const devFiles = ['AUDIT.md', 'DESIGN_DECISIONS.md', 'TESTING.md'];
for (const file of devFiles) {
  const p = path.join(docsDir, 'development', file);
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing development doc: docs/development/${file}`);
    errors++;
  } else {
    console.log(`✅ Development doc verified: docs/development/${file}`);
  }
}

// 4. Verify screenshots and demo assets
const expectedScreenshots = [
  'docs/assets/screenshots/en/overview.png',
  'docs/assets/screenshots/en/video-mode.png',
  'docs/assets/screenshots/en/audio-mode.png',
  'docs/assets/screenshots/en/queue.png',
  'docs/assets/screenshots/en/results.png',
  'docs/assets/screenshots/es/overview.png',
  'docs/assets/screenshots/es/video-mode.png',
  'docs/assets/screenshots/es/audio-mode.png',
  'docs/assets/screenshots/es/queue.png',
  'docs/assets/screenshots/es/results.png',
  'docs/assets/demo/splitly-demo.gif',
  'docs/assets/demo/splitly-demo.mp4',
];

console.log('\nVerifying visual assets:');
for (const asset of expectedScreenshots) {
  const p = path.join(rootDir, asset);
  if (!fs.existsSync(p)) {
    console.error(`❌ Missing media asset: ${asset}`);
    errors++;
  } else {
    console.log(`✅ Asset verified: ${asset}`);
  }
}

if (errors === 0) {
  console.log('\n✅ All documentation checks passed with 100% parity and valid assets!');
  process.exit(0);
} else {
  console.error(`\n❌ Documentation validation failed with ${errors} error(s).`);
  process.exit(1);
}
