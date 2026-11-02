import { utente } from "./accesso.ts";
import { corpo, Db, Errore, hashPassword, intero, json, passwordLeggibile, testo, tocca } from "./base.ts";

/* ---------- Invitati, vincoli, sorteggio delle squadre e biglietti per tavolo ---------- */

const regia = (req: Request, db: Db) => utente(req, db, ["regia"]);
const MAX_INVITATI = 200;

async function invitatoDellaSerata(db: Db, id: number, sid: number) {
  const r = await db.uno("SELECT id FROM invitato WHERE id = $1 AND serata_id = $2", [id, sid]);
  if (!r) throw new Errore(404, "Invitato non trovato.");
}

/** Aggiunge uno o più invitati (per esempio una lista incollata, una persona per riga). */
export async function aggiungi(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ nomi?: unknown }>(req);
  if (!Array.isArray(b.nomi)) throw new Errore(400, "Manca l'elenco dei nomi.");
  const nomi = b.nomi.map((n) => String(n ?? "").trim().slice(0, 80)).filter(Boolean);
  if (!nomi.length) throw new Errore(400, "Scrivi almeno un nome.");
  const ci = await db.uno<{ n: number; o: number }>("SELECT COUNT(*)::int AS n, COALESCE(MAX(ordine), 0)::int AS o FROM invitato WHERE serata_id = $1", [u.serata_id]);
  if ((ci?.n ?? 0) + nomi.length > MAX_INVITATI) throw new Errore(400, `Al massimo ${MAX_INVITATI} invitati per serata.`);
  await db.transazione(async (t) => {
    for (const [i, nome] of nomi.entries()) {
      await t.q("INSERT INTO invitato (serata_id, nome, ordine) VALUES ($1, $2, $3)", [u.serata_id, nome, (ci?.o ?? 0) + i + 1]);
    }
  });
  await tocca(db, u.serata_id);
  return json({ aggiunti: nomi.length }, 201);
}

