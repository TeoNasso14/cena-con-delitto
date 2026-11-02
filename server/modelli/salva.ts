import type { CasoFile } from "../regia.ts";
import type { Modello, ModoModello, ProvaModello } from "./tipo.ts";

type Riga = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");
const escapa = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Il testo intero, non dentro un'altra parola. */
const parola = (t: string) => new RegExp(`(?<![\\p{L}\\p{N}])${escapa(t)}(?![\\p{L}\\p{N}])`, "gu");

export interface DatiSalvataggio { nome: string; descrizione?: string; luogo?: string; vittima?: string }

/**
 * Trasforma il caso di una serata in un modello privato: i nomi dei personaggi, il luogo e la vittima diventano
 * segnaposto e i codici si rigenerano a ogni serata nuova. Il colpevole resta quello della serata.
 * Restituisce null se il colpevole della soluzione non è tra i personaggi.
 */
export function daCaso(c: CasoFile, d: DatiSalvataggio, stessoNome: (a: string, b: string) => boolean): Modello | null {
  const s = c.serata ?? {};
  const personaggi = (c.personaggi ?? []).map((p, i) => ({ p, chiave: `s${i + 1}`, nome: str(p["nome"]) }));
  const colpevole = str(s["colpevole"]);
  const trovato = personaggi.find((x) => stessoNome(x.nome, colpevole) || (!!str(x.p["ruolo"]) && stessoNome(str(x.p["ruolo"]), colpevole)));
  if (!trovato) return null;

  const luogo = d.luogo?.trim() ?? "";
  const vittima = d.vittima?.trim() ?? "";
  const prove = (c.prove ?? []).map((p) => ({ p, chiave: `p${Number(p["numero"])}` }));
  const chiaveDi = new Map(prove.map((x) => [Number(x.p["numero"]), x.chiave]));

  // I codici nei testi, di almeno tre caratteri e scritti uguali: se una prova cita il codice di un'altra, la catena resta viva.
  const codici = new Map<string, string>();
  for (const x of prove) for (const r of x.p.regole ?? []) if (r.tipo === "pin" && r.pin && r.pin.length >= 3 && !codici.has(r.pin)) codici.set(r.pin, x.chiave);
  // Prima i testi più lunghi, così "Anna Bianchi" non diventa "{s1} Bianchi".
  const sostituzioni: Array<[string, string]> = [
    ...personaggi.filter((x) => x.nome).map((x) => [x.nome, `{${x.chiave}}`] as [string, string]),
    ...(luogo ? [[luogo, "{luogo}"] as [string, string]] : []),
    ...(vittima ? [[vittima, "{vittima}"] as [string, string]] : []),
    ...[...codici].map(([pin, k]) => [pin, `{codice:${k}}`] as [string, string]),
  ].sort((a, b) => b[0].length - a[0].length);
  const seg = (v: unknown) => sostituzioni.reduce((t, [da, a]) => t.replace(parola(da), () => a), str(v));

  const prova = ({ p, chiave }: { p: CasoFile["prove"] extends Array<infer T> | undefined ? T : never; chiave: string }): ProvaModello => {
    const gruppi = new Map<number, NonNullable<typeof p.regole>>();
    for (const r of p.regole ?? []) gruppi.set(r.gruppo ?? 1, [...(gruppi.get(r.gruppo ?? 1) ?? []), r]);
    const modi = [...gruppi.values()].map((g): ModoModello => {
      const dopo = g.filter((r) => r.tipo === "prova" && r.prova_richiesta).map((r) => chiaveDi.get(Number(r.prova_richiesta))).filter((k): k is string => !!k);
      const fase = g.find((r) => r.tipo === "fase")?.fase_numero;
      return { ...(g.some((r) => r.tipo === "pin") ? { codice: true as const } : {}), ...(dopo.length ? { dopo } : {}), ...(fase ? { fase } : {}) };
    });
    const fasi = (p.regole ?? []).map((r) => Number(r.fase_numero)).filter((n) => n > 0);
    return {
      chiave, titolo: seg(p["titolo"]), tipo: str(p["tipo"]) as ProvaModello["tipo"], testo: seg(p["testo"]), fase: fasi.length ? Math.min(...fasi) : 1, modi,
      ...(str(p["nota_sigillo"]) ? { indizio: seg(p["nota_sigillo"]) } : {}),
      inElenco: p["in_elenco"] === true, titoloVisibile: p["titolo_visibile"] === true,
      ...(str(p["cartella"]) ? { cartella: str(p["cartella"]) } : {}),
      ...(str(p["allegato_key"]) ? { allegato: str(p["allegato_key"]), allegatoTipo: str(p["allegato_tipo"]) } : {}),
    };
  };

  return {
    id: "", privato: true, nome: d.nome, descrizione: d.descrizione?.trim() ?? "",
    temi: str(s["tema"]) ? [str(s["tema"])] : [],
    titolo: seg(s["titolo"]), premessa: seg(s["premessa"]),
    segnaposto: {
      luogo: { etichetta: "Il luogo", proposte: luogo ? { "*": [luogo] } : {} },
      vittima: { etichetta: "La vittima", proposte: vittima ? { "*": [vittima] } : {} },
      anno: { etichetta: "Anno o stagione", proposte: {} },
    },
    minimo: personaggi.length,
    sospetti: personaggi.map(({ p, chiave, nome }) => {
      const copione = seg(p["copione"]);
      return {
        chiave, ruolo: str(p["ruolo"]), nomi: { "*": [nome] }, scheda: seg(p["scheda"]), copione, noteRegia: seg(p["note_regia"]),
        ...(str(p["foto_key"]) ? { foto: str(p["foto_key"]) } : {}),
        ...(chiave === trovato.chiave ? { colpevole: { movente: seg(s["movente"]), arma: seg(s["arma"]), copione } } : {}),
      };
    }),
    fasi: (c.fasi ?? []).map((f) => ({ nome: str(f["nome"]), minuti: typeof f["durata_minuti"] === "number" ? f["durata_minuti"] : null })),
    prove: prove.map(prova),
    scene: (c.scene ?? []).map((x: Riga) => ({
      tipo: str(x["tipo"]), titolo: seg(x["titolo"]), testo: seg(x["testo"]), fase: typeof x["fase_numero"] === "number" ? x["fase_numero"] : null, automatica: x["avvio_automatico"] === true,
      ...(str(x["allegato_key"]) ? { allegato: str(x["allegato_key"]), allegatoTipo: str(x["allegato_tipo"]) } : {}),
    })),
    sussurri: (c.sussurri ?? []).map(seg),
    cartelle: (c.cartelle ?? []).map(str),
    cartelleVisibili: (c.cartelle_visibili ?? []).map(str),
    ...(str(s["sfondo_key"]) ? { sfondo: str(s["sfondo_key"]), sfondoOpacita: Number(s["sfondo_opacita"]) } : {}),
    premi: (c.premi ?? []).map((p) => ({ nome: str(p.nome), candidati: str(p.candidati) })),
  };
}

/** Tutte le chiavi di allegati citate da un modello. */
export function allegatiDi(m: Modello) {
  return [m.sfondo, ...m.sospetti.map((s) => s.foto), ...m.prove.map((p) => p.allegato), ...m.scene.map((s) => s.allegato)].filter((k): k is string => !!k);
}

/** Lo stesso modello con le chiavi degli allegati cambiate. */
export function conAllegati(m: Modello, nuova: (k: string) => string | null): Modello {
  const v = (k?: string) => (k ? nuova(k) ?? undefined : undefined);
  return {
    ...m, sfondo: v(m.sfondo),
    sospetti: m.sospetti.map((s) => ({ ...s, foto: v(s.foto) })),
    prove: m.prove.map((p) => ({ ...p, allegato: v(p.allegato) })),
    scene: m.scene.map((s) => ({ ...s, allegato: v(s.allegato) })),
  };
}
