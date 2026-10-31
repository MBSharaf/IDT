// Site header, mobile menu and footer, injected into every page.
import { $, esc } from '../core/dom.js';
import { site } from '../core/site.js';
import { renderWhatsApp } from './whatsapp.js';
import { socialLinks } from './social.js';
import { t, isAr, applyI18n, setLang, setTheme, theme } from '../core/i18n.js';

const NAV = [
  { href: 'index.html', label: 'Home', key: 'home' },
  { href: 'products.html', label: 'Products', key: 'products' },
  { href: 'about.html', label: 'About IDT', key: 'about' },
  { href: 'contact.html', label: 'Contact', key: 'contact' },
];

const digits = (v) => v.replace(/[^\d]/g, '');

export function renderHeader(active) {
  applyI18n();
  const links = NAV.map((n) => `<li><a class="nav__link" href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${t(n.label)}</a></li>`).join('');
  const mobile = NAV.map((n, i) => `<a class="mobile-menu__link" href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}><small>0${i + 1}</small>${t(n.label)}</a>`).join('');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="container site-header__inner">
      <a class="brand" href="index.html" aria-label="${t('IDT — Integrated Dental Technologies, home')}">
        <span class="brand__logo" aria-hidden="true"></span><span class="brand__mark">I<span>D</span>T</span>
        <span class="brand__name">Integrated<br>Dental Technologies</span>
      </a>
      <nav class="nav" aria-label="${t('Main')}"><ul class="nav__list">${links}</ul></nav>
      <div class="header-actions">
        ${prefButtons()}
        <a class="btn btn--sm" href="contact.html#inquiry">${t('Request a quote')} <span class="arrow" aria-hidden="true">→</span></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu"><span></span><span class="visually-hidden">${t('Menu')}</span></button>
      </div>
    </div>`;
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'mobile-menu';
  menu.setAttribute('aria-label', t('Main'));
  menu.innerHTML = `<nav>${mobile}</nav>
    <a class="btn" href="contact.html#inquiry" style="align-self:flex-start">${t('Request a quote')} <span class="arrow" aria-hidden="true">→</span></a>
    <div style="margin-top:auto;display:grid;gap:1rem">${socialLinks({ withLabels: true })}<div class="muted mono" style="font-size:.75rem">${esc(site.email)}</div></div>`;

  document.body.prepend(header, menu);
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main';
  skip.textContent = t('Skip to content');
  document.body.prepend(skip);

  bindPrefs(header);
  const toggle = $('.menu-toggle', header);
  const setOpen = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    menu.inert = !open;
  };
  menu.inert = true;
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });

  // Scrolled state + hide on scroll down, reveal on scroll up.
  let last = scrollY;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 24);
    header.classList.toggle('is-hidden', y > 400 && y > last + 4 && !document.documentElement.classList.contains('menu-open'));
    if (y < last - 4) header.classList.remove('is-hidden');
    document.documentElement.classList.toggle('header-hidden', header.classList.contains('is-hidden'));
    last = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/></svg>';

// Language switch (labelled with the other language) and light/dark switch.
function prefButtons() {
  return `<div class="prefs">
    <button class="pref-btn pref-btn--lang" type="button" data-lang-toggle lang="${isAr ? 'en' : 'ar'}" aria-label="${isAr ? 'English' : 'العربية'}">${isAr ? 'EN' : 'ع'}</button>
    <button class="pref-btn" type="button" data-theme-toggle><span class="pref-btn__icon pref-btn__icon--sun">${SUN}</span><span class="pref-btn__icon pref-btn__icon--moon">${MOON}</span></button>
  </div>`;
}

function bindPrefs(root) {
  $('[data-lang-toggle]', root).addEventListener('click', () => setLang(isAr ? 'en' : 'ar'));
  const btn = $('[data-theme-toggle]', root);
  const label = () => btn.setAttribute('aria-label', t(theme() === 'light' ? 'Switch to dark mode' : 'Switch to light mode'));
  label();
  btn.addEventListener('click', () => { setTheme(theme() === 'light' ? 'dark' : 'light'); label(); });
}

export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <a class="brand" href="index.html"><span class="brand__logo" aria-hidden="true"></span><span class="brand__mark">I<span>D</span>T</span><span class="brand__name">Integrated<br>Dental Technologies</span></a>
          <p class="muted" style="margin-top:1.2rem;max-width:36ch;font-size:.9rem">${t('Scanning, milling, sintering, porcelain firing and 3D printing equipment for dental laboratories.')}</p>
          <div style="margin-top:1.4rem">${socialLinks()}</div>
        </div>
        <div class="footer-col"><h4>${t('Explore')}</h4><ul>
          <li><a href="products.html">${t('All products')}</a></li>
          <li><a href="products.html?category=scanning">${t('Scanning')}</a></li>
          <li><a href="products.html?category=milling">${t('CAD/CAM milling')}</a></li>
          <li><a href="products.html?category=sintering">${t('Sintering')}</a></li>
          <li><a href="products.html?category=porcelain">${t('Porcelain firing')}</a></li>
          <li><a href="products.html?category=printing">${t('3D printing')}</a></li>
        </ul></div>
        <div class="footer-col"><h4>${t('Company')}</h4><ul>
          <li><a href="about.html">${t('About IDT')}</a></li>
          <li><a href="contact.html#inquiry">${t('Product inquiry')}</a></li>
          <li><a href="contact.html">${t('Contact')}</a></li>
        </ul></div>
        <div class="footer-col"><h4>${t('Contact')}</h4><ul>
          <li><a href="mailto:${esc(site.email)}" dir="ltr">${esc(site.email)}</a></li>
          <li><a href="tel:+${digits(site.phone)}" dir="ltr">${esc(site.phone)}</a></li>
          <li><a href="https://wa.me/${digits(site.whatsapp)}" target="_blank" rel="noopener">${t('WhatsApp')}: <span dir="ltr">${esc(site.whatsapp)}</span></a></li>
          <li><span class="muted">${esc(t(site.address))}</span></li>
        </ul></div>
      </div>
      <div class="footer-wordmark" aria-hidden="true">IDT</div>
      <div class="footer-bottom">
        <span>© <span data-year></span> ${esc(site.legalName)}. ${t('All rights reserved.')}</span>
        <span>${t('Product names and trademarks belong to their respective manufacturers. Specifications are as published by each manufacturer.')}</span>
      </div>
      <div class="credit">
        <span class="credit__badge" data-tilt dir="ltr">
          <span class="credit__beam" aria-hidden="true"></span>
          <span class="credit__by">Powered by</span>
          <span class="credit__name" data-text="PHAROSLINE">PHAROSLINE</span>
          <span class="credit__tag">Agency</span>
        </span>
      </div>
    </div>`;
  document.body.append(footer);
  footer.querySelector('[data-year]').textContent = new Date().getFullYear();
  tiltCredit(footer.querySelector('[data-tilt]'));
  renderWhatsApp();
}

// Agency credit: the badge leans towards the pointer (CSS 3D, no WebGL).
function tiltCredit(el) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(x * 22).toFixed(1)}deg`);
    el.style.setProperty('--rx', `${(-y * 18).toFixed(1)}deg`);
  });
  el.addEventListener('pointerleave', () => { el.style.removeProperty('--ry'); el.style.removeProperty('--rx'); });
}
