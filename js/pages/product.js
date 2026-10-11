// Product detail page: interactive 3D stage, verified specs, workflow position, gallery, sources, inquiry.
import { renderHeader, renderFooter } from '../components/layout.js';
import { productCard } from '../components/productCard.js';
import { specGroups } from '../components/specs.js';
import { $, $$, esc, pad2 } from '../core/dom.js';
import { loadCatalog, inquiryUrl, productUrl } from '../core/data.js';
import { boot, initReveals } from '../core/motion.js';
import { createViewer } from '../three/viewer.js';
import { mountReviews } from '../components/reviews.js';

renderHeader('products');
renderFooter();
boot();

const root = $('[data-product-root]');
const id = new URLSearchParams(location.search).get('id');

try {
  const { products, meta } = await loadCatalog();
  const p = products.find((x) => x.id === id);
  if (!p) renderNotFound(products);
  else render(p, products, meta.categories);
} catch (err) {
  console.error(err);
  root.innerHTML = `<div class="container not-found"><h1>Couldn't load the catalog.</h1><p class="lead">${esc(err.message)}. Run the site through a local server (see README).</p></div>`;
}

function render(p, products, categories) {
  document.title = `${p.manufacturer} ${p.name} — IDT`;
  $('meta[name="description"]').setAttribute('content', `${p.manufacturer} ${p.name}: ${p.tagline} Explore it in 3D with full specifications.`);
  const cats = categories.slice().sort((a, b) => a.step - b.step);
  const cat = cats.find((c) => c.id === p.category);
  const confidence = p.confidence === 'verified'
    ? '<span class="badge badge--gold"><span class="badge__dot"></span>Model verified</span>'
    : '<span class="badge"><span class="badge__dot"></span>Some specs pending confirmation</span>';
  const related = products.filter((x) => x.id !== p.id).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 3);
  const has3dDemo = true;

  root.innerHTML = `
  <section class="pd-hero container" aria-labelledby="pd-title">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a><span aria-hidden="true">/</span><a href="products.html">Products</a><span aria-hidden="true">/</span><a href="products.html?category=${esc(p.category)}">${esc(p.categoryLabel)}</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.model)}</span></nav>
    <div class="pd-hero__grid">
      <div class="pd-stage">
        <div class="pd-stage__ghost" aria-hidden="true">${esc(p.model)}</div>
        <div class="pd-stage__viewer" data-viewer></div>
        <div class="pd-stage__bar">
          <div class="viewer-toolbar" role="group" aria-label="3D view controls">
            <button class="tool-btn" type="button" data-view="three-quarter" aria-pressed="true">3/4</button>
            <button class="tool-btn" type="button" data-view="front" aria-pressed="false">Front</button>
            <button class="tool-btn" type="button" data-view="side" aria-pressed="false">Side</button>
            <button class="tool-btn" type="button" data-view="top" aria-pressed="false">Top</button>
          </div>
          <div class="viewer-toolbar">
            ${has3dDemo ? '<button class="tool-btn" type="button" data-demo aria-pressed="false">Animate</button>' : ''}
            <button class="tool-btn" type="button" data-autorotate aria-pressed="true">Auto-rotate</button>
          </div>
        </div>
      </div>
      <div class="pd-info">
        <span class="pd-info__maker">${esc(p.manufacturer)} · Model ${esc(p.model)}</span>
        <h1 class="pd-info__title" id="pd-title">${esc(p.name)}</h1>
        <div class="pd-info__badges"><span class="badge">${esc(p.categoryLabel)}</span>${confidence}</div>
        <p class="lead">${esc(p.tagline)}</p>
        <div class="pd-facts">${p.highlights.map((h) => `<div class="pd-fact"><strong>${esc(h.value)}${h.unit && h.unit.length <= 4 ? `<small>${esc(h.unit)}</small>` : ''}</strong><span>${esc(h.label)}${h.unit.length > 4 ? ` · ${esc(h.unit)}` : ''}</span></div>`).join('')}</div>
        <div class="hero__ctas">
          <a class="btn" href="${inquiryUrl(p)}">Request a quote <span class="arrow" aria-hidden="true">→</span></a>
          <a class="btn btn--ghost" href="#specs">Full specifications</a>
        </div>
        <p class="viewer-hint">Drag to rotate · scroll or pinch to zoom · focus the model and use arrow keys</p>
      </div>
    </div>
  </section>

  <nav class="pd-nav" aria-label="Product sections">
    <div class="container pd-nav__inner">
      <a href="#overview">Overview</a><a href="#features">Features</a><a href="#specs">Specifications</a><a href="#workflow">Workflow</a><a href="#gallery">Gallery</a><a href="#reviews">Reviews</a><a href="#sources">Sources</a>
      <a class="btn btn--sm" href="${inquiryUrl(p)}">Inquire</a>
    </div>
  </nav>

  <div class="container">
    <section class="pd-section" id="overview" aria-labelledby="ov-title">
      <div class="pd-overview">
        <div><p class="eyebrow">Overview</p><h2 id="ov-title" style="margin-top:1rem">Built for the<br>${esc(cat?.label.toLowerCase() || 'lab')} step.</h2></div>
        <div>
          <p class="pd-overview__desc" data-reveal>${esc(p.description)}</p>
          <ul class="value-list">${p.labValue.map((v) => `<li data-reveal data-reveal-stagger>${esc(v)}</li>`).join('')}</ul>
        </div>
      </div>
    </section>

    <section class="pd-section" id="features" aria-labelledby="ft-title">
      <div class="section-head"><p class="eyebrow">Features</p><h2 id="ft-title">What it does.</h2></div>
      <div class="feature-grid">${p.features.map((f, i) => `<div class="feature" data-reveal data-reveal-stagger><span class="feature__num">${pad2(i + 1)}</span><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>`).join('')}</div>
    </section>

    <section class="pd-section" id="specs" aria-labelledby="sp-title">
      <div class="section-head section-head--split">
        <div><p class="eyebrow">Specifications</p><h2 id="sp-title">Technical data.</h2></div>
        <p class="muted" style="font-size:.9rem">Values as published by ${esc(p.manufacturer)}. Configurations can vary by market, so please confirm the specification with IDT before ordering.</p>
      </div>
      ${specGroups(p.specs)}
    </section>

    <section class="pd-section" id="workflow" aria-labelledby="wf-title">
      <div class="section-head"><p class="eyebrow">Workflow</p><h2 id="wf-title">Where it fits.</h2></div>
      <div class="flow">${cats.map((c) => {
        const first = products.find((x) => x.category === c.id);
        return `<div class="flow__step${c.id === p.category ? ' is-current' : ''}">
          <small>Step ${pad2(c.step)}${c.id === p.category ? ' · this product' : ''}</small>
          <strong>${esc(c.label)}</strong><span>${esc(c.summary)}</span>
          ${c.id !== p.category && first ? `<a href="${productUrl(first)}" aria-label="${esc(c.label)}: ${esc(first.name)}"></a>` : ''}
        </div>`;
      }).join('')}</div>
      <ol class="flow-notes">${p.workflow.map((w) => `<li>${esc(w)}</li>`).join('')}</ol>
    </section>

    <section class="pd-section" id="gallery" aria-labelledby="gl-title">
      <div class="section-head"><p class="eyebrow">Gallery</p><h2 id="gl-title">Every angle.</h2></div>
      <div class="gallery">
        ${p.images.gallery.map((g) => `<figure class="gallery__item" data-reveal data-reveal-stagger><button type="button" data-zoom="${esc(g.src)}" data-alt="${esc(g.alt)}" style="position:absolute;inset:0" aria-label="Enlarge: ${esc(g.alt)}"></button><img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy"><figcaption>${g.credit ? `Official image · ${esc(g.credit)}` : 'Product photo'}</figcaption></figure>`).join('')}
        ${['three-quarter', 'front', 'side', 'top'].map((v) => `<figure class="gallery__item gallery__item--angle" data-reveal data-reveal-stagger><button type="button" class="tool-btn" data-goto-view="${v}">View ${v.replace('-', ' ')} in 3D</button><figcaption>Interactive 3D model</figcaption></figure>`).join('')}
      </div>
    </section>

    <section class="pd-section" id="sources" aria-labelledby="src-title">
      <div class="sources">
        <div>
          <p class="eyebrow">Sources</p>
          <h2 id="src-title" style="margin:1rem 0 1.4rem">Where the data comes from.</h2>
          <ul>
            <li><a href="${esc(p.sources.official)}" target="_blank" rel="noopener">Official ${esc(p.manufacturer)} product page ↗</a></li>
            ${p.sources.supporting.map((s) => `<li><a href="${esc(s)}" target="_blank" rel="noopener">${esc(shortUrl(s))} ↗</a></li>`).join('')}
          </ul>
        </div>
        <div class="notice">
          <div>
            <strong>About this 3D model.</strong>
            <p style="margin-top:.4rem">IDT built this model from ${esc(p.manufacturer)}'s official ${Object.keys(p.model3d.views || {}).filter((k) => !p.model3d.views[k].mirror).join(', ')} views${p.model3d.dimensionsMm ? `, at ${p.model3d.dimensionsMm.w} × ${p.model3d.dimensionsMm.h} × ${p.model3d.dimensionsMm.d} mm (W × H × D)` : ''}. Its surfaces are textured by projecting those views onto the geometry. Areas no official view shows${p.model3d.views?.back ? '' : ', such as the rear,'} are simplified, and interiors are illustrative. Rely on the product photos and specifications for exact details.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="pd-section reviews" id="reviews" aria-labelledby="rv-section-title">
      <div class="section-head"><p class="eyebrow">Reviews</p><h2 id="rv-section-title">What labs say about the ${esc(p.model)}.</h2></div>
      <div data-reviews></div>
    </section>

    <section class="pd-section" aria-labelledby="rel-title" style="border-bottom:0">
      <div class="section-head section-head--split"><div><p class="eyebrow">Related</p><h2 id="rel-title">Complete the workflow.</h2></div></div>
      <div class="product-grid">${related.map((r) => productCard(r, products.indexOf(r))).join('')}</div>
    </section>

    <section class="pd-section" style="border-bottom:0;padding-top:0">
      <div class="pd-cta">
        <div><h2>Interested in the ${esc(p.model)}?</h2><p>Ask us for configuration, pricing, lead time and installation details.</p></div>
        <a class="btn btn--dark" href="${inquiryUrl(p)}">Request a quote <span class="arrow" aria-hidden="true">→</span></a>
      </div>
    </section>
  </div>`;

  initViewer(p);
  initSectionNav();
  initLightbox();
  mountReviews($('[data-reviews]'), { products, productId: p.id });
  initReveals();
}

function initViewer(p) {
  const viewer = createViewer($('[data-viewer]'), { interactive: true, frame: { x: 0, y: 0, zoom: 0.86 } });
  viewer.setProduct(p, { immediate: true });
  const viewBtns = $$('[data-view]');
  const setPressed = (name) => viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  const auto = $('[data-autorotate]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  auto.setAttribute('aria-pressed', String(!reduced));

  viewBtns.forEach((b) => b.addEventListener('click', () => {
    viewer.setView(b.dataset.view);
    setPressed(b.dataset.view);
    auto.setAttribute('aria-pressed', 'false');
  }));
  auto.addEventListener('click', () => auto.setAttribute('aria-pressed', String(viewer.toggleAutoRotate())));
  viewer.onChange = (type, value) => {
    if (type === 'autorotate') { auto.setAttribute('aria-pressed', String(value)); setPressed(null); }
    if (type === 'product') {
      const demo = viewer.model?.userData.demo;
      const btn = $('[data-demo]');
      if (btn) { if (demo) btn.textContent = demo.label; else btn.hidden = true; }
    }
  };
  $('[data-demo]')?.addEventListener('click', (e) => e.currentTarget.setAttribute('aria-pressed', String(viewer.toggleDemo())));
  $$('[data-goto-view]').forEach((b) => b.addEventListener('click', () => {
    $('.pd-stage').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    viewer.setView(b.dataset.gotoView);
    setPressed(b.dataset.gotoView);
  }));
}

function initSectionNav() {
  const links = $$('.pd-nav__inner a[href^="#"]');
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-active'));
      map.get(e.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  map.forEach((_, sid) => { const s = document.getElementById(sid); if (s) io.observe(s); });
}

function initLightbox() {
  const box = $('[data-lightbox]');
  const img = $('img', box);
  let opener = null;
  const close = () => { box.hidden = true; opener?.focus(); };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-zoom]');
    if (!b) return;
    opener = b;
    img.src = b.dataset.zoom;
    img.alt = b.dataset.alt;
    box.hidden = false;
    $('[data-lightbox-close]').focus();
  });
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('[data-lightbox-close]')) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });
}

function renderNotFound(products) {
  document.title = 'Product not found — IDT';
  root.innerHTML = `
    <div class="container not-found">
      <p class="eyebrow">404</p>
      <h1>We couldn't find that product.</h1>
      <p class="lead">It may have been renamed or removed. Here's the current range:</p>
      <div class="product-grid" style="margin-top:2rem">${products.map(productCard).join('')}</div>
    </div>`;
  initReveals();
}

function shortUrl(u) {
  try { const x = new URL(u); return x.hostname.replace('www.', '') + decodeURIComponent(x.pathname).slice(0, 48) + (x.pathname.length > 48 ? '…' : ''); } catch { return u; }
}
