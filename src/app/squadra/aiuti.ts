import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, ErroreApi, ora } from '../api';
import { StatoSquadraService } from './stato';

/** Aiuti a richiesta: la squadra chiede, la regia risponde. Compare solo se la regia li ha accesi o se c'è una risposta da leggere. */
@Component({
  selector: 'app-aiuti',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; padding: 8px 20px 24px; }
    section { display: grid; gap: 14px; padding-top: 24px; border-top: 1px solid var(--fondo-3); }
    h2 { font-family: var(--titoli); font-size: 28px; line-height: 1.05; }
    .nota { color: var(--testo-2); font-size: 15px; }
    form { display: grid; gap: 12px; }
    .risposte { display: grid; gap: 10px; list-style: none; padding: 0; margin: 0; }
    .risposte li { padding: 14px 16px; border-radius: 2px; background: var(--fondo-2); border: 1px solid var(--filetto); display: grid; gap: 4px; }
    .risposte small { color: var(--accento); font-size: 14px; font-weight: 600; }
    .risposte li.rifiutato small { color: var(--testo-2); font-weight: 400; }
    .risposte .testo { font-size: 16px; white-space: pre-line; }
    .domanda { color: var(--testo-2); font-size: 14px; font-style: italic; }
  `,
  template: `
    @let a = st.stato()?.aiuti;
    @if (a && (a.attivi || a.richieste.length)) {
      <section aria-labelledby="titolo-aiuti">
        <h2 id="titolo-aiuti">Un aiuto dalla regia</h2>
        @if (inAttesa()) {
          <p class="avviso" role="status">Avete chiesto un aiuto alle {{ ora(inAttesa()!.chiesto) }}. La regia vi risponde qui.</p>
        } @else if (a.attivi && rimasti() > 0) {
          <p class="nota">{{ rimasti() === 1 ? 'Vi resta 1 aiuto' : 'Vi restano ' + rimasti() + ' aiuti' }} per la serata. La regia può togliere qualche punto all'accusa per ogni aiuto.</p>
          <form (ngSubmit)="chiedi()">
            <label class="etichetta" for="aiuto-prova">Su quale prova <small>Facoltativo</small>
              <select id="aiuto-prova" name="prova" class="campo" [(ngModel)]="prova">
                <option [ngValue]="null">Su tutto il caso</option>
                @for (p of prove(); track p.id) { <option [ngValue]="p.id">N. {{ p.numero }}{{ p.titolo ? ', ' + p.titolo : '' }}</option> }
              </select>
            </label>
            <label class="etichetta" for="aiuto-domanda">Dove vi siete fermati?
              <textarea id="aiuto-domanda" name="domanda" class="campo" rows="3" maxlength="500" [(ngModel)]="domanda" placeholder="Per esempio: non capiamo a cosa serve la chiave."></textarea>
            </label>
            @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
            <button class="bottone" type="submit" [disabled]="attesa()">Chiedi un aiuto</button>
          </form>
        } @else if (a.attivi) {
          <p class="nota">Avete usato tutti gli aiuti della serata.</p>
        } @else {
          <p class="nota">Gli aiuti ora sono chiusi.</p>
        }
        @if (risposte().length) {
          <ul class="risposte">
            @for (r of risposte(); track r.id) {
              <li [class.rifiutato]="r.stato === 'rifiutato'">
                <small>{{ r.stato === 'rifiutato' ? 'La regia non risponde a questa' : 'Dalla regia' }}{{ r.prova ? ', prova n. ' + r.prova : '' }}{{ r.penalita ? ', costa ' + (r.penalita === 1 ? '1 punto' : r.penalita + ' punti') : '' }}</small>
                @if (r.risposta) { <p class="testo">{{ r.risposta }}</p> }
                @if (r.domanda) { <p class="domanda">Avevate chiesto: {{ r.domanda }}</p> }
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
})
export class AiutiSquadra {
  private api = inject(Api);
  readonly st = inject(StatoSquadraService);
  readonly ora = ora;
  prova: number | null = null;
  domanda = '';
  readonly errore = signal('');
  readonly attesa = signal(false);

  readonly inAttesa = computed(() => this.st.stato()?.aiuti.richieste.find((r) => r.stato === 'attesa') ?? null);
  readonly risposte = computed(() => this.st.stato()?.aiuti.richieste.filter((r) => r.stato !== 'attesa') ?? []);
  readonly rimasti = computed(() => {
    const a = this.st.stato()?.aiuti;
    return a ? Math.max(0, a.max - a.usati) : 0;
  });
  /** Le prove che la squadra vede con un nome o un numero: aperte o sigillate. */
  readonly prove = computed(() => (this.st.stato()?.prove ?? []).map((p) => ({ id: p.id, numero: p.numero, titolo: p.titolo ?? '' })));

  async chiedi() {
    this.errore.set('');
    this.attesa.set(true);
    try {
      await this.api.post('/api/squadra/aiuto', { domanda: this.domanda, prova_id: this.prova });
      this.domanda = '';
      this.prova = null;
      await this.st.aggiorna();
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Richiesta non riuscita. Riprovate.');
    } finally {
      this.attesa.set(false);
    }
  }
}
