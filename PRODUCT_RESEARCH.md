# IDT Product Research Report

_Researched 2026-10-09 and updated 2026-10-10 from the three manufacturer websites IDT supplied. The structured data is in [`data/products.json`](data/products.json), and the website renders only from that file._

## Update — 2026-10-10

IDT supplied the official sites to use: aident3d.com, zahndent.com and neunorton.com/products. All product imagery, multi-angle renders and the Aident catalogue PDF were downloaded into `assets/images/products/source/<product>/`. The galleries show them with a manufacturer credit.

### AI-S3: Aident catalogue (`aident-catalog-2026.pdf`, pages 5–6) is now the primary source

Added from the catalogue:
- Blue-light fringe (grating) projection.
- 94 × 89 × 60 mm scan area.
- STL/PLY/OBJ export, with exocad and 3Shape compatibility.
- AI screw-channel closure.
- AI teeth-sorting and order dispatch: 25 positions in 2 s.
- CE, ISO 13485 and ISO 9001 marks shown by Aident.

Aident's own sources conflict on two values. The catalogue figure is published, with a flag:
- **Impression scan:** 15 s, 18 s or 19 s.
- **Weight:** 4 kg, 6 kg or 6.5 kg.

### ZDM-E5: added from Zahndent's detail images

- Haozhi water-cooled spindle, with 24-hour operation claimed by Zahndent.
- Six-tool magazine; each DC-coated bur carves about 600 teeth (Zahndent claim).
- Full-arch cut in about 1.5 h.
- Free calibration and 90° cutting.
- Window door that opens upward.

Zahndent's orthographic front render has a width-to-height ratio of 0.81. That contradicts the published 637 × 494 × 668 mm, so the dimensions spec is flagged. The 3D model uses 539 mm width with the published height and depth.

### M5: dimension order corrected

The published 329 × 290 × 541 mm is **depth × width × height**. The front render only scales consistently on both axes with a width of 290 mm.

### 3D models rebuilt from the official orthographic renders

Each model's geometry is measured from the official orthographic views below, and those images are projected onto it:

| Product | Views used |
|---|---|
| S9 | front, side and back |
| M9 | front and side |
| M5 | front and back |
| AI-S3 | front, end and back |
| E5 | front |

## Summary

You uploaded six images, which show **five distinct products** from three manufacturers. Every model was identified by matching it to the manufacturer's own product imagery and, where the device carries one, its printed model mark.

| # | Upload | Product | Manufacturer | Category | Confidence |
|---|--------|---------|--------------|----------|------------|
| 1 | #1, #2 | **ZDM-E5** Dental Lab Milling Machine | Zahndent | CAD/CAM Milling | Verified |
| 2 | #4 | **AI-S3** Fast Lab Scanner | Aident (Shenzhen Aident Technology Co., Ltd.) | Lab Scanning | Verified |
| 3 | #6 | **S9** High-Temperature Speed Sintering Furnace | NeunoRton (Zhongshan NeunoRton Intelligent Manufacturing Technology Co., Ltd.) | Zirconia Sintering | Verified |
| 4 | #5 | **M9** High-Temperature Sintering Furnace | NeunoRton | Zirconia Sintering | Partially verified |
| 5 | #3 | **M5** Vacuum Porcelain Furnace | NeunoRton | Porcelain Firing | Verified |

**Recommended catalog structure:** follow the digital lab workflow: **Scan → Mill → Sinter → Fire**.
`scanning` (AI-S3) → `milling` (ZDM-E5) → `sintering` (S9, M9) → `porcelain` (M5).

---

## 1. Zahndent ZDM-E5 Milling Machine (uploads #1 and #2)

- **How it was identified:** The device's front design matches the official ZDM-E5 image: an all-white housing, a wide landscape touch display, a round power button with two ports, a full-width window and the Zahndent wordmark below it. Zahndent's other mills (ZAHN-5Z, ZAHN-5T, ZDM-5T) have a dark or two-tone housing and a smaller square screen.
- **Key specs** (from the official parameter sheet image): 5-axis, dry milling. Materials: zirconia, wax, PMMA and PEEK. 1.2 kW water-cooled spindle at 20,000–60,000 RPM. 6 tools with automatic change and 4 mm shanks. 98 mm discs. 0.02 mm positioning accuracy. 1.8 kW total power at 220 V/50 Hz. Air supply 4.5–8 bar. External dimensions 637 × 494 × 668 mm. 111/148 kg. HyperDent CAM. 1-year warranty.
- **Sources:**
  - Official product page: <https://www.zahndent.com/product/dental-lab-milling-machine-zdm-e5/>
  - Parameter sheet image: `…/2025/08/ZDM-E5详情页（修改）_12.jpg`
  - Indications chart image: `…/2025/08/ZDM-E5详情页（修改）_13.jpg`
- **Uncertain or not published:**
  - The indications chart lists more zirconia indications than the parameter table. Only the table values are used.
  - The cabinet in upload #1 is IDT-branded and is not a listed E5 accessory. Its specs are unknown.
  - Both mill photos carry an AI-image ✦ sparkle mark. Please confirm they accurately depict the device being sold.
  - Marketplace listings disagree with the official site on several Zahndent figures (power, accuracy). Only the official sheet was used.

