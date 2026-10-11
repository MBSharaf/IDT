// Reviews service — same Google Apps Script web app as inquiries (see integrations/google-sheets/).
// Visitors submit reviews (stored as "Pending"); only rows set to "Approved" in the sheet are returned here.
import { INQUIRY_ENDPOINT } from './inquiry.js';

const CACHE_KEY = 'idt-reviews-v1';
const CACHE_MS = 5 * 60 * 1000;
let inflight = null;

/** Approved reviews, newest first. Cached for a few minutes per visitor to keep pages fast. */
export function getApprovedReviews() {
  if (!INQUIRY_ENDPOINT) return Promise.resolve([]);
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.t < CACHE_MS) return Promise.resolve(cached.reviews);
  } catch { /* storage unavailable */ }
  if (!inflight) {
    inflight = fetch(`${INQUIRY_ENDPOINT}?action=reviews`)
      .then((r) => r.json())
      .then((d) => {
        const reviews = Array.isArray(d.reviews) ? d.reviews : [];
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), reviews })); } catch { /* ignore */ }
        return reviews;
      })
      .catch(() => []);
  }
  return inflight;
}

export async function submitReview(review) {
  if (!INQUIRY_ENDPOINT) return { delivered: false };
  try {
    const res = await fetch(INQUIRY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: 'review', ...review }) });
    const data = await res.json().catch(() => ({}));
    return { delivered: res.ok && data.ok === true };
  } catch {
    return { delivered: false };
  }
}
