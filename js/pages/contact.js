// Contact & inquiry page. Frontend only: the form validates and prepares an inquiry, then hands off
// to email. To connect a backend later, implement `submitInquiry` (see js/services/inquiry.js).
import { renderHeader, renderFooter } from '../components/layout.js';
import { $, $$, esc } from '../core/dom.js';
import { getProducts } from '../core/data.js';
import { site, isPlaceholder } from '../core/site.js';
import { boot, initReveals } from '../core/motion.js';
import { buildInquiry, submitInquiry, inquiryToText } from '../services/inquiry.js';
import { socialLinks } from '../components/social.js';
import { t } from '../core/i18n.js';

renderHeader('contact');
renderFooter();
boot();
initReveals();

// [label, value, link, keep left-to-right]
const contactRows = [['Email', site.email, `mailto:${site.email}`, true], ['Phone', site.phone, `tel:+${site.phone.replace(/[^\d]/g, '')}`, true], ['WhatsApp', site.whatsapp, `https://wa.me/${site.whatsapp.replace(/[^\d]/g, '')}`, true], ['Address', t(site.address)], ['Hours', t(site.hours)]];
$('[data-contact]').innerHTML = contactRows.map(([k, v, href, ltr]) => `<div><dt>${esc(t(k))}</dt><dd>${
  isPlaceholder(v) ? `<span class="placeholder">${esc(v)}</span>` : href ? `<a href="${esc(href)}"${ltr ? ' dir="ltr"' : ''}>${esc(v)}</a>` : esc(v)
}</dd></div>`).join('') + (site.socials?.length ? `<div><dt>${t('Follow us')}</dt><dd style="margin-top:.6rem">${socialLinks({ withLabels: true })}</dd></div>` : '');

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
    <label class="check"><input type="checkbox" name="products" value="advice"><span><strong style="font-weight:600">${t('Not sure yet')}</strong><br><span class="muted" style="font-size:.8rem">${t('Recommend a setup')}</span></span></label>`;
} catch (err) {
  $('[data-products]').innerHTML = `<p class="muted">${t('Product list unavailable ({error}). Mention products in your message.', { error: esc(err.message) })}</p>`;
}

const rules = {
  products: (fd) => (fd.getAll('products').length || !$('[data-products] input') ? '' : t('Select at least one product (or "Not sure yet").')),
  name: (fd) => (fd.get('name').trim().length >= 2 ? '' : t('Please enter your name.')),
  company: (fd) => (fd.get('company').trim() ? '' : t('Please enter your laboratory or company.')),
  email: (fd) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fd.get('email').trim()) ? '' : t('Please enter a valid email address.')),
  phone: (fd) => (!fd.get('phone') || /^[+()\d\s-]{6,}$/.test(fd.get('phone')) ? '' : t('Use digits, spaces, + ( ) or -.')),
  consent: (fd) => (fd.get('consent') ? '' : t('Please confirm consent so we can reply.')),
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
  submitBtn.textContent = t('Sending…');
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
    ? `<div><strong>${t('Thank you, {name} — your inquiry has been sent.', { name: esc(inquiry.name.split(' ')[0]) })}</strong> ${t("We've sent a confirmation to {email}, and our team will reply shortly.", { email: `<span dir="ltr">${esc(inquiry.email)}</span>` })}</div>`
    : `<div><strong>${t("We couldn't send your inquiry automatically.")}</strong> <span>${t('Please send it by e-mail or WhatsApp using the buttons below, or copy the summary.')}</span></div>`;
  $('[data-wa]').href = `https://wa.me/${site.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;
  $('[data-edit]').textContent = t(outcome.delivered ? 'Send another inquiry' : 'Edit inquiry');
  if (outcome.delivered) form.reset();
  form.hidden = true;
  result.hidden = false;
  result.focus();
});

$('[data-copy]').addEventListener('click', async (e) => {
  try { await navigator.clipboard.writeText($('[data-summary]').textContent); e.currentTarget.textContent = t('Copied ✓'); } catch { e.currentTarget.textContent = t('Copy unavailable'); }
});
$('[data-edit]').addEventListener('click', () => { result.hidden = true; form.hidden = false; $$('input', form)[0]?.focus(); });
