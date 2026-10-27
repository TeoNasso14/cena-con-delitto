import { utente } from "./accesso.ts";
import { corpo, Db, Errore, json, testo, tocca } from "./base.ts";
import { bloccoPin, motivoSigillo, PIN_ERRORI_MAX, provaPin, Regola, regolePerSquadra } from "./motore.ts";

interface Prova {
  id: number; numero: number; titolo: string; tipo: string; testo: string;
  allegato_key: string | null; allegato_tipo: string | null; nota_sigillo: string;
  titolo_visibile: boolean; cartella_id: number | null;
}

export async function faseInfo(db: Db, serataId: number, numero: number) {
  const fasi = await db.q<{ numero: number; nome: string; durata_minuti: number | null; avviata_alle: Date | null }>(
    "SELECT numero, nome, durata_minuti, avviata_alle FROM fase WHERE serata_id = $1 ORDER BY numero",
    [serataId],
  );
  const corrente = fasi.find((f) => f.numero === numero) ?? null;
  return { fasi: fasi.map((f) => ({ numero: f.numero, nome: f.nome })), corrente, totale: fasi.length };
}

export async function stato(req: Request, db: Db) {
  const u = await utente(req, db, ["squadra"]);
  const sid = u.serata_id;
  const sqId = u.squadra_id!;
  const serata = await db.uno<{
    titolo: string; premessa: string; stato: string; fase_corrente: number; versione: string; rivelata: boolean;
  }>("SELECT titolo, premessa, stato, fase_corrente, versione, rivelata FROM serata WHERE id = $1", [sid]);
  const squadra = await db.uno<{ nome: string; colore: string; taccuino: string }>(
    "SELECT nome, colore, taccuino FROM squadra WHERE id = $1",
    [sqId],
  );
  const prove = await db.q<Prova>(
    "SELECT id, numero, titolo, tipo, testo, allegato_key, allegato_tipo, nota_sigillo, titolo_visibile, cartella_id FROM prova WHERE serata_id = $1 ORDER BY numero",
    [sid],
  );
  // Solo le cartelle che la regia ha reso visibili: le altre restano un suo ordine privato.
  const cartelle = await db.q<{ id: number; nome: string }>(
    "SELECT id, nome FROM cartella WHERE serata_id = $1 AND visibile ORDER BY ordine, id",
    [sid],
  );
  const visibili = new Set(cartelle.map((c) => c.id));
  const aperte = await db.q<{ prova_id: number; ora: Date; via: string }>(
    "SELECT prova_id, ora, via FROM sblocco WHERE squadra_id = $1",
    [sqId],
  );
  const apertaDa = new Map(aperte.map((a) => [a.prova_id, a]));
  const regole = await regolePerSquadra(db, sid, sqId);
  const numeroDi = new Map(prove.map((p) => [p.id, p.numero]));
  const perProva = new Map<number, Regola[]>();
  for (const r of regole) {
    if (!perProva.has(r.prova_id)) perProva.set(r.prova_id, []);
    perProva.get(r.prova_id)!.push(r);
  }

  const elenco = prove.map((p) => {
    const a = apertaDa.get(p.id);
    const cartella = p.cartella_id !== null && visibili.has(p.cartella_id) ? p.cartella_id : null;
    if (a) {
      return {
        id: p.id, numero: p.numero, cartella, aperta: true, titolo: p.titolo, tipo: p.tipo, testo: p.testo,
        allegato: p.allegato_key ? { url: `/api/file/${encodeURIComponent(p.allegato_key)}`, tipo: p.allegato_tipo } : null,
        ora: a.ora, via: a.via,
      };
    }
    const m = motivoSigillo(perProva.get(p.id) ?? [], numeroDi);
    return {
      id: p.id, numero: p.numero, cartella, aperta: false, motivo: p.nota_sigillo || m.testo, conCodice: m.conCodice,
      ...(p.titolo_visibile ? { titolo: p.titolo } : {}),
    };
  });

  const personaggi = await db.q<{ id: number; nome: string; ruolo: string; scheda: string; foto_key: string | null }>(
    "SELECT id, nome, ruolo, scheda, foto_key FROM personaggio WHERE serata_id = $1 ORDER BY ordine, id",
    [sid],
  );
  const annunci = await db.q<{ id: number; testo: string; ora: Date }>(
    `SELECT id, testo, ora FROM annuncio WHERE serata_id = $1 AND (squadra_id IS NULL OR squadra_id = $2)
     ORDER BY ora DESC LIMIT 5`,
    [sid, sqId],
  );
  const accusa = await db.uno("SELECT colpevole, movente, arma, spiegazione, consegnata_alle FROM accusa WHERE squadra_id = $1", [sqId]);
  const blocco = await bloccoPin(db, sqId);
  const fase = await faseInfo(db, sid, serata!.fase_corrente);

  return json({
    versione: serata!.versione,
    serata: { titolo: serata!.titolo, premessa: serata!.premessa, stato: serata!.stato, rivelata: serata!.rivelata },
    fase: { numero: serata!.fase_corrente, nome: fase.corrente?.nome ?? null, totale: fase.totale },
    squadra,
    prove: elenco,
    cartelle,
    personaggi: personaggi.map((p) => ({
      id: p.id, nome: p.nome, ruolo: p.ruolo, scheda: p.scheda,
      foto: p.foto_key ? `/api/file/${encodeURIComponent(p.foto_key)}` : null,
    })),
    annunci,
    accusa: accusa ?? null,
    codici: { bloccatoPer: blocco.secondi, tentativiRimasti: Math.max(0, PIN_ERRORI_MAX - blocco.errori) },
  });
}

