import { utente } from "./accesso.ts";
import { Db, json } from "./base.ts";
import { combacia } from "./regia.ts";

/* ---------- Controllo del caso: cosa non funzionerà durante la serata, prima che succeda ---------- */

export interface Problema {
  livello: "errore" | "avviso";
  /** La pagina della regia dove si corregge: caso, prove, scene, squadre, invitati, personaggi. */
  dove: "caso" | "prove" | "scene" | "squadre" | "invitati" | "personaggi";
  testo: string;
}

interface RegolaC { tipo: "pin" | "prova" | "fase"; pin: string | null; prova_richiesta_id: number | null; fase_numero: number | null; squadra_id: number | null; gruppo: number }
export interface DatiCaso {
  serata: { colpevole: string; movente: string; arma: string };
  fasi: number[];
  prove: Array<{ id: number; numero: number; tipo: string; testo: string; allegato_key: string | null; regole: RegolaC[] }>;
  squadre: Array<{ id: number; nome: string }>;
  schermi: number;
  personaggi: Array<{ id: number; nome: string }>;
  scene: Array<{ tipo: string; titolo: string; allegato_key: string | null; fase_numero: number | null; avvio_automatico: boolean }>;
  invitati: Array<{ nome: string; personaggio_id: number | null }>;
}

const CON_FILE = ["foto", "audio", "video"];

/** I modi (gruppi di regole) con cui una prova si apre per una squadra; squadra null: le regole valide per tutte. */
function modi(regole: RegolaC[], squadra: number | null) {
  const g = new Map<number, RegolaC[]>();
  for (const r of regole) g.set(r.gruppo, [...(g.get(r.gruppo) ?? []), r]);
  return [...g.values()].filter((m) => m.every((r) => r.squadra_id === null || r.squadra_id === squadra));
}

/** Perché un modo non potrà mai funzionare, a prescindere dalle altre prove; null se può funzionare. */
function modoImpossibile(m: RegolaC[], fasi: Set<number>): string | null {
  const pin = new Set(m.filter((r) => r.tipo === "pin").map((r) => (r.pin ?? "").toUpperCase()));
  if (pin.size > 1) return "chiede due codici diversi insieme";
  const f = m.find((r) => r.tipo === "fase" && !fasi.has(r.fase_numero ?? -1));
  if (f) return `aspetta la fase ${f.fase_numero}, che non esiste`;
  return null;
}

/**
 * Le prove che una squadra può aprire se trova tutti i codici e la regia avvia tutte le fasi.
 * Le prove senza regole le consegna la regia: contano come aperte, perché la regia le darà.
 */
function raggiungibili(d: DatiCaso, squadra: number | null) {
  const fasi = new Set(d.fasi);
  const aperte = new Set(d.prove.filter((p) => !p.regole.length).map((p) => p.id));
  for (let cambiato = true; cambiato;) {
    cambiato = false;
    for (const p of d.prove) {
      if (aperte.has(p.id)) continue;
      const ok = modi(p.regole, squadra).some((m) => !modoImpossibile(m, fasi) && m.every((r) => r.tipo !== "prova" || aperte.has(r.prova_richiesta_id ?? -1)));
      if (ok) { aperte.add(p.id); cambiato = true; }
    }
  }
  return aperte;
}

