// Tiny DOM helpers (kept framework-agnostic so they map cleanly to React components later).
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Escapes text for safe interpolation into HTML templates. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] : ''), '');
}

export function mount(target, markup) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el) el.innerHTML = markup;
  return el;
}

export const pad2 = (n) => String(n).padStart(2, '0');
export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function showError(target, message) {
  mount(target, `<div class="notice" role="alert"><strong>Couldn't load content.</strong> ${esc(message)} — run the site through a local server (see README).</div>`);
}
