import { inject, Injectable, signal } from '@angular/core';
import { Api, seguiVersione } from '../api';
import { applicaTema } from '../temi/applica';

export interface ProvaAperta {
  id: number; numero: number; cartella: number | null; aperta: true; titolo: string; tipo: string; testo: string;
  allegato: { url: string; tipo: string } | null; ora: string; via: string;
}
export interface ProvaChiusa { id: number; numero: number; cartella: number | null; aperta: false; motivo: string; conCodice: boolean; titolo?: string }
export type Prova = ProvaAperta | ProvaChiusa;

export interface StatoSquadra {
  versione: string;
  tema: string;
  serata: { titolo: string; premessa: string; stato: string; rivelata: boolean };
  fase: { numero: number; nome: string | null; totale: number };
  squadra: { nome: string; colore: string; taccuino: string };
  prove: Prova[];
  /** Solo le cartelle che la regia ha reso visibili alle squadre. */
  cartelle?: Array<{ id: number; nome: string }>;
  personaggi: Array<{ id: number; nome: string; ruolo: string; scheda: string; foto: string | null }>;
  annunci: Array<{ id: number; testo: string; ora: string }>;
  accusa: { colpevole: string; movente: string; arma: string; spiegazione: string; consegnata_alle: string } | null;
  codici: { bloccatoPer: number; tentativiRimasti: number };
  sussurri: { attivi: boolean; frasi: string[]; attesa: [number, number]; durata: number };
}

export type EsitoCodice =
  | { esito: 'aperta'; prove: number[] }
  | { esito: 'gia_aperta'; prove: number[] }
  | { esito: 'non_ancora' }
  | { esito: 'sbagliato'; rimasti: number }
  | { esito: 'bloccato'; secondi: number };

@Injectable({ providedIn: 'root' })
export class StatoSquadraService {
  private api = inject(Api);
  readonly stato = signal<StatoSquadra | null>(null);
  readonly errore = signal('');
  /** Prove viste almeno una volta: le altre aperte portano l'etichetta Nuova. */
  readonly viste = signal<Set<number>>(new Set());
  private ferma?: () => void;

  avvia() {
    this.ferma?.();
    this.ferma = seguiVersione(this.api, () => this.aggiorna());
  }
  arresta() {
    this.ferma?.();
  }

  async aggiorna() {
    try {
      const s = await this.api.get<StatoSquadra>('/api/squadra/stato');
      if (!this.stato()) {
        this.viste.set(new Set(s.prove.filter((p) => p.aperta).map((p) => p.id)));
      }
      this.stato.set(s);
      applicaTema(s.tema);
      this.errore.set('');
    } catch (e) {
      this.errore.set((e as Error).message);
      throw e;
    }
  }

  segnaVista(id: number) {
    const v = new Set(this.viste());
    v.add(id);
    this.viste.set(v);
  }

  async codice(c: string) {
    const r = await this.api.post<EsitoCodice>('/api/squadra/codice', { codice: c });
    // L'esito arriva subito; l'elenco delle prove si aggiorna in parallelo.
    this.aggiorna().catch(() => undefined);
    return r;
  }

  prova(id: number) {
    return this.stato()?.prove.find((p) => p.id === id);
  }
}
