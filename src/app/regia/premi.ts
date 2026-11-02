import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../api';
import { PremioR, RegiaStato } from './stato';

const TRA: Record<PremioR['tipo'], string> = { invitati: 'tra gli invitati', personaggi: 'tra i personaggi', squadre: 'tra le squadre' };
const STATO: Record<PremioR['stato'], string> = { preparato: 'Pronto', aperto: 'Si vota', chiuso: 'Voto chiuso', rivelato: 'Rivelato' };

/** Votazioni e premi. Completo in Accuse e verdetto; in diretta (compatto) solo i comandi dei premi già preparati. */
@Component({
  selector: 'app-premi',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .premio { display: grid; gap: 10px; }
    .testa { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 6px 12px; }
    .testa h3 { font-size: 18px; }
    .testa small { color: var(--testo-2); font-size: 14px; }
    .voti { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
    .voti li { display: grid; grid-template-columns: minmax(0, 160px) minmax(0, 1fr) 32px; gap: 10px; align-items: center; font-size: 15px; }
    .voti .barra { height: 8px; border-radius: 4px; background: var(--fondo-3); overflow: hidden; }
    .voti .barra i { display: block; height: 100%; background: var(--accento); transform-origin: left; }
    .voti b { text-align: right; font-variant-numeric: tabular-nums; }
    .nome-c { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .riga-nuovo { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
    .riga-nuovo .etichetta { flex: 1 1 200px; }
  `,
  template: `
    @let t = st.t()!;
    <section class="r-blocco" aria-labelledby="t-premi">
      <h2 id="t-premi">Premi</h2>
      @if (!compatto()) {
        <form class="r-scheda riga-nuovo" (ngSubmit)="crea()">
          <label class="etichetta" for="pr-nome">Nuovo premio <small>Per esempio: Miglior attore, Costume più bello.</small>
            <input id="pr-nome" name="pr-nome" class="campo" maxlength="80" [(ngModel)]="nome">
          </label>
          <label class="etichetta" for="pr-tra">Si vota
            <select id="pr-tra" name="pr-tra" class="campo" [(ngModel)]="tra">
              <option value="invitati">tra gli invitati</option><option value="personaggi">tra i personaggi</option><option value="squadre">tra le squadre</option>
            </select>
          </label>
          <button class="bottone" type="submit" [disabled]="!nome.trim()">Aggiungi</button>
        </form>
      }
      @for (p of visibili(); track p.id) {
        <div class="r-scheda premio">
          <div class="testa"><h3>{{ p.nome }}</h3><small>{{ etichettaTra(p) }}. {{ stato(p) }}{{ p.votanti ? ', ' + (p.votanti === 1 ? '1 voto' : p.votanti + ' voti') : '' }}</small></div>
          @if (!p.candidati.length) {
            <p class="secondario">Nessun candidato: {{ p.tipo === 'squadre' ? 'crea le squadre' : p.tipo === 'personaggi' ? 'aggiungi i personaggi' : 'aggiungi gli invitati' }}.</p>
          } @else if (p.stato !== 'preparato') {
            <ul class="voti">
              @for (c of p.candidati; track c.id) {
                <li><span class="nome-c">{{ c.nome }}</span><span class="barra"><i [style.transform]="'scaleX(' + quota(p, c.voti) + ')'"></i></span><b>{{ c.voti }}</b></li>
              }
            </ul>
          }
          <div class="r-azioni">
            @switch (p.stato) {
              @case ('preparato') { <button class="bottone bottone--pieno" type="button" [disabled]="!p.candidati.length" (click)="cambia(p, 'aperto')">Apri il voto</button> }
              @case ('aperto') { <button class="bottone bottone--pieno" type="button" (click)="cambia(p, 'chiuso')">Chiudi il voto</button> }
              @case ('chiuso') {
                <button class="bottone bottone--pieno" type="button" (click)="cambia(p, 'rivelato')">Rivela sul proiettore</button>
                <button class="bottone" type="button" (click)="cambia(p, 'aperto')">Riapri il voto</button>
              }
              @case ('rivelato') { <button class="bottone" type="button" (click)="cambia(p, 'chiuso')">Togli dal proiettore</button> }
            }
            @if (!compatto() && p.stato === 'preparato') { <button class="bottone bottone--pericolo" type="button" (click)="elimina(p)">Elimina</button> }
          </div>
        </div>
      } @empty {
        @if (compatto()) {
          <p class="r-vuoto">Nessun premio. <a [routerLink]="st.base() + '/accuse'">Preparali in Accuse e verdetto</a>.</p>
        } @else {
          <p class="r-vuoto">Nessun premio. Ogni telefono vota una volta per premio; il vincitore va sul proiettore con la scena "Premi".</p>
        }
      }
      @if (!compatto() && t.premi.length && !haScena()) {
        <p class="secondario">Per mostrare i vincitori sul proiettore serve una scena "Premi": <a [routerLink]="st.base() + '/scene'">aggiungila in Scene del proiettore</a>.</p>
      }
    </section>
  `,
})
export class PremiRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly compatto = input(false);
  nome = '';
  tra: PremioR['tipo'] = 'invitati';
  readonly visibili = computed(() => this.st.t()?.premi ?? []);
  readonly haScena = computed(() => !!this.st.t()?.scene.some((s) => s.tipo === 'premi'));
  etichettaTra(p: PremioR) { return TRA[p.tipo].charAt(0).toUpperCase() + TRA[p.tipo].slice(1); }
  stato(p: PremioR) { return STATO[p.stato]; }
  quota(p: PremioR, v: number) { return p.votanti ? v / Math.max(...p.candidati.map((c) => c.voti), 1) : 0; }
  async crea() {
    const ok = await this.st.fai(() => this.api.post('/api/regia/premi', { nome: this.nome, candidati: this.tra }), 'Premio aggiunto');
    if (ok) this.nome = '';
  }
  cambia(p: PremioR, stato: PremioR['stato']) {
    const detto = { preparato: 'Premio pronto', aperto: 'Voto aperto sui telefoni', chiuso: 'Voto chiuso', rivelato: 'Vincitore sul proiettore' }[stato];
    this.st.fai(() => this.api.put(`/api/regia/premi/${p.id}`, { stato }), detto);
  }
  elimina(p: PremioR) { this.st.fai(() => this.api.del(`/api/regia/premi/${p.id}`), 'Premio eliminato'); }
}
