import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { injectIntoShell } from "@/seo/render";
import type { SeoPage } from "@/seo/types";
import { catalogAliases } from "../../scripts/seo/catalog-aliases";
import { editorialPages } from "../../scripts/seo/editorial-pages";

// Règle commerciale : J2L Print fonctionne sur demande de devis ; aucun texte SEO
// ne doit promettre un prix immédiat ni une commande entièrement en ligne.
const BANNED = /prix (affiché|immédiat|en direct)|s'affiche (immédiatement|en ligne)|voir le prix|se configurent en ligne|entièrement en ligne|commandez en ligne|(?:prix|tarifs?)[^.!?\n"`]{0,80}(?:en direct|immédiatement|aussitôt|directement|instantanément)|se personnalise et se commande en ligne|commande 100 % en ligne|tout se commande|composer ma commande en ligne|lancez votre commande en ligne|commande en ligne, livraison|tout se configure en ligne/i;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(resolve(dir, e.name)) : /\.(json|html|ts|tsx|js|txt)$/.test(e.name) && !e.name.includes(".test.") ? [resolve(dir, e.name)] : []);
}

describe("textes SEO conformes au fonctionnement sur devis", () => {
  it("pages, produits et thèmes générés", () => {
    for (const f of ["pages", "products", "themes", "product-meta"]) {
      const txt = readFileSync(resolve("src/seo/generated", `${f}.json`), "utf8");
      expect(txt.match(BANNED)?.[0] ?? null).toBeNull();
    }
  });
  it("pages locales générées", () => {
    const bad = files(resolve("public/seo-local")).filter((f) => BANNED.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
  it("sources et fichiers publics, y compris descriptions répétées des cartes", () => {
    const bad = ["src", "scripts", "public", "supabase"].flatMap((dir) => files(resolve(dir)))
      .filter((f) => BANNED.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
  it("HTML prérendu de toutes les pages, catégories, produits et pages locales", () => {
    const shell = readFileSync(resolve("index.html"), "utf8");
    const pages = JSON.parse(readFileSync(resolve("src/seo/generated/pages.json"), "utf8")) as Record<string, SeoPage>;
    const inventories = ["pages", "products", "themes"].map((f) => resolve("src/seo/generated", `${f}.json`))
      .concat(files(resolve("public/seo-local")));
    const all = inventories.flatMap((f) => Object.values(JSON.parse(readFileSync(f, "utf8")) as Record<string, SeoPage>))
      .concat(Object.values(catalogAliases(pages)), editorialPages());
    const bad = all.filter((page) => BANNED.test(injectIntoShell(shell, page))).map((page) => page.path);
    expect(bad).toEqual([]);
  }, 30000);
});
