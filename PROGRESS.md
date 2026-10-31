# In progress: Arabic (Egyptian) + English, light/dark theme

Request (2026-10-31): site in Arabic + English, light and dark mode, very professional, Arabic in Egyptian colloquial.
Delete this file when done. Commit + push at the end (git: see memory git-safe-directory).

## Design decisions
- Language: `<html lang dir>` set before paint by an inline head script in all 5 HTML pages
  (`?lang=` > localStorage `idt-lang` > navigator.language). Switching reloads the page.
- `js/core/i18n.js`: `lang`, `t(englishOrKey, vars)`, `applyI18n()` for `[data-i18n]` / `[data-i18n-html]` / `[data-i18n-attr]`.
  Arabic strings live in `js/core/strings.ar.js` (keys = English text for JS strings, dotted keys for HTML).
- Product data: `data/products.ar.json` overlay (per product, arrays aligned by index), merged in `loadCatalog()`.
  Inquiry/review text sent to the Sheet stays English.
- Theme: `data-theme` on `<html>` (localStorage `idt-theme`, default dark). `--c-black`/`--c-white` are role tokens
  (bg/fg) that swap in light; `--ink`/`--paper` are fixed; `--c-gold-text` for gold text (deeper in light).
- Giant decorative verbs (MILL, SCAN…) stay English in both languages (char-split animation breaks Arabic shaping).
- Arabic font: Cairo (Google Fonts), loaded only for `ar`. No letter-spacing / uppercase on Arabic.

## Checklist
- [x] i18n.js + strings + head script in 5 pages + header toggles (lang, theme)
- [x] Light theme CSS (first pass)
- [x] RTL CSS fixes (first pass)
- [x] Translate static HTML (5 pages) + JS strings (layout, home, catalog, product, contact, about, reviews, whatsapp, productCard)
- [ ] products.ar.json (9 products + categories)
- [ ] Browser check: both langs × both themes, mobile + desktop
- [ ] HANDOFF.md section, delete PROGRESS.md, commit + push
