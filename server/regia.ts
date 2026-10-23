import { utente, Utente } from "./accesso.ts";
import { corpo, Db, Errore, hashPassword, intero, json, passwordLeggibile, slug, testo, tocca } from "./base.ts";
import { consegnaDallaRegia, normalizzaPin, propagaTutte } from "./motore.ts";

const regia = (req: Request, db: Db) => utente(req, db, ["regia"]);

const TIPI_PROVA = ["documento", "oggetto", "testimonianza", "foto", "audio", "video"];
const TIPI_SCENA = ["narrazione", "immagine", "video", "audio", "conto", "avanzamento", "annuncio", "rivelazione", "attesa"];

async function evento(db: Db, sid: number, testoEvento: string, tipo = "regia", squadraId: number | null = null) {
  await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, $3, $4)", [sid, squadraId, tipo, testoEvento]);
}

async function proprio(db: Db, tabella: string, id: number, sid: number) {
  const r = await db.uno(`SELECT id FROM ${tabella} WHERE id = $1 AND serata_id = $2`, [id, sid]);
  if (!r) throw new Errore(404, "Elemento non trovato.");
}

/* ---------- Lettura completa ---------- */

export async function tutto(req: Request, db: Db) {
  const u = await regia(req, db);
  const sid = u.serata_id;
  const serata = await db.uno("SELECT * FROM serata WHERE id = $1", [sid]);
  const fasi = await db.q("SELECT numero, nome, durata_minuti, avviata_alle FROM fase WHERE serata_id = $1 ORDER BY numero", [sid]);
  const totale = await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM prova WHERE serata_id = $1", [sid]);
  const squadre = await db.q(
    `SELECT sq.id, sq.nome, sq.colore, a.id AS account_id, a.username, a.ultimo_accesso,
       (SELECT COUNT(*)::int FROM sblocco sb WHERE sb.squadra_id = sq.id) AS aperte,
       (SELECT MAX(ora) FROM sblocco sb WHERE sb.squadra_id = sq.id) AS ultima_prova,
       (SELECT COUNT(*)::int FROM tentativo_pin tp WHERE tp.squadra_id = sq.id AND tp.esito = FALSE) AS codici_sbagliati,
       (SELECT COALESCE(json_agg(sb.prova_id), '[]'::json) FROM sblocco sb WHERE sb.squadra_id = sq.id) AS prove_aperte
     FROM squadra sq LEFT JOIN account a ON a.squadra_id = sq.id
     WHERE sq.serata_id = $1 ORDER BY sq.id`,
    [sid],
  );
  const schermi = await db.q(
    "SELECT id, username, ultimo_accesso FROM account WHERE serata_id = $1 AND ruolo = 'schermo' ORDER BY id",
    [sid],
  );
  const personaggi = await db.q("SELECT * FROM personaggio WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  const prove = await db.q(
    `SELECT p.*, COALESCE((SELECT json_agg(json_build_object(
        'id', r.id, 'tipo', r.tipo, 'pin', r.pin, 'prova_richiesta_id', r.prova_richiesta_id,
        'fase_numero', r.fase_numero, 'squadra_id', r.squadra_id, 'gruppo', r.gruppo) ORDER BY r.gruppo, r.id)
       FROM regola_sblocco r WHERE r.prova_id = p.id), '[]'::json) AS regole
     FROM prova p WHERE p.serata_id = $1 ORDER BY p.numero`,
    [sid],
  );
  const scene = await db.q("SELECT * FROM scena WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  const annunci = await db.q(
    `SELECT a.id, a.testo, a.ora, sq.nome AS squadra FROM annuncio a LEFT JOIN squadra sq ON sq.id = a.squadra_id
     WHERE a.serata_id = $1 ORDER BY a.ora DESC LIMIT 20`,
    [sid],
  );
  const accuse = await db.q(
    `SELECT a.*, sq.nome AS squadra FROM accusa a JOIN squadra sq ON sq.id = a.squadra_id
     WHERE sq.serata_id = $1 ORDER BY a.consegnata_alle`,
    [sid],
  );
  const eventi = await db.q(
    `SELECT e.id, e.tipo, e.testo, e.ora FROM evento e WHERE e.serata_id = $1 ORDER BY e.ora DESC, e.id DESC LIMIT 60`,
    [sid],
  );
  return json({
    io: { username: u.username },
    serata, fasi, totaleProve: totale?.n ?? 0, squadre, schermi, personaggi, prove, scene, annunci, accuse, eventi,
  });
}

