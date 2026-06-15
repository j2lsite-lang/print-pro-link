// Vite plugin: after the bundle is written, generate static, crawler-
// readable HTML files for every SEO page by injecting the prerendered
// head + body into the built dist/index.html shell. Runs inside
// `vite build` (writeBundle) so it executes on every Lovable publish.
// Fully defensive: never throws, so a content issue can't break the build.
import type { Plugin } from "vite";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { injectIntoShell } from "../../src/seo/render";
import type { SeoPage } from "../../src/seo/types";

export function prerenderPlugin(): Plugin {
  return {
    name: "j2l-seo-prerender",
    apply: "build",
    closeBundle() {
      try {
        const outDir = resolve("dist");
        const shellPath = resolve(outDir, "index.html");
        const pagesPath = resolve("src/seo/generated/pages.json");
        if (!existsSync(shellPath) || !existsSync(pagesPath)) {
          console.warn("[prerender] shell or pages.json missing — skipped");
          return;
        }
        const shell = readFileSync(shellPath, "utf8");
        const byPath = JSON.parse(readFileSync(pagesPath, "utf8")) as Record<string, SeoPage>;
        let count = 0;
        for (const page of Object.values(byPath)) {
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
        console.log(`[prerender] wrote ${count} static HTML pages`);
      } catch (err) {
        console.warn("[prerender] skipped due to error:", (err as Error).message);
      }
    },
  };
}
