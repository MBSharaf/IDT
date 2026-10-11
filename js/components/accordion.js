// Accessible accordion (hairline list with + icons, from the reference's right-hand list).
import { esc } from '../core/dom.js';

let uid = 0;
export function accordion(items, { openFirst = false } = {}) {
  return `<div class="accordion">${items.map((it, i) => {
    const id = `acc-${++uid}`;
    const open = openFirst && i === 0;
    return `<div class="accordion__item">
      <button class="accordion__trigger" type="button" aria-expanded="${open}" aria-controls="${id}">
        <span>${esc(it.title)}</span><span class="accordion__icon" aria-hidden="true"></span>
      </button>
      <div class="accordion__panel${open ? ' is-open' : ''}" id="${id}" role="region"><div>${it.html ?? `<p>${esc(it.text)}</p>`}</div></div>
    </div>`;
  }).join('')}</div>`;
}

export function bindAccordions(root = document) {
  root.querySelectorAll('.accordion__trigger').forEach((btn) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', open);
    });
  });
}
