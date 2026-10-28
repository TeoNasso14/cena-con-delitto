import { Db } from "./base.ts";

/*
 * Motore di sblocco.
 * Ogni prova ha zero o più regole. Le regole con lo stesso gruppo vanno rispettate tutte insieme,
 * gruppi diversi sono alternative. Una regola con squadra_id vale solo per quella squadra.
 * Un gruppo con una regola PIN si apre solo quando la squadra digita quel codice;
 * un gruppo senza PIN (catena o fase) si apre da solo appena le condizioni sono vere.
 * La regia può sempre consegnare una prova a mano.
 */

export interface Regola {
  id: number;
  prova_id: number;
  tipo: "pin" | "prova" | "fase";
  pin: string | null;
  prova_richiesta_id: number | null;
  fase_numero: number | null;
  squadra_id: number | null;
  gruppo: number;
}

type Via = "pin" | "catena" | "fase" | "regia";

export const normalizzaPin = (c: string) => c.replace(/\s+/g, "").toUpperCase();

interface Quadro {
  fase: number;
  regole: Regola[];
  aperte: Set<number>;
}

async function quadro(db: Db, serataId: number, squadraId: number): Promise<Quadro> {
  const s = await db.uno<{ fase_corrente: number }>("SELECT fase_corrente FROM serata WHERE id = $1", [serataId]);
  const tutte = await db.q<Regola>(
    `SELECT r.* FROM regola_sblocco r JOIN prova p ON p.id = r.prova_id WHERE p.serata_id = $1`,
    [serataId],
  );
  // Un gruppo vale per questa squadra solo se nessuna sua regola è riservata a un'altra squadra.
  const escluso = new Set(
    tutte.filter((r) => r.squadra_id !== null && r.squadra_id !== squadraId).map((r) => `${r.prova_id}:${r.gruppo}`),
  );
  const regole = tutte.filter((r) => !escluso.has(`${r.prova_id}:${r.gruppo}`));
  const aperte = await db.q<{ prova_id: number }>("SELECT prova_id FROM sblocco WHERE squadra_id = $1", [squadraId]);
  return { fase: s?.fase_corrente ?? 0, regole, aperte: new Set(aperte.map((a) => a.prova_id)) };
}

export async function regolePerSquadra(db: Db, serataId: number, squadraId: number) {
  return (await quadro(db, serataId, squadraId)).regole;
}

/** Gruppi di regole per prova: Map<prova_id, Map<gruppo, Regola[]>>. */
function gruppi(regole: Regola[]) {
  const m = new Map<number, Map<number, Regola[]>>();
  for (const r of regole) {
    if (!m.has(r.prova_id)) m.set(r.prova_id, new Map());
    const g = m.get(r.prova_id)!;
    if (!g.has(r.gruppo)) g.set(r.gruppo, []);
    g.get(r.gruppo)!.push(r);
  }
  return m;
}

function rispettata(r: Regola, q: Quadro, codice?: string): boolean {
  if (r.tipo === "fase") return q.fase >= (r.fase_numero ?? Infinity);
  if (r.tipo === "prova") return q.aperte.has(r.prova_richiesta_id ?? -1);
  return codice !== undefined && normalizzaPin(r.pin ?? "") === codice;
}

function viaDelGruppo(g: Regola[]): Via {
  if (g.some((r) => r.tipo === "pin")) return "pin";
  if (g.some((r) => r.tipo === "prova")) return "catena";
  return "fase";
}

async function apri(db: Db, serataId: number, squadraId: number, provaId: number, via: Via) {
  const r = await db.q(
    "INSERT INTO sblocco (squadra_id, prova_id, via) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING prova_id",
    [squadraId, provaId, via],
  );
  if (!r.length) return false;
  const p = await db.uno<{ numero: number; titolo: string }>("SELECT numero, titolo FROM prova WHERE id = $1", [provaId]);
  const sq = await db.uno<{ nome: string }>("SELECT nome FROM squadra WHERE id = $1", [squadraId]);
  const come = { pin: "con un codice", catena: "a catena", fase: "con la nuova fase", regia: "dalla regia" }[via];
  await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, 'sblocco', $3)", [
    serataId, squadraId, `${sq?.nome ?? "Una squadra"} ha aperto la prova n. ${p?.numero} "${p?.titolo}" ${come}`,
  ]);
  return true;
}

