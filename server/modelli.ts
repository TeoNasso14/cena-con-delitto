import { utente, utenteSenzaSerata } from "./accesso.ts";
import { corpo, Db, Errore, json, slugSerata, testo } from "./base.ts";
import { copiaAllegato, copiaInModello, eliminaAllegati } from "./file.ts";
import { ErroreModello, genera } from "./modelli/genera.ts";
import { MODELLI } from "./modelli/index.ts";
import { allegatiDi, conAllegati, daCaso } from "./modelli/salva.ts";
import type { Modello, Scelte } from "./modelli/tipo.ts";
import { casoDellaSerata, combacia, scriviCaso, TEMI } from "./regia.ts";

/* ---------- Modelli di caso: quelli pronti, nel codice, e quelli salvati da ogni regia ---------- */

const MAX_PRIVATI = 30;

async function regiaSenzaSerata(req: Request, db: Db) {
  const u = await utenteSenzaSerata(req, db);
  if (u.admin) throw new Errore(403, "L'amministrazione non apre i modelli delle regie.", "vietato");
  return u;
}

/** Quello che serve a chi sceglie: mai le prove né le soluzioni. */
function scheda(m: Modello) {
  return {
    id: m.id, nome: m.nome, descrizione: m.descrizione, temi: m.temi, privato: !!m.privato,
    minimo: m.minimo, fasi: m.fasi.map((f) => ({ nome: f.nome, minuti: f.minuti })),
    segnaposto: Object.fromEntries((["luogo", "vittima", "anno"] as const).map((k) => [k, { etichetta: m.segnaposto[k].etichetta, proposte: m.segnaposto[k].proposte, usato: Object.keys(m.segnaposto[k].proposte).length > 0 }])),
    sospetti: m.sospetti.map((s) => ({ chiave: s.chiave, ruolo: s.ruolo, nomi: s.nomi, colpevole: !!s.colpevole })),
  };
}

export async function elenco(req: Request, db: Db) {
  const u = await regiaSenzaSerata(req, db);
  const miei = await db.q<{ id: number; dati: Modello }>("SELECT id, dati FROM modello WHERE proprietario_id = $1 ORDER BY creato DESC", [u.id]);
  return json({ modelli: [...MODELLI.map(scheda), ...miei.map((r) => scheda({ ...r.dati, id: `m${r.id}` }))] });
}

async function trova(db: Db, id: unknown, proprietario: number): Promise<Modello> {
  const pronto = MODELLI.find((m) => m.id === id);
  if (pronto) return pronto;
  const n = /^m(\d+)$/.exec(String(id))?.[1];
  const r = n ? await db.uno<{ dati: Modello }>("SELECT dati FROM modello WHERE id = $1 AND proprietario_id = $2", [Number(n), proprietario]) : null;
  if (!r) throw new Errore(404, "Modello non trovato.");
  return r.dati;
}

/** Le scelte arrivano dal browser: si tiene solo quello che ha senso. */
function pulisci(b: Record<string, unknown>): Scelte {
  const corto = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
  const numero = (v: unknown) => (Number.isInteger(v) ? (v as number) : undefined);
  const nomi: Record<string, string> = {};
  if (b.nomi && typeof b.nomi === "object") for (const [k, v] of Object.entries(b.nomi)) { const n = corto(v, 80); if (n) nomi[k.slice(0, 8)] = n; }
  const minuti = b.minuti === null ? null : numero(b.minuti);
  if (minuti !== null && minuti !== undefined && (minuti < 1 || minuti > 600)) throw new Errore(400, "Durata delle fasi non valida.");
  const d = numero(b.difficolta);
  if (d !== undefined && ![1, 2, 3].includes(d)) throw new Errore(400, "Difficoltà non valida.");
  return {
    tema: typeof b.tema === "string" && TEMI.includes(b.tema) ? b.tema : undefined,
    titolo: corto(b.titolo, 120), luogo: corto(b.luogo, 80), vittima: corto(b.vittima, 80), anno: corto(b.anno, 80), nomi,
    sospetti: numero(b.sospetti), fasi: numero(b.fasi), minuti, difficolta: d as Scelte["difficolta"], colpevole: corto(b.colpevole, 8),
  };
}

