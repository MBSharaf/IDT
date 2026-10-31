// About page: manufacturer tiles derived from the catalog, company fact sheet.
import { renderHeader, renderFooter } from '../components/layout.js';
import { $, esc, showError } from '../core/dom.js';
import { getProducts, productUrl } from '../core/data.js';
import { site } from '../core/site.js';
import { boot, initReveals } from '../core/motion.js';
import { t, plural } from '../core/i18n.js';

renderHeader('about');
renderFooter();
boot();

const FACTS = [
  ['Legal name', site.legalName],
  ['Founded', '2024'],
  ['Headquarters', t(site.address)],
  ['Service area', t('Egypt')],
  ['Installation & training', t('Across Egypt')],
  ['Email', site.email],
  ['Phone', site.phone],
];

try {
  const products = await getProducts();
  const byMaker = new Map();
  products.forEach((p) => {
    if (!byMaker.has(p.manufacturer)) byMaker.set(p.manufacturer, { legal: p.manufacturerLegalName, items: [] });
    byMaker.get(p.manufacturer).items.push(p);
  });
  $('[data-brands]').innerHTML = [...byMaker].map(([name, m]) => `
    <div class="brand-tile" data-reveal data-reveal-stagger>
      <span class="eyebrow">${plural(m.items.length, '{n} product', '{n} products')}</span>
      <h3>${esc(name)}</h3>
      <p><bdi>${esc(m.legal)}</bdi></p>
      <ul>${m.items.map((p) => `<li><a href="${productUrl(p)}">${esc(p.model)} · ${esc(p.categoryLabel)} →</a></li>`).join('')}</ul>
    </div>`).join('');
} catch (err) {
  showError('[data-brands]', err.message);
}

$('[data-facts]').innerHTML = FACTS.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${/^\[.*\]$/.test(v) ? `<span class="placeholder">${esc(v)}</span>` : esc(v)}</dd></div>`).join('');
initReveals();
