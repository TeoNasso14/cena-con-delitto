import {
  cookieSessione, cookieUscita, corpo, Db, env, Errore, firmaSessione, hashPassword, json, leggiSessione,
  Ruolo, testo, tokenDaRichiesta, verificaPassword,
} from "./base.ts";

/**
 * Chi fa la richiesta, già legato a una serata. Per la regia `id` è l'utente e la serata è quella scelta
 * (intestazione x-serata, o la chiave di un file) di cui è proprietaria; per squadre e proiettore `id` è l'account.
 */
export interface Utente {
  id: number;
  serata_id: number;
  ruolo: Ruolo;
  username: string;
  squadra_id: number | null;
  versione_token: number;
  admin?: boolean;
}

/** La persona della sessione, prima di scegliere una serata. */
type Persona =
  | { tipo: "utente"; id: number; username: string; admin: boolean; versione_token: number }
  | { tipo: "partecipante"; u: Utente; archiviata: boolean };

const TENTATIVI_MAX = 8;
const FINESTRA_MIN = 10;

const scaduta = () => new Errore(401, "La sessione è scaduta. Accedi di nuovo.", "non_autenticato");

async function persona(req: Request, db: Db): Promise<Persona> {
  const s = leggiSessione(tokenDaRichiesta(req));
  if (!s) throw new Errore(401, "Accedi per continuare.", "non_autenticato");
  if (s.k === "u") {
    const p = await db.uno<{ id: number; username: string; admin: boolean; stato: string; versione_token: number }>(
      "SELECT id, username, admin, stato, versione_token FROM utente WHERE id = $1",
      [s.a],
    );
    if (!p || p.versione_token !== s.v || p.stato !== "attivo") throw scaduta();
    return { tipo: "utente", id: p.id, username: p.username, admin: p.admin, versione_token: p.versione_token };
  }
  const u = await db.uno<Utente & { attivo: boolean; archiviata: boolean }>(
    `SELECT a.id, a.serata_id, a.ruolo, a.username, a.squadra_id, a.versione_token, a.attivo, se.archiviata
     FROM account a JOIN serata se ON se.id = a.serata_id WHERE a.id = $1`,
    [s.a],
  );
  // Gli account regia della 1.x restano nel database ma non aprono più sessioni.
  if (!u || u.versione_token !== s.v || u.ruolo !== s.r || !u.attivo || u.ruolo === "regia") throw scaduta();
  const { attivo: _a, archiviata, ...resto } = u;
  return { tipo: "partecipante", u: resto, archiviata };
}

/**
 * Carica chi fa la richiesta e verifica il ruolo. Per la regia controlla che la serata sia sua:
 * una serata d'altri risponde come se non esistesse.
 */
export async function utente(req: Request, db: Db, ruoli: Ruolo[], serataDelFile?: number): Promise<Utente> {
  const p = await persona(req, db);
  if (p.tipo === "partecipante") {
    if (!ruoli.includes(p.u.ruolo)) throw new Errore(403, "Questa pagina non è per il tuo account.", "vietato");
    if (p.archiviata) throw new Errore(403, "Questa serata è archiviata: gli accessi sono chiusi.", "serata_archiviata");
    return p.u;
  }
  if (!ruoli.includes("regia")) throw new Errore(403, "Questa pagina non è per il tuo account.", "vietato");
  if (p.admin) throw new Errore(403, "L'amministrazione non apre le serate.", "vietato");
  const sid = serataDelFile ?? Number(req.headers.get("x-serata"));
  if (!Number.isInteger(sid) || sid <= 0) throw new Errore(400, "Scegli prima una serata.", "serata_mancante");
  const se = await db.uno<{ archiviata: boolean }>("SELECT archiviata FROM serata WHERE id = $1 AND proprietario_id = $2", [sid, p.id]);
  if (!se) throw new Errore(404, "Serata non trovata.", "serata_non_trovata");
  // Archiviata: la regia la consulta ma non la cambia finché non la riattiva.
  if (se.archiviata && req.method !== "GET") throw new Errore(409, "Questa serata è archiviata: riattivala per modificarla.", "serata_archiviata");
  return { id: p.id, serata_id: sid, ruolo: "regia", username: p.username, squadra_id: null, versione_token: p.versione_token, admin: p.admin };
}

/** Un utente (regia o amministrazione) senza serata: per l'elenco delle serate, il profilo, l'amministrazione. */
export async function utenteSenzaSerata(req: Request, db: Db) {
  const p = await persona(req, db);
  if (p.tipo !== "utente") throw new Errore(403, "Questa pagina non è per il tuo account.", "vietato");
  return p;
}

/** La serata degli indirizzi di prima della 2.0 (/accesso senza slug): la più vecchia. */
async function serataStorica(db: Db) {
  return db.uno<{ id: number; tema: string; archiviata: boolean }>("SELECT id, tema, archiviata FROM serata ORDER BY id LIMIT 1");
}

