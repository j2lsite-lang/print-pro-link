import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import Seo from "@/components/Seo";
import { injectIntoShell } from "@/seo/render";
import pages from "@/seo/generated/pages.json";
import type { SeoPage } from "@/seo/types";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

afterEach(() => { document.body.innerHTML = ""; });
describe("métadonnées communes", () => {
  it("conserve une canonical après le prérendu et les navigations", () => {
    document.head.innerHTML = '<link rel="canonical" href="https://j2lprint.fr/"><link rel="canonical" href="https://j2lprint.fr/ville/paris"><meta name="description" content="ancien"><meta name="description" content="doublon">';
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => root.render(<Seo title="Flyers à Paris" description="Flyers personnalisés à Paris" path="/ville/paris/flyers" />));
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://j2lprint.fr/ville/paris/flyers");
    act(() => root.render(<Seo title="Cartes de visite" description="Cartes personnalisées" path="/products/businesscards" />));
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://j2lprint.fr/products/businesscards");
    expect(document.querySelectorAll('meta[name="description"]').length).toBe(1);
    act(() => root.unmount());
  });
  it("supprime les balises initiales en double quel que soit l'ordre des attributs", () => {
    const page = (pages as unknown as Record<string, SeoPage>)["/ville/paris"];
    const shell = '<html><head><title>Accueil</title><link href="https://j2lprint.fr/" rel="canonical"><link rel="canonical" href="https://j2lprint.fr/"></head><body><div id="root"></div></body></html>';
    const document = new DOMParser().parseFromString(injectIntoShell(shell, page), "text/html");
    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://j2lprint.fr/ville/paris");
  });
});