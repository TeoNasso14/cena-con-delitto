import { NetlifyDB } from "@netlify/database-dev";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { apriDb, Db, migra, VERSIONE } from "../base.ts";
import { gestisci } from "../router.ts";

process.env.SESSION_SECRET = "segreto-di-prova-lungo-almeno-trentadue-caratteri";
process.env.SETUP_CODE = "codice-avvio";
process.env.CENA_ARCHIVIO_MEMORIA = "1";

let pg: NetlifyDB;
let db: Db;
let admin = "";
const regia: Record<string, string> = {};
const id: Record<string, number> = {};
let serata = 0;
const TITOLO = "Villa Segretissima del Conte";

async function chiama(metodo: string, path: string, body?: unknown, cookie?: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (body !== undefined && !(body instanceof Uint8Array)) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const corpo = body === undefined ? undefined : body instanceof Uint8Array ? body : JSON.stringify(body);
  const res = await gestisci(new Request(`https://cena.test${path}`, { method: metodo, headers, body: corpo }), db);
  const set = res.headers.get("set-cookie");
  return { stato: res.status, dati: (await res.json()) as any, cookie: set ? set.split(";")[0] : undefined };
}
const vista = async () => (await chiama("GET", "/api/admin", undefined, admin)).dati;

beforeAll(async () => {
  pg = new NetlifyDB();
  db = apriDb(await pg.start());
  await migra(db);
  admin = (await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "teo", password: "password-amministrazione" })).cookie!;
  for (const nome of ["anna", "bruno"]) {
    const inv = await chiama("POST", "/api/admin/inviti", { nome: nome === "anna" ? "Anna" : "Bruno" }, admin);
    regia[nome] = (await chiama("POST", `/api/invito/${inv.dati.token}`, { username: nome, password: "una-password-lunga" })).cookie!;
  }
  const v = await vista();
  id.anna = v.utenti.find((u: any) => u.username === "anna").id;
  id.bruno = v.utenti.find((u: any) => u.username === "bruno").id;
  id.teo = v.io.id;
  await chiama("POST", "/api/regia/serate", { titolo: TITOLO }, regia.anna);
  serata = (await chiama("GET", "/api/regia/serate", undefined, regia.anna)).dati.serate[0].id;
  const x = { "x-serata": String(serata) };
  await chiama("PUT", "/api/regia/fasi", { fasi: [{ nome: "Prologo segreto" }] }, regia.anna, x);
  await chiama("POST", "/api/regia/squadre", { nome: "Corvi" }, regia.anna, x);
  await chiama("POST", "/api/regia/prova-generale", {}, regia.anna, x);
  await chiama("POST", "/api/regia/fase", { numero: 1 }, regia.anna, x);
  const png = new Uint8Array(1000).fill(7);
  const f = await chiama("POST", "/api/regia/allegati", png, regia.anna, { ...x, "content-type": "image/png" });
  expect(f.stato).toBe(201);
}, 60_000);
afterAll(async () => {
  await db.fine?.();
  await pg.stop();
});

test("la versione dell'applicazione è quella di package.json", () => {
  expect(VERSIONE).toBe(JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version);
});

