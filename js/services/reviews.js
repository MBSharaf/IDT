// Reviews service — same Google Apps Script web app as inquiries (see integrations/google-sheets/).
// Visitors submit reviews (stored as "Pending"); only rows set to "Approved" in the sheet are shown.
// Approved reviews are read from data/reviews.json, a copy made by `node tools/sync-reviews.mjs`, so a
// traffic spike never reaches Google's limit of 30 simultaneous script runs. The live script is only
// asked when that file is missing.
import { INQUIRY_ENDPOINT } from './inquiry.js';

const toList = (d) => (Array.isArray(d?.reviews) ? d.reviews : []);
let inflight = null;

/** Approved reviews, newest first. */
export function getApprovedReviews() {
  if (!inflight) {
    inflight = fetch('data/reviews.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(toList)
      .catch(() => (INQUIRY_ENDPOINT
        ? fetch(`${INQUIRY_ENDPOINT}?action=reviews`).then((r) => r.json()).then(toList).catch(() => [])
        : []));
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