/** Pubblico: la pagina /s/<slug> si veste col tema della serata e mostra il titolo. Nient'altro del caso. */
export async function serataPubblica(db: Db, slug: string) {
  const s = await db.uno<{ titolo: string; tema: string; archiviata: boolean }>("SELECT titolo, tema, archiviata FROM serata WHERE slug = $1", [slug]);
  if (!s) throw new Errore(404, "Questa serata non esiste. Controlla l'indirizzo che ti hanno dato.", "serata_non_trovata");
  return json({ titolo: s.titolo, tema: s.tema, aperta: !s.archiviata });
}

export async function statoAvvio(db: Db) {
  // Configurato quando esiste l'amministrazione: prima, SETUP_CODE serve a crearla.
  const r = await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM utente WHERE admin");
  // Pubblico: serve alla pagina di accesso per vestirsi col tema. Solo l'id del tema, niente del caso.
  const s = await serataStorica(db);
  return json({ configurato: (r?.n ?? 0) > 0, tema: s?.tema ?? "halloween" });
}

function controllaPassword(pw: string) {
  if (pw.length < 10) throw new Errore(400, "La password della regia deve avere almeno 10 caratteri.");
  if (pw.length > 200) throw new Errore(400, "La password è troppo lunga.");
}

function controllaUsername(u: string) {
  if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(u)) {
    throw new Errore(400, "Il nome utente va scritto in minuscolo, da 3 a 40 caratteri: lettere, numeri, punto, trattino.");
  }
}

/**
 * Crea il primo amministratore. Funziona finché non ce n'è uno e richiede il codice di primo avvio.
 * L'amministrazione non gestisce serate: gli account regia nascono dagli inviti.
 */
export async function primoAvvio(req: Request, db: Db) {
  const b = await corpo<{ codice?: string; username?: string; password?: string; nome?: string }>(req);
  const atteso = env("SETUP_CODE");
  if (!atteso) throw new Errore(500, "Il sito non è configurato: manca SETUP_CODE.", "configurazione");
  if (testo(b.codice, "codice di primo avvio") !== atteso) throw new Errore(403, "Il codice di primo avvio non è giusto.");
  const username = testo(b.username, "nome utente", { max: 40 }).toLowerCase();
  controllaUsername(username);
  const password = testo(b.password, "password", { max: 200 });
  controllaPassword(password);
  const nome = testo(b.nome ?? "", "nome", { max: 80, vuoto: true });
  const hash = await hashPassword(password);

  const u = await db.transazione(async (t) => {
    const esiste = await t.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM utente WHERE admin");
    if ((esiste?.n ?? 0) > 0) throw new Errore(409, "L'amministrazione esiste già. Accedi con il suo account.");
    if (await t.uno("SELECT id FROM utente WHERE username = $1", [username])) throw new Errore(409, "Questo nome utente è già usato da un account regia.");
    return t.uno<{ id: number; versione_token: number }>(
      "INSERT INTO utente (username, password_hash, nome, admin) VALUES ($1, $2, $3, TRUE) RETURNING id, versione_token",
      [username, hash, nome],
    );
  });
  const token = firmaSessione({ k: "u", a: u!.id, r: "regia", v: u!.versione_token });
  return json({ ruolo: "regia", admin: true }, 201, { "set-cookie": cookieSessione(token) });
}

/**
 * Accesso. Senza slug prova prima un utente (regia), poi squadre e proiettore della serata storica;
 * con lo slug cerca squadre e proiettore di quella serata. Il blocco per troppi tentativi vale per nome e serata.
 */
