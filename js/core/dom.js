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

// Responsive images: smaller copies made by tools/make-variants.ps1 (name-<width>.jpg).
const VARIANTS = [
  [/^assets\/images\/products\/[^/]+\.jpg$/, [160, 640, 960], 1536],
  [/^assets\/images\/products\/source\/zahndent-zdm-e5\/0[2-4]-photo-[^/]+\.jpg$/, [640, 1200], 2362],
  [/^assets\/images\/products\/source\/zahndent-zdm-e5\/[^/]+\.jpg$/, [640], 1563],
];
/** ` srcset="…" sizes="…"` for photos that have smaller copies, otherwise ''. */
export function srcsetAttrs(src, sizes) {
  const hit = VARIANTS.find(([re]) => re.test(src));
  if (!hit || src.endsWith('-cabinet.jpg')) return '';
  const [, widths, full] = hit;
  const set = [...widths.map((w) => `${src.replace(/\.jpg$/, `-${w}.jpg`)} ${w}w`), `${src} ${full}w`].join(', ');
  return ` srcset="${esc(set)}" sizes="${esc(sizes)}"`;
}
