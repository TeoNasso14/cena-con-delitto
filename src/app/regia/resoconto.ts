import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Api, ErroreApi, ora } from '../api';
import { RegiaStato } from './stato';

interface SquadraRes {
  id: number; nome: string; colore: string; aperte: number; pin: number; catena: number; fase: number; regia: number;
  codici_sbagliati: number; aiuti: number; penalita: number; prima: string | null; ultima: string | null;
  consegnata_alle: string | null; punteggio: number | null; netto: number | null;
}
interface Resoconto {
  titolo: string; stato: string; rivelata: boolean; inizio: string | null; fine: string | null;
  squadre: SquadraRes[];
  prove: Array<{ numero: number; titolo: string; aperture: Array<{ squadra: string; colore: string; ora: string; via: string }> }>;
  fasi: Array<{ numero: number; nome: string; avviata_alle: string }>;
}

const VIA: Record<string, string> = { pin: 'con il codice', catena: 'a catena', fase: 'con la fase', regia: 'dalla regia' };

/** Com'è andata la serata: da mostrare a fine cena o da stampare. La prova generale non c'è. */
@Component({
  selector: 'app-resoconto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .podio { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
    :host { display: grid; gap: 36px; align-content: start; }
    .podio li { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 18px; border-radius: 14px; background: var(--fondo-2); }
    .nome { display: flex; align-items: center; gap: 10px; }
    .nome .pallino { width: 14px; height: 14px; }
    .pos { font-family: var(--titoli); font-size: 36px; line-height: 1; color: var(--testo-2); }
    .podio li:first-child .pos { color: var(--accento); }
    .nome { font-family: var(--titoli); font-size: 26px; line-height: 1.05; }
    .dettagli { color: var(--testo-2); font-size: 15px; margin-top: 4px; }
    .punti { font-size: 28px; font-weight: 700; text-align: right; line-height: 1; }
    .punti small { display: block; font-size: 13px; font-weight: 500; color: var(--testo-2); margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 15px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--fondo-3); vertical-align: top; }
    th { color: var(--testo-2); font-weight: 600; font-size: 14px; }
    td.n { font-variant-numeric: tabular-nums; }
    .tabella { overflow-x: auto; }
    .apertura { display: inline-flex; align-items: center; gap: 6px; margin: 0 12px 4px 0; white-space: nowrap; }
    .pallino { width: 10px; height: 10px; border-radius: 50%; display: inline-block; flex: none; }
    .nessuna { color: var(--testo-2); }
    @media print {
      :host { color: #111; }
      .r-azioni { display: none; }
      .podio li, .r-scheda { background: #fff; border: 1px solid #ccc; }
      th, td { border-color: #ccc; }
    }
  `,
  template: `
    <header class="r-testa">
      <div>
        <h1>Resoconto</h1>
        <p>{{ sottotitolo() }}</p>
      </div>
      <div class="r-azioni"><button class="bottone" type="button" (click)="stampa()">Stampa</button></div>
    </header>
    @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
    @if (r(); as r) {
      @if (!r.squadre.length) {
        <p class="r-vuoto">Nessuna squadra: il resoconto si riempie durante la serata.</p>
      } @else {
        <section class="r-blocco" aria-labelledby="t-classifica">
          <h2 id="t-classifica">La classifica</h2>
          @if (!r.rivelata) { <p class="secondario">La soluzione non è ancora rivelata: i punti delle accuse arrivano con la rivelazione, o li dai tu in Accuse e verdetto.</p> }
          <ol class="podio">
            @for (q of r.squadre; track q.id; let i = $index) {
              <li>
                <span class="pos">{{ i + 1 }}</span>
                <div>
                  <p class="nome"><span class="pallino" [style.background]="q.colore" aria-hidden="true"></span>{{ q.nome }}</p>
                  <p class="dettagli">{{ dettagli(q) }}</p>
                </div>
                @if (q.netto !== null) {
                  <p class="punti">{{ q.netto }}<small>{{ q.penalita ? q.punteggio + ' meno ' + q.penalita + ' di aiuti' : q.netto === 1 ? 'punto' : 'punti' }}</small></p>
                } @else {
                  <p class="punti"><small>{{ q.consegnata_alle ? 'punti da dare' : 'nessuna accusa' }}</small></p>
                }
              </li>
            }
          </ol>
        </section>

        <section class="r-blocco" aria-labelledby="t-numeri">
          <h2 id="t-numeri">Squadra per squadra</h2>
          <div class="r-scheda tabella">
            <table>
              <thead><tr><th scope="col">Squadra</th><th scope="col">Prove</th><th scope="col">Con il codice</th><th scope="col">A catena o con la fase</th><th scope="col">Dalla regia</th><th scope="col">Codici sbagliati</th><th scope="col">Aiuti</th><th scope="col">Prima e ultima prova</th><th scope="col">Accusa</th></tr></thead>
              <tbody>
                @for (q of r.squadre; track q.id) {
                  <tr>
                    <th scope="row"><span class="apertura"><span class="pallino" [style.background]="q.colore"></span>{{ q.nome }}</span></th>
                    <td class="n">{{ q.aperte }} su {{ r.prove.length }}</td>
                    <td class="n">{{ q.pin }}</td>
                    <td class="n">{{ q.catena + q.fase }}</td>
                    <td class="n">{{ q.regia }}</td>
                    <td class="n">{{ q.codici_sbagliati }}</td>
                    <td class="n">{{ q.aiuti }}</td>
                    <td class="n">{{ q.prima ? ora(q.prima) + ', ' + ora(q.ultima) : 'nessuna' }}</td>
                    <td class="n">{{ q.consegnata_alle ? 'alle ' + ora(q.consegnata_alle) : 'non consegnata' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="r-blocco" aria-labelledby="t-prove">
          <h2 id="t-prove">Prova per prova</h2>
          <div class="r-scheda tabella">
            <table>
              <thead><tr><th scope="col">Prova</th><th scope="col">Chi l'ha aperta, e quando</th></tr></thead>
              <tbody>
                @for (p of r.prove; track p.numero) {
                  <tr>
                    <th scope="row">N. {{ p.numero }}, {{ p.titolo }}</th>
                    <td>
                      @for (a of p.aperture; track a.squadra) {
                        <span class="apertura"><span class="pallino" [style.background]="a.colore"></span>{{ a.squadra }} alle {{ ora(a.ora) }}, {{ via(a.via) }}</span>
                      } @empty { <span class="nessuna">Nessuna squadra</span> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }
    } @else if (!errore()) {
      <p class="secondario" role="status">Preparo il resoconto…</p>
    }
  `,
})
export class ResocontoRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly ora = ora;
  readonly r = signal<Resoconto | null>(null);
  readonly errore = signal('');
  readonly via = (v: string) => VIA[v] ?? v;

  readonly sottotitolo = computed(() => {
    const r = this.r();
    if (!r) return 'Com\'è andata la serata.';
    if (!r.inizio) return 'La serata non è ancora cominciata: qui comparirà com\'è andata.';
    const durata = r.fine ? Math.round((+new Date(r.fine) - +new Date(r.inizio)) / 60000) : null;
    return `Cominciata alle ${ora(r.inizio)}${r.fine ? `, soluzione rivelata alle ${ora(r.fine)}: ${durata} minuti di indagine` : ', ancora in corso'}.`;
  });

  constructor() {
    // Si ricarica a ogni cambio della serata, come il resto della regia.
    effect(() => {
      if (this.st.t()?.serata.versione) this.carica();
    });
  }

  async carica() {
    try {
      this.r.set(await this.api.get<Resoconto>('/api/regia/resoconto'));
      this.errore.set('');
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Non riesco a preparare il resoconto.');
    }
  }

  dettagli(q: SquadraRes) {
    const parti = [q.aperte === 1 ? '1 prova aperta' : `${q.aperte} prove aperte`];
    if (q.codici_sbagliati) parti.push(q.codici_sbagliati === 1 ? '1 codice sbagliato' : `${q.codici_sbagliati} codici sbagliati`);
    if (q.aiuti) parti.push(q.aiuti === 1 ? '1 aiuto' : `${q.aiuti} aiuti`);
    if (q.consegnata_alle) parti.push(`accusa alle ${ora(q.consegnata_alle)}`);
    return parti.join(', ');
  }
  stampa() { window.print(); }
}
