import { randomBytes } from "node:crypto";
import { utente } from "./accesso.ts";
import { corpo, Db, Errore, json, testo, tocca } from "./base.ts";

/* ---------- Inviti agli ospiti: una pagina personale per invitato, con la conferma di presenza ---------- */

const regia = (req: Request, db: Db) => utente(req, db, ["regia"]);

/** Data, ora, luogo, dress code e nota dell'invito: valgono per tutti gli ospiti della serata. */
export async function dettagli(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ quando?: string | null; dove?: string; dress_code?: string; nota?: string }>(req);
  let quando: Date | null = null;
  if (b.quando) {
    quando = new Date(b.quando);
    if (Number.isNaN(quando.getTime())) throw new Errore(400, "Data e ora non valide.");
  }
  await db.q("UPDATE serata SET cena_quando = $1, cena_dove = $2, dress_code = $3, nota_invito = $4 WHERE id = $5", [
    quando, testo(b.dove ?? "", "luogo", { max: 300, vuoto: true }), testo(b.dress_code ?? "", "dress code", { max: 500, vuoto: true }),
    testo(b.nota ?? "", "nota", { max: 2000, vuoto: true }), u.serata_id,
  ]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/** Crea o rinnova il link personale di un invitato: quello di prima smette di valere. */
export async function link(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  const token = randomBytes(18).toString("base64url");
  const r = await db.q("UPDATE invitato SET token = $1 WHERE id = $2 AND serata_id = $3 RETURNING id", [token, id, u.serata_id]);
  if (!r.length) throw new Errore(404, "Invitato non trovato.");
  await tocca(db, u.serata_id);
  return json({ token });
}

/** Crea i link mancanti per tutti gli invitati della serata. */
export async function linkPerTutti(req: Request, db: Db) {
  const u = await regia(req, db);
  const senza = await db.q<{ id: number }>("SELECT id FROM invitato WHERE serata_id = $1 AND token IS NULL", [u.serata_id]);
  for (const i of senza) await db.q("UPDATE invitato SET token = $1 WHERE id = $2", [randomBytes(18).toString("base64url"), i.id]);
  await tocca(db, u.serata_id);
  return json({ creati: senza.length });
}

async function ospiteDa(db: Db, token: string) {
  const o = await db.uno<{
    id: number; nome: string; presenza: string | null; nota_ospite: string; serata_id: number; personaggio_id: number | null;
    titolo: string; tema: string; cena_quando: Date | null; cena_dove: string; dress_code: string; nota_invito: string; archiviata: boolean;
  }>(
    `SELECT i.id, i.nome, i.presenza, i.nota_ospite, i.serata_id, i.personaggio_id,
       s.titolo, s.tema, s.cena_quando, s.cena_dove, s.dress_code, s.nota_invito, s.archiviata
     FROM invitato i JOIN serata s ON s.id = i.serata_id WHERE i.token = $1`,
    [token],
  );
  if (!o) throw new Errore(404, "Questo invito non esiste più. Chiedi un link nuovo a chi organizza.", "ospite_non_trovato");
  return o;
}

/** Pubblico, con il link: solo quello che serve all'ospite. Nessun dato degli altri invitati, nessuna prova. */
export async function pagina(_req: Request, db: Db, token: string) {
  const o = await ospiteDa(db, token);
  const p = o.personaggio_id
    ? await db.uno<{ nome: string; ruolo: string; scheda: string; copione: string; foto_key: string | null }>(
        "SELECT nome, ruolo, scheda, copione, foto_key FROM personaggio WHERE id = $1", [o.personaggio_id])
    : null;
  return json({
    nome: o.nome,
    serata: { titolo: o.titolo, tema: o.tema, quando: o.cena_quando, dove: o.cena_dove, dressCode: o.dress_code, nota: o.nota_invito, chiusa: o.archiviata },
    // Il ritratto non c'è: i file si servono solo a chi è entrato nella serata.
    personaggio: p ? { nome: p.nome, ruolo: p.ruolo, scheda: p.scheda, copione: p.copione } : null,
    risposta: { presenza: o.presenza, nota: o.nota_ospite },
  });
}

export async function rispondi(req: Request, db: Db, token: string) {
  const o = await ospiteDa(db, token);
  if (o.archiviata) throw new Errore(409, "La serata è passata: le risposte sono chiuse.");
  const b = await corpo<{ presenza?: string; nota?: string }>(req);
  if (!["si", "no", "forse"].includes(String(b.presenza))) throw new Errore(400, "Rispondi sì, no o forse.");
  await db.q("UPDATE invitato SET presenza = $1, nota_ospite = $2, risposto = NOW() WHERE id = $3", [
    b.presenza, testo(b.nota ?? "", "nota", { max: 500, vuoto: true }), o.id,
  ]);
  const fatto = { si: "ci sarà", no: "non ci sarà", forse: "forse ci sarà" }[b.presenza as "si" | "no" | "forse"];
  await db.q("INSERT INTO evento (serata_id, tipo, testo) VALUES ($1, 'invito', $2)", [o.serata_id, `${o.nome} ${fatto}`]);
  await tocca(db, o.serata_id);
  return json({ ok: true });
}

