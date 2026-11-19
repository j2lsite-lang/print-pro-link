import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import worker from "../../public/cloudflare-worker-j2lprint.js";
import pages from "../seo/generated/pages.json";
import { catalogAliases } from "../../scripts/seo/catalog-aliases";
import type { SeoPage } from "../seo/types";

const context = { waitUntil: (_promise: Promise<unknown>) => undefined };
const handle = (path: string, method = "GET") => worker.fetch(new Request(`https://j2lprint.fr${path}`, { method }), {}, context);

describe("routage du Worker existant", () => {
  beforeEach(() => {
    vi.stubGlobal("caches", { default: { match: vi.fn(), put: vi.fn().mockResolvedValue(undefined) } });
    vi.stubGlobal("fetch", vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname.replace(/\/index.html$/, "");
      const alias = catalogAliases(pages as unknown as Record<string, SeoPage>)[path];
      const canonical = alias?.canonicalPath || path;
      return new Response(`<html><head><link rel="canonical" href="https://j2lprint.fr${canonical}"></head><body>Page</body></html>`, { headers: { "Content-Type": "text/html" } });
    }));
  });
  afterEach(() => vi.unstubAllGlobals());
  it.each(["paris", "lyon", "epinal", "bordeaux"])("redirige l'ancienne ville %s vers son équivalent réel", async (slug) => {
    const response = await handle(`/imprimerie/${slug}`);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(`https://j2lprint.fr/ville/${slug}`);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["/adresse-totalement-inconnue", "/products/inconnu", "/products/category/inconnu", "/ville/paris/inconnue", "/imprimerie/inconnue"])("renvoie une vraie 404 pour %s", async (path) => {
    expect((await handle(path)).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["/products", "/products/category/impression-papier", "/products/category/papeterie"])("demande le fichier de la page %s, pas l'accueil", async (path) => {
    expect((await handle(path)).status).toBe(200);
    const request = vi.mocked(fetch).mock.calls[0]?.[0] as Request;
    expect(new URL(request.url).pathname).toBe(`${path}/index.html`);
  });
  it("refuse l'accueil de repli sur une page réelle sans la supprimer", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('<html><head><link rel="canonical" href="https://j2lprint.fr/"></head></html>', { headers: { "Content-Type": "text/html" } }));
    expect((await handle("/products/garden-signs")).status).toBe(503);
  });
  it("HEAD a le même statut que GET et aucun corps", async () => {
    const response = await handle("/products/category/impression-papier", "HEAD");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
    expect((await handle("/inconnu", "HEAD")).status).toBe(404);
  });
  it("ne met pas le panier ni le formulaire de devis en cache", async () => {
    expect((await handle("/cart")).headers.get("Cache-Control")).toBe("no-store");
    expect((await handle("/checkout")).headers.get("Cache-Control")).toBe("no-store");
    expect((caches as unknown as { default: { put: ReturnType<typeof vi.fn> } }).default.put).not.toHaveBeenCalled();
  });
});