# IDT — Integrated Dental Technologies website

This is a frontend-only marketing and catalog site for IDT's dental laboratory equipment. It is written in vanilla HTML, CSS and JavaScript (ES modules). Three.js handles the interactive 3D models and GSAP/ScrollTrigger handles the scroll motion.

## Run it locally

The pages load `data/products.json` with `fetch()`, so the site has to be served over HTTP. Opening the HTML files directly with `file://` won't work.

**Windows (no install required):**

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

Then open <http://localhost:5173/>. To use another port, add `-Port 8080`.

**Any other static server** also works, for example:

```bash
npx serve .
```

```bash
python -m http.server 5173
```

An internet connection is needed for:

- Three.js (jsDelivr, pinned to `three@0.169.0`)
- GSAP 3.12.5 (cdnjs)
- Google Fonts (Archivo and IBM Plex Mono)

To run fully offline, download those files into `vendor/` and update the import map and script tags.

## Pages

| Page | File | Notes |
|---|---|---|
| Home | `index.html` | Hero product slider over a giant workflow verb, cinematic scroll-out, sticky 3D workflow stage (Scan → Mill → Sinter → Fire), catalog preview, value proposition, CTA |
| Catalog | `products.html` | Category filters, synced to `?category=` |
| Product detail | `product.html?id=<product-id>` | Interactive 3D (orbit, view presets, auto-rotate, demo animation), specs, workflow, gallery, sources, inquiry CTA |
| About | `about.html` | Company placeholders and the manufacturer range, derived from the data |
| Contact / Inquiry | `contact.html?product=<id>` | Validated inquiry form with the product preselected (see "Inquiry form" below) |

User flow: **Discover → Explore products → Product page → 3D model → Specifications → Inquiry.**

## Project structure

```
index.html, products.html, product.html, about.html, contact.html
css/
  tokens.css        design tokens (brand colours, type, spacing, motion)
  base.css          reset, typography, layout primitives, reveal hooks
  components.css    header, buttons, cards, accordion, specs, viewer, forms, footer
  pages.css         page layouts
js/
  core/             data access, DOM helpers, motion system, site/company config
  components/       layout (header/footer), product card, accordion, spec groups
  pages/            one controller per page
  services/         inquiry.js — the single integration point for a future backend
  three/
    viewer.js       scene, lighting, camera fitting, product swaps, controls, render loop
    materials.js    shared PBR materials, photo-crop and text textures
    floaters.js     hero "materials" (98 mm zirconia discs, burs, crowns)
    projection.js   photo-projection material + per-vertex baking from official orthographic views
    models/         per-product builders (s9, m9, m5, mill, scanner) + registry (GLB drop-in support)
data/products.json  researched product data — the single source of truth
assets/images/      product photos (uploads), brand assets
assets/models/      drop-in folder for future GLB models
reference/          reference video + a frame-sampling helper used for the motion analysis
tools/serve.ps1     zero-dependency local static server (+ dev-only /__save for QA renders)
tools/model-lab.html  render a model against its reference views (writes reference/_renders/)
tools/crop.ps1, calibrate.html, to-png.html, make-sheet.ps1   measuring / reference-image helpers
PRODUCT_RESEARCH.md research report: identification, sources, open questions
```

### Notes for a future React migration

- Each module in `js/components/` is a pure function that takes data and returns markup, so it maps one-to-one to a React component.
- `js/pages/*` holds the page-level state and effects. In React these become `useEffect` hooks.
- `createViewer(el, opts)` is framework-agnostic. Mount it in a `ref` effect and call `dispose()` on unmount.
- All content comes from `data/products.json`, and all design values from `css/tokens.css`.

## Design system

- **Colours:** Luxury Black `#0A0A0A` is the dominant background, Premium Gold `#D9AD55` is used sparingly for emphasis and the 3D rim light, Graphite `#303034` is used for surfaces and the giant type, and Soft White `#F5F3EE` is used for text and the "paper" sections. Derived tints are `color-mix()` blends of these four colours only.
- **Typography:** Archivo, using its width axis. Headlines use 125% width at weight 800–900, and body text uses normal width. IBM Plex Mono is used for labels, indices and specs.
- **Motion:** expo-out easing, character-split headline swaps, scroll-scrubbed 3D, and IntersectionObserver reveals. `prefers-reduced-motion` turns off autoplay, idle spin, floaters and scroll scrubbing.

## How the reference video shaped the design

The 5.9-second reference loop shows:

