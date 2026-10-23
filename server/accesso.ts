import {
  cookieSessione, cookieUscita, corpo, Db, env, Errore, firmaSessione, hashPassword, json, leggiSessione,
  Ruolo, testo, tokenDaRichiesta, verificaPassword,
} from "./base.ts";

export interface Utente {
  id: number;
  serata_id: number;
  ruolo: Ruolo;
  username: string;
  squadra_id: number | null;
  versione_token: number;
}

const TENTATIVI_MAX = 8;
const FINESTRA_MIN = 10;

/** Carica l'utente della sessione e verifica il ruolo. */
export async function utente(req: Request, db: Db, ruoli: Ruolo[]): Promise<Utente> {
  const s = leggiSessione(tokenDaRichiesta(req));
  if (!s) throw new Errore(401, "Accedi per continuare.", "non_autenticato");
  const u = await db.uno<Utente>(
    "SELECT id, serata_id, ruolo, username, squadra_id, versione_token FROM account WHERE id = $1",
    [s.a],
  );
  if (!u || u.versione_token !== s.v || u.ruolo !== s.r) throw new Errore(401, "La sessione è scaduta. Accedi di nuovo.", "non_autenticato");
  if (!ruoli.includes(u.ruolo)) throw new Errore(403, "Questa pagina non è per il tuo account.", "vietato");
  return u;
}

export async function statoAvvio(db: Db) {
  const r = await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM account WHERE ruolo = 'regia'");
  return json({ configurato: (r?.n ?? 0) > 0 });
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

/** Crea la serata e l'account regia. Funziona una sola volta e richiede il codice di primo avvio. */
export async function primoAvvio(req: Request, db: Db) {
  const b = await corpo<{ codice?: string; username?: string; password?: string; titolo?: string }>(req);
  const atteso = env("SETUP_CODE");
  if (!atteso) throw new Errore(500, "Il sito non è configurato: manca SETUP_CODE.", "configurazione");
  if (testo(b.codice, "codice di primo avvio") !== atteso) throw new Errore(403, "Il codice di primo avvio non è giusto.");
  const username = testo(b.username, "nome utente", { max: 40 }).toLowerCase();
  controllaUsername(username);
  const password = testo(b.password, "password", { max: 200 });
  controllaPassword(password);
  const titolo = testo(b.titolo ?? "Cena con delitto", "titolo", { max: 120 });
  const hash = await hashPassword(password);

  const u = await db.transazione(async (t) => {
    const esiste = await t.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM account WHERE ruolo = 'regia'");
    if ((esiste?.n ?? 0) > 0) throw new Errore(409, "La regia esiste già. Accedi con il suo account.");
    const s = await t.uno<{ id: number }>("INSERT INTO serata (titolo) VALUES ($1) RETURNING id", [titolo]);
    return t.uno<{ id: number; versione_token: number }>(
      "INSERT INTO account (serata_id, ruolo, username, password_hash) VALUES ($1, 'regia', $2, $3) RETURNING id, versione_token",
      [s!.id, username, hash],
    );
  });
  const token = firmaSessione({ a: u!.id, r: "regia", v: u!.versione_token });
  return json({ ruolo: "regia" }, 201, { "set-cookie": cookieSessione(token) });
}

export async function accedi(req: Request, db: Db) {
  const b = await corpo<{ username?: string; password?: string }>(req);
  const username = testo(b.username, "nome utente", { max: 40 }).toLowerCase();
  const password = testo(b.password, "password", { max: 200 });

  const falliti = await db.uno<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM tentativo_login
     WHERE username = $1 AND esito = FALSE AND ora > NOW() - ($2 || ' minutes')::interval`,
    [username, String(FINESTRA_MIN)],
  );
  if ((falliti?.n ?? 0) >= TENTATIVI_MAX) {
    throw new Errore(429, `Troppi tentativi sbagliati. Riprova tra ${FINESTRA_MIN} minuti.`, "troppi_tentativi");
  }

  const u = await db.uno<{ id: number; ruolo: Ruolo; password_hash: string; versione_token: number }>(
    "SELECT id, ruolo, password_hash, versione_token FROM account WHERE username = $1",
    [username],
  );
  const ok = !!u && (await verificaPassword(password, u.password_hash));
  await db.q("INSERT INTO tentativo_login (username, esito) VALUES ($1, $2)", [username, ok]);
  if (!ok || !u) throw new Errore(401, "Nome utente o password non giusti.", "credenziali");

  await db.q("UPDATE account SET ultimo_accesso = NOW() WHERE id = $1", [u.id]);
  const token = firmaSessione({ a: u.id, r: u.ruolo, v: u.versione_token });
  return json({ ruolo: u.ruolo }, 200, { "set-cookie": cookieSessione(token) });
}

export function esci() {
  return json({ ok: true }, 200, { "set-cookie": cookieUscita() });
}

export async function io(req: Request, db: Db) {
  let u: Utente;
  try {
    u = await utente(req, db, ["regia", "squadra", "schermo"]);
  } catch (e) {
    if (e instanceof Errore && e.stato === 401) return json({ ruolo: null });
    throw e;
  }
  const sq = u.squadra_id
    ? await db.uno<{ nome: string; colore: string }>("SELECT nome, colore FROM squadra WHERE id = $1", [u.squadra_id])
    : undefined;
  return json({ ruolo: u.ruolo, username: u.username, squadra: sq ?? null });
}

/** La regia cambia la propria password (e se vuole il nome utente). Chiude le altre sessioni regia. */
export async function cambiaPasswordRegia(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const b = await corpo<{ attuale?: string; nuova?: string; username?: string }>(req);
  const attuale = testo(b.attuale, "password attuale", { max: 200 });
  const nuova = testo(b.nuova, "nuova password", { max: 200 });
  controllaPassword(nuova);
  const r = await db.uno<{ password_hash: string }>("SELECT password_hash FROM account WHERE id = $1", [u.id]);
  if (!r || !(await verificaPassword(attuale, r.password_hash))) throw new Errore(403, "La password attuale non è giusta.");
  let username = u.username;
  if (typeof b.username === "string" && b.username.trim()) {
    username = b.username.trim().toLowerCase();
    controllaUsername(username);
    const altro = await db.uno("SELECT id FROM account WHERE username = $1 AND id <> $2", [username, u.id]);
    if (altro) throw new Errore(409, "Questo nome utente è già usato.");
  }
  const agg = await db.uno<{ versione_token: number }>(
    "UPDATE account SET password_hash = $1, username = $2, versione_token = versione_token + 1 WHERE id = $3 RETURNING versione_token",
    [await hashPassword(nuova), username, u.id],
  );
  const token = firmaSessione({ a: u.id, r: "regia", v: agg!.versione_token });
  return json({ ok: true, username }, 200, { "set-cookie": cookieSessione(token) });
}