export async function pin(req: Request, db: Db) {
  const u = await utente(req, db, ["squadra"]);
  const s = await db.uno<{ stato: string }>("SELECT stato FROM serata WHERE id = $1", [u.serata_id]);
  if (s?.stato !== "in_corso") throw new Errore(409, "La serata non è in corso: i sigilli sono fermi.", "serata_ferma");
  const b = await corpo<{ codice?: string }>(req);
  const codice = testo(b.codice, "codice", { max: 32 });
  const esito = await db.transazione((t) => provaPin(t, u.serata_id, u.squadra_id!, codice));
  await tocca(db, u.serata_id);
  return json(esito);
}

export async function taccuino(req: Request, db: Db) {
  const u = await utente(req, db, ["squadra"]);
  const b = await corpo<{ testo?: string }>(req);
  const t = testo(b.testo ?? "", "taccuino", { max: 20000, vuoto: true });
  await db.q("UPDATE squadra SET taccuino = $1 WHERE id = $2", [t, u.squadra_id]);
  return json({ ok: true });
}

export async function accusa(req: Request, db: Db) {
  const u = await utente(req, db, ["squadra"]);
  const s = await db.uno<{ stato: string; rivelata: boolean }>("SELECT stato, rivelata FROM serata WHERE id = $1", [u.serata_id]);
  if (s?.stato === "chiusa" || s?.rivelata) throw new Errore(409, "Le accuse sono chiuse.");
  const b = await corpo<{ colpevole?: string; movente?: string; arma?: string; spiegazione?: string }>(req);
  const dati = [
    testo(b.colpevole, "colpevole", { max: 200 }),
    testo(b.movente, "movente", { max: 400 }),
    testo(b.arma, "arma", { max: 200 }),
    testo(b.spiegazione ?? "", "spiegazione", { max: 4000, vuoto: true }),
  ];
  const r = await db.q(
    `INSERT INTO accusa (squadra_id, colpevole, movente, arma, spiegazione) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (squadra_id) DO NOTHING RETURNING squadra_id`,
    [u.squadra_id, ...dati],
  );
  if (!r.length) throw new Errore(409, "La vostra squadra ha già consegnato l'accusa.");
  const sq = await db.uno<{ nome: string }>("SELECT nome FROM squadra WHERE id = $1", [u.squadra_id]);
  await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, 'accusa', $3)", [
    u.serata_id, u.squadra_id, `${sq?.nome} ha consegnato l'accusa`,
  ]);
  await tocca(db, u.serata_id);
  return json({ ok: true }, 201);
}
