import { computed, inject, Injectable, signal } from '@angular/core';
import { Api, ErroreApi, seguiVersione } from '../api';
import { applicaTema } from '../temi/applica';

export interface Regola { id?: number; tipo: 'pin' | 'prova' | 'fase'; pin?: string | null; prova_richiesta_id?: number | null; fase_numero?: number | null; squadra_id?: number | null; gruppo: number }
export interface ProvaR { id: number; numero: number; titolo: string; tipo: string; testo: string; allegato_key: string | null; allegato_tipo: string | null; nota_sigillo: string; cartella_id: number | null; titolo_visibile: boolean; in_elenco: boolean; regole: Regola[] }
export interface CartellaR { id: number; nome: string; ordine: number; visibile: boolean }
export interface ScenaR { id: number; ordine: number; tipo: string; titolo: string; testo: string; allegato_key: string | null; allegato_tipo: string | null; fase_numero: number | null; avvio_automatico: boolean; in_onda_dal: string | null }
export interface PersonaggioR { id: number; nome: string; ruolo: string; scheda: string; note_regia: string; copione: string; foto_key: string | null; ordine: number }
export interface SquadraR { id: number; nome: string; colore: string; account_id: number | null; username: string | null; ultimo_accesso: string | null; aperte: number; ultima_prova: string | null; codici_sbagliati: number; prove_aperte: number[]; prove_mostrate?: number[] }
export interface Fase { numero: number; nome: string; durata_minuti: number | null; avviata_alle: string | null }
export interface Serata { id: number; titolo: string; premessa: string; stato: 'bozza' | 'in_corso' | 'in_pausa' | 'chiusa'; fase_corrente: number; scena_in_onda: number | null; schermo_nero: boolean; colpevole: string; movente: string; arma: string; rivelata: boolean; sfondo_key: string | null; sfondo_opacita: number; tema: string; sussurri_attivi: boolean; slug: string; archiviata: boolean; sussurri_attesa_min: number; sussurri_attesa_max: number; sussurri_durata: number; versione: string; aiuti_attivi: boolean; aiuti_max: number; ambiente_attivo: boolean; ambiente_volume: number }
export interface AiutoR { id: number; squadra_id: number; squadra: string; colore: string; di_prova: boolean; prova: number | null; domanda: string; stato: 'attesa' | 'dato' | 'rifiutato'; risposta: string; penalita: number; chiesto: string; risposto: string | null }
export interface Problema { livello: 'errore' | 'avviso'; dove: 'caso' | 'prove' | 'scene' | 'squadre' | 'invitati' | 'personaggi'; testo: string }
export interface AccusaR { squadra_id: number; squadra: string; colpevole: string; movente: string; arma: string; spiegazione: string; consegnata_alle: string; punteggio: number | null }

export interface Tutto {
  io: { username: string };
  serata: Serata;
  /** Frasi delle nuvolette scritte dalla regia; vuoto vuol dire quelle pronte del tema. */
  sussurri: string[];
  invitati: Array<{ id: number; nome: string; squadra_id: number | null; personaggio_id: number | null }>;
  aiuti: AiutoR[];
  vincoli: Array<{ id: number; a: number; b: number; tipo: 'divisi' | 'insieme' }>;
  fasi: Fase[];
  totaleProve: number;
  squadre: SquadraR[];
  schermi: Array<{ id: number; username: string; ultimo_accesso: string | null }>;
  personaggi: PersonaggioR[];
  prove: ProvaR[];
  cartelle: CartellaR[];
  scene: ScenaR[];
  annunci: Array<{ id: number; testo: string; ora: string; squadra: string | null }>;
  accuse: AccusaR[];
  eventi: Array<{ id: number; tipo: string; testo: string; ora: string }>;
}

export const TIPI_PROVA: Record<string, string> = {
  documento: 'Documento', oggetto: 'Oggetto', testimonianza: 'Testimonianza', foto: 'Fotografia', audio: 'Registrazione', video: 'Filmato',
};
export const TIPI_SCENA: Record<string, string> = {
  narrazione: 'Narrazione', immagine: 'Immagine', video: 'Video', audio: 'Audio con testo', conto: 'Conto alla rovescia',
  avanzamento: 'Squadre a confronto', annuncio: 'Ultimo annuncio', rivelazione: 'Rivelazione', attesa: 'Attesa',
};

@Injectable({ providedIn: 'root' })
export class RegiaStato {
  private api = inject(Api);
  readonly t = signal<Tutto | null>(null);
  readonly avviso = signal<{ testo: string; errore: boolean } | null>(null);
  private ferma?: () => void;
  private timerAvviso?: ReturnType<typeof setTimeout>;

  /** Esito del controllo del caso, chiesto dalle pagine che lo mostrano (vedi controlla). */
  readonly problemi = signal<Problema[] | null>(null);
  private controllata: string | null = null;

  /** Ricontrolla il caso, solo se la serata è cambiata dall'ultima volta. */
  async controlla(forza = false) {
    const t = this.t();
    if (!t || (!forza && this.controllata === `${t.serata.id}:${t.serata.versione}`)) return;
    this.controllata = `${t.serata.id}:${t.serata.versione}`;
    try {
      this.problemi.set((await this.api.get<{ problemi: Problema[] }>('/api/regia/controllo')).problemi);
    } catch {
      this.controllata = null;
    }
  }

  /** La serata non c'è più o non è nostra: la shell torna all'elenco delle serate. */
  readonly persa = signal(false);
  /** Inizio degli indirizzi della serata aperta, per i link tra le pagine della regia. */
  readonly base = computed(() => `/regia/s/${this.api.serata() ?? ''}`);

  /** Apre una serata: dimentica quella di prima e comincia ad aggiornarsi. */
  avvia(serata: number) {
    this.ferma?.();
    this.t.set(null);
    this.problemi.set(null);
    this.controllata = null;
    this.persa.set(false);
    this.api.scegliSerata(serata);
    this.ferma = seguiVersione(this.api, () => this.aggiorna());
  }
  arresta() { this.ferma?.(); }

  async aggiorna() {
    let t: Tutto;
    try {
      t = await this.api.get<Tutto>('/api/regia');
    } catch (e) {
      if (e instanceof ErroreApi && (e.codice === 'serata_non_trovata' || e.codice === 'serata_mancante')) this.persa.set(true);
      throw e;
    }
    this.t.set(t);
    applicaTema(t.serata.tema);
  }

  dimmi(testo: string, errore = false) {
    this.avviso.set({ testo, errore });
    clearTimeout(this.timerAvviso);
    this.timerAvviso = setTimeout(() => this.avviso.set(null), errore ? 7000 : 3500);
  }

  /** Esegue un'azione della regia, aggiorna lo stato e mostra l'esito. */
  async fai<T>(azione: () => Promise<T>, fatto?: string): Promise<T | undefined> {
    try {
      const r = await azione();
      await this.aggiorna().catch(() => undefined);
      if (fatto) this.dimmi(fatto);
      return r;
    } catch (e) {
      this.dimmi(e instanceof ErroreApi ? e.message : 'Operazione non riuscita.', true);
      return undefined;
    }
  }

  numeroProva(id: number | null | undefined) {
    return this.t()?.prove.find((p) => p.id === id)?.numero;
  }
  nomeSquadra(id: number | null | undefined) {
    return this.t()?.squadre.find((s) => s.id === id)?.nome;
  }
}
