// Customer reviews: approved-review cards + a "Write a review" dialog.
// Submitted reviews go to the Google Sheet as "Pending" and only appear once set to "Approved".
import { $, $$, esc } from '../core/dom.js';
import { getApprovedReviews, submitReview } from '../services/reviews.js';

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>';
const stars = (n) => `<span class="stars" role="img" aria-label="${n} out of 5 stars">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= n ? 'is-on' : ''}">${STAR}</span>`).join('')}</span>`;

/**
 * Renders the reviews block into `host`.
 * @param {HTMLElement} host
 * @param {object} opts  products: catalog list; productId: limit to one product; limit: max cards
 */
export async function mountReviews(host, { products = [], productId = null, limit = 6 } = {}) {
  host.innerHTML = `
    <div class="reviews__summary" data-rv-summary aria-live="polite"><span class="muted">Loading reviews…</span></div>
    <div class="reviews__grid" data-rv-grid></div>
    <div class="reviews__actions"><button class="btn" type="button" data-rv-open>Write a review <span class="arrow" aria-hidden="true">→</span></button></div>`;
  const dialog = ensureDialog(products);
  $('[data-rv-open]', host).addEventListener('click', () => openDialog(dialog, productId));

  let reviews = await getApprovedReviews();
  if (productId) reviews = reviews.filter((r) => r.productId === productId);
  const grid = $('[data-rv-grid]', host);
  const summary = $('[data-rv-summary]', host);

  if (!reviews.length) {
    summary.innerHTML = `<p class="muted">No reviews yet${productId ? ' for this product' : ''}. Be the first to share your experience with IDT.</p>`;
    return;
  }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  summary.innerHTML = `<strong class="reviews__avg">${avg.toFixed(1)}</strong>${stars(Math.round(avg))}<span class="muted">${reviews.length} verified review${reviews.length === 1 ? '' : 's'}</span>`;
  grid.innerHTML = reviews.slice(0, limit).map((r) => `
    <article class="review-card">
      ${stars(r.rating)}
      <blockquote class="review-card__text">“${esc(r.review)}”</blockquote>
      <footer class="review-card__by">
        <span class="review-card__avatar" aria-hidden="true">${esc((r.name || '?').trim().charAt(0).toUpperCase())}</span>
        <span><strong>${esc(r.name)}</strong><br><span class="muted">${esc([r.company, r.country].filter(Boolean).join(' · '))}</span></span>
      </footer>
      ${r.product && !productId ? `<span class="review-card__product">${esc(r.product)}</span>` : ''}
    </article>`).join('');
}

let dialogEl = null;
function ensureDialog(products) {
  if (dialogEl) return dialogEl;
  dialogEl = document.createElement('dialog');
  dialogEl.className = 'review-dialog';
  dialogEl.setAttribute('aria-labelledby', 'rv-title');
  dialogEl.innerHTML = `
    <form class="form" data-rv-form novalidate>
      <div class="review-dialog__head">
        <h2 id="rv-title">Write a review</h2>
        <button class="btn btn--icon btn--ghost" type="button" data-rv-close aria-label="Close">✕</button>
      </div>
      <p class="muted" style="font-size:.9rem">Reviews are checked by IDT before they appear on the site. Your e-mail is never shown.</p>
      <fieldset class="field rating-input" style="border:0;padding:0;margin:0">
        <legend>Your rating <span class="req">*</span></legend>
        <div class="rating-input__stars">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="rating" id="rv-${n}" value="${n}"><label for="rv-${n}" title="${n} star${n > 1 ? 's' : ''}">${STAR}<span class="visually-hidden">${n} star${n > 1 ? 's' : ''}</span></label>`).join('')}</div>
        <span class="field__error" data-rv-error="rating"></span>
      </fieldset>
      <div class="field"><label for="rv-product">Product</label>
        <select class="select" id="rv-product" name="productId"><option value="">General — IDT service</option>${products.map((p) => `<option value="${esc(p.id)}">${esc(p.manufacturer)} ${esc(p.model)}</option>`).join('')}</select></div>
      <div class="form__row form__row--2">
        <div class="field"><label for="rv-name">Full name <span class="req">*</span></label><input class="input" id="rv-name" name="name" autocomplete="name" maxlength="120"><span class="field__error" data-rv-error="name"></span></div>
        <div class="field"><label for="rv-company">Laboratory / company</label><input class="input" id="rv-company" name="company" autocomplete="organization" maxlength="160"></div>
      </div>
      <div class="form__row form__row--2">
        <div class="field"><label for="rv-country">Country</label><input class="input" id="rv-country" name="country" autocomplete="country-name" maxlength="80"></div>
        <div class="field"><label for="rv-email">Email (private, for a confirmation)</label><input class="input" id="rv-email" name="email" type="email" autocomplete="email" maxlength="200"><span class="field__error" data-rv-error="email"></span></div>
      </div>
      <div class="field"><label for="rv-text">Your review <span class="req">*</span></label><textarea class="textarea" id="rv-text" name="review" maxlength="2000" placeholder="How has the equipment and IDT's service worked for your lab?"></textarea><span class="field__error" data-rv-error="review"></span></div>
      <div class="visually-hidden" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <div class="review-dialog__foot"><button class="btn" type="submit">Submit review <span class="arrow" aria-hidden="true">→</span></button></div>
    </form>
    <div class="review-dialog__done" data-rv-done hidden tabindex="-1"></div>`;
  document.body.append(dialogEl);

  const form = $('[data-rv-form]', dialogEl);
  const done = $('[data-rv-done]', dialogEl);
  dialogEl.addEventListener('click', (e) => {
    if (e.target === dialogEl || e.target.closest('[data-rv-close]')) dialogEl.close();
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const errors = {
      rating: fd.get('rating') ? '' : 'Please choose a rating.',
      name: (fd.get('name') || '').trim().length >= 2 ? '' : 'Please enter your name.',
      review: (fd.get('review') || '').trim().length >= 10 ? '' : 'Please write at least a sentence.',
      email: !fd.get('email') || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fd.get('email')) ? '' : 'Please enter a valid email or leave it empty.',
    };
    Object.entries(errors).forEach(([k, v]) => { $(`[data-rv-error="${k}"]`, dialogEl).textContent = v; });
    const first = Object.keys(errors).find((k) => errors[k]);
    if (first) { (form.elements[first]?.[0] || form.elements[first])?.focus?.(); return; }

    const btn = form.querySelector('[type="submit"]');
    const label = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Sending…';
    const product = products.find((p) => p.id === fd.get('productId'));
    const outcome = await submitReview({
      rating: Number(fd.get('rating')),
      productId: fd.get('productId') || '',
      productLabel: product ? `${product.manufacturer} ${product.model}` : 'General — IDT service',
      name: fd.get('name').trim(), company: (fd.get('company') || '').trim(), country: (fd.get('country') || '').trim(),
      email: (fd.get('email') || '').trim(), review: fd.get('review').trim(),
      website: fd.get('website') || '', source: location.href,
    });
    btn.disabled = false; btn.innerHTML = label;
    done.innerHTML = outcome.delivered
      ? `<h2>Thank you!</h2><p class="muted">Your review has been received and will appear on the site once IDT approves it.${fd.get('email') ? ` A confirmation has been sent to ${esc(fd.get('email'))}.` : ''}</p><button class="btn" type="button" data-rv-close>Close</button>`
      : `<h2>Couldn't send your review</h2><p class="muted">Please check your connection and try again.</p><button class="btn btn--ghost" type="button" data-rv-retry>Try again</button>`;
    form.hidden = true; done.hidden = false; done.focus();
    if (outcome.delivered) form.reset();
    $('[data-rv-retry]', done)?.addEventListener('click', () => { done.hidden = true; form.hidden = false; });
  });
  return dialogEl;
}

function openDialog(dialog, productId) {
  $('[data-rv-form]', dialog).hidden = false;
  $('[data-rv-done]', dialog).hidden = true;
  $$('[data-rv-error]', dialog).forEach((e) => { e.textContent = ''; });
  if (productId) $('#rv-product', dialog).value = productId;
  dialog.showModal();
}
