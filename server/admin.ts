import { createHash, randomBytes } from "node:crypto";
import { utenteSenzaSerata } from "./accesso.ts";
import { chiaveAbly, cookieSessione, corpo, Db, Errore, firmaSessione, hashPassword, intero, json, testo, VERSIONE } from "./base.ts";
import { contaAllegati, misuraAllegati } from "./file.ts";

/* ---------- Amministrazione: account regia e inviti. Mai il contenuto delle serate. ---------- */

const GIORNI_INVITO = 7;

/** Scrive nel registro dell'amministrazione. I nomi si copiano: restano leggibili anche dopo un'eliminazione. */
export async function annota(db: Db, autore: { id: number; username: string } | null, azione: string, bersaglio = "") {
  await db.q("INSERT INTO registro_admin (autore_id, autore, azione, bersaglio) VALUES ($1, $2, $3, $4)", [autore?.id ?? null, autore?.username ?? "", azione, bersaglio]);
}

/** Nome leggibile di un account, per il registro. */
async function chi(db: Db, id: number) {
  const p = await db.uno<{ nome: string; username: string }>("SELECT nome, username FROM utente WHERE id = $1", [id]);
  return p ? (p.nome ? `${p.nome} (${p.username})` : p.username) : `account ${id}`;
}

async function admin(req: Request, db: Db) {
  const u = await utenteSenzaSerata(req, db);
  if (!u.admin) throw new Errore(403, "Questa pagina è solo per l'amministrazione.", "vietato");
  return u;
}

/** Il token va solo nel link; nel database resta l'impronta. */
const impronta = (token: string) => createHash("sha256").update(token).digest("hex");
const nuovoToken = () => randomBytes(24).toString("base64url");

