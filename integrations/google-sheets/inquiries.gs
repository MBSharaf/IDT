/**
 * IDT — website inquiries + reviews (Google Apps Script web app).
 *
 * Bound to the "IDT inquiries Customer Sheet" spreadsheet (Extensions → Apps Script).
 * Deploy → Web app · Execute as: Me · Who has access: Anyone. The /exec URL is set in
 * js/services/inquiry.js (INQUIRY_ENDPOINT) and js/services/reviews.js reuses it.
 * After editing: Deploy → Manage deployments → Edit → Version: New version (URL stays the same).
 *
 * POST {type:'inquiry', …}  → appends a row to the "Inquiries" tab.
 * POST {type:'review', …}   → appends a row to the "Reviews" tab with Status "Pending".
 * GET  ?action=reviews       → returns only reviews whose Status is "Approved" (no e-mails).
 */

// IDT team inbox: receives a notification for every new inquiry / review ('' to disable).
var NOTIFY_EMAIL = 'idt.digitalexpert@gmail.com';
// Customers get a confirmation e-mail after submitting (false to disable).
var CONFIRM_CUSTOMER = true;
var SENDER_NAME = 'IDT — Integrated Dental Technologies';
var SITE_WHATSAPP = '+20 155 687 1996';
var SITE_WHATSAPP_LINK = 'https://wa.me/201556871996';

var INQUIRY_HEADER = ['Submitted at', 'Status', 'Products of interest', 'Full name', 'Laboratory / company', 'Email',
  'Phone / WhatsApp', 'Country', 'Purchase timeline', 'Message', 'Page'];
var REVIEW_HEADER = ['Submitted at', 'Status', 'Rating (1–5)', 'Product', 'Product ID', 'Full name',
  'Laboratory / company', 'Country', 'Review', 'Email (private)', 'Page'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.website) return json({ ok: true });              // honeypot: silently drop bots
    if (data.type === 'review') return saveReview(data);
    return saveInquiry(data);
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (action === 'reviews') return json({ ok: true, reviews: approvedReviews() });
  return json({ ok: true, service: 'IDT inquiries' });
}

/* ---------------- Inquiries ---------------- */
function saveInquiry(data) {
  if (!data.name || !data.email || !data.company) return json({ ok: false, error: 'missing fields' });
  var sheet = tab('Inquiries', 0, INQUIRY_HEADER);
  var products = (data.products || []).map(function (p) { return p.label; }).join('\n');
  sheet.appendRow([new Date(), 'New', clip(products, 1000), clip(data.name, 200), clip(data.company, 200),
    clip(data.email, 200), clip(data.phone, 60), clip(data.country, 100), clip(data.timeline, 100),
    clip(data.message, 5000), clip(data.source, 300)]);
  var rows = [['Products', products], ['Name', data.name], ['Laboratory / company', data.company], ['Email', data.email],
    ['Phone / WhatsApp', data.phone], ['Country', data.country], ['Purchase timeline', data.timeline], ['Message', data.message]];
  notifyTeam('New inquiry — ' + data.company, 'New product inquiry', 'A customer sent an inquiry from the website.', rows, data.email);
  confirmCustomer(data.email, 'We received your inquiry — IDT', 'Thank you, ' + firstName(data.name) + '.',
    'We\'ve received your product inquiry. Our team will get back to you shortly with configuration options, pricing and lead times.',
    [['Products', products], ['Laboratory / company', data.company], ['Message', data.message]]);
  return json({ ok: true });
}

/* ---------------- Reviews ---------------- */
function saveReview(data) {
  var rating = Math.round(Number(data.rating));
  if (!data.name || !data.review || !(rating >= 1 && rating <= 5)) return json({ ok: false, error: 'missing fields' });
  var sheet = tab('Reviews', 1, REVIEW_HEADER);
  sheet.appendRow([new Date(), 'Pending', rating, clip(data.productLabel, 200), clip(data.productId, 80),
    clip(data.name, 120), clip(data.company, 160), clip(data.country, 80), clip(data.review, 2000),
    clip(data.email, 200), clip(data.source, 300)]);
  var stars = new Array(rating + 1).join('★') + new Array(6 - rating).join('☆');
  notifyTeam('New review ' + stars + ' — waiting for approval', 'New review (Pending)',
    'Set its Status to "Approved" in the Reviews tab to publish it on the website.',
    [['Rating', stars], ['Product', data.productLabel], ['Name', data.name], ['Laboratory / company', data.company],
     ['Country', data.country], ['Email', data.email], ['Review', data.review]], data.email);
  if (data.email) {
    confirmCustomer(data.email, 'Thank you for your review — IDT', 'Thank you, ' + firstName(data.name) + '.',
      'We\'ve received your review. It will appear on our website once our team has checked it.',
      [['Rating', stars], ['Product', data.productLabel], ['Your review', data.review]]);
  }
  return json({ ok: true });
}

