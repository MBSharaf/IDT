// Catalog page: category filters (URL-synced), workflow strip, product grid.
import { renderHeader, renderFooter } from '../components/layout.js';
import { productCard } from '../components/productCard.js';
import { $, $$, esc, pad2, showError } from '../core/dom.js';
import { loadCatalog } from '../core/data.js';
import { boot, initReveals } from '../core/motion.js';

renderHeader('products');
renderFooter();
boot();

try {
  const { products, meta } = await loadCatalog();
  const categories = meta.categories.slice().sort((a, b) => a.step - b.step);
  const count = (id) => products.filter((p) => p.category === id).length;

  $('[data-grid]').innerHTML = products.map(productCard).join('');
  $('[data-filters]').innerHTML = [{ id: 'all', label: 'All' }, ...categories]
    .map((c) => `<button class="chip" type="button" aria-pressed="false" data-filter="${c.id}">${esc(c.label)} <span class="chip__count">${c.id === 'all' ? products.length : count(c.id)}</span></button>`)
    .join('');
  $('[data-strip]').innerHTML = categories.map((c) => `
    <a href="?category=${c.id}" data-strip-link="${c.id}">
      <small>Step ${pad2(c.step)}</small><strong>${esc(c.label)}</strong><span>${esc(c.summary)}</span>
    </a>`).join('');

  const apply = (id, push = false) => {
    const valid = id === 'all' || categories.some((c) => c.id === id) ? id : 'all';
    $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === valid)));
    $$('[data-strip-link]').forEach((a) => a.setAttribute('aria-current', String(a.dataset.stripLink === valid)));
    let shown = 0;
    $$('.product-card').forEach((card) => {
      const on = valid === 'all' || card.dataset.category === valid;
      card.classList.toggle('is-hidden', !on);
      if (on) { shown++; card.classList.add('is-in'); }
    });
    $('[data-count]').textContent = `${shown} product${shown === 1 ? '' : 's'}`;
    $('[data-empty]').hidden = shown > 0;
    if (push) {
      const url = new URL(location.href);
      if (valid === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', valid);
      history.replaceState(null, '', url);
    }
  };

  $('[data-filters]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (b) apply(b.dataset.filter, true);
  });
  $('[data-strip]').addEventListener('click', (e) => {
    const a = e.target.closest('[data-strip-link]');
    if (!a) return;
    e.preventDefault();
    apply(a.dataset.stripLink, true);
    $('.catalog-toolbar').scrollIntoView({ block: 'start' });
  });

  apply(new URLSearchParams(location.search).get('category') || 'all');
  initReveals();
} catch (err) {
  console.error(err);
  showError('[data-grid]', err.message);
}
