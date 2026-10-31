// Merges partial Arabic overlays into data/products.ar.json and checks them against data/products.json.
// Usage: node tools/merge-ar.mjs [part.json ...]   (no arguments = just check)
import fs from 'node:fs';

const base = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));
const outPath = 'data/products.ar.json';
const out = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : { categories: {}, products: {} };

for (const file of process.argv.slice(2)) {
  const part = JSON.parse(fs.readFileSync(file, 'utf8'));
  Object.assign(out.categories, part.categories);
  Object.assign(out.products, part.products);
}
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`);

// Every translated array must line up index by index with the English one.
let problems = 0;
const lists = ['highlights', 'labValue', 'features', 'specs', 'workflow'];
for (const p of base.products) {
  const o = out.products[p.id];
  if (!o) { console.log(`todo  ${p.id}`); continue; }
  for (const k of lists) {
    if (o[k] && o[k].length !== p[k].length) { console.log(`LEN   ${p.id}.${k}: ${o[k].length} vs ${p[k].length}`); problems++; }
  }
  if (o.gallery && o.gallery.length !== p.images.gallery.length) { console.log(`LEN   ${p.id}.gallery`); problems++; }
  p.specs.forEach((s, i) => { if (s.flag && o.specs && !o.specs[i]?.flag) { console.log(`FLAG  ${p.id}.specs[${i}] ${s.label}`); problems++; } });
  console.log(`ok    ${p.id}`);
}
console.log(problems ? `${problems} problem(s)` : 'aligned');
