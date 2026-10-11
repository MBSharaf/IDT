# IDT Website — Session Handoff (2026-10-10)

Read this first when continuing work. Then read `README.md` (structure, run instructions) and `PRODUCT_RESEARCH.md` (sources and open questions).

## Project in one paragraph

- **What it is:** a vanilla HTML/CSS/JS site (ES modules, Three.js 0.169 and GSAP 3.12.5 from CDNs) for **IDT – Integrated Dental Technologies**, which sells dental-lab equipment.
- **Products (5):**
  - Zahndent **ZDM-E5** mill
  - Aident **AI-S3** lab scanner
  - NeunoRton **S9** speed sintering furnace
  - NeunoRton **M9** box sintering furnace
  - NeunoRton **M5** vacuum porcelain furnace
- **Pages:** `index.html` (hero slider + workflow + featured), `products.html`, `product.html?id=…`, `about.html`, `contact.html` (frontend-only inquiry form → mailto).
- **Data:** everything product-related comes from `data/products.json`.
- **Brand:** black `#0A0A0A`, gold `#D9AD55`, graphite `#303034`, soft white `#F5F3EE`. Tokens are in `css/tokens.css`.
- **User's instruction:** don't change the visual style or imitate the manufacturer sites; only fix what the user asks for.

## Running locally

```bash
powershell -ExecutionPolicy Bypass -File tools/serve.ps1
```

- The site is at http://localhost:5173.
- `.claude/launch.json` defines `idt-site` for the preview pane.
- No Node/Python on this machine; the server is PowerShell.
- **Avoid rewriting files with PowerShell `Get-Content`/`Set-Content` without `-Encoding UTF8`.** It caused mojibake once. Prefer the Edit tool.

## How the user works

- Writes in Egyptian Arabic. Reply in Arabic.
- Reports problems one at a time ("خلينا نبدأ باول مشكلة").
- **Problem #1 (DONE this session):** the hero and the 3D models looked unrealistic, and the product data was incomplete. The user supplied the official sources:
  - https://www.aident3d.com/3d-scanner/dental-lab-scanner/dental-model-scanner.html
  - https://www.zahndent.com/
  - https://www.neunorton.com/products/
- **Problem #2:** the user sent a screenshot of white broken blocks in the hero.
  - I wrongly removed the giant hero word. The user said that was NOT what they meant and asked to restore it all. **Keep the giant word (SCAN/MILL/SINTER/FIRE).**
  - It is now restored, with a bug fix: GSAP was tweening the letter colour to a `color-mix()` value it can't parse, so letters turned white mid-swap. The word now uses a plain `rgb(72, 71, 74)` (`--word-base` in `css/pages.css` and `WORD_BASE` in `home.js`).
  - **Before deleting anything again, confirm with the user what they mean.**
  - Unconfirmed: whether the user's "white part" was that glitch or something else (e.g. the floating white discs). Ask if it's still visible.
- **What the user actually meant:** the white "paper" sheet of the home workflow section ("The digital lab, in four steps") rising under the hero. The fix:
  - The section is now dark: `.section--paper` was removed in `index.html`.
  - The workflow CSS block in `css/pages.css` was re-themed, and the step button is now gold instead of `btn--dark`.
  - The sticky 3D stage and scroll-linked steps/meter are unchanged.
- **Workflow-viewer fix (DONE):** the user saw the product's back in the home workflow section. Two changes:
  - The scroll now sways the model ±0.4 rad around the front three-quarter view (`home.js`), with `idleSpin: false` on that viewer.
  - The product-swap entrance spin in `viewer.js` was reduced from 1.6 to 0.7 rad.
- **WhatsApp button (DONE):**
  - **Number:** +20 155 687 1996, stored in `js/core/site.js → whatsapp`.
  - **Component:** `js/components/whatsapp.js`, mounted on every page from `renderFooter()`.
  - **Look:** a 3D two-faced "coin" (black with a gold glyph, and gold with a black glyph). It flips every 7 s, tilts towards the pointer and has a gold pulse ring. A "Chat on WhatsApp" label shows on hover.
  - **Styles:** CSS is in `components.css` under `.wa-fab*`. It respects reduced motion and hides while the mobile menu is open.
  - **Link:** opens `wa.me` with a prefilled message. The Contact page's WhatsApp row links there too.
