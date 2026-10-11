// Contact & inquiry page. Frontend only: the form validates and prepares an inquiry, then hands off
// to email. To connect a backend later, implement `submitInquiry` (see js/services/inquiry.js).
import { renderHeader, renderFooter } from '../components/layout.js';
import { $, $$, esc } from '../core/dom.js';
import { getProducts } from '../core/data.js';
import { site, isPlaceholder } from '../core/site.js';
import { boot, initReveals } from '../core/motion.js';
import { buildInquiry, submitInquiry, inquiryToText } from '../services/inquiry.js';
import { socialLinks } from '../components/social.js';

renderHeader('contact');
renderFooter();
boot();
initReveals();

const contactRows = [['Email', site.email, `mailto:${site.email}`], ['Phone', site.phone, `tel:+${site.phone.replace(/[^\d]/g, '')}`], ['WhatsApp', site.whatsapp, `https://wa.me/${site.whatsapp.replace(/[^\d]/g, '')}`], ['Address', site.address], ['Hours', site.hours]];
$('[data-contact]').innerHTML = contactRows.map(([k, v, href]) => `<div><dt>${esc(k)}</dt><dd>${
  isPlaceholder(v) ? `<span class="placeholder">${esc(v)}</span>` : href ? `<a href="${esc(href)}">${esc(v)}</a>` : esc(v)
}</dd></div>`).join('') + (site.socials?.length ? `<div><dt>Follow us</dt><dd style="margin-top:.6rem">${socialLinks({ withLabels: true })}</dd></div>` : '');

const form = $('[data-form]');
const result = $('[data-result]');
const preselect = new URLSearchParams(location.search).get('product');
let catalog = [];

try {
  const products = await getProducts();
  catalog = products;
  $('[data-products]').innerHTML = products.map((p) => `
    <label class="check"><input type="checkbox" name="products" value="${esc(p.id)}"${p.id === preselect ? ' checked' : ''}>
      <span><strong style="font-weight:600">${esc(p.manufacturer)} ${esc(p.model)}</strong><br><span class="muted" style="font-size:.8rem">${esc(p.categoryLabel)}</span></span>
    </label>`).join('') + `
    <label class="check"><input type="checkbox" name="products" value="advice"><span><strong style="font-weight:600">Not sure yet</strong><br><span class="muted" style="font-size:.8rem">Recommend a setup</span></span></label>`;
} catch (err) {
  $('[data-products]').innerHTML = `<p class="muted">Product list unavailable (${esc(err.message)}). Mention products in your message.</p>`;
}

const rules = {
  products: (fd) => (fd.getAll('products').length || !$('[data-products] input') ? '' : 'Select at least one product (or "Not sure yet").'),
  name: (fd) => (fd.get('name').trim().length >= 2 ? '' : 'Please enter your name.'),
  company: (fd) => (fd.get('company').trim() ? '' : 'Please enter your laboratory or company.'),
  email: (fd) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fd.get('email').trim()) ? '' : 'Please enter a valid email address.'),
  phone: (fd) => (!fd.get('phone') || /^[+()\d\s-]{6,}$/.test(fd.get('phone')) ? '' : 'Use digits, spaces, + ( ) or -.'),
  consent: (fd) => (fd.get('consent') ? '' : 'Please confirm consent so we can reply.'),
};

function validate() {
  const fd = new FormData(form);
  let firstInvalid = null;
  Object.entries(rules).forEach(([name, rule]) => {
    const msg = rule(fd);
    const err = $(`[data-error-for="${name}"]`);
    if (err) err.textContent = msg;
    const input = name === 'products' ? null : form.elements[name];
    input?.setAttribute('aria-invalid', String(!!msg));
    if (msg && !firstInvalid) firstInvalid = name === 'products' ? $('[data-products] input') : input;
  });
  return { fd, firstInvalid };
}

form.addEventListener('input', (e) => {
  const name = e.target.name;
  const err = $(`[data-error-for="${name}"]`);
  if (rules[name] && err?.textContent) {
    const msg = rules[name](new FormData(form));
    err.textContent = msg;
    if (name !== 'products') e.target.setAttribute('aria-invalid', String(!!msg));
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { fd, firstInvalid } = validate();
  if (firstInvalid) { firstInvalid.focus(); return; }
  const submitBtn = form.querySelector('[type="submit"]');
  const btnHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';
  const inquiry = buildInquiry(fd, catalog);
  const outcome = await submitInquiry(inquiry);
  submitBtn.disabled = false;
  submitBtn.innerHTML = btnHtml;
  const text = inquiryToText(inquiry);
  $('[data-summary]').textContent = text;
  const subject = `Product inquiry — ${inquiry.company}`;
  $('[data-mailto]').href = `mailto:${isPlaceholder(site.email) ? '' : site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  // Sent: show a thank-you only. Not sent (no endpoint / network error): offer e-mail, copy and WhatsApp.
  result.classList.toggle('is-sent', outcome.delivered);
  $('.form-result .notice').innerHTML = outcome.delivered
    ? `<div><strong>Thank you, ${esc(inquiry.name.split(' ')[0])} — your inquiry has been sent.</strong> We've sent a confirmation to ${esc(inquiry.email)}, and our team will reply shortly.</div>`
    : '<div><strong>We couldn\'t send your inquiry automatically.</strong> <span>Please send it by e-mail or WhatsApp using the buttons below, or copy the summary.</span></div>';
  $('[data-wa]').href = `https://wa.me/${site.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;
  $('[data-edit]').textContent = outcome.delivered ? 'Send another inquiry' : 'Edit inquiry';
  if (outcome.delivered) form.reset();
  form.hidden = true;
  result.hidden = false;
  result.focus();
});

$('[data-copy]').addEventListener('click', async (e) => {
  try { await navigator.clipboard.writeText($('[data-summary]').textContent); e.currentTarget.textContent = 'Copied ✓'; } catch { e.currentTarget.textContent = 'Copy unavailable'; }
});
$('[data-edit]').addEventListener('click', () => { result.hidden = true; form.hidden = false; $$('input', form)[0]?.focus(); });
