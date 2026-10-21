// Price-only refresh: no catalog, URLs, sitemap, editorial content or Worker writes.
import { readFileSync, writeFileSync } from "node:fs";
import { resaleFromSupplierHT } from "../../src/lib/pricing";

const pricesPath = "src/seo/generated/product-prices.json";
const productsPath = "src/seo/generated/products.json";
const cache = JSON.parse(readFileSync(pricesPath, "utf8"));
for (const [sku, entry] of Object.entries(cache) as [string, any][]) {
  if (typeof entry.supplier !== "number" || !Number.isFinite(entry.supplier) || entry.supplier <= 0) delete cache[sku];
  else entry.price = resaleFromSupplierHT(entry.supplier);
}
const pages = JSON.parse(readFileSync(productsPath, "utf8"));
let offers = 0;
for (const page of Object.values(pages) as any[]) {
  for (const ld of page.jsonLd || []) {
    if (ld["@type"] !== "Product" || !ld.offers) continue;
    const price = cache[ld.sku]?.price;
    if (!price) { delete ld.offers; continue; }
    ld.offers.price = price;
    if (ld.offers.priceSpecification) ld.offers.priceSpecification.price = price;
    offers++;
  }
}
const xmlPath = "public/google-merchant.xml";
const xml = readFileSync(xmlPath, "utf8").replace(/<item>[\s\S]*?<\/item>/g, (item) => {
  const sku = item.match(/<g:id>(.*?)<\/g:id>/)?.[1];
  const price = sku ? cache[sku]?.price : null;
  return price ? item.replace(/<g:price>.*?<\/g:price>/, `<g:price>${price.toFixed(2)} EUR</g:price>`) : "";
});
writeFileSync(pricesPath, JSON.stringify(cache));
writeFileSync(productsPath, JSON.stringify(pages));
writeFileSync(xmlPath, xml);
console.log(`Repriced ${Object.keys(cache).length} supplier-backed prices, ${offers} offers; unrelated files untouched.`);