- **Social media (DONE):**
  - **Profile:** Facebook only, https://www.facebook.com/share/1HifsCnKEe/, stored in `site.socials` (`js/core/site.js`).
  - **Component:** `js/components/social.js` renders round icon links, with a gold hover state (`.social*` in `components.css`).
  - **Placement:** footer (all pages), mobile menu, and the Contact page's "Follow us" row.
  - **Adding a network:** add an entry to `site.socials` plus its icon in `ICONS`.
- **Inquiries → Google Sheets (DONE, tested end-to-end 2026-10-11):**
  - The web app is deployed by the user. Its URL is in `INQUIRY_ENDPOINT`.
  - A test row submitted from the site landed in the sheet, then was deleted.
  - **Sheet:** "IDT inquiries Customer Sheet" (id `1PFcFnG6O4vjopl6LTH36UqiVED-HMLm7V9Mge56J9HM`), owned by **pharosline.agency@gmail.com**. The user wants that account; the Drive and Sheets connectors are now both connected to it.
  - **Formatting:** tab "Inquiries", gold-on-black frozen header, Cairo time zone, and a Status drop-down (New / Contacted / Quoted / Won / Lost).
  - **Old sheet:** an earlier copy (id `1ngdyVOwr9…J4BA`) still exists in `sharafxx90@gmail.com`'s Drive. It can't be trashed from the current connector; the user should delete it.
  - **Receiver:** Apps Script `integrations/google-sheets/inquiries.gs`, with setup steps in that folder's `README.md`.
  - **Front end:** `js/services/inquiry.js` POSTs text/plain JSON to `INQUIRY_ENDPOINT`, which is **still null**. The user must deploy the script as a Web app and send the `/exec` URL; then set the constant and test a real submission.
  - **Contact form:** the button is now "Send inquiry". It shows a "Sending…" state, has a hidden honeypot field `website`, shows a thank-you view when sent, and falls back to e-mail / WhatsApp / copy otherwise.
- **Reviews with approval (DONE, tested end-to-end 2026-10-11):** the user redeployed the new script version. A test review went submit → Pending (hidden) → Approved (shown on the S9 page) and was then deleted.
  - **Sheet:** a "Reviews" tab (sheetId 1001) with a Pending/Approved/Rejected drop-down. Approved rows are highlighted gold; Product ID (column E) is hidden.
  - **Script:** `inquiries.gs` now routes POST `type:'review'` → Reviews (Pending), and serves GET `?action=reviews` → approved reviews only, with no e-mails.
  - **Front end:**
    - `js/services/reviews.js` caches for 5 minutes in sessionStorage.
    - `js/components/reviews.js` provides the cards, the average rating and a `<dialog>` form with star rating, product, name, company, country, private e-mail, text and a honeypot.
  - **Where it appears:** a home section `#reviews` (loaded on idle) and a product-page `#reviews` section filtered by product.
  - **Blocker:** the deployed web app is still the OLD version. The user must paste the new `inquiries.gs` and do Deploy → Manage deployments → Edit → New version. Until then, review submissions won't route correctly. **Do not submit test reviews before that.**
  - **After the redeploy:** test end-to-end (submit → Pending → approve → visible), then delete the test row.
- **E-mail notifications (DEPLOYED 2026-10-11):**
  - Test inquiry and test review rows saved, then deleted.
  - Both tests used idt.digitalexpert@gmail.com as the customer e-mail.
  - The user should confirm that 4 e-mails arrived (2 team notifications + 2 confirmations); Claude can't read that inbox.
  - **What `inquiries.gs` sends:**
    - A branded HTML notification to `NOTIFY_EMAIL = idt.digitalexpert@gmail.com` for every inquiry and review (replyTo = the customer).
    - A confirmation e-mail to the customer: always for inquiries, and for reviews only when an e-mail is given (replyTo = IDT).
  - **Sender:** the pharosline account (script owner), with display name "IDT — Integrated Dental Technologies".
  - **Error handling:** mail errors are caught, so rows still save.
  - **User steps:**
    1. Paste the new code.
    2. Run `authorizeAndTest` once in the editor to grant MailApp; this sends a test mail.
    3. Deploy → Manage deployments → New version.
  - **Then:** test end-to-end and delete the test rows.
