import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, ErroreApi, ora } from '../api';
import { StatoSquadraService } from './stato';

const BASE = `
  :host { display: block; padding: 32px 20px 24px; }
  h1 { font-family: var(--titoli); font-size: clamp(34px, 10vw, 44px); line-height: 1; }
  .intro { color: var(--testo-2); margin-top: 10px; max-width: 60ch; }
`;

@Component({
  selector: 'app-personaggi',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: BASE + `
    .elenco { display: grid; gap: 12px; margin-top: 24px; }
    article { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px; padding: 14px; border: 1px solid var(--filetto); border-radius: 2px; background: var(--fondo-2); }
    .ritratto { width: 72px; height: 88px; border-radius: 2px; background: var(--fondo-3); object-fit: cover; display: grid; place-items: center;
      font-family: var(--titoli); font-size: 34px; color: var(--testo-2); }
    h2 { font-family: var(--titoli); font-size: 24px; line-height: 1.05; }
    .ruolo { color: var(--accento); font-weight: 600; font-size: 15px; margin-top: 2px; }
    .scheda { color: var(--testo-1); font-size: 15px; margin-top: 8px; white-space: pre-line; }
  `,
  template: `
    <h1>I personaggi</h1>
    <p class="intro">Le persone del caso. Interrogatele in sala: ognuna sa qualcosa.</p>
    <div class="elenco">
      @for (p of st.stato()?.personaggi ?? []; track p.id) {
        <article>
          @if (p.foto) { <img class="ritratto" [src]="p.foto" [alt]="p.nome" loading="lazy"> } @else { <span class="ritratto" aria-hidden="true">{{ p.nome.charAt(0) }}</span> }
          <div>
            <h2>{{ p.nome }}</h2>
            @if (p.ruolo) { <p class="ruolo">{{ p.ruolo }}</p> }
            @if (p.scheda) { <p class="scheda">{{ p.scheda }}</p> }
          </div>
        </article>
      } @empty {
        <p class="intro">La regia non ha ancora presentato i personaggi.</p>
      }
    </div>
  `,
})
export class PersonaggiVista {
  readonly st = inject(StatoSquadraService);
}

@Component({
  selector: 'app-taccuino',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: BASE + `
    textarea { margin-top: 20px; width: 100%; min-height: 50dvh; border-radius: 2px; border: 1px solid var(--filetto); background: var(--fondo-2);
      padding: 16px; font-size: 17px; line-height: 1.6; resize: vertical; }
    .stato { margin-top: 8px; font-size: 14px; color: var(--testo-2); min-height: 20px; }
  `,
  template: `
    <h1>Il taccuino</h1>
    <p class="intro">Appunti condivisi dalla squadra: li vede chiunque sia entrato con il vostro account.</p>
    <label class="sr" for="taccuino">Appunti della squadra</label>
    <textarea id="taccuino" [value]="testo()" (input)="scrivi($any($event.target).value)" placeholder="Chi mente? Chi aveva un motivo? Chi era dove?"></textarea>
    <p class="stato" role="status">{{ salvataggio() }}</p>
  `,
})
export class TaccuinoVista implements OnDestroy {
  private api = inject(Api);
  private st = inject(StatoSquadraService);
  readonly testo = signal('');
  readonly salvataggio = signal('');
  private toccato = false;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const s = this.st.stato();
      if (s && !this.toccato) this.testo.set(s.squadra.taccuino);
    });
  }

  scrivi(v: string) {
    this.toccato = true;
    this.testo.set(v);
    this.salvataggio.set('Sto salvando…');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.salva(), 800);
  }

  private async salva() {
    try {
      await this.api.put('/api/squadra/taccuino', { testo: this.testo() });
      this.salvataggio.set('Salvato');
      this.toccato = false;
    } catch {
      this.salvataggio.set('Non salvato: controlla la connessione. Riprovo al prossimo tasto.');
    }
  }

  ngOnDestroy() {
    if (this.toccato) { clearTimeout(this.timer); this.salva(); }
  }
}

