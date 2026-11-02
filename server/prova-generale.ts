import { utente } from "./accesso.ts";
import { Db, firmaSessione, hashPassword, json, tocca } from "./base.ts";
import { propaga } from "./motore.ts";
import { randomBytes } from "node:crypto";

/*
 * Prova generale: una squadra nascosta (squadra.prova) che la regia guida da un'altra scheda.
 * La sessione non è un cookie, che sostituirebbe quello della regia, ma un token nell'intestazione x-anteprima,
 * tenuto dalla scheda in sessionStorage. Nessuna password vera cambia e nessuno conosce quella di questo account.
 */

const NOME = "Prova generale";

async function squadraDiProva(db: Db, sid: number) {
  const c = await db.uno<{ id: number; account_id: number; versione_token: number }>(
    "SELECT sq.id, a.id AS account_id, a.versione_token FROM squadra sq JOIN account a ON a.squadra_id = sq.id WHERE sq.serata_id = $1 AND sq.prova",
    [sid],
  );
  if (c) return c;
  return db.transazione(async (t) => {
    // Il nome è unico nella serata: se la regia ha già una squadra con questo nome, si aggiunge l'id.
    const sq = await t.uno<{ id: number }>(
      `INSERT INTO squadra (serata_id, nome, colore, prova) VALUES ($1, $2, '#8a8a8a', TRUE)
       ON CONFLICT (serata_id, nome) DO NOTHING RETURNING id`,
      [sid, NOME],
    ) ?? await t.uno<{ id: number }>("INSERT INTO squadra (serata_id, nome, colore, prova) VALUES ($1, $2, '#8a8a8a', TRUE) RETURNING id", [sid, `${NOME} ${Date.now() % 10000}`]);
    let username = "prova-generale";
    for (let i = 2; await t.uno("SELECT id FROM account WHERE username = $1 AND serata_id = $2", [username, sid]); i++) username = `prova-generale-${i}`;
    const a = await t.uno<{ id: number; versione_token: number }>(
      "INSERT INTO account (serata_id, ruolo, username, password_hash, squadra_id) VALUES ($1, 'squadra', $2, $3, $4) RETURNING id, versione_token",
      [sid, username, await hashPassword(randomBytes(24).toString("base64url")), sq!.id],
    );
    return { id: sq!.id, account_id: a!.id, versione_token: a!.versione_token };
  });
}

/** Apre la prova generale: un token per la scheda che fa da telefono di squadra. */
export async function apri(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const c = await squadraDiProva(db, u.serata_id);
  return json({ token: firmaSessione({ a: c.account_id, r: "squadra", v: c.versione_token }) });
}

/** Cancella i progressi della prova generale, e solo quelli. */
export async function ricomincia(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const c = await squadraDiProva(db, u.serata_id);
  await db.transazione(async (t) => {
    for (const tab of ["sblocco", "prova_mostrata", "tentativo_pin", "accusa", "aiuto"]) await t.q(`DELETE FROM ${tab} WHERE squadra_id = $1`, [c.id]);
    await t.q("DELETE FROM evento WHERE squadra_id = $1", [c.id]);
    await t.q("UPDATE squadra SET taccuino = '' WHERE id = $1", [c.id]);
  });
  // Le prove delle fasi già avviate si riaprono subito, come per una squadra appena entrata.
  await propaga(db, u.serata_id, c.id);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}
