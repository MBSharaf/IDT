// Unified motion system.
// - Reveals: IntersectionObserver adds .is-in to [data-reveal] (CSS handles the transition).
// - Scroll scenes: GSAP + ScrollTrigger (loaded as classic scripts) when available and motion is allowed.
import { prefersReducedMotion } from './dom.js';

export const reduced = prefersReducedMotion();

export function getGsap() {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || reduced) return null;
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

export function initReveals(root = document) {
  const items = [...root.querySelectorAll('[data-reveal]:not(.is-in)')];
  if (reduced || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  items.forEach((el, i) => {
    if (el.dataset.revealStagger !== undefined) el.style.setProperty('--reveal-delay', `${(i % 6) * 80}ms`);
    io.observe(el);
  });
}

/** Splits an element's text into per-character spans for headline animation. */
export function splitChars(el) {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text].map((c) => `<span class="char" aria-hidden="true">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  return [...el.querySelectorAll('.char')];
}

export function boot() {
  document.documentElement.classList.add('js');
  initReveals();
}