## 2. Aident AI-S3 Fast Lab Scanner (upload #4)

- **How it was identified:** "AI-S3" and the AIDENT logo are printed on the housing.
  - **Note:** the brand is **Aident**, not the similarly named Aidite.
- **Key specs:** dual 2.4 MP cameras. ±0.006 mm accuracy (ISO 12836). Scan times: 1 s occlusal, 8.5 s single arch, 12 s for 1–4 crowns, 19 s impression. True-color texture. 393 × 271 × 264 mm. 6 kg. DC 24 V. Direct impression scanning with automatic dual-impression alignment.
- **Sources:**
  - <https://www.aident3d.com/3d-scanner/dental-lab-scanner/fast-lab-scanner.html>
  - <https://www.aident3d.com/3d-scanner/dental-lab-scanner/scanner-for-dental-impression.html>
- **Uncertain or not published:**
  - The official pages do not state output formats, the interface or the light source.
  - A search-engine summary quoted STL/PLY/OBJ and USB 3.0, but that page now returns 404, so these are **not** published.
  - The "≈50% faster than regular scanners" claim is not published because it has no defined baseline.

## 3. NeunoRton S9 Speed Sintering Furnace (upload #6)

- **How it was identified:** "S9" is printed on the control panel, and the curved-top lift housing matches the official image.
- **Key specs:**
  - Thermal: 1700 °C maximum. Heating rate ≤100 °C/min. ±1 °C PID control. 3 × MoSi₂ heating elements.
  - Capacity: crucible Ø100 × 35 mm in up to 3 layers, for up to 25 crowns per cycle.
  - Control: 100 programs on a 7" touch screen, plus app monitoring.
  - Physical: 2500 W, 220/110 V. 498 × 346 × 811 mm. 70 kg.
- **Source:** <https://www.neunorton.com/zirconia-sintering-furnace/s9-zirconia-sintering-furnace.html>
- **Uncertain or not published:**
  - The page gives the fastest cycle as both "within one hour" and "2 hours". Only the spec-table figure of **2 h** is published.
  - Certifications (CE MDR, FDA, ISO 13485) are self-reported on the brand's YouTube channel and are not verified.

## 4. NeunoRton M9 Sintering Furnace (upload #5)

- **How it was identified:** The upload is the same image as the official M9 product photo.
- **Published specs:** ±1 °C PID control. MoSi₂ heating elements. Crucible 100 × 100 × 35 mm in 3 layers. 7" touch screen. 2500 W, 220/110 V. 361 × 360 × 555 mm. 50 kg. Power-off memory. Drying function. Warranty: 1 year for the machine and 6 months for consumables.
- **Source:** <https://www.neunorton.com/zirconia-sintering-furnace/m9.html>
- **Why it is only partially verified:** the official text contradicts itself.
  - **Maximum temperature:** 1700 °C in the title and spec table, but 1560 °C in the body. It is shown as 1700 °C with a *to be confirmed* flag.
  - **Lift-type features:** the page mentions a "lifting table", a "cylindrical chamber" and "opens step by step". These conflict with the front-door box design in the photo and are withheld.
  - **Heating rate and cycle time:** each is stated in two inconsistent ways and is withheld.

## 5. NeunoRton M5 Porcelain Furnace (upload #3)

- **How it was identified:** The lift hood with a heat-warning label, the base with a firing-curve display and the row of 6 blue control buttons match the official M5 image.
- **Key specs:**
  - Thermal: 1200 °C maximum. ±1 °C control. S-type thermocouple.
  - Vacuum: −98 kPa with an oil-free pump.
  - Capacity: 100 × 90 mm chamber.
  - Control: 100 program segments on a 7" touch screen. Built-in programs for Ivoclar, Vita and Noritake.
  - Physical: 1500 W. 329 × 290 × 541 mm. 20 kg.
- **Source:** <https://www.neunorton.com/porcelain-furnace/m5.html>
- **Note:** NeunoRton files the M5 under "Zirconia Sintering Furnace", but its specs are clearly those of a porcelain furnace. It is categorised here as **Porcelain Firing**.

---

## Official imagery and 3D assets

- **Official images:** at IDT's request (2026-10-10), these were downloaded from the manufacturers' websites and are shown in the galleries with credit. Reseller usage rights should still be confirmed with each manufacturer.
- **3D models:** none of the manufacturers publishes downloadable 3D models (GLB, STEP or similar). The site therefore uses **procedural 3D models** built to each device's published external dimensions, with screens textured from the uploaded photos. See the README for details.

## Open items for IDT to confirm

1. Pricing, lead times, regional certifications and IDT's own warranty and service terms for each product.
2. Missing scanner details: output formats, interface and bundled software for the AI-S3.
3. M9 maximum temperature, heating rate and cycle time.
4. Whether the IDT cabinet (upload #1) is a product IDT sells, and its specifications.
5. IDT company details: address, phone, email, registration, history and service area. Placeholders are used on the site.
