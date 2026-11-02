import pg from "pg";
import { createHmac, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/* ---------- Ambiente ---------- */

/** La versione dell'applicazione, per lo stato del sito nell'amministrazione. Un test la confronta con package.json. */
export const VERSIONE = "2.3.0";

export function env(nome: string): string | undefined {
  const n = (globalThis as { Netlify?: { env: { get(k: string): string | undefined } } }).Netlify;
  return n?.env.get(nome) ?? process.env[nome];
}

/* ---------- Database ---------- */

export interface Riga { [k: string]: unknown }
export interface Db {
  q<T = Riga>(sql: string, params?: unknown[]): Promise<T[]>;
  uno<T = Riga>(sql: string, params?: unknown[]): Promise<T | undefined>;
  transazione<T>(fn: (db: Db) => Promise<T>): Promise<T>;
  fine?(): Promise<void>;
}

type Esecutore = { query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>; end?(): Promise<void> };

function avvolgi(es: Esecutore, pool?: { connect(): Promise<Esecutore & { release(): void }>; end?(): Promise<void> }): Db {
  const db: Db = {
    async q<T>(sql: string, params: unknown[] = []) {
      const r = await es.query(sql, params);
      return r.rows as T[];
    },
    async uno<T>(sql: string, params: unknown[] = []) {
      const r = await es.query(sql, params);
      return r.rows[0] as T | undefined;
    },
    async transazione<T>(fn: (db: Db) => Promise<T>) {
      if (!pool) return fn(db);
      const c = await pool.connect();
      try {
        await c.query("BEGIN");
        const out = await fn(avvolgi(c));
        await c.query("COMMIT");
        return out;
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      } finally {
        c.release();
      }
    },
    async fine() {
      await pool?.end?.();
    },
  };
  return db;
}

let cache: Db | undefined;
type Pool = Esecutore & { connect(): Promise<Esecutore & { release(): void }>; end?(): Promise<void> };

function nuovoPool(connectionString: string): Pool {
  return new pg.Pool({
    connectionString,
    max: Number(env("CENA_DB_MAX") ?? 1),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  }) as unknown as Pool;
}

export function apriDb(connectionString?: string): Db {
  if (connectionString) {
    const pool = nuovoPool(connectionString);
    return avvolgi(pool, pool);
  }
  if (!cache) {
    const url = env("CENA_DB_URL");
    if (!url) throw new Errore(500, "Il sito non è configurato: manca CENA_DB_URL.", "configurazione");
    const pool = nuovoPool(url);
    cache = avvolgi(pool, pool);
  }
  return cache;
}

/** Applica le migrazioni mancanti. Un lock impedisce che due istanze lo facciano insieme. */
export async function migra(db: Db) {
  const { MIGRAZIONI } = await import("./migrazioni.ts");
  await db.transazione(async (t) => {
    await t.q("SELECT pg_advisory_xact_lock(7342001)");
    await t.q("CREATE TABLE IF NOT EXISTS migrazione (nome TEXT PRIMARY KEY, applicata TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    const fatte = new Set((await t.q<{ nome: string }>("SELECT nome FROM migrazione")).map((r) => r.nome));
    for (const m of MIGRAZIONI) {
      if (fatte.has(m.nome)) continue;
      await t.q(m.sql);
      await t.q("INSERT INTO migrazione (nome) VALUES ($1)", [m.nome]);
    }
  });
}

/** Segnala ai telefoni e al proiettore che qualcosa è cambiato. */
export async function tocca(db: Db, serataId: number) {
  const r = await db.uno<{ versione: string }>("UPDATE serata SET versione = versione + 1, aggiornata = NOW() WHERE id = $1 RETURNING versione", [serataId]);
  if (r) await annunciaVersione(serataId, r.versione);
}

/* ---------- Tempo reale (Ably): solo il numero di versione, mai contenuti ---------- */

const ABLY = "https://main.realtime.ably.net";
/** La rete verso Ably: i test la sostituiscono con una finta. */
export const tempoReale = { rete: (u: string, i: RequestInit) => fetch(u, i) };
export const canaleSerata = (sid: number) => `movente-serata-${sid}`;
export const ablyBase = ABLY;

export function chiaveAbly() {
  const k = env("ABLY_API_KEY");
  return k && /^[^.:\s]+\.[^.:\s]+:\S+$/.test(k) ? k : null;
}
export const autorizzazioneAbly = (k: string) => `Basic ${Buffer.from(k).toString("base64")}`;

/** Pubblica la nuova versione sul canale della serata. Se Ably non risponde in fretta, i browser se ne accorgono col controllo di sempre. */
async function annunciaVersione(sid: number, versione: string) {
  const k = chiaveAbly();
  if (!k) return;
  try {
    const r = await tempoReale.rete(`${ABLY}/channels/${encodeURIComponent(canaleSerata(sid))}/messages`, {
      method: "POST",
      headers: { authorization: autorizzazioneAbly(k), "content-type": "application/json" },
      body: JSON.stringify({ name: "versione", data: String(versione) }),
      signal: AbortSignal.timeout(1500),
    });
    if (!r.ok) console.warn(`Ably ha risposto ${r.status} alla pubblicazione`);
  } catch (e) {
    console.warn("Ably non raggiungibile", e);
  }
}

/* ---------- Errori e risposte ---------- */

export class Errore extends Error {
  constructor(public stato: number, messaggio: string, public codice = "errore") {
    super(messaggio);
  }
}

export const json = (dati: unknown, stato = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(dati), {
    status: stato,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

export async function corpo<T = Riga>(req: Request): Promise<T> {
  const tipo = req.headers.get("content-type") ?? "";
  if (!tipo.includes("application/json")) throw new Errore(415, "Richiesta non valida.");
  try {
    return (await req.json()) as T;
  } catch {
    throw new Errore(400, "Richiesta non leggibile.");
  }
}

export function testo(v: unknown, campo: string, { max = 4000, vuoto = false } = {}): string {
  if (typeof v !== "string") throw new Errore(400, `Manca il campo ${campo}.`);
  const t = v.trim();
  if (!vuoto && !t) throw new Errore(400, `Il campo ${campo} è vuoto.`);
  if (t.length > max) throw new Errore(400, `Il campo ${campo} è troppo lungo.`);
  return t;
}

export function intero(v: unknown, campo: string, { min = 0, max = 1_000_000 } = {}): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isInteger(n) || n < min || n > max) {
    throw new Errore(400, `Il campo ${campo} non è un numero valido.`);
  }
  return n;
}

/* ---------- Password ---------- */

export async function hashPassword(pw: string): Promise<string> {
  const sale = randomBytes(16);
  const h = await scrypt(pw, sale, 32);
  return `scrypt$${sale.toString("base64url")}$${h.toString("base64url")}`;
}

export async function verificaPassword(pw: string, salvato: string): Promise<boolean> {
  const [alg, s, h] = salvato.split("$");
  if (alg !== "scrypt" || !s || !h) return false;
  const atteso = Buffer.from(h, "base64url");
  const calcolato = await scrypt(pw, Buffer.from(s, "base64url"), atteso.length);
  return timingSafeEqual(atteso, calcolato);
}

const PAROLE = [
  "corvo", "luna", "candela", "cripta", "lanterna", "zucca", "gufo", "nebbia", "ombra", "cantina",
  "torre", "veleno", "pugnale", "specchio", "tomba", "civetta", "falò", "campana", "chiave", "ragno",
  "strega", "teschio", "mantello", "porta", "scala", "orologio", "lupo", "pozzo", "quadro", "baule",
].map((p) => p.normalize("NFD").replace(/[̀-ͯ]/g, ""));

/** Password facile da dettare a voce: due parole e un numero. */
export function passwordLeggibile(): string {
  const a = PAROLE[randomInt(PAROLE.length)];
  let b = PAROLE[randomInt(PAROLE.length)];
  while (b === a) b = PAROLE[randomInt(PAROLE.length)];
  return `${a}-${b}-${randomInt(10, 100)}`;
}

export function slug(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "utente";
}

/** Indirizzo pubblico di una serata (/s/<slug>), dal titolo e libero: a parità si aggiunge un numero. */
export async function slugSerata(db: Db, titolo: string, tranne?: number): Promise<string> {
  const base = slug(titolo) === "utente" ? "serata" : slug(titolo);
  let s = base;
  for (let i = 2; await db.uno("SELECT id FROM serata WHERE slug = $1 AND id IS DISTINCT FROM $2", [s, tranne ?? null]); i++) s = `${base}-${i}`;
  return s;
}

/* ---------- Sessioni ---------- */

export type Ruolo = "regia" | "squadra" | "schermo";
/** k: "u" per un utente (regia, amministrazione, tabella utente); assente per squadre e proiettore (tabella account). */
export interface Sessione { k?: "u"; a: number; r: Ruolo; v: number; e: number }

const COOKIE = "cena_sessione";
const DURATA_MS = 1000 * 60 * 60 * 20;

function segreto(): string {
  const s = env("SESSION_SECRET");
  if (!s || s.length < 32) throw new Errore(500, "Il sito non è configurato: manca SESSION_SECRET di almeno 32 caratteri.", "configurazione");
  return s;
}

export function firmaSessione(s: Omit<Sessione, "e">): string {
  const dati: Sessione = { ...s, e: Date.now() + DURATA_MS };
  const p = Buffer.from(JSON.stringify(dati)).toString("base64url");
  const f = createHmac("sha256", segreto()).update(p).digest("base64url");
  return `${p}.${f}`;
}

export function leggiSessione(token: string | undefined): Sessione | null {
  if (!token) return null;
  const [p, f] = token.split(".");
  if (!p || !f) return null;
  const atteso = createHmac("sha256", segreto()).update(p).digest();
  const dato = Buffer.from(f, "base64url");
  if (dato.length !== atteso.length || !timingSafeEqual(dato, atteso)) return null;
  try {
    const s = JSON.parse(Buffer.from(p, "base64url").toString()) as Sessione;
    if (typeof s.e !== "number" || s.e < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

export function cookieSessione(token: string): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURATA_MS / 1000}`;
}
export const cookieUscita = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function tokenDaRichiesta(req: Request): string | undefined {
  const c = req.headers.get("cookie") ?? "";
  for (const parte of c.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === COOKIE) return v.join("=");
  }
  return undefined;
}
