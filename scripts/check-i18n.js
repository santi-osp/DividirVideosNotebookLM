import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.resolve(__dirname, '../src/i18n/locales');

const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
const es = JSON.parse(fs.readFileSync(path.join(localesDir, 'es.json'), 'utf8'));

function flattenKeys(obj, prefix = '') {
  let keys = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(keys, flattenKeys(v, fullKey));
    } else {
      keys[fullKey] = String(v);
    }
  }
  return keys;
}

const enKeys = flattenKeys(en);
const esKeys = flattenKeys(es);

let errors = 0;

console.log('--- Checking i18n Locales (EN & ES) ---');
console.log(`Total keys in English: ${Object.keys(enKeys).length}`);
console.log(`Total keys in Spanish: ${Object.keys(esKeys).length}`);

// Check missing in Spanish
for (const key of Object.keys(enKeys)) {
  if (!(key in esKeys)) {
    console.error(`❌ Missing in es.json: "${key}"`);
    errors++;
  } else if (!esKeys[key].trim()) {
    console.error(`❌ Empty translation in es.json for "${key}"`);
    errors++;
  }
}

// Check extra/missing in English
for (const key of Object.keys(esKeys)) {
  if (!(key in enKeys)) {
    console.error(`❌ Missing in en.json: "${key}"`);
    errors++;
  } else if (!enKeys[key].trim()) {
    console.error(`❌ Empty translation in en.json for "${key}"`);
    errors++;
  }
}

// Check parameter token parity
const extractTokens = str => {
  // Extract plural variable names
  const plurals = [...str.matchAll(/\{(\w+),\s*plural/g)].map(m => m[1]);
  // Strip plural blocks to avoid false positives with inner text
  const stripped = str.replace(/\{(\w+),\s*plural,[^}]+\}/g, '');
  // Extract remaining simple {var} tokens
  const simples = [...stripped.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  return [...new Set([...plurals, ...simples])].sort();
};

for (const key of Object.keys(enKeys)) {
  if (key in esKeys) {
    const enTokens = extractTokens(enKeys[key]);
    const esTokens = extractTokens(esKeys[key]);
    if (JSON.stringify(enTokens) !== JSON.stringify(esTokens)) {
      console.error(`⚠️ Token mismatch in "${key}": EN has [${enTokens.join(', ')}], ES has [${esTokens.join(', ')}]`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log('✅ All i18n checks passed with 100% parity and no missing keys!');
  process.exit(0);
} else {
  console.error(`❌ i18n validation failed with ${errors} error(s).`);
  process.exit(1);
}