- **Logo (DONE):**
  - **Files:** the user's tooth logo is `assets/images/brand/idt-logo-original.jpg`. A transparent `idt-logo.png` was made from it: the tooth is opaque and the letters are cut-outs.
  - **Rendering:** `.brand__logo` uses the PNG as a CSS mask. It is soft white and turns gold with a slight tilt on hover.
  - **Placement:** beside the "IDT" wordmark in the header and footer. The "IDT" text was kept, as the user asked.
- **Contact details (DONE):** set in `js/core/site.js`.
  - Email: idt.digitalexpert@gmail.com
  - Phone: +20 112 132 1366 (user gave 01121321366)
  - WhatsApp: +20 155 687 1996
  - Address: Nasr City, Cairo, Egypt
  - Hours: left as the placeholder, per the user.
  - Phone and WhatsApp are now clickable (`tel:`, `wa.me`) on the contact page and in the footer.
- **Problem #3 (IN PROGRESS): performance ("site is heavy, bad UX").**
  - **Measured on home:** long tasks of 2.7 s, 1.6 s and 1.2 s. The 3D model only starts loading ~2.7 s in, because of a serial import chain.
  - **Done:**
    - Shadow maps disabled and pixel ratio capped (1.5 desktop / 1.25 mobile) in `viewer.js`.
    - Zirconia floater material changed to MeshStandard (transmission was causing an extra render pass).
    - Switched to `three.module.min.js` (1274 KB → 671 KB).
  - **Still to do:**
    1. `renderer.compileAsync` before adding a model, to remove shader-compile jank.
    2. The projected material in `projection.js`: MeshPhysical → MeshStandard.
    3. `<link rel="modulepreload">` for `viewer.js`/`models`/`projection.js`/`parts.js`/`materials.js`/`index.js` and three, plus a preload for the E5 texture.
    4. Render on demand on product pages (only when the controls change, auto-rotate is on, or animations or tweens are running).
    5. Reduce geometry segments (RoundedBox 4→3, cylinders 96→48).
    6. Remove `backdrop-filter` blur from `.site-header.is-scrolled` and `.pd-nav` (it re-composites over the WebGL canvas on scroll).
    7. Resize the 2362 px Zahndent gallery photos to ~1400 px (`tools/crop.ps1`-style `System.Drawing` with `[Bitmap]::new` works).
    8. Add Last-Modified/304 caching to `tools/serve.ps1`, and a hosting note in the README (gzip/CDN).
    9. Re-measure long tasks and FPS afterwards. Also ask whether the hero itself (layout, motion, text) still has issues besides the models.

## What was done for problem #1

1. **Official images downloaded** to `assets/images/products/source/<product-id>/`.
   - Aident files are WebP, renamed to `.webp`.
   - The Aident catalogue PDF is `aident-ai-s3/aident-catalog-2026.pdf`.
   - The Zahndent main image `ZDM-E5-8.jpg` is blocked (403); the others downloaded.
   - The E5 product video `E5.mp4` (73 MB) is there too.
2. **New 3D approach: photo-projection** (`js/three/projection.js`).
   - Geometry is measured from the official orthographic renders.
   - The renders are projected onto the geometry.
   - Projection coordinates are baked per vertex at the rest pose, so moving parts keep their texture.
   - A mesh with `userData.project = false` is excluded (interiors, glass, rings, arm parts, decals).
   - With no top view, upward faces sample the front view, shifted by `elevation` (default 0.08).
3. **Builders** in `js/three/models/` (old `liftFurnace.js` and `boxFurnace.js` were deleted):

   | Builder | Product | Views | Animation |
   |---|---|---|---|
   | `s9.js` | NeunoRton S9 | front, left (right mirrored), back | lift table |
   | `m9.js` | NeunoRton M9 | front, left | door on left hinges; hollow chamber |
   | `m5.js` | NeunoRton M5 | front, back | lowering cylindrical hood |
   | `scanner.js` | Aident AI-S3 | front (07), right end (08), back (03) | tilt arm + spinning plate |
   | `mill.js` | Zahndent ZDM-E5 | front (detail-04) | top-hinged window door; illustrative chamber |

   - Each product's view calibration rects (normalized image coords of the model's W×H or D×H extents) are in `products.json → model3d.views`.
   - The AI-S3 has `preferredYaw: 0.62` so the product viewer opens on the scan-bay side.
