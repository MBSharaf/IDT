// Product data access. All pages read from data/products.json (single source of truth).
let cache;

export async function loadCatalog() {
  if (!cache) {
    cache = fetch('data/products.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(`products.json: HTTP ${r.status}`); return r.json(); })
      .then((json) => {
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
    .filter((x) => x.product);
}
