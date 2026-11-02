import { getStore } from "@netlify/blobs";
import { randomBytes } from "node:crypto";
import { utente } from "./accesso.ts";
import { Db, env, Errore, json } from "./base.ts";

const MAX_BYTE = 4 * 1024 * 1024;
const TIPI = /^(image\/(jpeg|png|webp|gif)|audio\/(mpeg|mp4|ogg|wav|webm)|video\/(mp4|webm)|application\/pdf)$/;

type Archivio = Pick<ReturnType<typeof getStore>, "set" | "getWithMetadata" | "delete" | "list">;
const memoria = new Map<string, { data: ArrayBuffer; metadata: Record<string, unknown> }>();
const archivioMemoria = {
  async set(key: string, data: ArrayBuffer, o?: { metadata?: Record<string, unknown> }) { memoria.set(key, { data, metadata: o?.metadata ?? {} }); },
  async getWithMetadata(key: string) { return memoria.get(key) ?? null; },
  async delete(key: string) { memoria.delete(key); },
  async list() { return { blobs: [...memoria.keys()].map((key) => ({ key, etag: "" })), directories: [] }; },
} as unknown as Archivio;

/** Su Netlify gli allegati vanno in Netlify Blobs; in locale (CENA_ARCHIVIO_MEMORIA=1) restano in memoria. */
const archivio = (): Archivio => (env("CENA_ARCHIVIO_MEMORIA") === "1" ? archivioMemoria : getStore({ name: "allegati", consistency: "strong" }));

/** Ricorda la grandezza di un allegato: serve allo stato del sito e ai numeri per account dell'amministrazione. */
async function registra(db: Db, key: string, serataId: number | null, byte: number, tipo: string) {
  await db.q("INSERT INTO allegato (chiave, serata_id, byte, tipo) VALUES ($1, $2, $3, $4) ON CONFLICT (chiave) DO NOTHING", [key, serataId, byte, tipo]);
}

/** Copia un allegato in un'altra serata con una chiave nuova (per duplicare una serata). Un file sparito resta senza copia. */
export async function copiaAllegato(db: Db, key: string, serataId: number): Promise<string | null> {
  const r = await archivio().getWithMetadata(key, { type: "arrayBuffer" });
  if (!r) return null;
  const nuova = `s${serataId}-${randomBytes(12).toString("base64url")}`;
  const metadata: Record<string, unknown> = { ...(r.metadata as Record<string, unknown>), serata: serataId };
  await archivio().set(nuova, r.data as ArrayBuffer, { metadata });
  await registra(db, nuova, serataId, (r.data as ArrayBuffer).byteLength, String(metadata.tipo ?? ""));
  return nuova;
}

/** Cancella gli allegati di una serata eliminata. */
export async function eliminaAllegati(db: Db, keys: string[]) {
  for (const k of keys) await archivio().delete(k);
  if (keys.length) await db.q("DELETE FROM allegato WHERE chiave = ANY($1::text[])", [keys]);
}

/** Gli allegati nell'archivio: quanti, quanto pesano quelli misurati, quanti non sono ancora misurati (caricati prima della 3.0). */
export async function contaAllegati(db: Db) {
  const chiavi = (await archivio().list()).blobs.map((b) => b.key);
  const misurati = await db.q<{ chiave: string; byte: string }>("SELECT chiave, byte FROM allegato WHERE chiave = ANY($1::text[])", [chiavi]);
  return { file: chiavi.length, byte: misurati.reduce((n, m) => n + Number(m.byte), 0), daMisurare: chiavi.length - misurati.length, chiavi, misurati: new Set(misurati.map((m) => m.chiave)) };
}

/** Misura fino a `quanti` allegati di prima della 3.0, scaricandoli uno alla volta. Restituisce quanti ne restano. */
export async function misuraAllegati(db: Db, quanti = 10) {
  const c = await contaAllegati(db);
  const da = c.chiavi.filter((k) => !c.misurati.has(k)).slice(0, quanti);
  for (const k of da) {
    const r = await archivio().getWithMetadata(k, { type: "arrayBuffer" });
    if (!r) continue;
    const sid = Number(/^s(\d+)-/.exec(k)?.[1]);
    const esiste = Number.isInteger(sid) && (await db.uno("SELECT 1 FROM serata WHERE id = $1", [sid]));
    await registra(db, k, esiste ? sid : null, (r.data as ArrayBuffer).byteLength, String((r.metadata as Record<string, unknown>)?.tipo ?? ""));
  }
  return { misurati: da.length, restanti: c.daMisurare - da.length };
}