function approvedReviews() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Reviews');
  if (!sheet || sheet.getLastRow() < 2) return [];
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, REVIEW_HEADER.length).getValues();
  return rows
    .filter(function (r) { return String(r[1]).trim().toLowerCase() === 'approved'; })
    .map(function (r) {
      return {
        date: r[0] instanceof Date ? Utilities.formatDate(r[0], 'Africa/Cairo', 'yyyy-MM-dd') : String(r[0]),
        rating: Math.max(1, Math.min(5, Math.round(Number(r[2]) || 5))),
        product: String(r[3] || ''),
        productId: String(r[4] || ''),
        name: String(r[5] || ''),
        company: String(r[6] || ''),
        country: String(r[7] || ''),
        review: String(r[8] || ''),
      };
    })
    .reverse(); // newest first
}

/* ---------------- Helpers ---------------- */
function tab(name, fallbackIndex, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name) || ss.getSheets()[fallbackIndex] || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#0A0A0A').setFontColor('#D9AD55');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Run this ONCE from the Apps Script editor (select "authorizeAndTest" → Run) after pasting the code:
 * it grants the "send e-mail" permission and sends a sample notification to NOTIFY_EMAIL.
 */
function authorizeAndTest() {
  notifyTeam('Test — IDT website notifications are working', 'Notifications are on',
    'New inquiries and reviews from the website will be e-mailed here.', [['Sheet', SpreadsheetApp.getActiveSpreadsheet().getName()]], '');
}

/* ---------------- E-mails (failures never block saving the row) ---------------- */
function notifyTeam(subject, title, intro, rows, replyTo) {
  if (!NOTIFY_EMAIL) return;
  try {
    var sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
    MailApp.sendEmail({
      to: NOTIFY_EMAIL, subject: subject, name: SENDER_NAME, replyTo: isEmail(replyTo) ? replyTo : undefined,
      htmlBody: emailHtml(title, intro, rows, '<a href="' + sheetUrl + '" style="' + BTN + '">Open the sheet</a>'),
      body: intro + '\n\n' + plain(rows) + '\n\n' + sheetUrl,
    });
  } catch (err) { console.error('notifyTeam: ' + err); }
}

function confirmCustomer(to, subject, title, intro, rows) {
  if (!CONFIRM_CUSTOMER || !isEmail(to)) return;
  try {
    MailApp.sendEmail({
      to: to, subject: subject, name: SENDER_NAME, replyTo: NOTIFY_EMAIL || undefined,
      htmlBody: emailHtml(title, intro, rows,
        '<a href="' + SITE_WHATSAPP_LINK + '" style="' + BTN + '">Chat on WhatsApp</a>' +
        '<p style="margin:16px 0 0;color:#8f8d88;font-size:13px">Or reply to this e-mail. WhatsApp: ' + esc(SITE_WHATSAPP) + '</p>'),
      body: title + '\n\n' + intro + '\n\n' + plain(rows) + '\n\nWhatsApp: ' + SITE_WHATSAPP + '\n\nIDT — Integrated Dental Technologies',
    });
  } catch (err) { console.error('confirmCustomer: ' + err); }
}

var BTN = 'display:inline-block;background:#D9AD55;color:#0A0A0A;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px;font-size:14px';

function emailHtml(title, intro, rows, footerHtml) {
  var table = rows.filter(function (r) { return r[1]; }).map(function (r) {
    return '<tr><td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#8f8d88;font-size:12px;letter-spacing:.08em;text-transform:uppercase;vertical-align:top;width:38%">' + esc(r[0]) +
      '</td><td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#F5F3EE;font-size:14px;white-space:pre-wrap">' + esc(r[1]) + '</td></tr>';
  }).join('');
  return '<div style="background:#0A0A0A;padding:32px 16px;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#121214;border:1px solid #2a2a2e;border-radius:20px;padding:28px">' +
    '<div style="font-weight:900;font-size:22px;letter-spacing:.06em;color:#F5F3EE">I<span style="color:#D9AD55">D</span>T</div>' +
    '<div style="color:#8f8d88;font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin-top:2px">Integrated Dental Technologies</div>' +
    '<h1 style="color:#F5F3EE;font-size:24px;margin:28px 0 8px">' + esc(title) + '</h1>' +
    '<p style="color:#c9c6bf;font-size:15px;line-height:1.6;margin:0 0 20px">' + esc(intro) + '</p>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">' + table + '</table>' +
    footerHtml + '</div></div>';
}

function plain(rows) {
  return rows.filter(function (r) { return r[1]; }).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n');
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(s || '')); }
function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || 'there'; }

function clip(v, n) { v = v == null ? '' : String(v); return v.length > n ? v.slice(0, n) : v; }

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