/** Rinomina un invitato o lo sposta in una squadra (null: nessuna squadra). */
export async function modifica(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await invitatoDellaSerata(db, id, u.serata_id);
  const b = await corpo<{ nome?: string; squadra_id?: number | null; personaggio_id?: number | null }>(req);
  if (b.nome !== undefined) await db.q("UPDATE invitato SET nome = $1 WHERE id = $2", [testo(b.nome, "nome", { max: 80 }), id]);
  if (b.squadra_id !== undefined) {
    if (b.squadra_id !== null) {
      const sq = await db.uno("SELECT id FROM squadra WHERE id = $1 AND serata_id = $2 AND NOT prova", [intero(b.squadra_id, "squadra"), u.serata_id]);
      if (!sq) throw new Errore(404, "Squadra non trovata.");
    }
    await db.q("UPDATE invitato SET squadra_id = $1 WHERE id = $2", [b.squadra_id, id]);
  }
  // Il personaggio che interpreta, facoltativo: si può giocare con i personaggi come terze persone.
  if (b.personaggio_id !== undefined) {
    if (b.personaggio_id !== null) {
      const p = await db.uno("SELECT id FROM personaggio WHERE id = $1 AND serata_id = $2", [intero(b.personaggio_id, "personaggio"), u.serata_id]);
      if (!p) throw new Errore(404, "Personaggio non trovato.");
    }
    await db.q("UPDATE invitato SET personaggio_id = $1 WHERE id = $2", [b.personaggio_id, id]);
  }
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function elimina(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await invitatoDellaSerata(db, id, u.serata_id);
  await db.q("DELETE FROM invitato WHERE id = $1", [id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function aggiungiVincolo(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ a?: number; b?: number; tipo?: string }>(req);
  const a = intero(b.a, "primo invitato");
  const c = intero(b.b, "secondo invitato");
  if (a === c) throw new Errore(400, "Scegli due persone diverse.");
  if (b.tipo !== "divisi" && b.tipo !== "insieme") throw new Errore(400, "Il vincolo è divisi o insieme.");
  await invitatoDellaSerata(db, a, u.serata_id);
  await invitatoDellaSerata(db, c, u.serata_id);
  const [x, y] = a < c ? [a, c] : [c, a];
  await db.q(
    "INSERT INTO vincolo (serata_id, a, b, tipo) VALUES ($1, $2, $3, $4) ON CONFLICT (a, b) DO UPDATE SET tipo = EXCLUDED.tipo",
    [u.serata_id, x, y, b.tipo],
  );
  return json({ ok: true }, 201);
}

export async function eliminaVincolo(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  const r = await db.q("DELETE FROM vincolo WHERE id = $1 AND serata_id = $2 RETURNING id", [id, u.serata_id]);
  if (!r.length) throw new Errore(404, "Vincolo non trovato.");
  return json({ ok: true });
}

/**
 * Distribuisce le persone sulle squadre: squadre di dimensione uguale (al più una persona di differenza),
 * chi deve stare insieme sta insieme, chi deve stare diviso no. Restituisce null se i vincoli sono impossibili.
 * Pura e deterministica a parità di `caso`, così si prova nei test.
 */
export function distribuisci(
  persone: number[], squadre: number[], vincoli: Array<{ a: number; b: number; tipo: "divisi" | "insieme" }>, caso: () => number = Math.random,
): Map<number, number> | null {
  if (squadre.length < 2 || !persone.length) return null;
  // Chi sta insieme diventa un blocco unico (unione per ricerca).
  const capo = new Map(persone.map((p) => [p, p]));
  const trova = (p: number): number => (capo.get(p) === p ? p : trova(capo.get(p)!));
  for (const v of vincoli) if (v.tipo === "insieme") capo.set(trova(v.a), trova(v.b));
  const blocchi = new Map<number, number[]>();
  for (const p of persone) blocchi.set(trova(p), [...(blocchi.get(trova(p)) ?? []), p]);
  const divisi = vincoli.filter((v) => v.tipo === "divisi").map((v) => [trova(v.a), trova(v.b)] as const);
  if (divisi.some(([x, y]) => x === y)) return null;

  const max = Math.ceil(persone.length / squadre.length);
  const min = Math.floor(persone.length / squadre.length);
  const mescola = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(caso() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const ordine = mescola([...blocchi.keys()]).sort((x, y) => blocchi.get(y)!.length - blocchi.get(x)!.length);
  const dove = new Map<number, number>();
  const pieno = new Map(squadre.map((s) => [s, 0]));

  const prova = (i: number): boolean => {
    if (i === ordine.length) return [...pieno.values()].every((n) => n >= min && n <= max);
    const blocco = ordine[i];
    const n = blocchi.get(blocco)!.length;
    for (const s of mescola([...squadre])) {
      if (pieno.get(s)! + n > max) continue;
      if (divisi.some(([x, y]) => (x === blocco && dove.get(y) === s) || (y === blocco && dove.get(x) === s))) continue;
      dove.set(blocco, s);
      pieno.set(s, pieno.get(s)! + n);
      if (prova(i + 1)) return true;
      dove.delete(blocco);
      pieno.set(s, pieno.get(s)! - n);
    }
    return false;
  };
  if (!prova(0)) return null;
  return new Map(persone.map((p) => [p, dove.get(trova(p))!]));
}

export async function sorteggia(req: Request, db: Db) {
  const u = await regia(req, db);
  const sid = u.serata_id;
  const persone = (await db.q<{ id: number }>("SELECT id FROM invitato WHERE serata_id = $1", [sid])).map((r) => r.id);
  const squadre = (await db.q<{ id: number }>("SELECT id FROM squadra WHERE serata_id = $1 AND NOT prova ORDER BY id", [sid])).map((r) => r.id);
  if (squadre.length < 2) throw new Errore(400, "Per il sorteggio servono almeno due squadre: creale in Squadre e accessi.");
  if (!persone.length) throw new Errore(400, "Aggiungi prima gli invitati.");
  const vincoli = await db.q<{ a: number; b: number; tipo: "divisi" | "insieme" }>("SELECT a, b, tipo FROM vincolo WHERE serata_id = $1", [sid]);
  const esito = distribuisci(persone, squadre, vincoli);
  if (!esito) throw new Errore(409, "Con questi vincoli non si riesce a fare squadre bilanciate. Togline qualcuno o aggiungi una squadra.", "vincoli_impossibili");
  await db.transazione(async (t) => {
    for (const [p, s] of esito) await t.q("UPDATE invitato SET squadra_id = $1 WHERE id = $2", [s, p]);
  });
  await db.q("INSERT INTO evento (serata_id, tipo, testo) VALUES ($1, 'regia', $2)", [sid, `Squadre sorteggiate: ${persone.length} invitati su ${squadre.length} squadre`]);
  await tocca(db, sid);
  return json({ ok: true });
}

/**
 * Biglietti per tavolo: nuove password per tutte le squadre (le vecchie e le sessioni aperte smettono di valere),
 * restituite una volta sola insieme ai componenti di ogni squadra.
 */
export async function biglietti(req: Request, db: Db) {
  const u = await regia(req, db);
  const sid = u.serata_id;
  const b = await corpo<{ conferma?: boolean }>(req);
  if (b.conferma !== true) throw new Errore(400, "Preparare i biglietti cambia le password delle squadre: conferma per continuare.");
  const squadre = await db.q<{ id: number; nome: string; colore: string; account_id: number; username: string }>(
    `SELECT sq.id, sq.nome, sq.colore, a.id AS account_id, a.username FROM squadra sq JOIN account a ON a.squadra_id = sq.id
     WHERE sq.serata_id = $1 AND NOT sq.prova ORDER BY sq.id`,
    [sid],
  );
  if (!squadre.length) throw new Errore(400, "Non ci sono squadre: creale in Squadre e accessi.");
  const invitati = await db.q<{ nome: string; squadra_id: number | null; personaggio: string | null }>(
    "SELECT i.nome, i.squadra_id, p.nome AS personaggio FROM invitato i LEFT JOIN personaggio p ON p.id = i.personaggio_id WHERE i.serata_id = $1 ORDER BY i.ordine, i.id", [sid]);
  const s = await db.uno<{ titolo: string; slug: string }>("SELECT titolo, slug FROM serata WHERE id = $1", [sid]);
  const fogli = [];
  for (const sq of squadre) {
    const password = passwordLeggibile();
    await db.q("UPDATE account SET password_hash = $1, versione_token = versione_token + 1 WHERE id = $2", [await hashPassword(password), sq.account_id]);
    fogli.push({ squadra: sq.nome, colore: sq.colore, username: sq.username, password, componenti: invitati.filter((i) => i.squadra_id === sq.id).map((i) => (i.personaggio ? `${i.nome}, nel ruolo di ${i.personaggio}` : i.nome)) });
  }
  await db.q("INSERT INTO evento (serata_id, tipo, testo) VALUES ($1, 'regia', 'Biglietti per tavolo preparati: password delle squadre rinnovate')", [sid]);
  return json({ titolo: s!.titolo, slug: s!.slug, biglietti: fogli });
}