- a product slowly turning in front of a giant display word ("01 RENEW"), with ingredients floating around it at different depths;
- a centred minimal navigation with an underline on the active item;
- a hairline accordion list with "+" icons on the right;
- a paper sheet at the bottom showing round product thumbnails joined by "+" signs.

On the IDT site these became:

- the hero's index number and giant workflow verb (SCAN / MILL / SINTER / FIRE), with the 3D product layered over it;
- floating 98 mm zirconia discs, milling burs and crowns in place of the ingredients;
- the same navigation and accordion patterns;
- the soft-white workflow sheet rising over the hero, with circular product thumbnails joined by "+".

## 3D approach and limitations

**What was checked:**

- No image-to-3D, photogrammetry or 3D-modelling tool was available among this environment's tools and connectors. The available MCP tools only generate and edit 2D images.
- The manufacturers don't publish downloadable 3D models.

**What was built instead:** photo-projected models (`js/three/projection.js`, `js/three/models/*.js`).

- **Geometry:** each model is measured from the manufacturers' **orthographic renders** (front, side, back or end views, in `assets/images/products/source/`). These are calibrated against the published dimensions.
- **Texturing:** the same renders are projected onto the geometry. Every surface shows what the official image shows at that spot: a front-facing surface takes the front view, a side surface the side view, and rounded edges blend between them.
- **Moving parts:** coordinates are baked at the rest position, so moving parts keep their texture. The animations are the E5 and M9 doors opening, the S9 table lifting, the M5 hood lowering, and the AI-S3 plate rotating and arm tilting.
- **View calibration:** each view's calibration rectangle is stored in `data/products.json` under `model3d.views`.

**Checking alignment:** `tools/model-lab.html?id=<id>&view=front|left|right|back|persp` renders a model with an orthographic camera next to the reference image and a 50 % overlay. When the site runs through `tools/serve.ps1`, the result is saved to `reference/_renders/`.

**Limitations:**

- Surfaces that no official view shows are kept simple rather than invented. This covers the E5 sides and rear, the M5 sides, and the AI-S3 tower's outer end.
- Interiors are illustrative: the E5 milling chamber and the furnace chambers.
- The result looks like the product from the reference angles and is convincing in between. It is still not a CAD-exact model. For that, replace it with a manufacturer GLB (see below).
- Every product page says this in an "About this 3D model" note.

**Swapping in a real model:** add a GLB to `assets/models/` and set `model3d.glb` in `data/products.json`. See [assets/models/README.md](assets/models/README.md).

**Fallbacks:**

- Without WebGL, the viewer shows the product photo.
- While a model loads, a blurred poster image and a spinner are shown.
- The render loop pauses when the viewer is off-screen or the tab is hidden.

## Product data

[PRODUCT_RESEARCH.md](PRODUCT_RESEARCH.md) summarises the research, and `data/products.json` holds the structured data, including a source URL for every product.

**Rules for editing:**

- Only publish values that a source supports.
- Use a spec's `"flag"` field to mark a value as awaiting confirmation. It is displayed next to the value.
- `missingInformation` lists open questions. It is internal and never shown on the site.

## Placeholders to fill in

| Item | Where |
|---|---|
| Company contact details (email, phone, WhatsApp, address, hours) | `js/core/site.js` |
| Company facts (founding year, service area, after-sales service) | `js/pages/about.js` (`FACTS`) and the About intro notice in `about.html` |
| Installation and support text | the fourth value card in `index.html` |
| Official IDT logo | `assets/images/brand/` (the header currently uses a typographic "IDT" wordmark) |

## Inquiry form

The site has no backend, so the form validates the input and prepares a summary. It then offers **Send by email** (a `mailto:` link with the inquiry pre-filled) and **Copy summary**, and it says clearly that nothing has been sent online.

To connect a backend or CRM later, set `INQUIRY_ENDPOINT` in `js/services/inquiry.js`. `submitInquiry()` will then POST the inquiry as JSON, and the UI will switch to a "sent" confirmation when the request succeeds.

## Testing done

- All pages load with no console errors. Every JS module was import-checked in the browser.
- All five 3D models render, and their view presets and demo toggles work.
- The catalog filters and URL sync work. An unknown product id shows a 404 state listing the products.
- Inquiry validation, product preselection from the URL and summary/mailto generation all work.
- Tested at 1440×900, 1024×768 and 375×812 with no horizontal overflow. On mobile the header CTA moves into the menu.

**Not covered by automated checks:**

- Animation smoothness. The preview pane throttles animation frames, so check this in a real browser.
- Real-device mobile performance.
