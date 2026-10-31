// Product data access. All pages read from data/products.json (single source of truth); in Arabic,
// data/products.ar.json is laid over it (same shapes, arrays aligned by index).
import { isAr } from './i18n.js';

let cache;

const getJson = (url) => fetch(url, { cache: 'no-cache' })
  .then((r) => { if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return r.json(); });

export async function loadCatalog() {
  if (!cache) {
    cache = Promise.all([getJson('data/products.json'), isAr ? getJson('data/products.ar.json').catch(() => null) : null])
      .then(([json, ar]) => {
        json.products.forEach((p) => { p.en = { name: p.name, tagline: p.tagline }; });
        if (ar) localise(json, ar);
        json.products.sort((a, b) => a.order - b.order);
        return json;
      });
  }
  return cache;
}

export async function getProducts() { return (await loadCatalog()).products; }
export async function getCategories() { return (await loadCatalog()).meta.categories; }
export async function getProduct(id) { return (await getProducts()).find((p) => p.id === id) || null; }

export const productUrl = (p) => `product.html?id=${encodeURIComponent(p.id)}`;
export const inquiryUrl = (p) => `contact.html?product=${encodeURIComponent(p.id)}#inquiry`;

/** Hero/workflow lineup: the first product of each workflow category, in workflow order. */
export async function getWorkflowLineup() {
  const { products, meta } = await loadCatalog();
  return meta.categories
    .slice()
    .sort((a, b) => a.step - b.step)
    .map((c) => ({ category: c, product: products.find((p) => p.category === c.id && p.featured) || products.find((p) => p.category === c.id) }))
    .filter((x) => x.product && x.category.workflow !== false);
}

function localise(json, ar) {
  json.meta.categories.forEach((c) => Object.assign(c, ar.categories?.[c.id]));
  json.products.forEach((p) => {
    const cat = json.meta.categories.find((c) => c.id === p.category);
    if (cat) p.categoryLabel = cat.label;
    const o = ar.products?.[p.id];
    if (!o) return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'gallery') v.forEach((alt, i) => { if (alt && p.images.gallery[i]) p.images.gallery[i].alt = alt; });
      else if (Array.isArray(v) && Array.isArray(p[k])) p[k] = p[k].map((x, i) => (v[i] == null ? x : typeof x === 'object' ? { ...x, ...v[i] } : v[i]));
      else p[k] = v;
    }
  });
}
