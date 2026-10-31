# In progress: Arabic (Egyptian) + English, light/dark theme

Request (2026-10-31): site in Arabic + English, light and dark mode, very professional, Arabic in Egyptian colloquial.
Delete this file when done. Commit + push only at the end (git: see memory git-safe-directory).
Local WIP commits exist (NOT pushed: the live site must not get a half-translated version). Push once everything is done.

## Design decisions
- Language: `<html lang dir data-theme>` set before paint by an inline head script in all 5 HTML pages
  (`?lang=` > localStorage `idt-lang` > navigator.language). Switching reloads the page (`setLang`).
- `js/core/i18n.js`: `lang`, `isAr`, `t(englishOrKey, vars)`, `plural(n, one, many)` (Arabic dual via "<key>|2"),
  `applyI18n()` for `[data-i18n]` / `[data-i18n-attr="attr:key;…"]`, `setTheme`, `theme`.
  Arabic strings: `js/core/strings.ar.js` (keys = English text for JS strings, dotted keys for HTML). DONE.
- Static HTML annotated with data-i18n keys (applied to all 5 pages). DONE.
- Product data: `data/products.ar.json` overlay merged in `loadCatalog()` (js/core/data.js `localise`, code DONE).
  Shape: `{ "categories": { "<id>": { "label", "summary" } }, "products": { "<id>": { "name", "tagline",
  "description", "highlights": [{ "label", "unit"? }], "labValue": [..], "features": [{ "title", "text" }],
  "specs": [{ "group", "label", "value", "flag"? }], "workflow": [..], "gallery": ["alt", ..] } } }`
  Arrays are aligned BY INDEX with data/products.json (objects merged per index). Keep numbers/units Latin.
  Category labels planned: scanning "السكان الديجيتال", milling "تفريز CAD/CAM", sintering "تلبيد الزيركون",
  porcelain "حرق البورسلين", printing "الطباعة 3D للأسنان".
  `p.en.name` keeps the English name for inquiries (js/services/inquiry.js).
- Theme: `--c-black`/`--c-white` are role tokens (bg/fg) that swap in `[data-theme=light]` (css/tokens.css);
  `--ink`/`--paper` fixed; `--c-gold-text` for gold text (deeper in light); `--word-base` for hero word.
  Header has `.prefs` (lang button "ع"/"EN" + sun/moon theme button) in js/components/layout.js.
- Giant decorative verbs (MILL, SCAN…) stay English (char-split animation breaks Arabic shaping).
- Arabic font: Cairo (loaded by the head script only for ar), as fallback after Archivo/Plex Mono so Latin keeps
  brand fonts. Letter-spacing off for Arabic (css/base.css).

## Checklist
- [x] i18n.js + strings + head script in 5 pages + header toggles (lang, theme)
- [x] Light theme CSS (first pass, not yet checked in browser)
- [x] RTL CSS fixes (first pass, not yet checked in browser)
- [x] Static HTML + JS strings (layout, home, catalog, product, contact, about, reviews, whatsapp, social, productCard, viewer)
- [ ] NEXT: write data/products.ar.json (categories + 9 products, Egyptian Arabic, professional). Do it in chunks
      (scratchpad part file per product, merge with node) and validate index alignment with a node check
      (same array lengths as products.json). Commit locally after each few products.
- [ ] Browser check (preview "idt-site", port 5173): EN dark, EN light, AR dark, AR light; mobile 375 + desktop;
      all 5 pages; console errors; header prefs on mobile; RTL layout (hero, cards, specs, forms, footer, WhatsApp button on the left).
- [ ] HANDOFF.md section, delete PROGRESS.md, commit + push, tell the user (Arabic) incl. Ctrl+F5.
