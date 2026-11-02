import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Api, ErroreApi } from '../api';
import { StatoSquadraService } from './stato';

/** Votazioni aperte dalla regia: un voto per telefono e per premio, si può cambiare finché il voto è aperto. */
@Component({
  selector: 'app-voti',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    section { margin: 24px 20px 0; padding: 16px; border-radius: 14px; background: var(--fondo-2); display: grid; gap: 12px; }
    h2 { font-family: var(--titoli); font-size: 26px; line-height: 1.05; }
    .nota { color: var(--testo-2); font-size: 15px; }
    .scelte { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
    .scelte button { min-height: 48px; padding: 8px 12px; border-radius: 2px; border: 1px solid var(--filetto); background: var(--fondo); color: var(--testo-1);
      font: inherit; font-weight: 600; text-align: left; display: flex; align-items: center; gap: 8px; }
    .scelte button[aria-pressed="true"] { border-color: var(--accento); background: var(--accento); color: var(--su-accento); }
    .pallino { width: 10px; height: 10px; border-radius: 50%; flex: none; }
  `,
  template: `
    @for (p of st.stato()?.premi ?? []; track p.id) {
      <section [attr.aria-labelledby]="'premio-' + p.id">
        <h2 [id]="'premio-' + p.id">{{ p.nome }}</h2>
        <p class="nota">{{ p.mio ? 'Hai votato. Puoi cambiare idea finché la regia non chiude il voto.' : 'Si vota! Un voto da questo telefono.' }}</p>
        <div class="scelte" role="group" [attr.aria-label]="'Candidati per ' + p.nome">
          @for (c of p.candidati; track c.id) {
            <button type="button" [attr.aria-pressed]="p.mio === c.id" [disabled]="attesa()" (click)="vota(p.id, c.id)">
              @if (c.colore) { <i class="pallino" [style.background]="c.colore" aria-hidden="true"></i> }{{ c.nome }}
            </button>
          }
        </div>
        @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
      </section>
    }
  `,
})
export class VotiSquadra {
  private api = inject(Api);
  readonly st = inject(StatoSquadraService);
  readonly attesa = signal(false);
  readonly errore = signal('');

  async vota(premio_id: number, candidato: number) {
    this.errore.set('');
    this.attesa.set(true);
    try {
      await this.api.post('/api/squadra/voto', { premio_id, candidato });
      await this.st.aggiorna();
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Voto non riuscito. Riprova.');
    } finally {
      this.attesa.set(false);
    }
  }
}
