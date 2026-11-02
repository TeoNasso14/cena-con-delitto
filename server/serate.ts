import { utenteSenzaSerata } from "./accesso.ts";
import { corpo, Db, Errore, json, slug, slugSerata, testo } from "./base.ts";
import { copiaAllegato, eliminaAllegati } from "./file.ts";

/* ---------- Le mie serate: crea, rinomina l'indirizzo, duplica, archivia, elimina ---------- */

interface Serata {
  id: number; titolo: string; premessa: string; colpevole: string; movente: string; arma: string; tema: string;
  sfondo_key: string | null; sfondo_opacita: number; sussurri_attivi: boolean; archiviata: boolean;
}

/** La serata, solo se è dell'utente: per gli altri non esiste. */
async function propria(db: Db, id: number, utenteId: number) {
  const s = await db.uno<Serata>("SELECT * FROM serata WHERE id = $1 AND proprietario_id = $2", [id, utenteId]);
  if (!s) throw new Errore(404, "Serata non trovata.", "serata_non_trovata");
  return s;
}

/** Tutti gli allegati di una serata, per copiarli o cancellarli. */
async function chiaviAllegati(db: Db, id: number) {
  const r = await db.q<{ k: string }>(
    `SELECT foto_key AS k FROM personaggio WHERE serata_id = $1 AND foto_key IS NOT NULL
     UNION SELECT allegato_key FROM prova WHERE serata_id = $1 AND allegato_key IS NOT NULL
     UNION SELECT allegato_key FROM scena WHERE serata_id = $1 AND allegato_key IS NOT NULL
     UNION SELECT sfondo_key FROM serata WHERE id = $1 AND sfondo_key IS NOT NULL`,
    [id],
  );
  return r.map((x) => x.k);
}

export async function crea(req: Request, db: Db) {
  const u = await utenteSenzaSerata(req, db);
  if (u.admin) throw new Errore(403, "L'amministrazione non crea serate: invita un account regia.", "vietato");
  const b = await corpo<{ titolo?: string }>(req);
  const titolo = testo(b.titolo, "titolo", { max: 120 });
  const s = await db.uno<{ id: number; slug: string }>(
    "INSERT INTO serata (titolo, proprietario_id, slug) VALUES ($1, $2, $3) RETURNING id, slug",
    [titolo, u.id, await slugSerata(db, titolo)],
  );
  return json(s, 201);
}

/** Cambia l'indirizzo pubblico (/s/<slug>). */
export async function modifica(req: Request, db: Db, id: number) {
  const u = await utenteSenzaSerata(req, db);
  await propria(db, id, u.id);
  const b = await corpo<{ slug?: string }>(req);
  const nuovo = slug(testo(b.slug, "indirizzo", { max: 60 }));
  if (nuovo === "utente" || nuovo.length < 3) throw new Errore(400, "L'indirizzo deve avere almeno 3 lettere o numeri.");
  if (await db.uno("SELECT id FROM serata WHERE slug = $1 AND id <> $2", [nuovo, id])) throw new Errore(409, "Questo indirizzo è già usato da un'altra serata.");
  await db.q("UPDATE serata SET slug = $1 WHERE id = $2", [nuovo, id]);
  return json({ slug: nuovo });
}

/**
 * Una serata nuova con lo stesso caso: fasi, personaggi, cartelle, prove con le regole, scene, tema, nuvolette,
 * sfondo e allegati (copiati con chiavi nuove). Squadre, accessi e tutto ciò che è successo in sala restano fuori;
 * come nell'esportazione, si salta ogni gruppo di regole che riguarda una squadra.
 */