/* ---------- Il caso ---------- */

export async function salvaSerata(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<Record<string, unknown>>(req);
  await db.q(
    "UPDATE serata SET titolo = $1, premessa = $2, colpevole = $3, movente = $4, arma = $5 WHERE id = $6",
    [
      testo(b.titolo, "titolo", { max: 120 }),
      testo(b.premessa ?? "", "premessa", { max: 4000, vuoto: true }),
      testo(b.colpevole ?? "", "colpevole", { max: 200, vuoto: true }),
      testo(b.movente ?? "", "movente", { max: 400, vuoto: true }),
      testo(b.arma ?? "", "arma", { max: 200, vuoto: true }),
      u.serata_id,
    ],
  );
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function salvaFasi(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ fasi?: Array<{ nome?: string; durata_minuti?: number | null }> }>(req);
  if (!Array.isArray(b.fasi) || b.fasi.length > 20) throw new Errore(400, "Elenco delle fasi non valido.");
  const fasi = b.fasi.map((f, i) => ({
    numero: i + 1,
    nome: testo(f.nome, `nome della fase ${i + 1}`, { max: 80 }),
    durata: f.durata_minuti == null || (f.durata_minuti as unknown) === "" ? null : intero(f.durata_minuti, "durata", { min: 1, max: 600 }),
  }));
  await db.transazione(async (t) => {
    await t.q("DELETE FROM fase WHERE serata_id = $1 AND numero > $2", [u.serata_id, fasi.length]);
    for (const f of fasi) {
      await t.q(
        `INSERT INTO fase (serata_id, numero, nome, durata_minuti) VALUES ($1, $2, $3, $4)
         ON CONFLICT (serata_id, numero) DO UPDATE SET nome = EXCLUDED.nome, durata_minuti = EXCLUDED.durata_minuti`,
        [u.serata_id, f.numero, f.nome, f.durata],
      );
    }
  });
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/* ---------- Squadre e account ---------- */

async function usernameLibero(db: Db, base: string) {
  let nome = base;
  for (let i = 2; await db.uno("SELECT id FROM account WHERE username = $1", [nome]); i++) nome = `${base}-${i}`;
  return nome;
}

function colore(v: unknown) {
  const c = typeof v === "string" ? v.trim() : "#ff7a1a";
  if (!/^#[0-9a-fA-F]{6}$/.test(c)) throw new Errore(400, "Il colore deve essere nel formato #rrggbb.");
  return c.toLowerCase();
}

export async function creaSquadra(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ nome?: string; colore?: string; username?: string }>(req);
  const nome = testo(b.nome, "nome della squadra", { max: 40 });
  const password = passwordLeggibile();
  const hash = await hashPassword(password);
  const out = await db.transazione(async (t) => {
    const doppia = await t.uno("SELECT id FROM squadra WHERE serata_id = $1 AND lower(nome) = lower($2)", [u.serata_id, nome]);
    if (doppia) throw new Errore(409, "Esiste già una squadra con questo nome.");
    const username = await usernameLibero(t, slug(b.username || nome));
    const sq = await t.uno<{ id: number }>(
      "INSERT INTO squadra (serata_id, nome, colore) VALUES ($1, $2, $3) RETURNING id",
      [u.serata_id, nome, colore(b.colore)],
    );
    await t.q(
      "INSERT INTO account (serata_id, ruolo, username, password_hash, squadra_id) VALUES ($1, 'squadra', $2, $3, $4)",
      [u.serata_id, username, hash, sq!.id],
    );
    return { id: sq!.id, username };
  });
  await evento(db, u.serata_id, `Creata la squadra ${nome}`);
  await tocca(db, u.serata_id);
  return json({ ...out, nome, password }, 201);
}

export async function modificaSquadra(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "squadra", id, u.serata_id);
  const b = await corpo<{ nome?: string; colore?: string }>(req);
  await db.q("UPDATE squadra SET nome = $1, colore = $2 WHERE id = $3", [testo(b.nome, "nome", { max: 40 }), colore(b.colore), id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function eliminaSquadra(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "squadra", id, u.serata_id);
  await db.q("DELETE FROM squadra WHERE id = $1", [id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/** Nuova password per un account squadra o schermo. Chiude le sessioni aperte di quell'account. */
export async function nuovaPassword(req: Request, db: Db, accountId: number) {
  const u = await regia(req, db);
  const a = await db.uno<{ ruolo: string; username: string }>(
    "SELECT ruolo, username FROM account WHERE id = $1 AND serata_id = $2",
    [accountId, u.serata_id],
  );
  if (!a || a.ruolo === "regia") throw new Errore(404, "Account non trovato.");
  const password = passwordLeggibile();
  await db.q("UPDATE account SET password_hash = $1, versione_token = versione_token + 1 WHERE id = $2", [await hashPassword(password), accountId]);
  return json({ username: a.username, password });
}

export async function creaSchermo(req: Request, db: Db) {
  const u = await regia(req, db);
  const password = passwordLeggibile();
  const username = await usernameLibero(db, "proiettore");
  const r = await db.uno<{ id: number }>(
    "INSERT INTO account (serata_id, ruolo, username, password_hash) VALUES ($1, 'schermo', $2, $3) RETURNING id",
    [u.serata_id, username, await hashPassword(password)],
  );
  return json({ id: r!.id, username, password }, 201);
}

export async function eliminaSchermo(req: Request, db: Db, accountId: number) {
  const u = await regia(req, db);
  const r = await db.q("DELETE FROM account WHERE id = $1 AND serata_id = $2 AND ruolo = 'schermo' RETURNING id", [accountId, u.serata_id]);
  if (!r.length) throw new Errore(404, "Account non trovato.");
  return json({ ok: true });
}

/* ---------- Personaggi ---------- */

function datiPersonaggio(b: Record<string, unknown>) {
  return [
    testo(b.nome, "nome", { max: 80 }),
    testo(b.ruolo ?? "", "ruolo", { max: 120, vuoto: true }),
    testo(b.scheda ?? "", "scheda", { max: 4000, vuoto: true }),
    testo(b.note_regia ?? "", "note di regia", { max: 4000, vuoto: true }),
    typeof b.foto_key === "string" && b.foto_key ? b.foto_key : null,
    b.ordine == null ? 0 : intero(b.ordine, "ordine", { max: 1000 }),
  ];
}

export async function creaPersonaggio(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo(req);
  const r = await db.uno<{ id: number }>(
    "INSERT INTO personaggio (serata_id, nome, ruolo, scheda, note_regia, foto_key, ordine) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id",
    [u.serata_id, ...datiPersonaggio(b)],
  );
  await tocca(db, u.serata_id);
  return json({ id: r!.id }, 201);
}

export async function modificaPersonaggio(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "personaggio", id, u.serata_id);
  const b = await corpo(req);
  await db.q(
    "UPDATE personaggio SET nome=$1, ruolo=$2, scheda=$3, note_regia=$4, foto_key=$5, ordine=$6 WHERE id=$7",
    [...datiPersonaggio(b), id],
  );
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function eliminaPersonaggio(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "personaggio", id, u.serata_id);
  await db.q("DELETE FROM personaggio WHERE id = $1", [id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/* ---------- Prove e regole ---------- */

interface RegolaIn { tipo?: string; pin?: string; prova_richiesta_id?: number; fase_numero?: number; squadra_id?: number | null; gruppo?: number }

async function controllaRegole(db: Db, sid: number, provaId: number | null, regole: unknown): Promise<RegolaIn[]> {
  if (!Array.isArray(regole) || regole.length > 40) throw new Errore(400, "Regole di sblocco non valide.");
  const out: RegolaIn[] = [];
  for (const r of regole as RegolaIn[]) {
    const gruppo = r.gruppo == null ? 1 : intero(r.gruppo, "gruppo", { min: 1, max: 99 });
    let squadra: number | null = null;
    if (r.squadra_id != null) {
      squadra = intero(r.squadra_id, "squadra");
      await proprio(db, "squadra", squadra, sid);
    }
    if (r.tipo === "pin") {
      const pin = normalizzaPin(testo(r.pin, "codice", { max: 32 }));
      if (!/^[A-Z0-9]{2,32}$/.test(pin)) throw new Errore(400, "Il codice può contenere solo lettere e numeri, da 2 a 32 caratteri.");
      out.push({ tipo: "pin", pin, squadra_id: squadra, gruppo });
    } else if (r.tipo === "prova") {
      const pid = intero(r.prova_richiesta_id, "prova richiesta");
      if (pid === provaId) throw new Errore(400, "Una prova non può richiedere se stessa.");
      await proprio(db, "prova", pid, sid);
      out.push({ tipo: "prova", prova_richiesta_id: pid, squadra_id: squadra, gruppo });
    } else if (r.tipo === "fase") {
      out.push({ tipo: "fase", fase_numero: intero(r.fase_numero, "fase", { min: 1, max: 20 }), squadra_id: squadra, gruppo });
    } else {
      throw new Errore(400, "Tipo di regola sconosciuto.");
    }
  }
  return out;
}

async function codiceGiaUsato(db: Db, sid: number, provaId: number | null, regole: RegolaIn[]) {
  for (const r of regole) {
    if (r.tipo !== "pin") continue;
    const altro = await db.uno<{ numero: number }>(
      `SELECT p.numero FROM regola_sblocco rs JOIN prova p ON p.id = rs.prova_id
       WHERE p.serata_id = $1 AND rs.tipo = 'pin' AND rs.pin = $2 AND p.id <> COALESCE($3, -1)
       AND (rs.squadra_id IS NULL OR $4::int IS NULL OR rs.squadra_id = $4)`,
      [sid, r.pin, provaId, r.squadra_id],
    );
    if (altro) throw new Errore(409, `Il codice ${r.pin} apre già la prova n. ${altro.numero}. Usane un altro.`);
  }
}

function datiProva(b: Record<string, unknown>) {
  const tipo = typeof b.tipo === "string" && TIPI_PROVA.includes(b.tipo) ? b.tipo : "documento";
  return {
    numero: intero(b.numero, "numero", { min: 1, max: 999 }),
    titolo: testo(b.titolo, "titolo", { max: 120 }),
    tipo,
    testo: testo(b.testo ?? "", "testo", { max: 8000, vuoto: true }),
    allegato_key: typeof b.allegato_key === "string" && b.allegato_key ? b.allegato_key : null,
    allegato_tipo: typeof b.allegato_tipo === "string" && b.allegato_tipo ? b.allegato_tipo.slice(0, 100) : null,
    nota_sigillo: testo(b.nota_sigillo ?? "", "nota sul sigillo", { max: 120, vuoto: true }),
  };
}

async function scriviRegole(db: Db, provaId: number, regole: RegolaIn[]) {
  await db.q("DELETE FROM regola_sblocco WHERE prova_id = $1", [provaId]);
  for (const r of regole) {
    await db.q(
      "INSERT INTO regola_sblocco (prova_id, tipo, pin, prova_richiesta_id, fase_numero, squadra_id, gruppo) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [provaId, r.tipo, r.pin ?? null, r.prova_richiesta_id ?? null, r.fase_numero ?? null, r.squadra_id ?? null, r.gruppo],
    );
  }
}

export async function creaProva(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo(req);
  const p = datiProva(b);
  const regole = await controllaRegole(db, u.serata_id, null, b.regole ?? []);
  await codiceGiaUsato(db, u.serata_id, null, regole);
  const id = await db.transazione(async (t) => {
    const doppia = await t.uno("SELECT id FROM prova WHERE serata_id = $1 AND numero = $2", [u.serata_id, p.numero]);
    if (doppia) throw new Errore(409, `Esiste già una prova n. ${p.numero}.`);
    const r = await t.uno<{ id: number }>(
      "INSERT INTO prova (serata_id, numero, titolo, tipo, testo, allegato_key, allegato_tipo, nota_sigillo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [u.serata_id, p.numero, p.titolo, p.tipo, p.testo, p.allegato_key, p.allegato_tipo, p.nota_sigillo],
    );
    await scriviRegole(t, r!.id, regole);
    return r!.id;
  });
  await propagaTutte(db, u.serata_id);
  await tocca(db, u.serata_id);
  return json({ id }, 201);
}

export async function modificaProva(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "prova", id, u.serata_id);
  const b = await corpo(req);
  const p = datiProva(b);
  const regole = await controllaRegole(db, u.serata_id, id, b.regole ?? []);
  await codiceGiaUsato(db, u.serata_id, id, regole);
  await db.transazione(async (t) => {
    const doppia = await t.uno("SELECT id FROM prova WHERE serata_id = $1 AND numero = $2 AND id <> $3", [u.serata_id, p.numero, id]);
    if (doppia) throw new Errore(409, `Esiste già una prova n. ${p.numero}.`);
    await t.q(
      "UPDATE prova SET numero=$1, titolo=$2, tipo=$3, testo=$4, allegato_key=$5, allegato_tipo=$6, nota_sigillo=$7 WHERE id=$8",
      [p.numero, p.titolo, p.tipo, p.testo, p.allegato_key, p.allegato_tipo, p.nota_sigillo, id],
    );
    await scriviRegole(t, id, regole);
  });
  await propagaTutte(db, u.serata_id);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function eliminaProva(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "prova", id, u.serata_id);
  await db.q("DELETE FROM prova WHERE id = $1", [id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/* ---------- Scene del proiettore ---------- */

function datiScena(b: Record<string, unknown>) {
  if (typeof b.tipo !== "string" || !TIPI_SCENA.includes(b.tipo)) throw new Errore(400, "Tipo di scena non valido.");
  return [
    b.ordine == null ? 0 : intero(b.ordine, "ordine", { max: 10000 }),
    b.tipo,
    testo(b.titolo ?? "", "titolo", { max: 160, vuoto: true }),
    testo(b.testo ?? "", "testo", { max: 4000, vuoto: true }),
    typeof b.allegato_key === "string" && b.allegato_key ? b.allegato_key : null,
    typeof b.allegato_tipo === "string" && b.allegato_tipo ? b.allegato_tipo.slice(0, 100) : null,
    b.fase_numero == null || b.fase_numero === "" ? null : intero(b.fase_numero, "fase", { min: 1, max: 20 }),
    b.avvio_automatico === true,
  ];
}

export async function creaScena(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo(req);
  const r = await db.uno<{ id: number }>(
    `INSERT INTO scena (serata_id, ordine, tipo, titolo, testo, allegato_key, allegato_tipo, fase_numero, avvio_automatico)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [u.serata_id, ...datiScena(b)],
  );
  return json({ id: r!.id }, 201);
}

export async function modificaScena(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "scena", id, u.serata_id);
  const b = await corpo(req);
  await db.q(
    `UPDATE scena SET ordine=$1, tipo=$2, titolo=$3, testo=$4, allegato_key=$5, allegato_tipo=$6, fase_numero=$7, avvio_automatico=$8 WHERE id=$9`,
    [...datiScena(b), id],
  );
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function eliminaScena(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  await proprio(db, "scena", id, u.serata_id);
  await db.q("UPDATE serata SET scena_in_onda = NULL WHERE id = $1 AND scena_in_onda = $2", [u.serata_id, id]);
  await db.q("DELETE FROM scena WHERE id = $1", [id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/* ---------- In diretta ---------- */

async function mandaInOnda(db: Db, u: Utente, scenaId: number | null) {
  if (scenaId !== null) {
    await proprio(db, "scena", scenaId, u.serata_id);
    await db.q("UPDATE scena SET in_onda_dal = NOW() WHERE id = $1", [scenaId]);
    const s = await db.uno<{ titolo: string; tipo: string }>("SELECT titolo, tipo FROM scena WHERE id = $1", [scenaId]);
    await evento(db, u.serata_id, `In onda: ${s?.titolo || s?.tipo}`, "scena");
  }
  await db.q("UPDATE serata SET scena_in_onda = $1, schermo_nero = FALSE WHERE id = $2", [scenaId, u.serata_id]);
  await tocca(db, u.serata_id);
}

export async function onda(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ scena_id?: number | null }>(req);
  await mandaInOnda(db, u, b.scena_id == null ? null : intero(b.scena_id, "scena"));
  return json({ ok: true });
}

export async function ondaSuccessiva(req: Request, db: Db) {
  const u = await regia(req, db);
  const scene = await db.q<{ id: number }>("SELECT id FROM scena WHERE serata_id = $1 ORDER BY ordine, id", [u.serata_id]);
  if (!scene.length) throw new Errore(409, "Non ci sono scene. Aggiungile in Scene del proiettore.");
  const s = await db.uno<{ scena_in_onda: number | null }>("SELECT scena_in_onda FROM serata WHERE id = $1", [u.serata_id]);
  const i = scene.findIndex((x) => x.id === s?.scena_in_onda);
  if (i === scene.length - 1) throw new Errore(409, "Sei già all'ultima scena.");
  await mandaInOnda(db, u, scene[i + 1].id);
  return json({ ok: true, scena_id: scene[i + 1].id });
}

export async function schermoNero(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ nero?: boolean }>(req);
  await db.q("UPDATE serata SET schermo_nero = $1 WHERE id = $2", [b.nero === true, u.serata_id]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function statoSerata(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ stato?: string }>(req);
  const nomi: Record<string, string> = { in_corso: "Serata in corso", in_pausa: "Serata in pausa", chiusa: "Serata chiusa", bozza: "Serata in preparazione" };
  if (!b.stato || !nomi[b.stato]) throw new Errore(400, "Stato non valido.");
  await db.q("UPDATE serata SET stato = $1 WHERE id = $2", [b.stato, u.serata_id]);
  await evento(db, u.serata_id, nomi[b.stato]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function avviaFase(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ numero?: number }>(req);
  const n = intero(b.numero, "fase", { min: 1, max: 20 });
  const f = await db.uno<{ nome: string }>("SELECT nome FROM fase WHERE serata_id = $1 AND numero = $2", [u.serata_id, n]);
  if (!f) throw new Errore(404, "Questa fase non esiste. Aggiungila in Fasi.");
  await db.q("UPDATE fase SET avviata_alle = NOW() WHERE serata_id = $1 AND numero = $2", [u.serata_id, n]);
  await db.q("UPDATE serata SET fase_corrente = $1, stato = CASE WHEN stato = 'bozza' THEN 'in_corso' ELSE stato END WHERE id = $2", [n, u.serata_id]);
  await evento(db, u.serata_id, `Iniziata la fase ${n}, ${f.nome}`, "fase");
  const auto = await db.uno<{ id: number }>(
    "SELECT id FROM scena WHERE serata_id = $1 AND fase_numero = $2 AND avvio_automatico ORDER BY ordine, id LIMIT 1",
    [u.serata_id, n],
  );
  if (auto) await mandaInOnda(db, u, auto.id);
  await propagaTutte(db, u.serata_id);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function consegna(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ prova_id?: number; squadra_id?: number | null }>(req);
  const provaId = intero(b.prova_id, "prova");
  await proprio(db, "prova", provaId, u.serata_id);
  const squadre = b.squadra_id == null
    ? await db.q<{ id: number }>("SELECT id FROM squadra WHERE serata_id = $1", [u.serata_id])
    : [{ id: intero(b.squadra_id, "squadra") }];
  for (const s of squadre) {
    await proprio(db, "squadra", s.id, u.serata_id);
    await consegnaDallaRegia(db, u.serata_id, s.id, provaId);
  }
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function annuncio(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ testo?: string; squadra_id?: number | null }>(req);
  const t = testo(b.testo, "annuncio", { max: 500 });
  let sq: number | null = null;
  if (b.squadra_id != null) {
    sq = intero(b.squadra_id, "squadra");
    await proprio(db, "squadra", sq, u.serata_id);
  }
  await db.q("INSERT INTO annuncio (serata_id, squadra_id, testo) VALUES ($1, $2, $3)", [u.serata_id, sq, t]);
  await evento(db, u.serata_id, sq ? "Annuncio mandato a una squadra" : "Annuncio mandato a tutte le squadre", "annuncio", sq);
  await tocca(db, u.serata_id);
  return json({ ok: true }, 201);
}

/* ---------- Accuse e rivelazione ---------- */

const pulisci = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Confronto tollerante: vale se una risposta contiene l'altra. */
export function combacia(risposta: string, soluzione: string) {
  const a = pulisci(risposta), b = pulisci(soluzione);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

export async function punteggio(req: Request, db: Db, squadraId: number) {
  const u = await regia(req, db);
  await proprio(db, "squadra", squadraId, u.serata_id);
  const b = await corpo<{ punteggio?: number | null }>(req);
  const p = b.punteggio == null ? null : intero(b.punteggio, "punteggio", { min: 0, max: 1000 });
  await db.q("UPDATE accusa SET punteggio = $1 WHERE squadra_id = $2", [p, squadraId]);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function rivela(req: Request, db: Db) {
  const u = await regia(req, db);
  const s = await db.uno<{ colpevole: string; movente: string; arma: string }>(
    "SELECT colpevole, movente, arma FROM serata WHERE id = $1",
    [u.serata_id],
  );
  if (!s?.colpevole) throw new Errore(409, "Prima scrivi la soluzione in Il caso: colpevole, movente e arma.");
  const accuse = await db.q<{ squadra_id: number; colpevole: string; movente: string; arma: string; punteggio: number | null }>(
    "SELECT a.* FROM accusa a JOIN squadra sq ON sq.id = a.squadra_id WHERE sq.serata_id = $1",
    [u.serata_id],
  );
  for (const a of accuse) {
    if (a.punteggio !== null) continue;
    const p = (combacia(a.colpevole, s.colpevole) ? 2 : 0) + (combacia(a.movente, s.movente) ? 1 : 0) + (combacia(a.arma, s.arma) ? 1 : 0);
    await db.q("UPDATE accusa SET punteggio = $1 WHERE squadra_id = $2", [p, a.squadra_id]);
  }
  await db.q("UPDATE serata SET rivelata = TRUE WHERE id = $1", [u.serata_id]);
  await evento(db, u.serata_id, "Soluzione rivelata", "rivelazione");
  const scena = await db.uno<{ id: number }>("SELECT id FROM scena WHERE serata_id = $1 AND tipo = 'rivelazione' ORDER BY ordine LIMIT 1", [u.serata_id]);
  if (scena) await mandaInOnda(db, u, scena.id);
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/* ---------- Strumenti ---------- */

export async function azzera(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ conferma?: string }>(req);
  if (b.conferma !== "AZZERA") throw new Errore(400, "Per azzerare la serata scrivi AZZERA.");
  const sid = u.serata_id;
  await db.transazione(async (t) => {
    await t.q("DELETE FROM sblocco WHERE squadra_id IN (SELECT id FROM squadra WHERE serata_id = $1)", [sid]);
    await t.q("DELETE FROM tentativo_pin WHERE squadra_id IN (SELECT id FROM squadra WHERE serata_id = $1)", [sid]);
    await t.q("DELETE FROM accusa WHERE squadra_id IN (SELECT id FROM squadra WHERE serata_id = $1)", [sid]);
    await t.q("UPDATE squadra SET taccuino = '' WHERE serata_id = $1", [sid]);
    await t.q("DELETE FROM annuncio WHERE serata_id = $1", [sid]);
    await t.q("DELETE FROM evento WHERE serata_id = $1", [sid]);
    await t.q("UPDATE fase SET avviata_alle = NULL WHERE serata_id = $1", [sid]);
    await t.q("UPDATE scena SET in_onda_dal = NULL WHERE serata_id = $1", [sid]);
    await t.q(
      "UPDATE serata SET stato = 'bozza', fase_corrente = 0, scena_in_onda = NULL, schermo_nero = FALSE, rivelata = FALSE WHERE id = $1",
      [sid],
    );
  });
  await evento(db, sid, "Serata azzerata: si riparte da capo");
  await tocca(db, sid);
  return json({ ok: true });
}

export async function esporta(req: Request, db: Db) {
  const u = await regia(req, db);
  const sid = u.serata_id;
  const serata = await db.uno("SELECT titolo, premessa, colpevole, movente, arma FROM serata WHERE id = $1", [sid]);
  const fasi = await db.q("SELECT numero, nome, durata_minuti FROM fase WHERE serata_id = $1 ORDER BY numero", [sid]);
  const personaggi = await db.q("SELECT nome, ruolo, scheda, note_regia, ordine FROM personaggio WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  const prove = await db.q<{ id: number; numero: number }>(
    "SELECT id, numero, titolo, tipo, testo, nota_sigillo FROM prova WHERE serata_id = $1 ORDER BY numero",
    [sid],
  );
  const num = new Map(prove.map((p) => [p.id, p.numero]));
  // Le regole riservate a una squadra non si esportano: le squadre cambiano da una serata all'altra.
  // Si salta l'intero gruppo, così una catena non resta aperta a tutti senza il suo codice.
  const regole = await db.q<{ prova_id: number; tipo: string; pin: string | null; prova_richiesta_id: number | null; fase_numero: number | null; gruppo: number }>(
    `SELECT r.* FROM regola_sblocco r JOIN prova p ON p.id = r.prova_id WHERE p.serata_id = $1
     AND NOT EXISTS (SELECT 1 FROM regola_sblocco x WHERE x.prova_id = r.prova_id AND x.gruppo = r.gruppo AND x.squadra_id IS NOT NULL)
     ORDER BY r.id`,
    [sid],
  );
  const scene = await db.q("SELECT ordine, tipo, titolo, testo, fase_numero, avvio_automatico FROM scena WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  return json({
    formato: "cena-con-delitto/1",
    serata, fasi, personaggi, scene,
    prove: prove.map(({ id, ...p }) => ({
      ...p,
      regole: regole.filter((r) => r.prova_id === id).map((r) => ({
        tipo: r.tipo, pin: r.pin, prova_richiesta: r.prova_richiesta_id ? num.get(r.prova_richiesta_id) : null,
        fase_numero: r.fase_numero, gruppo: r.gruppo,
      })),
    })),
  });
}

export async function importa(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{
    conferma?: string;
    caso?: {
      formato?: string; serata?: Record<string, unknown>; fasi?: Array<Record<string, unknown>>; personaggi?: Array<Record<string, unknown>>;
      scene?: Array<Record<string, unknown>>;
      prove?: Array<Record<string, unknown> & { regole?: Array<{ tipo: string; pin?: string; prova_richiesta?: number; fase_numero?: number; gruppo?: number }> }>;
    };
  }>(req);
  if (b.conferma !== "SOSTITUISCI") throw new Errore(400, "Per sostituire il caso scrivi SOSTITUISCI.");
  const c = b.caso;
  if (!c || c.formato !== "cena-con-delitto/1") throw new Errore(400, "Il file non è un caso esportato da questo sito.");
  const sid = u.serata_id;
  await db.transazione(async (t) => {
    await t.q("UPDATE serata SET scena_in_onda = NULL WHERE id = $1", [sid]);
    for (const tab of ["prova", "personaggio", "scena", "fase"]) await t.q(`DELETE FROM ${tab} WHERE serata_id = $1`, [sid]);
    const s = c.serata ?? {};
    await t.q("UPDATE serata SET titolo=$1, premessa=$2, colpevole=$3, movente=$4, arma=$5 WHERE id=$6", [
      testo(s.titolo ?? "Cena con delitto", "titolo", { max: 120 }), String(s.premessa ?? ""), String(s.colpevole ?? ""),
      String(s.movente ?? ""), String(s.arma ?? ""), sid,
    ]);
    for (const [i, f] of (c.fasi ?? []).entries()) {
      await t.q("INSERT INTO fase (serata_id, numero, nome, durata_minuti) VALUES ($1,$2,$3,$4)", [
        sid, i + 1, testo(f.nome, "fase", { max: 80 }), f.durata_minuti ?? null,
      ]);
    }
    for (const p of c.personaggi ?? []) {
      await t.q("INSERT INTO personaggio (serata_id, nome, ruolo, scheda, note_regia, ordine) VALUES ($1,$2,$3,$4,$5,$6)", [
        sid, testo(p.nome, "nome", { max: 80 }), String(p.ruolo ?? ""), String(p.scheda ?? ""), String(p.note_regia ?? ""), Number(p.ordine ?? 0),
      ]);
    }
    for (const sc of c.scene ?? []) {
      await t.q(
        "INSERT INTO scena (serata_id, ordine, tipo, titolo, testo, fase_numero, avvio_automatico) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [sid, Number(sc.ordine ?? 0), TIPI_SCENA.includes(String(sc.tipo)) ? sc.tipo : "narrazione", String(sc.titolo ?? ""), String(sc.testo ?? ""), sc.fase_numero ?? null, sc.avvio_automatico === true],
      );
    }
    const idDi = new Map<number, number>();
    for (const p of c.prove ?? []) {
      const d = datiProva(p);
      const r = await t.uno<{ id: number }>(
        "INSERT INTO prova (serata_id, numero, titolo, tipo, testo, nota_sigillo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id",
        [sid, d.numero, d.titolo, d.tipo, d.testo, d.nota_sigillo],
      );
      idDi.set(d.numero, r!.id);
    }
    for (const p of c.prove ?? []) {
      const id = idDi.get(Number(p.numero))!;
      for (const r of p.regole ?? []) {
        await t.q(
          "INSERT INTO regola_sblocco (prova_id, tipo, pin, prova_richiesta_id, fase_numero, gruppo) VALUES ($1,$2,$3,$4,$5,$6)",
          [id, r.tipo, r.pin ? normalizzaPin(r.pin) : null, r.prova_richiesta ? idDi.get(r.prova_richiesta) ?? null : null, r.fase_numero ?? null, r.gruppo ?? 1],
        );
      }
    }
  });
  await evento(db, sid, "Caso importato da file");
  await tocca(db, sid);
  return json({ ok: true });
}
