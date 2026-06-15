// Standalone prerender preview — generates real, JS-free HTML samples
// without running a full Vite build. Writes files under
// /mnt/documents/seo-preview/ for inspection and prints a couple of
// samples to stdout. The production prerender (vite plugin) reuses the
// same buildAllPages() + injectIntoShell().
import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { buildAllPages } from "./build-pages";
import { injectIntoShell } from "../../src/seo/render";

async function main() {
  const shell = readFileSync(resolve("index.html"), "utf8");
  const pages = await buildAllPages();
  const outRoot = "/mnt/documents/seo-preview";

  for (const page of pages) {
    const html = injectIntoShell(shell, page);
    const file = resolve(outRoot, `.${page.path === "/" ? "/index" : page.path}/index.html`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  }

  const counts = pages.reduce<Record<string, number>>((acc, p) => {
    const k = p.path === "/" ? "home"
      : p.path.startsWith("/categorie/") && p.path.split("/").length === 4 ? "subcategory"
      : p.path.startsWith("/categorie/") ? "category"
      : p.path.startsWith("/ville/") ? "city"
      : p.path.startsWith("/departement/") ? "department"
      : "other";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  console.log(`Generated ${pages.length} prerendered pages →`, counts);
  console.log("\n========== RAW HTML SAMPLE: /categorie/impression-papier ==========\n");
  console.log(injectIntoShell(shell, pages.find((p) => p.path === "/categorie/impression-papier")!));
}

main();
