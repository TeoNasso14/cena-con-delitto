import type { CasoFile } from "../regia.ts";
import type { Modello, ProvaModello, Scelte } from "./tipo.ts";

/** Il primo nome proposto per il tema, oppure per tutti i temi. */
function proposta(p: Record<string, string[]>, tema: string, i = 0) {
  const l = p[tema] ?? p["*"] ?? Object.values(p)[0] ?? [];
  return l[i % Math.max(1, l.length)] ?? "";
}

export class ErroreModello extends Error {}

/**
 * Crea un caso da un modello. Pura: a parità di `caso` dà sempre lo stesso risultato, così si prova nei test.
 * Restituisce il caso nel formato dei file esportati, la chiave del colpevole e i nomi usati.
 */
export function genera(m: Modello, s: Scelte = {}, caso: () => number = Math.random) {
  const tema = s.tema ?? m.temi[0] ?? "halloween";
  const quanti = m.privato ? m.sospetti.length : Math.min(m.sospetti.length, Math.max(m.minimo, s.sospetti ?? m.sospetti.length));
  const sospetti = m.sospetti.slice(0, quanti);
  const inGioco = new Set(sospetti.map((x) => x.chiave));
  const nFasi = Math.min(m.fasi.length, Math.max(m.privato ? m.fasi.length : Math.min(3, m.fasi.length), s.fasi ?? m.fasi.length));
  const difficolta = m.privato ? 3 : (s.difficolta ?? 2);

  // Il colpevole: scelto dalla regia o estratto tra quelli possibili in gioco.
  const possibili = sospetti.filter((x) => x.colpevole);
  if (!possibili.length) throw new ErroreModello("Questo modello non ha colpevoli possibili con questi sospetti.");
  let colpevole = possibili.find((x) => x.chiave === s.colpevole);
  if (s.colpevole && s.colpevole !== "sorte" && !colpevole) throw new ErroreModello("Questo colpevole non è in gioco.");
  colpevole ??= possibili[Math.floor(caso() * possibili.length)];

  // Nomi: quelli della regia, altrimenti le proposte del tema, senza ripetere lo stesso nome.
  const usati = new Set<string>();
  const nomi: Record<string, string> = {};
  for (const x of sospetti) {
    let n = s.nomi?.[x.chiave]?.trim() || "";
    for (let i = 0; !n || usati.has(n); i++) {
      n = proposta(x.nomi, tema, i);
      if (i > 20) { n = `${x.ruolo} ${i}`; break; }
    }
    usati.add(n);
    nomi[x.chiave] = n;
  }
  const luogo = s.luogo?.trim() || proposta(m.segnaposto.luogo.proposte, tema);
  const vittima = s.vittima?.trim() || proposta(m.segnaposto.vittima.proposte, tema);
  const anno = s.anno?.trim() || proposta(m.segnaposto.anno.proposte, tema);

  // Le prove in gioco: per colpevole, per sospetto, per difficoltà, false piste da media in su.
  const prove = m.prove.filter((p) =>
    (!p.per || p.per === colpevole!.chiave) && (!p.sospetto || inGioco.has(p.sospetto))
    && (p.difficolta ?? 1) <= difficolta && (!p.falsa || difficolta >= 2));
  const presenti = new Map(prove.map((p) => [p.chiave, p]));
  const fase = (f: number) => Math.min(f, nFasi);

  // Codici a caso, quattro cifre, tutti diversi.
  const codici = new Map<string, string>();
  for (const p of prove) {
    if (!p.modi.some((x) => x.codice)) continue;
    let c = "";
    do c = String(1000 + Math.floor(caso() * 9000)); while ([...codici.values()].includes(c));
    codici.set(p.chiave, c);
  }

  // [[...]] è una parte facoltativa: sparisce se cita il codice di una prova che in questa serata non c'è.
  const sost = (t: string): string => t.replace(/\[\[(.*?)\]\]/gs, (_, dentro: string) =>
    [...dentro.matchAll(/\{codice:([a-z0-9_]+)\}/gi)].every((x) => codici.has(x[1])) ? dentro : "").trim().replace(/\{([a-z0-9:._]+)\}/gi, (tutto, k: string): string => {
    if (k === "luogo") return luogo;
    if (k === "vittima") return vittima;
    if (k === "anno") return anno;
    if (k === "colpevole") return nomi[colpevole!.chiave];
    if (k === "movente") return sost(colpevole!.colpevole!.movente);
    if (k === "arma") return sost(colpevole!.colpevole!.arma);
    if (k.startsWith("codice:")) return codici.get(k.slice(7)) ?? tutto;
    const [chi, campo] = k.split(".");
    const x = m.sospetti.find((y) => y.chiave === chi);
    if (x && campo === "ruolo") return x.ruolo;
    if (x && inGioco.has(chi)) return nomi[chi];
    return tutto;
  });

  const numero = new Map(prove.map((p, i) => [p.chiave, i + 1]));
  /** I modi di una prova; una catena verso una prova fuori gioco diventa l'apertura con la fase della prova. */
  const regole = (p: ProvaModello) => {
    const out: Array<{ tipo: string; pin: string | null; prova_richiesta: number | null; fase_numero: number | null; gruppo: number }> = [];
    p.modi.forEach((x, i) => {
      const g = i + 1;
      // Un'apertura di riserva per una fase che con meno fasi non c'è più si toglie: resta il codice.
      if (!x.codice && !x.dopo && x.fase && x.fase > nFasi && p.modi.length > 1) return;
      const richieste = (Array.isArray(x.dopo) ? x.dopo : x.dopo ? [x.dopo] : []).filter((d) => presenti.has(d));
      const tolte = (Array.isArray(x.dopo) ? x.dopo.length : x.dopo ? 1 : 0) > richieste.length;
      if (x.codice) out.push({ tipo: "pin", pin: codici.get(p.chiave)!, prova_richiesta: null, fase_numero: null, gruppo: g });
      for (const d of richieste) out.push({ tipo: "prova", pin: null, prova_richiesta: numero.get(d)!, fase_numero: null, gruppo: g });
      if (x.fase || (tolte && !richieste.length && !x.codice)) out.push({ tipo: "fase", pin: null, prova_richiesta: null, fase_numero: fase(x.fase ?? p.fase), gruppo: g });
    });
    return out;
  };

  const caso2: CasoFile = {
    formato: "cena-con-delitto/2",
    serata: {
      titolo: (s.titolo?.trim() || sost(m.titolo)).slice(0, 120),
      premessa: sost(m.premessa),
      colpevole: nomi[colpevole.chiave],
      movente: sost(colpevole.colpevole!.movente),
      arma: sost(colpevole.colpevole!.arma),
      tema,
      ...(m.sfondo ? { sfondo_key: m.sfondo, sfondo_opacita: m.sfondoOpacita } : {}),
    },
    fasi: m.fasi.slice(0, nFasi).map((f, i) => ({
      // L'ultima fase prende il nome dell'ultima del modello: di solito è quella della verità.
      nome: i === nFasi - 1 ? m.fasi[m.fasi.length - 1].nome : f.nome,
      durata_minuti: s.minuti === undefined ? f.minuti : s.minuti,
    })),
    personaggi: sospetti.map((x, i) => ({
      nome: nomi[x.chiave], ruolo: x.ruolo, scheda: sost(x.scheda), ordine: i,
      copione: sost(x.chiave === colpevole!.chiave ? x.colpevole!.copione : x.copione),
      note_regia: x.noteRegia ? sost(x.noteRegia) : x.chiave === colpevole!.chiave ? "Il colpevole." : "",
      foto_key: x.foto ?? null,
    })),
    cartelle: m.cartelle ?? [],
    cartelle_visibili: m.cartelleVisibili ?? m.cartelle ?? [],
    premi: m.premi ?? [],
    prove: prove.map((p) => ({
      numero: numero.get(p.chiave), titolo: sost(p.titolo), tipo: p.tipo, testo: sost(p.testo),
      nota_sigillo: (difficolta === 1 || m.privato) && p.indizio ? sost(p.indizio) : "",
      titolo_visibile: p.titoloVisibile ?? false, in_elenco: p.inElenco ?? false, cartella: p.cartella ?? null,
      allegato_key: p.allegato ?? null, allegato_tipo: p.allegatoTipo ?? null,
      regole: regole(p),
    })),
    scene: m.scene.map((x, i) => ({
      ordine: i, tipo: x.tipo, titolo: sost(x.titolo), testo: sost(x.testo),
      fase_numero: x.fase === null ? null : fase(x.fase), avvio_automatico: !!x.automatica && (x.fase === null || x.fase <= nFasi),
      allegato_key: x.allegato ?? null, allegato_tipo: x.allegatoTipo ?? null,
    })),
    ...(m.sussurri ? { sussurri: m.sussurri.map(sost) } : {}),
  };
  // Con meno fasi, di due scene automatiche nella stessa fase parte solo la prima.
  const viste = new Set<number>();
  for (const sc of caso2.scene ?? []) {
    if (!sc.avvio_automatico || sc.fase_numero === null) continue;
    if (viste.has(sc.fase_numero as number)) sc.avvio_automatico = false;
    viste.add(sc.fase_numero as number);
  }
  return { caso: caso2, colpevole: colpevole.chiave, nomi, codici: Object.fromEntries(codici) };
}

/** I segnaposto rimasti in un testo: servono ai test e al controllo dei modelli salvati. */
export const segnapostoRimasti = (t: string) => t.match(/\{[a-z0-9:._]+\}/gi) ?? [];
