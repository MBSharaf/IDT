// Language (en | ar) and colour theme (dark | light).
// The inline script at the top of every page's <head> sets <html lang dir data-theme> before first paint;
// this module reads that state and handles switching. English is the source text: JS strings are looked up
// by their English text, static HTML by its data-i18n key (js/core/strings.ar.js holds the Arabic).
import { AR } from './strings.ar.js';

export const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
export const isAr = lang === 'ar';

/** Translates an English string (or dotted key). `{name}` placeholders are filled from `vars`. */
export function t(key, vars) {
  let s = isAr && AR[key] != null ? AR[key] : key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}

/** Picks the singular or plural source string for `n`, then translates it ({n} is filled in).
 *  Arabic has a dual: a "<plural key>|2" entry, when present, is used for n = 2. */
export function plural(n, one, many) {
  const key = n === 1 ? one : many;
  if (isAr && n === 2 && AR[`${key}|2`] != null) return AR[`${key}|2`];
  return t(key, { n });
}

/** Swaps static page text for Arabic: [data-i18n] (inner HTML) and [data-i18n-attr="attr:key;…"]. */
export function applyI18n(root = document) {
  if (!isAr) return;
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const s = AR[el.dataset.i18n];
    if (s != null) el.innerHTML = s;
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (AR[key] != null) el.setAttribute(attr, AR[key]);
    });
  });
}

export function setLang(next) {
  try { localStorage.setItem('idt-lang', next); } catch { /* private mode: falls back to this visit only */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', next);
  location.href = url.href;
}

export const theme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

export function setTheme(next) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.dataset.theme = next;
  try { localStorage.setItem('idt-theme', next); } catch { /* ignore */ }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#F5F3EE' : '#0A0A0A');
  dispatchEvent(new CustomEvent('themechange', { detail: next }));
  // Let colours change in one step instead of every element running its own transition.
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
}