function email(v: unknown) {
  if (v == null || v === "") return null;
  const e = testo(v, "email", { max: 200 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Errore(400, "L'email non sembra giusta.");
  return e;
}

export async function tutto(req: Request, db: Db) {
  const u = await admin(req, db);
  // Solo numeri, stati e date: mai titoli, indirizzi (nascono dal titolo) o temi delle serate.
  const utenti = await db.q(
    `SELECT u.id, u.username, u.nome, u.email, u.admin, u.stato, u.ultimo_accesso, u.creato,
       COUNT(s.id)::int AS serate,
       COUNT(s.id) FILTER (WHERE NOT s.archiviata AND s.stato = 'bozza')::int AS in_preparazione,
       COUNT(s.id) FILTER (WHERE NOT s.archiviata AND s.stato IN ('in_corso', 'in_pausa'))::int AS in_corso,
       COUNT(s.id) FILTER (WHERE NOT s.archiviata AND s.stato = 'chiusa')::int AS chiuse,
       COUNT(s.id) FILTER (WHERE s.archiviata)::int AS archiviate,
       (SELECT COUNT(*)::int FROM squadra q JOIN serata x ON x.id = q.serata_id WHERE x.proprietario_id = u.id AND NOT q.prova) AS squadre,
       (SELECT MAX(f.avviata_alle) FROM fase f JOIN serata x ON x.id = f.serata_id WHERE x.proprietario_id = u.id) AS ultima_partita,
       (SELECT COALESCE(SUM(a.byte), 0)::bigint FROM allegato a JOIN serata x ON x.id = a.serata_id WHERE x.proprietario_id = u.id) AS spazio
     FROM utente u LEFT JOIN serata s ON s.proprietario_id = u.id
     GROUP BY u.id ORDER BY u.admin DESC, u.stato, u.nome, u.username`,
  );
  const inviti = await db.q(
    `SELECT i.id, i.tipo, i.nome, i.email, i.creato, i.scade, i.utente_id, u.username,
       CASE WHEN i.scade < NOW() THEN 'scaduto' ELSE 'attesa' END AS stato
     FROM invito i LEFT JOIN utente u ON u.id = i.utente_id
     WHERE i.usato IS NULL AND i.revocato IS NULL ORDER BY i.creato DESC`,
  );
  const registro = await db.q("SELECT id, autore, azione, bersaglio, ora FROM registro_admin ORDER BY ora DESC, id DESC LIMIT 60");
  return json({ io: { id: u.id, username: u.username }, utenti: utenti.map((x) => ({ ...x, spazio: Number(x.spazio) })), inviti, registro, sito: await statoSito(db) });
}

/** Lo stato del sito: versione, database, tempo reale, totali, allegati. */
async function statoSito(db: Db) {
  const m = await db.uno<{ nome: string; n: number }>("SELECT MAX(nome) AS nome, COUNT(*)::int AS n FROM migrazione");
  const tot = await db.uno<{ serate: number; squadre: number }>(
    "SELECT (SELECT COUNT(*)::int FROM serata) AS serate, (SELECT COUNT(*)::int FROM squadra WHERE NOT prova) AS squadre",
  );
  let allegati: { file: number; byte: number; daMisurare: number } | null = null;
  try {
    const c = await contaAllegati(db);
    allegati = { file: c.file, byte: c.byte, daMisurare: c.daMisurare };
  } catch (e) {
    console.warn("Archivio degli allegati non raggiungibile", e);
  }
  return {
    versione: VERSIONE,
    database: { ultimaMigrazione: m?.nome ?? null, migrazioni: m?.n ?? 0 },
    tempoReale: chiaveAbly() !== null,
    serate: tot?.serate ?? 0,
    squadre: tot?.squadre ?? 0,
    allegati,
  };
}

/** Misura dieci allegati caricati prima della 3.0. La pagina richiama finché non ne restano. */
export async function misura(req: Request, db: Db) {
  const u = await admin(req, db);
  const r = await misuraAllegati(db, 10);
  if (r.misurati && !r.restanti) await annota(db, u, "Allegati di prima misurati");
  return json(r);
}

/** Elimina un account regia senza serate. Serve il suo nome utente come conferma. */
export async function elimina(req: Request, db: Db, id: number) {
  const u = await admin(req, db);
  const b = await corpo<{ conferma?: string }>(req);
  const p = await db.uno<{ username: string; admin: boolean; serate: number }>(
    "SELECT username, admin, (SELECT COUNT(*)::int FROM serata WHERE proprietario_id = utente.id) AS serate FROM utente WHERE id = $1", [id]);
  if (!p) throw new Errore(404, "Account non trovato.");
  if (id === u.id || p.admin) throw new Errore(400, "L'amministrazione non si elimina da qui.");
  if (p.serate) throw new Errore(409, "Questo account ha ancora serate: passale prima a un'altra regia.", "ha_serate");
  if (b.conferma !== p.username) throw new Errore(400, `Per eliminare l'account scrivi il suo nome utente, ${p.username}.`);
  const nome = await chi(db, id);
  await db.q("DELETE FROM utente WHERE id = $1", [id]);
  await annota(db, u, "Account eliminato", nome);
  return json({ ok: true });
}

/** Passa tutte le serate di un account a un altro account regia. L'amministrazione non le vede: cambia solo il proprietario. */
export async function trasferisci(req: Request, db: Db, id: number) {
  const u = await admin(req, db);
  const b = await corpo<{ a?: number }>(req);
  const a = intero(b.a, "account che riceve");
  if (a === id) throw new Errore(400, "Scegli un altro account.");
  const da = await db.uno<{ admin: boolean }>("SELECT admin FROM utente WHERE id = $1", [id]);
  const verso = await db.uno<{ admin: boolean }>("SELECT admin FROM utente WHERE id = $1", [a]);
  if (!da || !verso) throw new Errore(404, "Account non trovato.");
  if (verso.admin) throw new Errore(400, "L'amministrazione non gestisce serate.");
  const r = await db.q("UPDATE serata SET proprietario_id = $1 WHERE proprietario_id = $2 RETURNING id", [a, id]);
  await annota(db, u, `${r.length === 1 ? "1 serata passata" : `${r.length} serate passate`} a ${await chi(db, a)}`, await chi(db, id));
  return json({ ok: true, serate: r.length });
}

/** Invito a diventare regia: il link è monouso, scade dopo 7 giorni, e si vede una volta sola. */
export async function invita(req: Request, db: Db) {
  const u = await admin(req, db);
  const b = await corpo<{ nome?: string; email?: string }>(req);
  const token = nuovoToken();
  const r = await db.uno<{ id: number; scade: Date }>(
    `INSERT INTO invito (token_hash, tipo, nome, email, creato_da, scade)
     VALUES ($1, 'regia', $2, $3, $4, NOW() + ($5 || ' days')::interval) RETURNING id, scade`,
    [impronta(token), testo(b.nome, "nome", { max: 80 }), email(b.email), u.id, String(GIORNI_INVITO)],
  );
  await annota(db, u, "Invito creato", testo(b.nome, "nome", { max: 80 }));
  return json({ id: r!.id, token, scade: r!.scade }, 201);
}

async function invitoAperto(db: Db, id: number) {
  const i = await db.uno<{ id: number; nome: string; tipo: string }>("SELECT id, nome, tipo FROM invito WHERE id = $1 AND usato IS NULL AND revocato IS NULL", [id]);
  if (!i) throw new Errore(404, "Invito non trovato.");
  return i;
}

export async function revoca(req: Request, db: Db, id: number) {
  const u = await admin(req, db);
  const i = await invitoAperto(db, id);
  await db.q("UPDATE invito SET revocato = NOW() WHERE id = $1", [id]);
  await annota(db, u, i.tipo === "password" ? "Link per la password revocato" : "Invito revocato", i.nome);
  return json({ ok: true });
}

/** Un link nuovo per lo stesso invito: quello di prima smette di funzionare. */
export async function rigenera(req: Request, db: Db, id: number) {
  const u = await admin(req, db);
  const i = await invitoAperto(db, id);
  await annota(db, u, i.tipo === "password" ? "Link per la password rigenerato" : "Invito rigenerato", i.nome);
  const token = nuovoToken();
  const r = await db.uno<{ scade: Date }>(
    "UPDATE invito SET token_hash = $1, scade = NOW() + ($2 || ' days')::interval WHERE id = $3 RETURNING scade",
    [impronta(token), String(GIORNI_INVITO), id],
  );
  return json({ id, token, scade: r!.scade });
}

/** Sospende o riattiva un account regia. Sospeso: le sessioni aperte si chiudono e non rientra. */
export async function sospendi(req: Request, db: Db, id: number) {
  const u = await admin(req, db);
  const b = await corpo<{ sospeso?: boolean }>(req);
  if (typeof b.sospeso !== "boolean") throw new Errore(400, "Valore non valido.");
  if (id === u.id) throw new Errore(400, "Non puoi sospendere il tuo account.");
  const r = await db.q(
    "UPDATE utente SET stato = $1, versione_token = versione_token + CASE WHEN $1 = 'sospeso' THEN 1 ELSE 0 END WHERE id = $2 RETURNING id",
    [b.sospeso ? "sospeso" : "attivo", id],
  );
  if (!r.length) throw new Errore(404, "Account non trovato.");
  await annota(db, u, b.sospeso ? "Account sospeso" : "Account riattivato", await chi(db, id));
  return json({ ok: true });
}

/** Link per scegliere una password nuova, per chi l'ha persa. Annulla i link per la password ancora aperti. */
export async function linkPassword(req: Request, db: Db, id: number) {
  const u = await admin(req, db);
  const p = await db.uno<{ nome: string; username: string }>("SELECT nome, username FROM utente WHERE id = $1", [id]);
  if (!p) throw new Errore(404, "Account non trovato.");
  await db.q("UPDATE invito SET revocato = NOW() WHERE utente_id = $1 AND tipo = 'password' AND usato IS NULL AND revocato IS NULL", [id]);
  const token = nuovoToken();
  const r = await db.uno<{ id: number; scade: Date }>(
    `INSERT INTO invito (token_hash, tipo, nome, utente_id, creato_da, scade)
     VALUES ($1, 'password', $2, $3, $4, NOW() + ($5 || ' days')::interval) RETURNING id, scade`,
    [impronta(token), p.nome || p.username, id, u.id, String(GIORNI_INVITO)],
  );
  await annota(db, u, "Link per la password creato", await chi(db, id));
  return json({ id: r!.id, token, scade: r!.scade }, 201);
}

/* ---------- Il link aperto da chi è stato invitato (pubblico) ---------- */

async function invitoDaToken(db: Db, token: string) {
  const i = await db.uno<{ id: number; tipo: "regia" | "password"; nome: string; email: string | null; utente_id: number | null; scade: Date; usato: Date | null; revocato: Date | null; username: string | null }>(
    "SELECT i.*, u.username FROM invito i LEFT JOIN utente u ON u.id = i.utente_id WHERE i.token_hash = $1",
    [impronta(token)],
  );
  if (!i || i.revocato) throw new Errore(404, "Questo link non è valido. Chiedi all'amministrazione un link nuovo.", "invito_non_valido");
  if (i.usato) throw new Errore(410, "Questo link è già stato usato. Se ti serve, chiedine uno nuovo all'amministrazione.", "invito_usato");
  if (new Date(i.scade).getTime() < Date.now()) throw new Errore(410, "Questo link è scaduto. Chiedi all'amministrazione un link nuovo.", "invito_scaduto");
  return i;
}

export async function leggiInvito(_req: Request, db: Db, token: string) {
  const i = await invitoDaToken(db, token);
  return json({ tipo: i.tipo, nome: i.nome, username: i.username });
}

function controllaPassword(pw: string) {
  if (pw.length < 10) throw new Errore(400, "La password deve avere almeno 10 caratteri.");
}

/** Chi ha l'invito sceglie nome utente e password (o solo la password nuova) ed entra. L'amministrazione non li vede mai. */
export async function usaInvito(req: Request, db: Db, token: string) {
  const b = await corpo<{ username?: string; password?: string }>(req);
  const password = testo(b.password, "password", { max: 200 });
  controllaPassword(password);
  const hash = await hashPassword(password);
  const u = await db.transazione(async (t) => {
    const i = await invitoDaToken(t, token);
    let utente: { id: number; versione_token: number; admin: boolean } | undefined;
    if (i.tipo === "regia") {
      const username = testo(b.username, "nome utente", { max: 40 }).toLowerCase();
      if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)) {
        throw new Errore(400, "Il nome utente va scritto in minuscolo, da 3 a 40 caratteri: lettere, numeri, punto, trattino.");
      }
      if (await t.uno("SELECT id FROM utente WHERE username = $1", [username])) throw new Errore(409, "Questo nome utente è già usato. Scegline un altro.");
      utente = await t.uno("INSERT INTO utente (username, password_hash, nome, email) VALUES ($1, $2, $3, $4) RETURNING id, versione_token, admin", [username, hash, i.nome, i.email]);
    } else {
      utente = await t.uno(
        "UPDATE utente SET password_hash = $1, versione_token = versione_token + 1 WHERE id = $2 RETURNING id, versione_token, admin",
        [hash, i.utente_id],
      );
      if (!utente) throw new Errore(404, "Account non trovato.");
    }
    await t.q("UPDATE invito SET usato = NOW() WHERE id = $1", [i.id]);
    await annota(t, null, i.tipo === "regia" ? "Invito accettato" : "Password nuova scelta", await chi(t, utente!.id));
    await t.q("UPDATE utente SET ultimo_accesso = NOW() WHERE id = $1", [utente!.id]);
    return utente!;
  });
  const sessione = firmaSessione({ k: "u", a: u.id, r: "regia", v: u.versione_token });
  return json({ ruolo: "regia", admin: u.admin }, 200, { "set-cookie": cookieSessione(sessione) });
}
