import { utente } from "./accesso.ts";
import { Db, json } from "./base.ts";
import { penalita } from "./aiuti.ts";

/* ---------- Resoconto: com'è andata la serata, squadra per squadra. La prova generale non conta. ---------- */

interface RigaSquadra {
  id: number; nome: string; colore: string; aperte: number; pin: number; catena: number; fase: number; regia: number;
  codici_sbagliati: number; aiuti: number; prima: Date | null; ultima: Date | null;
  consegnata_alle: Date | null; punteggio: number | null;
}

async function squadre(db: Db, sid: number) {
  const righe = await db.q<RigaSquadra>(
    `SELECT sq.id, sq.nome, sq.colore,
       COUNT(sb.prova_id)::int AS aperte,
       COUNT(*) FILTER (WHERE sb.via = 'pin')::int AS pin,
       COUNT(*) FILTER (WHERE sb.via = 'catena')::int AS catena,
       COUNT(*) FILTER (WHERE sb.via = 'fase')::int AS fase,
       COUNT(*) FILTER (WHERE sb.via = 'regia')::int AS regia,
       (SELECT COUNT(*)::int FROM tentativo_pin tp WHERE tp.squadra_id = sq.id AND NOT tp.esito) AS codici_sbagliati,
       (SELECT COUNT(*)::int FROM aiuto x WHERE x.squadra_id = sq.id AND x.stato = 'dato') AS aiuti,
       MIN(sb.ora) AS prima, MAX(sb.ora) AS ultima,
       a.consegnata_alle, a.punteggio
     FROM squadra sq LEFT JOIN sblocco sb ON sb.squadra_id = sq.id LEFT JOIN accusa a ON a.squadra_id = sq.id
     WHERE sq.serata_id = $1 AND NOT sq.prova
     GROUP BY sq.id, a.consegnata_alle, a.punteggio ORDER BY sq.id`,
    [sid],
  );
  const pen = await penalita(db, sid);
  return righe
    .map((r) => ({ ...r, penalita: pen.get(r.id) ?? 0, netto: r.punteggio === null ? null : r.punteggio - (pen.get(r.id) ?? 0) }))
    .sort((a, b) => (b.netto ?? -1e9) - (a.netto ?? -1e9) || b.aperte - a.aperte || +(a.consegnata_alle ?? Infinity) - +(b.consegnata_alle ?? Infinity));
}

/** Per i telefoni dopo la rivelazione: posizione, prove aperte e punti netti. Nient'altro delle altre squadre. */
export async function classifica(db: Db, sid: number) {
  return (await squadre(db, sid)).map((s) => ({ nome: s.nome, colore: s.colore, aperte: s.aperte, netto: s.netto }));
}

export async function resoconto(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const sid = u.serata_id;
  const serata = await db.uno<{ titolo: string; stato: string; rivelata: boolean }>("SELECT titolo, stato, rivelata FROM serata WHERE id = $1", [sid]);
  // Inizio: la prima fase avviata. Fine: la rivelazione, se c'è stata.
  const inizio = await db.uno<{ t: Date | null }>("SELECT MIN(avviata_alle) AS t FROM fase WHERE serata_id = $1", [sid]);
  const fine = await db.uno<{ t: Date | null }>("SELECT MAX(ora) AS t FROM evento WHERE serata_id = $1 AND tipo = 'rivelazione' AND testo = 'Soluzione rivelata'", [sid]);
  const prove = await db.q<{ numero: number; titolo: string; aperture: Array<{ squadra: string; colore: string; ora: string; via: string }> }>(
    `SELECT p.numero, p.titolo, COALESCE((SELECT json_agg(json_build_object('squadra', sq.nome, 'colore', sq.colore, 'ora', sb.ora, 'via', sb.via) ORDER BY sb.ora)
       FROM sblocco sb JOIN squadra sq ON sq.id = sb.squadra_id WHERE sb.prova_id = p.id AND NOT sq.prova), '[]'::json) AS aperture
     FROM prova p WHERE p.serata_id = $1 ORDER BY p.numero`,
    [sid],
  );
  const fasi = await db.q("SELECT numero, nome, avviata_alle FROM fase WHERE serata_id = $1 AND avviata_alle IS NOT NULL ORDER BY numero", [sid]);
  return json({
    titolo: serata!.titolo, stato: serata!.stato, rivelata: serata!.rivelata,
    inizio: inizio?.t ?? null, fine: fine?.t ?? null,
    squadre: await squadre(db, sid), prove, fasi,
  });
}
