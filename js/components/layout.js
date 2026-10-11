// Site header, mobile menu and footer, injected into every page.
import { $, esc } from '../core/dom.js';
import { site } from '../core/site.js';
import { renderWhatsApp } from './whatsapp.js';
import { socialLinks } from './social.js';

const NAV = [
  { href: 'index.html', label: 'Home', key: 'home' },
  { href: 'products.html', label: 'Products', key: 'products' },
  { href: 'about.html', label: 'About IDT', key: 'about' },
  { href: 'contact.html', label: 'Contact', key: 'contact' },
];

export function renderHeader(active) {
  const links = NAV.map((n) => `<li><a class="nav__link" href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('');
  const mobile = NAV.map((n, i) => `<a class="mobile-menu__link" href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}><small>0${i + 1}</small>${n.label}</a>`).join('');
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="container site-header__inner">
      <a class="brand" href="index.html" aria-label="IDT — Integrated Dental Technologies, home">
        <span class="brand__logo" aria-hidden="true"></span><span class="brand__mark">I<span>D</span>T</span>
        <span class="brand__name">Integrated<br>Dental Technologies</span>
      </a>
      <nav class="nav" aria-label="Main"><ul class="nav__list">${links}</ul></nav>
      <div class="header-actions">
        <a class="btn btn--sm" href="contact.html#inquiry">Request a quote <span class="arrow" aria-hidden="true">→</span></a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu"><span></span><span class="visually-hidden">Menu</span></button>
      </div>
    </div>`;
  const menu = document.createElement('div');
  menu.className = 'mobile-menu';
  menu.id = 'mobile-menu';
  menu.setAttribute('aria-label', 'Main');
  menu.innerHTML = `<nav>${mobile}</nav>
    <a class="btn" href="contact.html#inquiry" style="align-self:flex-start">Request a quote <span class="arrow" aria-hidden="true">→</span></a>
    <div style="margin-top:auto;display:grid;gap:1rem">${socialLinks({ withLabels: true })}<div class="muted mono" style="font-size:.75rem">${esc(site.email)}</div></div>`;

  document.body.prepend(header, menu);
  const skip = document.createElement('a');
  skip.className = 'skip-link';
  skip.href = '#main';
  skip.textContent = 'Skip to content';
  document.body.prepend(skip);

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

export function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <a class="brand" href="index.html"><span class="brand__logo" aria-hidden="true"></span><span class="brand__mark">I<span>D</span>T</span><span class="brand__name">Integrated<br>Dental Technologies</span></a>
          <p class="muted" style="margin-top:1.2rem;max-width:36ch;font-size:.9rem">Scanning, milling, sintering and porcelain firing equipment for dental laboratories.</p>
          <div style="margin-top:1.4rem">${socialLinks()}</div>
        </div>
        <div class="footer-col"><h4>Explore</h4><ul>
          <li><a href="products.html">All products</a></li>
          <li><a href="products.html?category=scanning">Lab scanning</a></li>
          <li><a href="products.html?category=milling">CAD/CAM milling</a></li>
          <li><a href="products.html?category=sintering">Sintering</a></li>
          <li><a href="products.html?category=porcelain">Porcelain firing</a></li>
        </ul></div>
        <div class="footer-col"><h4>Company</h4><ul>
          <li><a href="about.html">About IDT</a></li>
          <li><a href="contact.html#inquiry">Product inquiry</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul></div>
        <div class="footer-col"><h4>Contact</h4><ul>
          <li><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></li>
          <li><a href="tel:+${site.phone.replace(/[^\d]/g, '')}">${esc(site.phone)}</a></li>
          <li><a href="https://wa.me/${site.whatsapp.replace(/[^\d]/g, '')}" target="_blank" rel="noopener">WhatsApp: ${esc(site.whatsapp)}</a></li>
          <li><span class="muted">${esc(site.address)}</span></li>
        </ul></div>
      </div>
      <div class="footer-wordmark" aria-hidden="true">IDT</div>
      <div class="footer-bottom">
        <span>© <span data-year></span> ${esc(site.legalName)}. All rights reserved.</span>
        <span>Product names and trademarks belong to their respective manufacturers. Specifications are as published by each manufacturer.</span>
      </div>
    </div>`;
  document.body.append(footer);
  footer.querySelector('[data-year]').textContent = new Date().getFullYear();
  renderWhatsApp();
}
