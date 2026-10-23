/**
 * Server locale per provare il sito senza Netlify: database Postgres locale, API e frontend compilato.
 * Uso: npm run locale  (poi apri http://localhost:8888)
 */
import { NetlifyDB } from "@netlify/database-dev";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

process.env.SESSION_SECRET ??= "solo-in-locale-un-segreto-lungo-almeno-32";
process.env.SETUP_CODE ??= "prova";
process.env.CENA_ARCHIVIO_MEMORIA = "1";

const pg = new NetlifyDB({ directory: ".locale-db" });
const cs = await pg.start();
await pg.applyMigrations("./netlify/database/migrations").catch((e: Error) => console.log("Migrazioni:", e.message));
process.env.CENA_DB_URL = cs;
const { gestisci } = await import("../server/router.ts");

const radice = join(process.cwd(), "dist/cena/browser");
const tipi: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost:8888");
  if (url.pathname.startsWith("/api/")) {
    const corpo = req.method === "GET" || req.method === "HEAD" ? undefined : await new Promise<Buffer>((ok) => {
      const parti: Buffer[] = [];
      req.on("data", (c) => parti.push(c));
      req.on("end", () => ok(Buffer.concat(parti)));
    });
    const r = await gestisci(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body: corpo }));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
    return;
  }
  let file = normalize(join(radice, url.pathname));
  if (!file.startsWith(radice)) { res.writeHead(403).end(); return; }
  try { if ((await stat(file)).isDirectory()) file = join(file, "index.html"); } catch { file = join(radice, "index.html"); }
  try {
    res.writeHead(200, { "content-type": tipi[extname(file)] ?? "application/octet-stream" });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
}).listen(8888, () => console.log(`Pronto su http://localhost:8888  (codice di primo avvio: ${process.env.SETUP_CODE})`));
