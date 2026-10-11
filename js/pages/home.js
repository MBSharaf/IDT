// Home page controller: hero product slider, scroll-linked 3D, workflow stage, featured grid.
import { renderHeader, renderFooter } from '../components/layout.js';
import { productCard } from '../components/productCard.js';
import { accordion, bindAccordions } from '../components/accordion.js';
import { $, $$, esc, pad2, showError } from '../core/dom.js';
import { getWorkflowLineup, getProducts, productUrl, inquiryUrl } from '../core/data.js';
import { boot, getGsap, reduced, splitChars, initReveals } from '../core/motion.js';
import { createViewer } from '../three/viewer.js';
import { mountReviews } from '../components/reviews.js';

renderHeader('home');
renderFooter();
boot();

const AUTOPLAY_MS = 7000;

try {
  const [lineup, products] = await Promise.all([getWorkflowLineup(), getProducts()]);
  initHero(lineup);
  initWorkflow(lineup);
  $('[data-featured]').innerHTML = products.map(productCard).join('');
  initReveals();
  // Reviews come from the Google Sheet; fetch them once the page is idle so they never delay the hero.
  const loadReviews = () => mountReviews($('[data-reviews]'), { products });
  if ('requestIdleCallback' in window) requestIdleCallback(loadReviews, { timeout: 2500 });
  else setTimeout(loadReviews, 1200);
} catch (err) {
  console.error(err);
  showError('[data-featured]', err.message);
}

/* ------------------------------------------------------------------ HERO */
function initHero(lineup) {
  const viewer = createViewer($('#hero-viewer'), { floaters: true, frame: { x: 0, y: -0.02, zoom: 0.72 } });
  const wordEl = $('[data-hero-word]');
  const numEl = $('[data-hero-num]');
  const stepsEl = $('[data-hero-steps]');
  const listEl = $('[data-hero-list]');
  const gs = getGsap();
  let index = Math.max(0, lineup.findIndex((x) => x.category.id === 'milling'));
  let timer = 0;
  let autoplay = !reduced;

  $('[data-hero-total]').textContent = pad2(lineup.length);
  stepsEl.innerHTML = lineup.map((x, i) => `
    <button class="hero__step" type="button" role="tab" aria-selected="false" data-i="${i}">
      ${pad2(i + 1)} ${esc(x.product.verb.toLowerCase())}<span class="hero__step-bar"></span>
    </button>`).join('');

  fitWord(lineup.map((x) => x.product.verb));
  addEventListener('resize', () => fitWord(lineup.map((x) => x.product.verb)));

  function render(i, first = false) {
    const { product: p } = lineup[i];
    index = i;
    numEl.textContent = pad2(i + 1);
    $('[data-hero-name]').textContent = `${p.manufacturer} ${p.model}`;
    $('[data-hero-tagline]').textContent = p.tagline;
    $('[data-hero-link]').href = productUrl(p);
    $('[data-hero-link]').setAttribute('aria-label', `View the ${p.name} in 3D`);
    listEl.innerHTML = accordion([
      { title: 'Key figures', html: p.highlights.map((h) => `<div class="fig"><span>${esc(h.label)}</span><strong>${esc(h.value)} ${esc(h.unit)}</strong></div>`).join('') },
      { title: 'Why labs choose it', text: p.labValue[0] },
      { title: 'Buying options', html: `<p>Ask us for configuration, pricing and lead times. <br><a class="link-arrow" href="${inquiryUrl(p)}">Request a quote <span aria-hidden="true">→</span></a></p>` },
    ], { openFirst: true });
    bindAccordions(listEl);
    $$('.hero__step', stepsEl).forEach((b, bi) => {
      b.setAttribute('aria-selected', String(bi === i));
      const bar = $('.hero__step-bar', b);
      bar.classList.remove('is-running');
      if (bi === i && autoplay) { void bar.offsetWidth; bar.classList.add('is-running'); }
    });
    swapWord(p.verb, first);
    viewer.setProduct(p, { immediate: first });
    schedule();
  }

  // The word's resting colour as a concrete rgb() string (GSAP can't interpolate color-mix()).
  const WORD_BASE = 'rgb(72, 71, 74)';
  function swapWord(text, first) {
    if (!gs || first) {
      wordEl.textContent = text;
      if (gs) gs.gsap.from(splitChars(wordEl), { yPercent: 150, duration: 1.1, ease: 'expo.out', stagger: 0.045, delay: 0.15 });
      return;
    }
    const old = $$('.char', wordEl);
    gs.gsap.killTweensOf(old);
    gs.gsap.to(old, {
      yPercent: -150, duration: 0.45, ease: 'power3.in', stagger: 0.03,
      onComplete: () => {
        wordEl.textContent = text;
        const chars = splitChars(wordEl);
        gs.gsap.fromTo(chars, { yPercent: 150 }, { yPercent: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04 });
        gs.gsap.fromTo(chars, { color: '#D9AD55' }, { color: WORD_BASE, duration: 1.4, ease: 'power2.out', stagger: 0.04, clearProps: 'color' });
      },
    });
    gs.gsap.fromTo(numEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: 'expo.out' });
  }

  function schedule() {
    clearTimeout(timer);
    document.documentElement.style.setProperty('--autoplay-ms', `${AUTOPLAY_MS}ms`);
    if (autoplay) timer = setTimeout(() => render((index + 1) % lineup.length), AUTOPLAY_MS);
  }
  const stopAutoplay = () => {
    autoplay = false;
    clearTimeout(timer);
    $$('.hero__step-bar').forEach((b) => b.classList.remove('is-running'));
  };

  $('[data-hero-next]').addEventListener('click', () => { stopAutoplay(); render((index + 1) % lineup.length); });
  $('[data-hero-prev]').addEventListener('click', () => { stopAutoplay(); render((index - 1 + lineup.length) % lineup.length); });
  stepsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.hero__step');
    if (!b) return;
    stopAutoplay();
    render(+b.dataset.i);
  });
  stepsEl.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    stopAutoplay();
    const n = (index + (e.key === 'ArrowRight' ? 1 : -1) + lineup.length) % lineup.length;
    render(n);
    $$('.hero__step', stepsEl)[n].focus();
  });
  $('#hero').addEventListener('focusin', stopAutoplay);
  // Pause autoplay off-screen.
  new IntersectionObserver(([e]) => { if (!e.isIntersecting) clearTimeout(timer); else if (autoplay) schedule(); }).observe($('#hero'));

  render(index, true);

  // Cinematic scroll-out: product turns and recedes, materials disperse, type drifts.
  if (gs) {
    const { gsap } = gs;
    // Intro animates inner elements; the scroll scene animates their containers (no shared props).
    gsap.from(['.hero__num', '.hero__copy > *', '.hero__list > *', '.hero__controls > *'], { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06, delay: 0.2 });
    gsap.timeline({ scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.8 } })
      .to(viewer.state, { spin: 1.4, scale: 0.86, lift: -0.08, spread: 1, ease: 'none' }, 0)
      .to('.hero__word-wrap', { yPercent: 40, opacity: 0.25, ease: 'none' }, 0)
      .to(['.hero__copy', '.hero__list', '.hero__controls', '.hero__index'], { y: -80, opacity: 0, ease: 'none', stagger: 0.02 }, 0);
  }
}