/** La regia carica un file (foto, audio, video breve, PDF). Restituisce la chiave da salvare sulla prova o sulla scena. */
export async function carica(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const tipo = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  if (!TIPI.test(tipo)) throw new Errore(415, "Formato non supportato. Usa JPG, PNG, WEBP, GIF, MP3, M4A, OGG, WAV, MP4, WEBM o PDF.");
  const dati = await req.arrayBuffer();
  if (dati.byteLength === 0) throw new Errore(400, "Il file è vuoto.");
  if (dati.byteLength > MAX_BYTE) throw new Errore(413, "Il file supera 4 MB. Riducilo e riprova.");
  const key = `s${u.serata_id}-${randomBytes(12).toString("base64url")}`;
  await archivio().set(key, dati, { metadata: { tipo, serata: u.serata_id } });
  await registra(db, key, u.serata_id, dati.byteLength, tipo);
  return json({ key, tipo }, 201);
}

/** Serve un allegato solo a chi può vederlo. */
export async function servi(req: Request, db: Db, key: string) {
  // La serata sta nella chiave (s<id>-...): un <img> non porta l'intestazione x-serata della regia.
  const daChiave = Number(/^s(\d+)-/.exec(key)?.[1]);
  const u = await utente(req, db, ["regia", "squadra", "schermo"], Number.isInteger(daChiave) ? daChiave : undefined);
  if (!key.startsWith(`s${u.serata_id}-`)) throw new Errore(404, "File non trovato.");

  if (u.ruolo === "squadra") {
    const ok = await db.uno(
      `SELECT 1 FROM personaggio WHERE serata_id = $1 AND foto_key = $2
       UNION SELECT 1 FROM prova p JOIN sblocco sb ON sb.prova_id = p.id
       WHERE p.serata_id = $1 AND p.allegato_key = $2 AND sb.squadra_id = $3`,
      [u.serata_id, key, u.squadra_id],
    );
    if (!ok) throw new Errore(404, "File non trovato.");
  }
  if (u.ruolo === "schermo") {
    const ok = await db.uno(
      `SELECT 1 FROM scena s JOIN serata se ON se.scena_in_onda = s.id WHERE se.id = $1 AND s.allegato_key = $2
       UNION SELECT 1 FROM personaggio WHERE serata_id = $1 AND foto_key = $2
       UNION SELECT 1 FROM serata WHERE id = $1 AND sfondo_key = $2`,
      [u.serata_id, key],
    );
    if (!ok) throw new Errore(404, "File non trovato.");
  }

  const r = await archivio().getWithMetadata(key, { type: "arrayBuffer" });
  if (!r) throw new Errore(404, "File non trovato.");
  const tipo = String((r.metadata as { tipo?: string }).tipo ?? "application/octet-stream");
  return rispostaFile(r.data as ArrayBuffer, tipo, req.headers.get("range"));
}

/**
 * Risponde con il file intero o con il pezzo richiesto (Range).
 * Safari su iPhone ascolta audio e video solo se il server sa mandare i pezzi:
 * senza, la riproduzione si ferma a metà.
 */
export function rispostaFile(data: ArrayBuffer, tipo: string, range: string | null) {
  const totale = data.byteLength;
  const base = { "content-type": tipo, "cache-control": "private, max-age=3600", "x-content-type-options": "nosniff", "accept-ranges": "bytes" };
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (!m || (!m[1] && !m[2])) {
    return new Response(data, { headers: { ...base, "content-length": String(totale) } });
  }
  let inizio: number, fine: number;
  if (!m[1]) {
    inizio = Math.max(0, totale - Number(m[2]));
    fine = totale - 1;
  } else {
    inizio = Number(m[1]);
    fine = m[2] ? Math.min(Number(m[2]), totale - 1) : totale - 1;
  }
  if (inizio >= totale || inizio > fine) {
    return new Response(null, { status: 416, headers: { ...base, "content-range": `bytes */${totale}` } });
  }
  return new Response(data.slice(inizio, fine + 1), {
    status: 206,
    headers: { ...base, "content-range": `bytes ${inizio}-${fine}/${totale}`, "content-length": String(fine - inizio + 1) },
  });
}