4. **Viewer (`js/three/viewer.js`) changes:**
   - Fit to each model's height and turntable radius.
   - Per-product `preferredYaw`.
   - `el.idtViewer` exposes the API (`snapshot()` returns a PNG blob).
   - The key light was raised to shorten the shadow.
5. **Data updates in `products.json`:**
   - **AI-S3:**
     - Primary source is now the catalogue PDF.
     - Added: blue-light fringe projection, 94×89×60 mm scan area, STL/PLY/OBJ export, exocad/3Shape, AI screw-channel closure, AI tooth sorting.
     - Conflicting figures are flagged: impression 18 s, weight 6.5 kg.
   - **E5:**
     - Added: Haozhi spindle, 24 h operation, full arch ~1.5 h, ~600 teeth per bur, free calibration, 90° cutting.
     - Dimensions are flagged: the front render implies ~539 mm width, against the sheet's 494.
     - The model uses W539 × H668 × D637.
   - **M5:** dimensions corrected to W290 × D329 × H541.
   - **Galleries:** official images added with a `credit` field (29 images total, all serve OK).
   - **`usageRights`:** text updated.
6. **`PRODUCT_RESEARCH.md` and `README.md`** were updated to match.

## Dev/QA tools

All dev-only.

| Tool | What it does |
|---|---|
| `tools/model-lab.html?id=<id>&view=front\|left\|right\|back\|persp[&demo=1]` | Renders the model against its reference image and POSTs a PNG to `reference/_renders/<id>-<view>.png`. Read the PNG with the Read tool. Rendering can take up to ~40 s; poll `window.done`. |
| `tools/crop.ps1 -Src … -X0 -Y0 -X1 -Y1 -Scale -Grid -Out` | Crops and gridifies an image for measuring. Grid labels are absolute image px. **Doesn't read WebP**; convert first with `tools/to-png.html?src=…&name=….png`. |
| `tools/calibrate.html` | Pixel bbox and profile helpers. White-on-white shadows make them unreliable. |
| `tools/make-sheet.ps1` | Builds contact sheets in `reference/sheets/`. |
| `tools/serve.ps1` | Has a dev-only `POST /__save?name=x.png` endpoint. |

Preview-pane screenshots are flaky (they time out, and frames are throttled when the pane is hidden). Prefer `model-lab` PNGs, `viewer.snapshot()`, or the Read tool on image files.

## Known open items / ideas

- **Unconfirmed product details:** E5 width; AI-S3 impression time and weight; M9 max temperature (1700 vs 1560 °C).
- **Missing views:**
  - Sides with no official view use a plain fallback colour: E5 sides/back, M5 sides, AI-S3 tower outer face.
  - The furnace tops use procedural vent decals.
- **IDT placeholders still pending:** contact details (`js/core/site.js`), About facts, support text, official logo.
- **Rights:** confirm reseller rights for the manufacturer images.

## QA pass (2026-10-11)

- **Checked (all passing):**
  - 12 page variants load with no JS errors, no broken images and no duplicate ids. All inputs have labels.
  - No horizontal scroll at 375px. Every referenced file and ES import exists.
  - Contact form: validation and the offline fallback (mailto / WhatsApp / copy) work.
  - Review dialog: validation and product preselect work.
  - Reviews GET API is live, around 3 s cold.
  - Mobile menu opens and closes on Esc; WhatsApp and Facebook links are correct.
- **Fixed:**
  - About h1 "Technologies." was clipped on phones. Added a `.page-hero__title` 10.4vw rule at ≤479px.
  - The WhatsApp FAB covered the hero "View in 3D" button on phones. The hero CTAs are now more compact at ≤559px.
  - `tools/serve.ps1` returned 500 for HEAD requests (dev only).
- **Still open (content):**
  - Placeholders filled 2026-10-11: founded 2024, service area / installation & training = Egypt, hours confirmed. "After-sales service" row and About "Editable section" notice removed (no info supplied yet).
  - `assets/.../zahndent-zdm-e5/E5.mp4` (73 MB) and `aident-catalog-2026.pdf` are reference-only. Exclude them when deploying.
