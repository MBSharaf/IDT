// Copies the approved reviews from the Google Sheet into data/reviews.json, which the site reads.
// Run it after approving (or un-approving) reviews in the sheet, then upload data/reviews.json.
// Usage: node tools/sync-reviews.mjs
import fs from 'node:fs';
import { INQUIRY_ENDPOINT } from '../js/services/inquiry.js';

if (!INQUIRY_ENDPOINT) {
  console.error('INQUIRY_ENDPOINT is not set in js/services/inquiry.js.');
  process.exit(1);
}
const res = await fetch(`${INQUIRY_ENDPOINT}?action=reviews`);
const data = await res.json().catch(() => null);
if (!res.ok || !data?.ok || !Array.isArray(data.reviews)) {
  // Keep the current file rather than wiping the reviews off the site.
  console.error(`Could not read reviews from the sheet (HTTP ${res.status}). data/reviews.json was not changed.`);
  process.exit(1);
}
const out = { updatedAt: new Date().toISOString(), reviews: data.reviews };
fs.writeFileSync(new URL('../data/reviews.json', import.meta.url), `${JSON.stringify(out, null, 2)}\n`);
console.log(`data/reviews.json: ${data.reviews.length} approved review(s). Upload it to the site to publish them.`);
