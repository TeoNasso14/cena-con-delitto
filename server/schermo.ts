import { utente } from "./accesso.ts";
import { Db, json } from "./base.ts";
import { faseInfo } from "./squadra.ts";

/** Stato del proiettore: solo ciò che la regia ha mandato in onda. */
export async function statoSchermo(req: Request, db: Db) {
  const u = await utente(req, db, ["schermo", "regia"]);
  return json(await costruisciSchermo(db, u.serata_id));
}

export async function costruisciSchermo(db: Db, sid: number) {
  const s = await db.uno<{
    titolo: string; stato: string; fase_corrente: number; scena_in_onda: number | null; schermo_nero: boolean;
    versione: string; rivelata: boolean; colpevole: string; movente: string; arma: string;
    sfondo_key: string | null; sfondo_opacita: number;
  }>(
    "SELECT titolo, stato, fase_corrente, scena_in_onda, schermo_nero, versione, rivelata, colpevole, movente, arma, sfondo_key, sfondo_opacita FROM serata WHERE id = $1",
    [sid],
  );
  const fase = await faseInfo(db, sid, s!.fase_corrente);
  const scena = s!.scena_in_onda
    ? await db.uno<{ id: number; tipo: string; titolo: string; testo: string; allegato_key: string | null; allegato_tipo: string | null; in_onda_dal: Date }>(
        "SELECT id, tipo, titolo, testo, allegato_key, allegato_tipo, in_onda_dal FROM scena WHERE id = $1 AND serata_id = $2",
        [s!.scena_in_onda, sid],
      )
    : undefined;

  const base = {
    versione: s!.versione,
    titolo: s!.titolo,
    stato: s!.stato,
    schermoNero: s!.schermo_nero,
    fase: {
      numero: s!.fase_corrente,
      nome: fase.corrente?.nome ?? null,
      avviata: fase.corrente?.avviata_alle ?? null,
      durataMinuti: fase.corrente?.durata_minuti ?? null,
      elenco: fase.fasi,
    },
    adesso: new Date().toISOString(),
    sfondo: s!.sfondo_key ? { url: `/api/file/${encodeURIComponent(s!.sfondo_key)}`, opacita: Number(s!.sfondo_opacita) } : null,
  };

  if (!scena) return { ...base, scena: { tipo: "attesa", titolo: s!.titolo, testo: "" } };

  const out: Record<string, unknown> = {
    id: scena.id,
    tipo: scena.tipo,
    titolo: scena.titolo,
    testo: scena.testo,
    allegato: scena.allegato_key ? { url: `/api/file/${encodeURIComponent(scena.allegato_key)}`, tipo: scena.allegato_tipo } : null,
    inOndaDal: scena.in_onda_dal,
  };

  if (scena.tipo === "avanzamento") {
    out.squadre = await db.q(
      `SELECT sq.nome, sq.colore, COUNT(sb.prova_id)::int AS aperte
       FROM squadra sq LEFT JOIN sblocco sb ON sb.squadra_id = sq.id
       WHERE sq.serata_id = $1 GROUP BY sq.id ORDER BY aperte DESC, sq.nome`,
      [sid],
    );
    const t = await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM prova WHERE serata_id = $1", [sid]);
    out.totaleProve = t?.n ?? 0;
  }
  if (scena.tipo === "annuncio") {
    const a = await db.uno<{ testo: string }>(
      "SELECT testo FROM annuncio WHERE serata_id = $1 AND squadra_id IS NULL ORDER BY ora DESC LIMIT 1",
      [sid],
    );
    out.annuncio = a?.testo ?? "";
  }
  if (scena.tipo === "rivelazione") {
    out.rivelata = s!.rivelata;
    if (s!.rivelata) {
      out.soluzione = { colpevole: s!.colpevole, movente: s!.movente, arma: s!.arma };
      // Scherzo della serata: se c'è una squadra Rainbow, vince lei a prescindere.
      const rainbow = await db.uno<{ nome: string }>(
        "SELECT nome FROM squadra WHERE serata_id = $1 AND lower(nome) LIKE '%rainbow%' ORDER BY id LIMIT 1",
        [sid],
      );
      out.vincitori = rainbow
        ? [{ nome: rainbow.nome, consegnata_alle: null }]
        : await db.q(
            `SELECT sq.nome, a.consegnata_alle FROM accusa a JOIN squadra sq ON sq.id = a.squadra_id
             WHERE sq.serata_id = $1 AND a.punteggio IS NOT NULL AND a.punteggio > 0
             ORDER BY a.punteggio DESC, a.consegnata_alle ASC`,
            [sid],
          );
    }
  }
  return { ...base, scena: out };
}
