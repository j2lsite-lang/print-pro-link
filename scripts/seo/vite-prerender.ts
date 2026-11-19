// Vite plugin: after the bundle is written, generate static, crawler-
// readable HTML files for every SEO page by injecting the prerendered
// head + body into the built dist/index.html shell. Runs inside
// `vite build` (writeBundle) so it executes on every Lovable publish.
// Fail closed: missing SEO output must not be published as a successful build.
import type { Plugin } from "vite";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { injectIntoShell } from "../../src/seo/render";
import type { SeoPage } from "../../src/seo/types";
import { catalogAliases } from "./catalog-aliases";
import { editorialPages } from "./editorial-pages";

export function prerenderPlugin(): Plugin {
  return {
    name: "j2l-seo-prerender",
    apply: "build",
    closeBundle() {
      try {
        const outDir = resolve("dist");
        const shellPath = resolve(outDir, "index.html");
        const pagesPath = resolve("src/seo/generated/pages.json");
        const productsPath = resolve("src/seo/generated/products.json");
        const themesPath = resolve("src/seo/generated/themes.json");
        if (![shellPath, pagesPath, productsPath, themesPath, resolve("public/seo-local")].every(existsSync)) {
          throw new Error("[prerender] required shell or SEO inventory missing");
        }
        const shell = readFileSync(shellPath, "utf8");
        const byPath = JSON.parse(readFileSync(pagesPath, "utf8")) as Record<string, SeoPage>;
        // Product + theme pages are stored separately to keep the runtime bundle
        // small, but they must be prerendered to real /…/index.html files.
        const products: Record<string, SeoPage> = existsSync(productsPath)
          ? (JSON.parse(readFileSync(productsPath, "utf8")) as Record<string, SeoPage>)
          : {};
        const themes: Record<string, SeoPage> = existsSync(themesPath)
          ? (JSON.parse(readFileSync(themesPath, "utf8")) as Record<string, SeoPage>)
          : {};
        const localPages: SeoPage[] = [];
        const localDir = resolve("public/seo-local");
        if (existsSync(localDir)) {
          for (const scope of readdirSync(localDir)) {
            for (const f of readdirSync(resolve(localDir, scope))) {
              localPages.push(...Object.values(JSON.parse(readFileSync(resolve(localDir, scope, f), "utf8")) as Record<string, SeoPage>));
            }
          }
        }
        const allPages = [...localPages, ...Object.values(byPath), ...Object.values(products), ...Object.values(themes), ...Object.values(catalogAliases(byPath)), ...editorialPages()];
        let count = 0;
        for (const page of allPages) {
          if (page.path === "/") {
            // homepage: overwrite root index.html head + intro block
            writeFileSync(shellPath, injectIntoShell(shell, page));
            count++;
            continue;
          }
          const file = resolve(outDir, `.${page.path}/index.html`);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, injectIntoShell(shell, page));
          count++;
        }
        console.log(`[prerender] wrote ${count} static HTML pages (${Object.keys(products).length} products, ${Object.keys(themes).length} themes, ${localPages.length} local)`);
      } catch (err) {
        throw new Error(`[prerender] failed: ${(err as Error).message}`);
      }
    },
  };
}
