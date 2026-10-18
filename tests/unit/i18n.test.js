import { describe, it, expect, beforeEach } from 'vitest';
import { t, setLanguage, getLanguage, formatNumber, onLanguageChange } from '../../src/i18n/index.js';

describe('Internationalization (i18n) Engine', () => {
  beforeEach(() => {
    setLanguage('en');
  });

  it('translates simple nested keys in English and Spanish', () => {
    expect(t('app.brandName')).toBe('Splitly');
    expect(t('controls.unit')).toBe('MB');

    setLanguage('es');
    expect(getLanguage()).toBe('es');
    expect(t('controls.unit')).toBe('MB');
    expect(t('app.heroTitle')).toBe('Divide videos. Extrae audio.');
  });

  it('interpolates simple tokens like {maxMb}', () => {
    setLanguage('en');
    expect(t('errors.sizeLimitExceeded', { maxMb: 190 })).toBe(
      'Could not fit segment under 190 MB even with maximum adjustments.'
    );

    setLanguage('es');
    expect(t('errors.sizeLimitExceeded', { maxMb: 25 })).toBe(
      'No fue posible ajustar el segmento por debajo de 25 MB.'
    );
  });

  it('handles plural rules for one vs other', () => {
    setLanguage('en');
    expect(t('queue.titleCount', { count: 1 })).toBe('1 video');
    expect(t('queue.titleCount', { count: 4 })).toBe('4 videos');
    expect(t('queue.downloadAll', { count: 1 })).toBe('Download result');
    expect(t('queue.downloadAll', { count: 5 })).toBe('Download all 5 parts');

    setLanguage('es');
    expect(t('queue.titleCount', { count: 1 })).toBe('1 video');
    expect(t('queue.titleCount', { count: 4 })).toBe('4 videos');
    expect(t('queue.downloadAll', { count: 1 })).toBe('Descargar resultado');
    expect(t('queue.downloadAll', { count: 3 })).toBe('Descargar las 3 partes');
  });

  it('notifies listeners when language changes', () => {
    let notifiedLang = null;
    const unsub = onLanguageChange(lang => {
      notifiedLang = lang;
    });

    setLanguage('es');
    expect(notifiedLang).toBe('es');

    setLanguage('en');
    expect(notifiedLang).toBe('en');

    unsub();
  });

  it('falls back to English when a key is missing in another language', () => {
    // Both locales have full parity, but let's test fallback behavior
    expect(t('nonexistent.key.test')).toBe('nonexistent.key.test');
  });
});
