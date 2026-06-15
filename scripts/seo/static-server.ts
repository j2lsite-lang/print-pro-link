/**
 * Serveur statique reproduisant un hébergement type (clean URLs).
 * Résolution: fichier exact -> path/index.html -> 404 (PAS de SPA fallback
 * silencieux pour exposer le vrai comportement).
 */
import { createServer } from "http";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";

const DIST = join(process.cwd(), "dist");
const PORT = 4178;

const types: Record<string, string> = {
  ".html": "text/html",
  ".xml": "application/xml",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

function resolveFile(urlPath: string): string | null {
  let p = decodeURIComponent(urlPath.split("?")[0]);
  if (p === "/") return join(DIST, "index.html");
  const noSlash = p.replace(/\/$/, "");
  const candidates = [
    join(DIST, noSlash),                 // fichier exact (ex: /sitemap.xml)
    join(DIST, noSlash, "index.html"),   // dossier clean URL
  ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

createServer((req, res) => {
  const file = resolveFile(req.url || "/");
  if (!file) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end("404 Not Found");
    return;
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`static server on ${PORT}`));