/** Una serata nuova da un modello. Non dice chi è il colpevole: chi sceglie "a sorte" lo trova in Il caso, se vuole. */
export async function creaSerata(req: Request, db: Db) {
  const u = await regiaSenzaSerata(req, db);
  const b = await corpo<{ modello?: string; scelte?: Record<string, unknown> }>(req);
  const m = await trova(db, b.modello, u.id);
  const scelte = pulisci(b.scelte ?? {});
  if (scelte.tema === undefined && !TEMI.includes(m.temi[0])) scelte.tema = m.temi.find((t) => TEMI.includes(t)) ?? "halloween";
  let g: ReturnType<typeof genera>;
  try {
    g = genera(m, scelte);
  } catch (e) {
    if (e instanceof ErroreModello) throw new Errore(400, e.message);
    throw e;
  }
  const titolo = testo(g.caso.serata?.titolo, "titolo", { max: 120 });
  const s = await db.uno<{ id: number; slug: string }>("INSERT INTO serata (titolo, proprietario_id, slug) VALUES ($1, $2, $3) RETURNING id, slug", [titolo, u.id, await slugSerata(db, titolo)]);
  const sid = s!.id;
  const copie = new Map<string, string | null>();
  try {
    let caso = g.caso;
    if (m.privato) {
      for (const k of allegatiDi(m)) copie.set(k, await copiaAllegato(db, k, sid));
      caso = genera(conAllegati(m, (k) => copie.get(k) ?? null), { ...scelte, colpevole: g.colpevole }).caso;
    }
    await db.transazione((t) => scriviCaso(t, sid, caso));
  } catch (e) {
    await eliminaAllegati(db, [...copie.values()].filter((k): k is string => !!k));
    await db.q("DELETE FROM serata WHERE id = $1", [sid]);
    throw e;
  }
  await db.q("INSERT INTO evento (serata_id, tipo, testo) VALUES ($1, 'regia', $2)", [sid, `Serata creata dal modello "${m.nome}"`]);
  return json({ id: sid, slug: s!.slug }, 201);
}

/** La serata aperta diventa un modello privato: nomi, luogo e vittima segnaposto, codici nuovi a ogni uso, allegati copiati. */
export async function salva(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const b = await corpo<{ nome?: string; descrizione?: string; luogo?: string; vittima?: string }>(req);
  const nome = testo(b.nome, "nome del modello", { max: 80 });
  const quanti = await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM modello WHERE proprietario_id = $1", [u.id]);
  if ((quanti?.n ?? 0) >= MAX_PRIVATI) throw new Errore(409, `Al massimo ${MAX_PRIVATI} modelli: eliminane uno prima.`);
  const caso = await casoDellaSerata(db, u.serata_id);
  const m = daCaso(caso as never, { nome, descrizione: testo(b.descrizione ?? "", "descrizione", { max: 400, vuoto: true }), luogo: testo(b.luogo ?? "", "luogo", { max: 80, vuoto: true }), vittima: testo(b.vittima ?? "", "vittima", { max: 80, vuoto: true }) }, combacia);
  if (!m) throw new Errore(409, "Per salvare un modello il colpevole della soluzione deve essere uno dei personaggi, scritto come il suo nome o il suo ruolo.", "colpevole_sconosciuto");
  const r = await db.uno<{ id: number }>("INSERT INTO modello (proprietario_id, nome, descrizione, dati) VALUES ($1, $2, $3, $4) RETURNING id", [u.id, nome, m.descrizione, JSON.stringify(m)]);
  // Gli allegati vivono con il modello: la serata di partenza si può eliminare senza perderli.
  const copie = new Map<string, string | null>();
  for (const k of allegatiDi(m)) copie.set(k, await copiaInModello(db, k, r!.id));
  await db.q("UPDATE modello SET dati = $1 WHERE id = $2", [JSON.stringify(conAllegati(m, (k) => copie.get(k) ?? null)), r!.id]);
  return json({ id: `m${r!.id}` }, 201);
}

export async function elimina(req: Request, db: Db, id: number) {
  const u = await regiaSenzaSerata(req, db);
  const r = await db.uno<{ dati: Modello }>("DELETE FROM modello WHERE id = $1 AND proprietario_id = $2 RETURNING dati", [id, u.id]);
  if (!r) throw new Errore(404, "Modello non trovato.");
  await eliminaAllegati(db, allegatiDi(r.dati));
  return json({ ok: true });
}