export function controlla(d: DatiCaso): Problema[] {
  const out: Problema[] = [];
  const errore = (dove: Problema["dove"], testo: string) => out.push({ livello: "errore", dove, testo });
  const avviso = (dove: Problema["dove"], testo: string) => out.push({ livello: "avviso", dove, testo });
  const fasi = new Set(d.fasi);
  const numero = new Map(d.prove.map((p) => [p.id, p.numero]));

  // La soluzione serve alla rivelazione e ai punteggi.
  if (!d.serata.colpevole.trim()) errore("caso", "Manca il colpevole nella soluzione: la rivelazione non può partire.");
  if (!d.serata.movente.trim()) avviso("caso", "Manca il movente nella soluzione: nessuna squadra prenderà il punto del movente.");
  if (!d.serata.arma.trim()) avviso("caso", "Manca l'arma nella soluzione: nessuna squadra prenderà il punto dell'arma.");
  if (d.serata.colpevole.trim() && d.personaggi.length && !d.personaggi.some((p) => combacia(p.nome, d.serata.colpevole))) {
    avviso("caso", "Il colpevole della soluzione non corrisponde a nessun personaggio: controlla che il nome sia scritto come nei personaggi.");
  }
  if (!d.fasi.length) avviso("caso", "Non ci sono fasi: le prove che si aprono con una fase restano chiuse.");
  if (!d.prove.length) avviso("prove", "Non ci sono prove.");

  // Prove: modi impossibili in sé, poi prove che non si aprono mai per qualche squadra.
  const giaDette = new Set<number>();
  for (const p of d.prove) {
    for (const m of modi(p.regole, null).concat(...d.squadre.map((s) => modi(p.regole, s.id)))) {
      const perche = modoImpossibile(m, fasi);
      if (perche) { errore("prove", `La prova ${p.numero} ${perche}.`); giaDette.add(p.id); break; }
    }
    if (!p.regole.length) avviso("prove", `La prova ${p.numero} non ha regole: la può consegnare solo la regia, a mano.`);
    if (CON_FILE.includes(p.tipo) && !p.allegato_key) avviso("prove", `La prova ${p.numero} è di tipo ${p.tipo} ma non ha un file.`);
    else if (!p.testo.trim() && !p.allegato_key) avviso("prove", `La prova ${p.numero} è vuota: niente testo e niente file.`);
  }
  const perSquadra = d.squadre.length ? d.squadre.map((s) => ({ nome: s.nome, aperte: raggiungibili(d, s.id) })) : [{ nome: "", aperte: raggiungibili(d, null) }];
  for (const p of d.prove) {
    const senza = perSquadra.filter((s) => !s.aperte.has(p.id));
    if (!senza.length) continue;
    const chi = d.squadre.length && senza.length < perSquadra.length ? ` per ${senza.map((s) => s.nome).join(", ")}` : "";
    const attese: number[] = [...new Set(p.regole.filter((r) => r.tipo === "prova").map((r) => numero.get(r.prova_richiesta_id ?? -1)).filter((n): n is number => n !== undefined))];
    if (!attese.length && giaDette.has(p.id)) continue;
    const motivo = attese.length ? `: aspetta ${attese.length > 1 ? "le prove" : "la prova"} ${attese.join(", ")}, che a ${attese.length > 1 ? "loro" : "sua"} volta non si ${attese.length > 1 ? "aprono" : "apre"}` : "";
    errore("prove", `La prova ${p.numero} non si apre mai${chi}${motivo}. La regia può solo consegnarla a mano.`);
  }

  // Scene del proiettore.
  if (d.scene.length && !d.scene.some((s) => s.tipo === "rivelazione")) avviso("scene", "Non c'è una scena di rivelazione: quando riveli la soluzione il proiettore non la mostra.");
  const automatiche = new Map<number, number>();
  for (const s of d.scene) {
    const nome = s.titolo || s.tipo;
    if (["immagine", "video", "audio"].includes(s.tipo) && !s.allegato_key) avviso("scene", `La scena "${nome}" non ha un file.`);
    if (s.fase_numero !== null && !fasi.has(s.fase_numero)) avviso("scene", `La scena "${nome}" è legata alla fase ${s.fase_numero}, che non esiste.`);
    if (s.avvio_automatico && s.fase_numero !== null) automatiche.set(s.fase_numero, (automatiche.get(s.fase_numero) ?? 0) + 1);
  }
  for (const [f, n] of automatiche) if (n > 1) avviso("scene", `La fase ${f} ha ${n} scene che partono da sole: va in onda solo la prima.`);

  // Squadre, proiettore, invitati.
  if (!d.squadre.length) avviso("squadre", "Non ci sono squadre.");
  if (!d.schermi) avviso("squadre", "Non c'è un accesso per il proiettore.");
  const contati = new Map<number, string[]>();
  for (const i of d.invitati) if (i.personaggio_id !== null) contati.set(i.personaggio_id, [...(contati.get(i.personaggio_id) ?? []), i.nome]);
  for (const [id, nomi] of contati) {
    if (nomi.length > 1) avviso("invitati", `${d.personaggi.find((p) => p.id === id)?.nome ?? "Un personaggio"} è interpretato da più persone: ${nomi.join(", ")}.`);
  }
  return out;
}

export async function controllo(req: Request, db: Db) {
  const u = await utente(req, db, ["regia"]);
  const sid = u.serata_id;
  const serata = await db.uno<DatiCaso["serata"]>("SELECT colpevole, movente, arma FROM serata WHERE id = $1", [sid]);
  const fasi = (await db.q<{ numero: number }>("SELECT numero FROM fase WHERE serata_id = $1", [sid])).map((f) => f.numero);
  const prove = await db.q<DatiCaso["prove"][number]>(
    `SELECT p.id, p.numero, p.tipo, p.testo, p.allegato_key, COALESCE((SELECT json_agg(json_build_object(
        'tipo', r.tipo, 'pin', r.pin, 'prova_richiesta_id', r.prova_richiesta_id, 'fase_numero', r.fase_numero,
        'squadra_id', r.squadra_id, 'gruppo', r.gruppo)) FROM regola_sblocco r WHERE r.prova_id = p.id), '[]'::json) AS regole
     FROM prova p WHERE p.serata_id = $1 ORDER BY p.numero`,
    [sid],
  );
  const squadre = await db.q<{ id: number; nome: string }>("SELECT id, nome FROM squadra WHERE serata_id = $1 AND NOT prova ORDER BY id", [sid]);
  const schermi = await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM account WHERE serata_id = $1 AND ruolo = 'schermo'", [sid]);
  const personaggi = await db.q<{ id: number; nome: string }>("SELECT id, nome FROM personaggio WHERE serata_id = $1", [sid]);
  const scene = await db.q<DatiCaso["scene"][number]>("SELECT tipo, titolo, allegato_key, fase_numero, avvio_automatico FROM scena WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  const invitati = await db.q<DatiCaso["invitati"][number]>("SELECT nome, personaggio_id FROM invitato WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  return json({ problemi: controlla({ serata: serata!, fasi, prove, squadre, schermi: schermi?.n ?? 0, personaggi, scene, invitati }) });
}