/** Apre tutte le prove che si aprono da sole (catene e fasi). Ripete finché non cambia più nulla. */
export async function propaga(db: Db, serataId: number, squadraId: number): Promise<number[]> {
  const nuove: number[] = [];
  for (let giro = 0; giro < 50; giro++) {
    const q = await quadro(db, serataId, squadraId);
    let cambiato = false;
    for (const [provaId, gs] of gruppi(q.regole)) {
      if (q.aperte.has(provaId)) continue;
      for (const g of gs.values()) {
        if (g.some((r) => r.tipo === "pin")) continue;
        if (g.every((r) => rispettata(r, q))) {
          if (await apri(db, serataId, squadraId, provaId, viaDelGruppo(g))) {
            nuove.push(provaId);
            cambiato = true;
          }
          break;
        }
      }
    }
    if (!cambiato) break;
  }
  return nuove;
}

export async function propagaTutte(db: Db, serataId: number) {
  const sq = await db.q<{ id: number }>("SELECT id FROM squadra WHERE serata_id = $1", [serataId]);
  for (const s of sq) await propaga(db, serataId, s.id);
}

/**
 * La regia consegna una prova a una squadra.
 * Se la prova ha un codice valido per quella squadra non si apre: compare sul telefono, sigillata e con il titolo,
 * e la squadra la apre digitando il codice. Le prove senza codice si aprono subito.
 */
export async function consegnaDallaRegia(db: Db, serataId: number, squadraId: number, provaId: number): Promise<"aperta" | "mostrata" | "gia"> {
  const q = await quadro(db, serataId, squadraId);
  if (q.aperte.has(provaId)) return "gia";
  if (q.regole.some((r) => r.prova_id === provaId && r.tipo === "pin")) {
    const r = await db.q(
      "INSERT INTO prova_mostrata (squadra_id, prova_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING prova_id",
      [squadraId, provaId],
    );
    if (r.length) {
      const p = await db.uno<{ numero: number }>("SELECT numero FROM prova WHERE id = $1", [provaId]);
      const sq = await db.uno<{ nome: string }>("SELECT nome FROM squadra WHERE id = $1", [squadraId]);
      await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, 'mostrata', $3)", [
        serataId, squadraId, `La regia ha mostrato a ${sq?.nome ?? "una squadra"} la prova n. ${p?.numero}: si apre con il suo codice`,
      ]);
    }
    return r.length ? "mostrata" : "gia";
  }
  const ok = await apri(db, serataId, squadraId, provaId, "regia");
  await propaga(db, serataId, squadraId);
  return ok ? "aperta" : "gia";
}

export const PIN_ERRORI_MAX = 5;
export const PIN_FINESTRA_MIN = 5;
export const PIN_PAUSA_SEC = 120;

export type EsitoPin =
  | { esito: "aperta"; prove: number[] }
  | { esito: "gia_aperta"; prove: number[] }
  | { esito: "non_ancora" }
  | { esito: "sbagliato"; rimasti: number }
  | { esito: "bloccato"; secondi: number };

export async function bloccoPin(db: Db, squadraId: number): Promise<{ secondi: number; errori: number }> {
  const err = await db.q<{ ora: Date }>(
    `SELECT ora FROM tentativo_pin WHERE squadra_id = $1 AND esito = FALSE
     AND ora > NOW() - ($2 || ' minutes')::interval ORDER BY ora DESC`,
    [squadraId, String(PIN_FINESTRA_MIN)],
  );
  if (err.length < PIN_ERRORI_MAX) return { secondi: 0, errori: err.length };
  const trascorsi = (Date.now() - new Date(err[0].ora).getTime()) / 1000;
  return { secondi: Math.max(0, Math.ceil(PIN_PAUSA_SEC - trascorsi)), errori: err.length };
}

