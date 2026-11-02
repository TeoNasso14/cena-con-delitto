import { utente } from "./accesso.ts";
import { corpo, Db, Errore, intero, json, testo, tocca } from "./base.ts";

/* ---------- Aiuti a richiesta: la squadra chiede, la regia risponde con una penalità facoltativa ---------- */

/** Gli aiuti di una squadra, per il suo telefono. Il numero della prova al posto dell'id. */
export async function aiutiDi(db: Db, serataId: number, squadraId: number) {
  const s = await db.uno<{ aiuti_attivi: boolean; aiuti_max: number }>("SELECT aiuti_attivi, aiuti_max FROM serata WHERE id = $1", [serataId]);
  const richieste = await db.q<{ id: number; prova: number | null; domanda: string; stato: string; risposta: string; penalita: number; chiesto: Date }>(
    `SELECT a.id, p.numero AS prova, a.domanda, a.stato, a.risposta, a.penalita, a.chiesto
     FROM aiuto a LEFT JOIN prova p ON p.id = a.prova_id WHERE a.squadra_id = $1 ORDER BY a.chiesto DESC`,
    [squadraId],
  );
  const usati = richieste.filter((r) => r.stato !== "rifiutato").length;
  return { attivi: s!.aiuti_attivi, max: s!.aiuti_max, usati, richieste };
}

export async function chiedi(req: Request, db: Db) {
  const u = await utente(req, db, ["squadra"]);
  const sid = u.serata_id;
  const b = await corpo<{ domanda?: string; prova_id?: number | null }>(req);
  const domanda = testo(b.domanda ?? "", "domanda", { max: 500, vuoto: true });
  let provaId: number | null = null;
  if (b.prova_id != null) {
    provaId = intero(b.prova_id, "prova");
    // Solo una prova che la squadra vede: aperta, mostrata o in elenco.
    const p = await db.uno(
      `SELECT p.id FROM prova p WHERE p.id = $1 AND p.serata_id = $2 AND (p.in_elenco
         OR EXISTS (SELECT 1 FROM sblocco s WHERE s.prova_id = p.id AND s.squadra_id = $3)
         OR EXISTS (SELECT 1 FROM prova_mostrata m WHERE m.prova_id = p.id AND m.squadra_id = $3))`,
      [provaId, sid, u.squadra_id],
    );
    if (!p) throw new Errore(404, "Prova non trovata.");
  }
  const stato = await aiutiDi(db, sid, u.squadra_id!);
  if (!stato.attivi) throw new Errore(409, "Gli aiuti stasera sono chiusi.", "aiuti_chiusi");
  if (stato.richieste.some((r) => r.stato === "attesa")) throw new Errore(409, "Avete già un aiuto in attesa: aspettate la risposta della regia.", "aiuto_in_attesa");
  if (stato.usati >= stato.max) throw new Errore(409, "Avete usato tutti gli aiuti della serata.", "aiuti_finiti");
  await db.q("INSERT INTO aiuto (serata_id, squadra_id, prova_id, domanda) VALUES ($1, $2, $3, $4)", [sid, u.squadra_id, provaId, domanda]);
  const sq = await db.uno<{ nome: string }>("SELECT nome FROM squadra WHERE id = $1", [u.squadra_id]);
  await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, 'aiuto', $3)", [sid, u.squadra_id, `${sq?.nome} chiede un aiuto`]);
  await tocca(db, sid);
  return json({ ok: true }, 201);
}

/** La regia risponde a un aiuto (con una penalità da 0 a 10) o lo rifiuta: un aiuto rifiutato non si conta. */
export async function rispondi(req: Request, db: Db, id: number) {
  const u = await utente(req, db, ["regia"]);
  const b = await corpo<{ risposta?: string; penalita?: number; rifiuta?: boolean }>(req);
  const a = await db.uno<{ squadra_id: number; stato: string }>("SELECT squadra_id, stato FROM aiuto WHERE id = $1 AND serata_id = $2", [id, u.serata_id]);
  if (!a) throw new Errore(404, "Aiuto non trovato.");
  const rifiuta = b.rifiuta === true;
  const risposta = testo(b.risposta ?? "", "risposta", { max: 1000, vuoto: rifiuta });
  const penalita = rifiuta ? 0 : intero(b.penalita ?? 0, "penalità", { min: 0, max: 10 });
  await db.q("UPDATE aiuto SET stato = $1, risposta = $2, penalita = $3, risposto = NOW() WHERE id = $4", [rifiuta ? "rifiutato" : "dato", risposta, penalita, id]);
  const sq = await db.uno<{ nome: string }>("SELECT nome FROM squadra WHERE id = $1", [a.squadra_id]);
  const fatto = rifiuta ? `Aiuto a ${sq?.nome} rifiutato` : `Aiuto dato a ${sq?.nome}${penalita ? `, penalità ${penalita}` : ""}`;
  await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, 'aiuto', $3)", [u.serata_id, a.squadra_id, fatto]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function impostazioni(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const b = await corpo<{ attivi?: boolean; max?: number }>(req);
  if (b.attivi !== undefined) {
    if (typeof b.attivi !== "boolean") throw new Errore(400, "Valore non valido.");
    await db.q("UPDATE serata SET aiuti_attivi = $1 WHERE id = $2", [b.attivi, u.serata_id]);
  }
  if (b.max !== undefined) await db.q("UPDATE serata SET aiuti_max = $1 WHERE id = $2", [intero(b.max, "numero di aiuti", { min: 1, max: 20 }), u.serata_id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/** Penalità totale per squadra, da togliere al punteggio dell'accusa. */
export async function penalita(db: Db, serataId: number) {
  const r = await db.q<{ squadra_id: number; p: number }>(
    "SELECT squadra_id, COALESCE(SUM(penalita), 0)::int AS p FROM aiuto WHERE serata_id = $1 AND stato = 'dato' GROUP BY squadra_id",
    [serataId],
  );
  return new Map(r.map((x) => [x.squadra_id, x.p]));
}