/** Sizes the giant verb so the longest word spans the stage width. */
function fitWord(words) {
  const wrap = $('.hero__word-wrap');
  const probe = document.createElement('span');
  probe.className = 'hero__word';
  Object.assign(probe.style, { position: 'absolute', visibility: 'hidden', fontSize: '100px' });
  probe.textContent = words.reduce((a, b) => (b.length > a.length ? b : a), '');
  document.body.append(probe);
  const w100 = probe.getBoundingClientRect().width;
  probe.remove();
  const size = Math.min((wrap.clientWidth * 0.99 / w100) * 100, innerHeight * 0.34);
  document.documentElement.style.setProperty('--hero-word-size', `${size}px`);
}

/* ------------------------------------------------------------------ WORKFLOW */
function initWorkflow(lineup) {
  const bundle = $('[data-bundle]');
  bundle.innerHTML = lineup.map((x, i) => `
    ${i ? '<span class="bundle__plus" aria-hidden="true">+</span>' : ''}
    <a class="bundle__item" href="#wstep-${i}" title="${esc(x.category.label)}: ${esc(x.product.manufacturer)} ${esc(x.product.model)}">
      <img src="${esc(x.product.images.hero)}" alt="${esc(x.product.manufacturer)} ${esc(x.product.model)}" loading="lazy" width="84" height="84">
    </a>`).join('');

  $('[data-workflow-steps]').innerHTML = lineup.map(({ category: c, product: p }, i) => `
    <li class="wstep" id="wstep-${i}" data-i="${i}">
      <span class="wstep__step">Step ${pad2(i + 1)} · ${esc(c.label)}</span>
      <span class="wstep__verb">${esc(p.verb)}</span>
      <h3 class="wstep__name">${esc(p.manufacturer)} ${esc(p.name)}</h3>
      <p>${esc(c.summary)} ${esc(p.labValue[0])}</p>
      <div class="wstep__facts">${p.highlights.map((h) => `<div class="wstep__fact"><strong>${esc(h.value)}<small>${esc(h.unit.length <= 4 ? h.unit : '')}</small></strong><span>${esc(h.label)}${h.unit.length > 4 ? ` · ${esc(h.unit)}` : ''}</span></div>`).join('')}</div>
      <div class="wstep__links">
        <a class="btn btn--sm" href="${productUrl(p)}">Explore in 3D <span class="arrow" aria-hidden="true">→</span></a>
        <a class="btn btn--ghost btn--sm" href="${inquiryUrl(p)}">Inquire</a>
      </div>
    </li>`).join('');

  const host = $('#workflow-viewer');
  let viewer = null;
  let active = -1;
  const steps = $$('.wstep');
  const bundleItems = $$('.bundle__item', bundle);

  const activate = (i) => {
    if (i === active) return;
    active = i;
    steps.forEach((s, si) => s.classList.toggle('is-active', si === i));
    bundleItems.forEach((b, bi) => b.classList.toggle('is-active', bi === i));
    viewer?.setProduct(lineup[i].product);
  };

  // Create the second WebGL scene only when the section approaches the viewport.
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    // Scroll drives the rotation here; no idle spin on top of it.
    viewer = createViewer(host, { idleSpin: false, frame: { x: 0, y: 0.03, zoom: 1.05 } });
    viewer.setProduct(lineup[Math.max(active, 0)].product, { immediate: true });
  }, { rootMargin: '400px' }).observe(host);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) activate(+e.target.dataset.i); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));
  activate(0);

  // Scroll-linked turntable + progress meter across the whole step list.
  const list = $('[data-workflow-steps]');
  const meter = $('[data-workflow-meter]');
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = list.getBoundingClientRect();
    const total = r.height - innerHeight * 0.5;
    const p = Math.min(1, Math.max(0, (innerHeight * 0.5 - r.top) / total));
    meter.style.transform = `scaleX(${p})`;
    // Sway around the front three-quarter view (never past the sides), so the product's face stays visible.
    if (viewer && !reduced) viewer.state.spin = Math.sin(p * Math.PI * 4) * 0.4;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