export async function accedi(req: Request, db: Db) {
  // regia: true arriva da /regia/accedi, che accetta solo regia e amministrazione.
  const b = await corpo<{ username?: string; password?: string; slug?: string; regia?: boolean }>(req);
  const username = testo(b.username, "nome utente", { max: 40 }).toLowerCase();
  const password = testo(b.password, "password", { max: 200 });
  const serata = typeof b.slug === "string" && b.slug
    ? await db.uno<{ id: number; archiviata: boolean }>("SELECT id, archiviata FROM serata WHERE slug = $1", [b.slug])
    : await serataStorica(db);
  const sid = serata?.id ?? null;

  const falliti = await db.uno<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM tentativo_login
     WHERE username = $1 AND (serata_id IS NULL OR serata_id = $2) AND esito = FALSE AND ora > NOW() - ($3 || ' minutes')::interval`,
    [username, sid, String(FINESTRA_MIN)],
  );
  if ((falliti?.n ?? 0) >= TENTATIVI_MAX) {
    throw new Errore(429, `Troppi tentativi sbagliati. Riprova tra ${FINESTRA_MIN} minuti.`, "troppi_tentativi");
  }
  const registra = (esito: boolean, s: number | null) =>
    db.q("INSERT INTO tentativo_login (username, esito, serata_id) VALUES ($1, $2, $3)", [username, esito, s]);

  if (!b.slug) {
    const p = await db.uno<{ id: number; password_hash: string; stato: string; versione_token: number; admin: boolean }>(
      "SELECT id, password_hash, stato, versione_token, admin FROM utente WHERE username = $1",
      [username],
    );
    if (p && (await verificaPassword(password, p.password_hash))) {
      await registra(true, null);
      if (p.stato !== "attivo") throw new Errore(403, "Questo account è sospeso. Scrivi all'amministrazione.", "sospeso");
      await db.q("UPDATE utente SET ultimo_accesso = NOW() WHERE id = $1", [p.id]);
      const token = firmaSessione({ k: "u", a: p.id, r: "regia", v: p.versione_token });
      return json({ ruolo: "regia", admin: p.admin }, 200, { "set-cookie": cookieSessione(token) });
    }
  }

  if (b.regia) {
    await registra(false, null);
    throw new Errore(401, "Nome utente o password non giusti.", "credenziali");
  }

  const u = sid
    ? await db.uno<{ id: number; ruolo: Ruolo; password_hash: string; versione_token: number }>(
        "SELECT id, ruolo, password_hash, versione_token FROM account WHERE serata_id = $1 AND username = $2 AND attivo AND ruolo <> 'regia'",
        [sid, username],
      )
    : undefined;
  const ok = !!u && (await verificaPassword(password, u.password_hash));
  await registra(ok, sid);
  if (!ok || !u) throw new Errore(401, "Nome utente o password non giusti.", "credenziali");
  if (serata?.archiviata) throw new Errore(403, "Questa serata è archiviata: gli accessi sono chiusi.", "serata_archiviata");

  await db.q("UPDATE account SET ultimo_accesso = NOW() WHERE id = $1", [u.id]);
  const token = firmaSessione({ a: u.id, r: u.ruolo, v: u.versione_token });
  return json({ ruolo: u.ruolo }, 200, { "set-cookie": cookieSessione(token) });
}

export function esci() {
  return json({ ok: true }, 200, { "set-cookie": cookieUscita() });
}

export async function io(req: Request, db: Db) {
  let p: Persona;
  try {
    p = await persona(req, db);
  } catch (e) {
    if (e instanceof Errore && e.stato === 401) return json({ ruolo: null });
    throw e;
  }
  if (p.tipo === "utente") return json({ ruolo: "regia", username: p.username, admin: p.admin, squadra: null });
  const u = p.u;
  const sq = u.squadra_id
    ? await db.uno<{ nome: string; colore: string }>("SELECT nome, colore FROM squadra WHERE id = $1", [u.squadra_id])
    : undefined;
  // Lo slug serve a "Esci", che riporta squadre e proiettore alla pagina d'accesso della loro serata.
  const se = await db.uno<{ slug: string }>("SELECT slug FROM serata WHERE id = $1", [u.serata_id]);
  return json({ ruolo: u.ruolo, username: u.username, squadra: sq ?? null, slug: se?.slug ?? null });
}

/** La regia cambia la propria password (e se vuole il nome utente). Chiude le altre sessioni di quell'utente. */
export async function cambiaPasswordRegia(req: Request, db: Db) {
  const u = await utenteSenzaSerata(req, db);
  const b = await corpo<{ attuale?: string; nuova?: string; username?: string }>(req);
  const attuale = testo(b.attuale, "password attuale", { max: 200 });
  const nuova = testo(b.nuova, "nuova password", { max: 200 });
  controllaPassword(nuova);
  const r = await db.uno<{ password_hash: string }>("SELECT password_hash FROM utente WHERE id = $1", [u.id]);
  if (!r || !(await verificaPassword(attuale, r.password_hash))) throw new Errore(403, "La password attuale non è giusta.");
  let username = u.username;
  if (typeof b.username === "string" && b.username.trim()) {
    username = b.username.trim().toLowerCase();
    controllaUsername(username);
    const altro = await db.uno("SELECT id FROM utente WHERE username = $1 AND id <> $2", [username, u.id]);
    if (altro) throw new Errore(409, "Questo nome utente è già usato.");
  }
  const agg = await db.uno<{ versione_token: number }>(
    "UPDATE utente SET password_hash = $1, username = $2, versione_token = versione_token + 1 WHERE id = $3 RETURNING versione_token",
    [await hashPassword(nuova), username, u.id],
  );
  const token = firmaSessione({ k: "u", a: u.id, r: "regia", v: agg!.versione_token });
  return json({ ok: true, username }, 200, { "set-cookie": cookieSessione(token) });
}

/** Le serate dell'utente, per scegliere su quale lavorare. */
export async function mieSerate(req: Request, db: Db) {
  const u = await utenteSenzaSerata(req, db);
  const serate = await db.q(
    `SELECT id, titolo, slug, tema, stato, archiviata, creata, aggiornata,
       (SELECT COUNT(*)::int FROM squadra sq WHERE sq.serata_id = serata.id) AS squadre
     FROM serata WHERE proprietario_id = $1 ORDER BY archiviata, aggiornata DESC, id DESC`,
    [u.id],
  );
  return json({ serate });
}
