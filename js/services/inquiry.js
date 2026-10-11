// Inquiry service — sends each inquiry to the "IDT inquiries Customer Sheet" (Google Sheets) through a
// Google Apps Script web app (see integrations/google-sheets/inquiries.gs and its README).
// Paste the deployed web-app URL (ends in /exec) below. While it's null, the form falls back to e-mail.
export const INQUIRY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwioA-5TeiLgaOgsW4Q02uYSDRiQovMJluabLFhjEzhmqZFeaXUbJWC6DCz1EMdrhmUMA/exec';

export function buildInquiry(fd, products) {
  const ids = fd.getAll('products');
  return {
    type: 'inquiry',
    products: ids.map((id) => {
      const p = products.find((x) => x.id === id);
      return p ? { id, label: `${p.manufacturer} ${p.model} (${p.name})` } : { id, label: 'Not sure yet: please recommend a setup' };
    }),
    name: fd.get('name').trim(),
    company: fd.get('company').trim(),
    email: fd.get('email').trim(),
    phone: (fd.get('phone') || '').trim(),
    country: (fd.get('country') || '').trim(),
    timeline: fd.get('timeline') || '',
    message: (fd.get('message') || '').trim(),
    createdAt: new Date().toISOString(),
    source: location.href,
    website: (fd.get('website') || '').trim(), // honeypot — real visitors never fill it
  };
}

export async function submitInquiry(inquiry) {
  if (!INQUIRY_ENDPOINT) return { delivered: false };
  try {
    // text/plain keeps this a "simple" CORS request (Apps Script can't answer a preflight).
    const res = await fetch(INQUIRY_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(inquiry) });
    const data = await res.json().catch(() => ({}));
    return { delivered: res.ok && data.ok === true };
  } catch {
    return { delivered: false };
  }
}

export function inquiryToText(q) {
  return [
    'PRODUCT INQUIRY — IDT',
    '',
    'Products:',
    ...q.products.map((p) => `  • ${p.label}`),
    '',
    `Name:      ${q.name}`,
    `Company:   ${q.company}`,
    `Email:     ${q.email}`,
    q.phone ? `Phone:     ${q.phone}` : null,
    q.country ? `Country:   ${q.country}` : null,
    q.timeline ? `Timeline:  ${q.timeline}` : null,
    q.message ? `\nMessage:\n${q.message}` : null,
  ].filter((l) => l !== null).join('\n');
}