/** Una squadra digita un codice. */
export async function provaPin(db: Db, serataId: number, squadraId: number, grezzo: string): Promise<EsitoPin> {
  const codice = normalizzaPin(grezzo);
  const blocco = await bloccoPin(db, squadraId);
  if (blocco.secondi > 0) return { esito: "bloccato", secondi: blocco.secondi };

  const q = await quadro(db, serataId, squadraId);
  const daAprire = new Map<number, Via>();
  const giaAperte: number[] = [];
  let codiceEsiste = false;

  for (const [provaId, gs] of gruppi(q.regole)) {
    for (const g of gs.values()) {
      const conQuestoPin = g.some((r) => r.tipo === "pin" && normalizzaPin(r.pin ?? "") === codice);
      if (!conQuestoPin) continue;
      codiceEsiste = true;
      if (q.aperte.has(provaId)) {
        giaAperte.push(provaId);
        break;
      }
      if (g.every((r) => rispettata(r, q, codice))) {
        daAprire.set(provaId, "pin");
        break;
      }
    }
  }

  const sq = await db.uno<{ nome: string }>("SELECT nome FROM squadra WHERE id = $1", [squadraId]);
  if (daAprire.size) {
    await db.q("INSERT INTO tentativo_pin (squadra_id, codice, esito) VALUES ($1, $2, TRUE)", [squadraId, codice]);
    const aperte: number[] = [];
    for (const [provaId, via] of daAprire) if (await apri(db, serataId, squadraId, provaId, via)) aperte.push(provaId);
    await propaga(db, serataId, squadraId);
    return { esito: "aperta", prove: aperte };
  }
  if (giaAperte.length) return { esito: "gia_aperta", prove: giaAperte };
  if (codiceEsiste) {
    await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, 'pin', $3)", [
      serataId, squadraId, `${sq?.nome} ha un codice giusto ma non ancora utilizzabile: ${codice}`,
    ]);
    return { esito: "non_ancora" };
  }

  await db.q("INSERT INTO tentativo_pin (squadra_id, codice, esito) VALUES ($1, $2, FALSE)", [squadraId, codice]);
  await db.q("INSERT INTO evento (serata_id, squadra_id, tipo, testo) VALUES ($1, $2, 'pin_errato', $3)", [
    serataId, squadraId, `${sq?.nome} ha provato ${codice}, codice sbagliato`,
  ]);
  const dopo = await bloccoPin(db, squadraId);
  if (dopo.secondi > 0) return { esito: "bloccato", secondi: dopo.secondi };
  return { esito: "sbagliato", rimasti: Math.max(0, PIN_ERRORI_MAX - dopo.errori) };
}

/** Descrive in parole perché una prova è ancora sigillata per una squadra, senza svelarne il contenuto. */
/**
 * Una prova che si apre "dopo un'altra prova" più un codice è pronta quando le prove richieste sono aperte
 * (e l'eventuale fase è iniziata): manca solo il codice. Anche se è nascosta, a quel punto la squadra la vede.
 */
export function prontaPerCodice(regole: Regola[], aperte: Set<number>, fase: number): boolean {
  const q: Quadro = { fase, regole, aperte };
  for (const gs of gruppi(regole).values()) {
    for (const g of gs.values()) {
      if (!g.some((r) => r.tipo === "pin") || !g.some((r) => r.tipo === "prova")) continue;
      if (g.filter((r) => r.tipo !== "pin").every((r) => rispettata(r, q))) return true;
    }
  }
  return false;
}

export function motivoSigillo(regole: Regola[], numeroDi: Map<number, number>): { testo: string; conCodice: boolean } {
  if (!regole.length) return { testo: "La consegna la regia", conCodice: false };
  const gs = gruppi(regole).values().next().value as Map<number, Regola[]>;
  const conCodice = regole.some((r) => r.tipo === "pin");
  const primo = [...gs.values()][0];
  const parti: string[] = [];
  for (const r of primo) {
    if (r.tipo === "pin") parti.push("serve un codice");
    if (r.tipo === "prova") parti.push(`si apre dopo la prova ${numeroDi.get(r.prova_richiesta_id ?? -1) ?? "?"}`);
    if (r.tipo === "fase") parti.push(`si apre con la fase ${r.fase_numero}`);
  }
  const t = parti.join(", ");
  return { testo: t.charAt(0).toUpperCase() + t.slice(1), conCodice };
}
