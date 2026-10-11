// Product card used on the catalog and home "featured" grid.
import { esc, pad2 } from '../core/dom.js';
import { productUrl, inquiryUrl } from '../core/data.js';

export function productCard(p, index) {
  const facts = (p.highlights || []).slice(0, 2)
    .map((h) => `<div class="product-card__fact"><strong>${esc(h.value)}${h.unit && h.unit.length <= 4 ? `<small> ${esc(h.unit)}</small>` : ''}</strong><span>${esc(h.label)}</span></div>`)
    .join('');
  return `
    <article class="product-card" data-reveal data-reveal-stagger data-category="${esc(p.category)}">
      <div class="product-card__media">
        <span class="product-card__index">${pad2(index + 1)}</span>
        <span class="product-card__cat">${esc(p.categoryLabel)}</span>
        <img src="${esc(p.images.hero)}" alt="${esc(p.images.gallery[0]?.alt || p.name)}" loading="lazy" decoding="async" width="600" height="600">
      </div>
      <div class="product-card__body">
        <span class="product-card__maker">${esc(p.manufacturer)} · ${esc(p.model)}</span>
        <h3 class="product-card__title"><a class="product-card__link" href="${productUrl(p)}">${esc(p.name)}</a></h3>
        <p class="product-card__tagline">${esc(p.tagline)}</p>
        <div class="product-card__facts">${facts}</div>
      </div>
      <div class="product-card__actions">
        <a class="btn btn--sm" href="${productUrl(p)}">View in 3D <span class="arrow" aria-hidden="true">→</span></a>
        <a class="btn btn--sm btn--ghost" href="${inquiryUrl(p)}" aria-label="Inquire about ${esc(p.name)}">Inquire</a>
      </div>
    </article>`;
}