export async function duplica(req: Request, db: Db, id: number) {
  const u = await utenteSenzaSerata(req, db);
  const o = await propria(db, id, u.id);
  const b = await corpo<{ titolo?: string }>(req);
  const titolo = testo(b.titolo ?? `${o.titolo} (copia)`.slice(0, 120), "titolo", { max: 120 });

  const nuova = await db.uno<{ id: number; slug: string }>(
    `INSERT INTO serata (titolo, premessa, colpevole, movente, arma, tema, sfondo_opacita, sussurri_attivi, proprietario_id, slug)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, slug`,
    [titolo, o.premessa, o.colpevole, o.movente, o.arma, o.tema, o.sfondo_opacita, o.sussurri_attivi, u.id, await slugSerata(db, titolo)],
  );
  const sid = nuova!.id;
  const copie = new Map<string, string | null>();
  try {
    for (const k of await chiaviAllegati(db, id)) copie.set(k, await copiaAllegato(db, k, sid));
    const nuovaChiave = (k: string | null) => (k ? copie.get(k) ?? null : null);

    await db.transazione(async (t) => {
      await t.q("UPDATE serata SET sfondo_key = $1 WHERE id = $2", [nuovaChiave(o.sfondo_key), sid]);
      await t.q("INSERT INTO fase (serata_id, numero, nome, durata_minuti) SELECT $2, numero, nome, durata_minuti FROM fase WHERE serata_id = $1", [id, sid]);
      await t.q("INSERT INTO sussurro (serata_id, testo, ordine) SELECT $2, testo, ordine FROM sussurro WHERE serata_id = $1", [id, sid]);
      for (const p of await t.q<{ nome: string; ruolo: string; scheda: string; note_regia: string; foto_key: string | null; ordine: number; copione: string }>(
        "SELECT nome, ruolo, scheda, note_regia, foto_key, ordine, copione FROM personaggio WHERE serata_id = $1 ORDER BY id", [id])) {
        await t.q("INSERT INTO personaggio (serata_id, nome, ruolo, scheda, note_regia, foto_key, ordine, copione) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
          [sid, p.nome, p.ruolo, p.scheda, p.note_regia, nuovaChiave(p.foto_key), p.ordine, p.copione]);
      }
      const cartella = new Map<number, number>();
      for (const c of await t.q<{ id: number; nome: string; ordine: number; visibile: boolean }>(
        "SELECT id, nome, ordine, visibile FROM cartella WHERE serata_id = $1 ORDER BY id", [id])) {
        const r = await t.uno<{ id: number }>("INSERT INTO cartella (serata_id, nome, ordine, visibile) VALUES ($1,$2,$3,$4) RETURNING id", [sid, c.nome, c.ordine, c.visibile]);
        cartella.set(c.id, r!.id);
      }
      const prova = new Map<number, number>();
      for (const p of await t.q<{
        id: number; numero: number; titolo: string; tipo: string; testo: string; allegato_key: string | null; allegato_tipo: string | null;
        nota_sigillo: string; titolo_visibile: boolean; in_elenco: boolean; cartella_id: number | null;
      }>("SELECT * FROM prova WHERE serata_id = $1 ORDER BY numero", [id])) {
        const r = await t.uno<{ id: number }>(
          `INSERT INTO prova (serata_id, numero, titolo, tipo, testo, allegato_key, allegato_tipo, nota_sigillo, titolo_visibile, in_elenco, cartella_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
          [sid, p.numero, p.titolo, p.tipo, p.testo, nuovaChiave(p.allegato_key), p.allegato_tipo, p.nota_sigillo, p.titolo_visibile, p.in_elenco,
            p.cartella_id ? cartella.get(p.cartella_id) ?? null : null],
        );
        prova.set(p.id, r!.id);
      }
      for (const r of await t.q<{ prova_id: number; tipo: string; pin: string | null; prova_richiesta_id: number | null; fase_numero: number | null; gruppo: number }>(
        `SELECT r.* FROM regola_sblocco r JOIN prova p ON p.id = r.prova_id WHERE p.serata_id = $1
         AND NOT EXISTS (SELECT 1 FROM regola_sblocco x WHERE x.prova_id = r.prova_id AND x.gruppo = r.gruppo AND x.squadra_id IS NOT NULL)
         ORDER BY r.id`, [id])) {
        await t.q("INSERT INTO regola_sblocco (prova_id, tipo, pin, prova_richiesta_id, fase_numero, gruppo) VALUES ($1,$2,$3,$4,$5,$6)",
          [prova.get(r.prova_id), r.tipo, r.pin, r.prova_richiesta_id ? prova.get(r.prova_richiesta_id) ?? null : null, r.fase_numero, r.gruppo]);
      }
      for (const s of await t.q<{ ordine: number; tipo: string; titolo: string; testo: string; allegato_key: string | null; allegato_tipo: string | null; fase_numero: number | null; avvio_automatico: boolean }>(
        "SELECT ordine, tipo, titolo, testo, allegato_key, allegato_tipo, fase_numero, avvio_automatico FROM scena WHERE serata_id = $1 ORDER BY ordine, id", [id])) {
        await t.q("INSERT INTO scena (serata_id, ordine, tipo, titolo, testo, allegato_key, allegato_tipo, fase_numero, avvio_automatico) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [sid, s.ordine, s.tipo, s.titolo, s.testo, nuovaChiave(s.allegato_key), s.allegato_tipo, s.fase_numero, s.avvio_automatico]);
      }
    });
  } catch (e) {
    // Niente serate a metà: si toglie la copia e i file già copiati.
    await db.q("DELETE FROM serata WHERE id = $1", [sid]);
    await eliminaAllegati(db, [...copie.values()].filter((k): k is string => !!k));
    throw e;
  }
  return json(nuova, 201);
}

/** Archivia o riattiva. Archiviata: sola lettura per la regia, accessi di squadre e proiettore chiusi. */
export async function archivia(req: Request, db: Db, id: number) {
  const u = await utenteSenzaSerata(req, db);
  await propria(db, id, u.id);
  const b = await corpo<{ archiviata?: boolean }>(req);
  if (typeof b.archiviata !== "boolean") throw new Errore(400, "Valore non valido.");
  await db.q("UPDATE serata SET archiviata = $1, versione = versione + 1 WHERE id = $2", [b.archiviata, id]);
  return json({ ok: true });
}

/** Elimina per sempre la serata, con tutto quello che contiene e i suoi allegati. Serve il titolo scritto per intero. */
export async function elimina(req: Request, db: Db, id: number) {
  const u = await utenteSenzaSerata(req, db);
  const s = await propria(db, id, u.id);
  const b = await corpo<{ conferma?: string }>(req);
  if ((b.conferma ?? "").trim() !== s.titolo.trim()) throw new Errore(400, "Per eliminare la serata scrivi il suo titolo esatto.");
  const chiavi = await chiaviAllegati(db, id);
  await db.q("DELETE FROM serata WHERE id = $1", [id]);
  await eliminaAllegati(db, chiavi);
  return json({ ok: true });
}
