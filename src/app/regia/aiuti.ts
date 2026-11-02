import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api, ora } from '../api';
import { AiutoR, RegiaStato } from './stato';

/** In diretta: le richieste di aiuto delle squadre, con la risposta e la penalità. */
@Component({
  selector: 'app-aiuti-diretta',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .testa { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 12px; }
    .testa p { color: var(--testo-2); font-size: 15px; }
    .richiesta { display: grid; gap: 10px; }
    .chi { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .chi small { font-weight: 400; color: var(--testo-2); font-size: 14px; }
    .pallino { width: 12px; height: 12px; border-radius: 50%; display: inline-block; flex: none; }
    .domanda { white-space: pre-line; }
    .riga { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; }
    .riga .etichetta { flex: 0 0 140px; }
    .storico { color: var(--testo-2); font-size: 14px; }
  `,
  template: `
    @let s = st.t()!.serata;
    <section class="r-blocco" aria-labelledby="t-aiuti">
      <h2 id="t-aiuti">Aiuti{{ inAttesa().length ? ' (' + inAttesa().length + ')' : '' }}</h2>
      <div class="r-scheda">
        <div class="testa">
          <p>{{ s.aiuti_attivi ? 'Le squadre possono chiedere fino a ' + s.aiuti_max + ' aiuti, uno alla volta.' : 'Gli aiuti sono spenti: le squadre non vedono il pulsante.' }}</p>
          <button class="bottone bottone--piccolo" type="button" (click)="accendi(!s.aiuti_attivi)">{{ s.aiuti_attivi ? 'Spegni gli aiuti' : 'Accendi gli aiuti' }}</button>
        </div>
        @if (dati().length) { <p class="storico">{{ dati().length === 1 ? '1 aiuto dato' : dati().length + ' aiuti dati' }} finora.</p> }
      </div>
      @for (a of inAttesa(); track a.id) {
        <form class="r-scheda richiesta" (ngSubmit)="rispondi(a)">
          <p class="chi"><span class="pallino" [style.background]="a.colore"></span>{{ a.squadra }}
            <small>alle {{ ora(a.chiesto) }}{{ a.prova ? ', sulla prova n. ' + a.prova : '' }}</small></p>
          <p class="domanda">{{ a.domanda || 'Nessuna domanda: chiedono un aiuto e basta.' }}</p>
          <label class="etichetta" [for]="'risp-' + a.id">La tua risposta
            <textarea [id]="'risp-' + a.id" [name]="'risp-' + a.id" class="campo" rows="3" maxlength="1000" [(ngModel)]="risposte[a.id]" required></textarea>
          </label>
          <div class="riga">
            <label class="etichetta" [for]="'pen-' + a.id">Penalità
              <select [id]="'pen-' + a.id" [name]="'pen-' + a.id" class="campo" [ngModel]="penalita[a.id] ?? 0" (ngModelChange)="penalita[a.id] = $event">
                @for (n of punti; track n) { <option [ngValue]="n">{{ n === 0 ? 'Nessuna' : n === 1 ? '1 punto' : n + ' punti' }}</option> }
              </select>
            </label>
            <button class="bottone bottone--pieno" type="submit" [disabled]="!(risposte[a.id] ?? '').trim()">Rispondi</button>
            <button class="bottone" type="button" (click)="rifiuta(a)">Non rispondere</button>
          </div>
        </form>
      }
    </section>
  `,
})
export class AiutiDiretta {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly ora = ora;
  readonly punti = [0, 1, 2, 3, 5];
  risposte: Record<number, string> = {};
  penalita: Record<number, number> = {};
  readonly inAttesa = computed(() => (this.st.t()?.aiuti ?? []).filter((a) => a.stato === 'attesa').reverse());
  readonly dati = computed(() => (this.st.t()?.aiuti ?? []).filter((a) => a.stato === 'dato' && !a.di_prova));

  accendi(attivi: boolean) { this.st.fai(() => this.api.put('/api/regia/aiuti', { attivi }), attivi ? 'Aiuti accesi' : 'Aiuti spenti'); }
  async rispondi(a: AiutoR) {
    const ok = await this.st.fai(() => this.api.put(`/api/regia/aiuti/${a.id}`, { risposta: this.risposte[a.id], penalita: this.penalita[a.id] ?? 0 }), `Risposta mandata a ${a.squadra}`);
    if (ok) delete this.risposte[a.id];
  }
  rifiuta(a: AiutoR) { this.st.fai(() => this.api.put(`/api/regia/aiuti/${a.id}`, { rifiuta: true }), `${a.squadra} sa che non rispondi: l'aiuto non si conta`); }
}

/** La prova generale: il telefono di una squadra nascosta in un'altra scheda. */
@Component({
  selector: 'app-prova-generale',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: contents; } .azioni { display: flex; flex-wrap: wrap; gap: 10px; }`,
  template: `
    <section class="r-blocco" aria-labelledby="t-prova">
      <h2 id="t-prova">Prova generale</h2>
      <div class="r-scheda">
        <p class="secondario">Apri il telefono di una squadra nascosta e prova codici, catene e aiuti come li vedranno gli invitati. Nessuna password cambia e la prova generale non compare sul proiettore né nel resoconto. Le fasi però sono quelle vere: dopo la prova, azzera la serata in Strumenti.</p>
        <div class="azioni">
          <button class="bottone" type="button" (click)="apri()">Apri la prova generale</button>
          <button class="bottone" type="button" (click)="ricomincia()">Ricomincia da capo</button>
        </div>
      </div>
    </section>
  `,
})
export class ProvaGenerale {
  private st = inject(RegiaStato);
  private api = inject(Api);

  async apri() {
    // La scheda si apre subito, durante il clic: dopo l'attesa della risposta il browser la bloccherebbe.
    const w = window.open('', '_blank');
    const r = await this.st.fai(() => this.api.post<{ token: string }>('/api/regia/prova-generale'));
    if (r && w) w.location.href = `/squadra#anteprima=${r.token}`;
    else w?.close();
  }
  ricomincia() { this.st.fai(() => this.api.post('/api/regia/prova-generale/ricomincia'), 'Prova generale da capo'); }
}

/** Esito del controllo del caso. Breve in diretta, per esteso in Strumenti. */
@Component({
  selector: 'app-controllo',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    li { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--fondo-3); }
    li:last-child { border-bottom: 0; }
    .livello { font-size: 13px; font-weight: 700; padding: 1px 8px; border-radius: 2px; border: 1px solid var(--filetto); color: var(--testo-2); }
    .livello.errore { border-color: var(--allarme); color: var(--allarme); }
    .breve { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 16px; }
  `,
  template: `
    @let p = st.problemi();
    @if (breve()) {
      @if (p) {
        <div class="r-scheda breve">
          <p>{{ riassunto() }}</p>
          <a class="r-link" [routerLink]="st.base() + '/strumenti'" fragment="controllo">{{ p.length ? 'Vedi cosa sistemare' : 'Vedi il controllo' }}</a>
        </div>
      }
    } @else {
      <div class="r-scheda">
        @if (!p) {
          <p class="secondario" role="status">Controllo il caso…</p>
        } @else if (!p.length) {
          <p>Nessun problema trovato: tutte le prove si possono aprire e la soluzione è completa.</p>
        } @else {
          <p>{{ riassunto() }}</p>
          <ul>
            @for (x of p; track $index) {
              <li><span class="livello" [class.errore]="x.livello === 'errore'">{{ x.livello === 'errore' ? 'Errore' : 'Avviso' }}</span>
                <span>{{ x.testo }}</span>
                <a class="r-link" [routerLink]="st.base() + '/' + x.dove">Correggi</a></li>
            }
          </ul>
        }
      </div>
    }
  `,
})
export class Controllo {
  readonly st = inject(RegiaStato);
  readonly breve = input(false);
  readonly riassunto = computed(() => {
    const p = this.st.problemi() ?? [];
    const e = p.filter((x) => x.livello === 'errore').length;
    const a = p.length - e;
    if (!p.length) return 'Controllo del caso: nessun problema trovato.';
    const parti = [e ? (e === 1 ? '1 errore' : `${e} errori`) : '', a ? (a === 1 ? '1 avviso' : `${a} avvisi`) : ''].filter(Boolean);
    return `Controllo del caso: ${parti.join(' e ')}.`;
  });
  constructor() {
    effect(() => {
      if (this.st.t()) this.st.controlla();
    });
  }
}
