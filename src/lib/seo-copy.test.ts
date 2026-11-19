import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

// Règle commerciale : J2L Print fonctionne sur demande de devis ; aucun texte SEO
// ne doit promettre un prix immédiat ni une commande entièrement en ligne.
const BANNED = /prix (affiché|immédiat|en direct)|s'affiche (immédiatement|en ligne)|voir le prix|se configurent en ligne|entièrement en ligne|commandez en ligne/i;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(resolve(dir, e.name)) : e.name.endsWith(".json") ? [resolve(dir, e.name)] : []);
}

describe("textes SEO conformes au fonctionnement sur devis", () => {
  it("pages, produits et thèmes générés", () => {
    for (const f of ["pages", "products", "themes"]) {
      const txt = readFileSync(resolve("src/seo/generated", `${f}.json`), "utf8");
      expect(txt.match(BANNED)?.[0] ?? null).toBeNull();
    }
  });
  it("pages locales générées", () => {
    const bad = files(resolve("public/seo-local")).filter((f) => BANNED.test(readFileSync(f, "utf8")));
    expect(bad).toEqual([]);
  });
});