describe("amministrazione 3.0", () => {
  test("numeri per account, mai contenuti delle serate", async () => {
    const v = await vista();
    const anna = v.utenti.find((u: any) => u.username === "anna");
    expect(anna).toMatchObject({ serate: 1, in_preparazione: 0, in_corso: 1, chiuse: 0, archiviate: 0, squadre: 1, spazio: 1000 });
    expect(anna.ultima_partita).not.toBeNull();
    expect(v.utenti.find((u: any) => u.username === "bruno")).toMatchObject({ serate: 0, squadre: 0, spazio: 0, ultima_partita: null });
    // niente titolo, indirizzo, nomi di fasi o squadre
    const tutto = JSON.stringify(v);
    for (const vietato of [TITOLO, "villa-segretissima", "Prologo segreto", "Corvi", "Prova generale"]) expect(tutto).not.toContain(vietato);
  });

  test("stato del sito", async () => {
    const s = (await vista()).sito;
    expect(s).toMatchObject({ versione: VERSIONE, tempoReale: false, serate: 1, squadre: 1, allegati: { file: 1, byte: 1000, daMisurare: 0 } });
    expect(s.database.ultimaMigrazione).toBe("20261102160000_amministrazione_3_0");
  });

  test("i file di prima della 3.0 si misurano a gruppi", async () => {
    await db.q("DELETE FROM allegato");
    expect((await vista()).sito.allegati).toEqual({ file: 1, byte: 0, daMisurare: 1 });
    expect((await chiama("POST", "/api/admin/allegati/misura", {}, regia.anna)).stato).toBe(403);
    expect((await chiama("POST", "/api/admin/allegati/misura", {}, admin)).dati).toEqual({ misurati: 1, restanti: 0 });
    const v = await vista();
    expect(v.sito.allegati).toEqual({ file: 1, byte: 1000, daMisurare: 0 });
    expect(v.utenti.find((u: any) => u.username === "anna").spazio).toBe(1000);
  });

  test("eliminare: solo account regia senza serate, con il nome utente come conferma", async () => {
    expect((await chiama("POST", `/api/admin/utenti/${id.teo}/elimina`, { conferma: "teo" }, admin)).stato).toBe(400);
    expect((await chiama("POST", `/api/admin/utenti/${id.anna}/elimina`, { conferma: "anna" }, admin)).dati.codice).toBe("ha_serate");
    expect((await chiama("POST", `/api/admin/utenti/${id.bruno}/elimina`, { conferma: "sbagliato" }, admin)).stato).toBe(400);
    expect((await chiama("POST", `/api/admin/utenti/${id.bruno}/elimina`, { conferma: "bruno" }, regia.anna)).stato).toBe(403);
  });

  test("passare le serate a un'altra regia, poi eliminare l'account vuoto", async () => {
    expect((await chiama("POST", `/api/admin/utenti/${id.anna}/trasferisci`, { a: id.teo }, admin)).stato).toBe(400);
    expect((await chiama("POST", `/api/admin/utenti/${id.anna}/trasferisci`, { a: id.anna }, admin)).stato).toBe(400);
    expect((await chiama("POST", `/api/admin/utenti/${id.anna}/trasferisci`, { a: id.bruno }, admin)).dati).toEqual({ ok: true, serate: 1 });
    expect((await chiama("GET", "/api/regia/serate", undefined, regia.bruno)).dati.serate.map((s: any) => s.id)).toEqual([serata]);
    expect((await chiama("GET", "/api/regia/serate", undefined, regia.anna)).dati.serate).toEqual([]);
    expect((await chiama("POST", `/api/admin/utenti/${id.anna}/elimina`, { conferma: "anna" }, admin)).stato).toBe(200);
    // la sessione di chi è stato eliminato non vale più
    expect((await chiama("GET", "/api/regia/serate", undefined, regia.anna)).stato).toBe(401);
    expect((await vista()).utenti.map((u: any) => u.username)).toEqual(["teo", "bruno"]);
  });

  test("il registro dice chi ha fatto cosa", async () => {
    const r = (await vista()).registro.map((x: any) => `${x.autore}: ${x.azione}${x.bersaglio ? ` (${x.bersaglio})` : ""}`).reverse();
    expect(r).toEqual([
      "teo: Amministrazione creata",
      "teo: Invito creato (Anna)",
      ": Invito accettato (Anna (anna))",
      "teo: Invito creato (Bruno)",
      ": Invito accettato (Bruno (bruno))",
      "teo: Allegati di prima misurati",
      "teo: 1 serata passata a Bruno (bruno) (Anna (anna))",
      "teo: Account eliminato (Anna (anna))",
    ]);
  });
});

test("l'aggiornamento alla 3.0 conserva i dati di un database 2.3 in uso", async () => {
  const { MIGRAZIONI } = await import("../migrazioni.ts");
  const altro = new NetlifyDB();
  const d2 = apriDb(await altro.start());
  const fino = MIGRAZIONI.findIndex((m) => m.nome === "20261102160000_amministrazione_3_0");
  await d2.q("CREATE TABLE migrazione (nome TEXT PRIMARY KEY, applicata TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  for (const m of MIGRAZIONI.slice(0, fino)) {
    await d2.q(m.sql);
    await d2.q("INSERT INTO migrazione (nome) VALUES ($1)", [m.nome]);
  }
  const u = await d2.uno<{ id: number }>("INSERT INTO utente (username, password_hash) VALUES ('organizza', 'x') RETURNING id");
  await d2.q("INSERT INTO serata (titolo, slug, proprietario_id) VALUES ('Halloween', 'halloween', $1)", [u!.id]);
  await migra(d2);
  expect((await d2.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM serata WHERE proprietario_id = $1", [u!.id]))!.n).toBe(1);
  expect((await d2.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM registro_admin"))!.n).toBe(0);
  expect((await d2.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM allegato"))!.n).toBe(0);
  await d2.fine?.();
  await altro.stop();
}, 60_000);
