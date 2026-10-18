/**
 * Splitly Internationalization (i18n) Engine
 * Zero-dependency, reactive, lightweight localization with pluralization support.
 */

import en from './locales/en.json';
import es from './locales/es.json';

const STORAGE_KEY = 'splitly_locale';
const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'en';

const translations = { en, es };

let currentLang = DEFAULT_LANG;
const listeners = new Set();

/**
 * Resolve initial language based on:
 * 1. Explicit user preference in localStorage
 * 2. Browser language (navigator.language)
 * 3. Default fallback (en)
 */
export function detectInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
  } catch {}

  const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
  if (navLang.startsWith('es')) {
    return 'es';
  }
  return DEFAULT_LANG;
}

/**
 * Get current active language code ('es' | 'en')
 */
export function getLanguage() {
  return currentLang;
}

/**
 * Subscribe to language change events
 */
export function onLanguageChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Switch active language immediately without page reload or resetting state
 */
export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
  currentLang = lang;

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}

  syncDocumentMetadata();

  for (const cb of listeners) {
    try {
      cb(currentLang);
    } catch (err) {
      console.error('Error in i18n listener:', err);
    }
  }
}

/**
 * Synchronize <html lang="..."> and <title> with current language
 */
export function syncDocumentMetadata() {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLang;
    const title = t('app.title');
    const desc = t('app.description');
    if (title) document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && desc) metaDesc.setAttribute('content', desc);
  }
}

/**
 * Parse and interpolate plural rules: {count, plural, one {1 part} other {# parts}}
 */
function interpolatePlurals(template, params, locale) {
  return template.replace(/\{(\w+),\s*plural,\s*one\s*\{([^}]+)\}\s*other\s*\{([^}]+)\}\}/g, (_, key, oneTpl, otherTpl) => {
    const val = Number(params[key]) || 0;
    const isOne = Math.abs(val) === 1;
    const chosen = isOne ? oneTpl : otherTpl;
    return chosen.replace(/#/g, formatNumber(val, locale));
  });
}

/**
 * Interpolate simple tokens: {token}
 */
function interpolateTokens(template, params, locale) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in params) {
      const val = params[key];
      if (typeof val === 'number') return formatNumber(val, locale);
      return String(val);
    }
    return match;
  });
}

/**
 * Format numbers with Intl.NumberFormat according to active locale
 */
export function formatNumber(num, locale = currentLang) {
  try {
    return new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US').format(num);
  } catch {
    return String(num);
  }
}

/**
 * Translate a key into the active locale with optional parameter interpolation
 * @param {string} key - e.g. "queue.status.processing"
 * @param {Record<string, any>} [params] - interpolation parameters
 * @param {string} [langOverride] - optional language override
 * @returns {string}
 */
export function t(key, params = {}, langOverride = null) {
  const lang = langOverride || currentLang;
  const dict = translations[lang] || translations[DEFAULT_LANG];

  const parts = key.split('.');
  let val = dict;
  for (const p of parts) {
    if (val && typeof val === 'object' && p in val) {
      val = val[p];
    } else {
      val = null;
      break;
    }
  }

  // Fallback to English if missing in target
  if (typeof val !== 'string' && lang !== DEFAULT_LANG) {
    let fallback = translations[DEFAULT_LANG];
    for (const p of parts) {
      if (fallback && typeof fallback === 'object' && p in fallback) {
        fallback = fallback[p];
      } else {
        fallback = null;
        break;
      }
    }
    if (typeof fallback === 'string') {
      val = fallback;
    }
  }

  if (typeof val !== 'string') {
    return key;
  }

  let result = interpolatePlurals(val, params, lang);
  result = interpolateTokens(result, params, lang);
  return result;
}

// Initialize on module load
currentLang = detectInitialLanguage();
syncDocumentMetadata();