@Component({
  selector: 'app-accusa',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: BASE + `
    form { display: grid; gap: 16px; margin-top: 24px; }
    .verbale { margin-top: 24px; background: var(--carta); color: var(--inchiostro); border-radius: 2px; padding: 0 18px 22px; display: grid; gap: 10px; position: relative; }
    .verbale .intestazione { padding: 12px 0 10px; border-bottom: 1.5px solid var(--inchiostro); font-size: 13px; font-weight: 700; letter-spacing: 0.04em; }
    .verbale dl { margin: 0; display: grid; gap: 10px; }
    .verbale dt { font-size: 14px; font-weight: 700; }
    .verbale dd { margin: 0; font-size: 17px; white-space: pre-line; }
    .conferma { display: grid; gap: 12px; padding: 16px; background: var(--fondo-2); border-radius: 14px; }
    .azioni { display: flex; gap: 10px; flex-wrap: wrap; }
  `,
  template: `
    @let s = st.stato();
    <h1>L'accusa</h1>
    @if (s?.accusa; as a) {
      <p class="intro">Avete consegnato l'accusa alle {{ ora(a.consegnata_alle) }}. Ora si aspetta la rivelazione sul proiettore.</p>
      <article class="verbale">
        <div class="intestazione">VERBALE DELLA SQUADRA {{ s?.squadra?.nome?.toUpperCase() }}</div>
        <dl>
          <div><dt>Colpevole</dt><dd>{{ a.colpevole }}</dd></div>
          <div><dt>Movente</dt><dd>{{ a.movente }}</dd></div>
          <div><dt>Arma</dt><dd>{{ a.arma }}</dd></div>
          @if (a.spiegazione) { <div><dt>Come è andata</dt><dd>{{ a.spiegazione }}</dd></div> }
        </dl>
      </article>
    } @else if (s?.serata?.rivelata || s?.serata?.stato === 'chiusa') {
      <p class="intro">Le accuse sono chiuse.</p>
    } @else {
      <p class="intro">Una sola accusa per squadra, e non si torna indietro. Mettetevi d'accordo prima di consegnarla.</p>
      <form (ngSubmit)="chiediConferma()">
        <label class="etichetta" for="colpevole">Chi è il colpevole?<input id="colpevole" name="colpevole" class="campo" [(ngModel)]="colpevole" required></label>
        <label class="etichetta" for="movente">Perché lo ha fatto?<input id="movente" name="movente" class="campo" [(ngModel)]="movente" required></label>
        <label class="etichetta" for="arma">Con che cosa?<input id="arma" name="arma" class="campo" [(ngModel)]="arma" required></label>
        <label class="etichetta" for="spiegazione">Come è andata <small>Facoltativo, ma la regia lo leggerà.</small>
          <textarea id="spiegazione" name="spiegazione" class="campo" rows="5" [(ngModel)]="spiegazione"></textarea>
        </label>
        @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
        @if (!conferma()) {
          <button class="bottone bottone--pieno" type="submit">Consegna l'accusa</button>
        } @else {
          <div class="conferma" role="alertdialog" aria-labelledby="conf-titolo">
            <p id="conf-titolo"><strong>Siete sicuri?</strong> Dopo la consegna non si può cambiare.</p>
            <div class="azioni">
              <button class="bottone bottone--pieno" type="button" (click)="consegna()" [disabled]="attesa()">Sì, consegna</button>
              <button class="bottone" type="button" (click)="conferma.set(false)">Ci penso ancora</button>
            </div>
          </div>
        }
      </form>
    }
  `,
})
export class AccusaVista {
  private api = inject(Api);
  readonly st = inject(StatoSquadraService);
  readonly ora = ora;
  colpevole = '';
  movente = '';
  arma = '';
  spiegazione = '';
  readonly conferma = signal(false);
  readonly errore = signal('');
  readonly attesa = signal(false);

  chiediConferma() {
    this.errore.set('');
    if (!this.colpevole.trim() || !this.movente.trim() || !this.arma.trim()) {
      this.errore.set('Servono colpevole, movente e arma.');
      return;
    }
    this.conferma.set(true);
  }

  async consegna() {
    this.attesa.set(true);
    try {
      await this.api.post('/api/squadra/accusa', { colpevole: this.colpevole, movente: this.movente, arma: this.arma, spiegazione: this.spiegazione });
      await this.st.aggiorna();
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Consegna non riuscita. Riprovate.');
      this.conferma.set(false);
    } finally {
      this.attesa.set(false);
    }
  }
}
