/*
 * Formato dei modelli di caso.
 * Nei testi si possono usare i segnaposto: {luogo} {vittima} {anno}, {s1} (il nome del sospetto s1), {s1.ruolo},
 * {colpevole} {movente} {arma} (della soluzione estratta) e {codice:p3} (il codice generato per la prova p3).
 * [[...]] è una parte facoltativa: sparisce se cita il codice di una prova che in quella serata non c'è.
 */

export interface SospettoModello {
  chiave: string;
  ruolo: string;
  /** Nomi proposti, per tema (chiave "*" per tutti i temi). */
  nomi: Record<string, string[]>;
  scheda: string;
  /** Cosa sa solo chi lo interpreta, se non è il colpevole. */
  copione: string;
  /** Se questo sospetto può essere il colpevole: movente, arma e il copione al posto di quello normale. */
  colpevole?: { movente: string; arma: string; copione: string };
  /** Solo nei modelli salvati: il ritratto. */
  foto?: string;
  noteRegia?: string;
}

/** Un modo di aprire la prova: le condizioni presenti valgono tutte insieme. */
export interface ModoModello { codice?: true; dopo?: string | string[]; fase?: number }

export interface ProvaModello {
  chiave: string;
  titolo: string;
  tipo: "documento" | "oggetto" | "testimonianza" | "foto" | "audio" | "video";
  testo: string;
  /** La fase della serata a cui appartiene: serve a unire le fasi e a sostituire una catena interrotta. */
  fase: number;
  modi: ModoModello[];
  /** Solo se il colpevole è questo sospetto. */
  per?: string;
  /** Solo se questo sospetto è in gioco. */
  sospetto?: string;
  /** 1 sempre, 2 da media in su, 3 solo a difficile. */
  difficolta?: 1 | 2 | 3;
  /** Una falsa pista: da media in su. */
  falsa?: boolean;
  /** Suggerimento sul sigillo, solo a difficoltà facile. */
  indizio?: string;
  inElenco?: boolean;
  cartella?: string;
  titoloVisibile?: boolean;
  /** Solo nei modelli salvati: l'allegato, copiato nella serata nuova. */
  allegato?: string;
  allegatoTipo?: string;
}

export interface ScenaModello { tipo: string; titolo: string; testo: string; fase: number | null; automatica?: boolean; allegato?: string; allegatoTipo?: string }

export interface SegnapostoModello { etichetta: string; proposte: Record<string, string[]> }

export interface Modello {
  id: string;
  nome: string;
  descrizione: string;
  /** Temi consigliati: il primo è quello proposto. */
  temi: string[];
  titolo: string;
  premessa: string;
  segnaposto: { luogo: SegnapostoModello; vittima: SegnapostoModello; anno: SegnapostoModello };
  /** In ordine: i primi `minimo` sono sempre in gioco. */
  sospetti: SospettoModello[];
  minimo: number;
  /** Le fasi del modello completo; con meno fasi le ultime si uniscono. */
  fasi: Array<{ nome: string; minuti: number | null }>;
  prove: ProvaModello[];
  scene: ScenaModello[];
  sussurri?: string[];
  cartelle?: string[];
  cartelleVisibili?: string[];
  sfondo?: string;
  sfondoOpacita?: number;
  premi?: Array<{ nome: string; candidati: string }>;
  /** Modelli salvati da una regia: colpevole fisso, niente grandezza né difficoltà. */
  privato?: boolean;
}

/** Le scelte della regia quando crea una serata da un modello. */
export interface Scelte {
  tema?: string;
  titolo?: string;
  luogo?: string;
  vittima?: string;
  anno?: string;
  /** Nomi dei sospetti per chiave; quelli mancanti si prendono dalle proposte del tema. */
  nomi?: Record<string, string>;
  sospetti?: number;
  fasi?: number;
  /** Minuti per fase, se la regia li vuole diversi da quelli del modello. */
  minuti?: number | null;
  difficolta?: 1 | 2 | 3;
  /** La chiave del colpevole, oppure "sorte". */
  colpevole?: string;
}
