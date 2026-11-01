import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sessione } from '../sessione';

/** La testata gialla del marchio Il Movente, per le pagine fuori da una serata. Vedi DESIGN.md, "Il marchio". */
@Component({
  selector: 'app-testata',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; background: var(--accento); color: var(--su-accento); border-bottom: 2px solid var(--su-accento); }
    .barra { max-width: 1440px; margin: 0 auto; min-height: 64px; padding: 10px max(16px, min(3vw, 48px)); display: flex; flex-wrap: wrap; align-items: center; gap: 12px 32px; }
    .marchio { display: flex; align-items: baseline; gap: 10px; color: var(--su-accento); text-decoration: none; }
    .marchio b { background: var(--su-accento); color: var(--accento); font: 400 26px/1 var(--titoli); padding: 7px 12px 5px; border-radius: 2px; }
    /* Limelight resta per il marchio e i titoli: in piccolo la G diventa una C, quindi il sottotitolo è nel carattere del testo. */
    .marchio span { font: 700 16px/1 var(--corpo); }
    .utente { margin-left: auto; display: flex; align-items: center; gap: 14px; font-weight: 600; }
    .esci { min-height: 40px; padding: 0 16px; border-radius: 999px; border: 1.5px solid var(--su-accento); background: transparent; color: var(--su-accento); font: 600 15px/1 var(--corpo); }
    @media (hover: hover) { .esci:hover { background: var(--su-accento); color: var(--accento); } }
    @media (max-width: 480px) {
      .barra { flex-wrap: nowrap; gap: 12px; }
      .marchio span, .utente > span { display: none; }
      .marchio b { font-size: 22px; }
    }
  `,
  template: `
    <div class="barra">
      <a class="marchio" [routerLink]="casa()"><b>Il Movente</b><span>Gialli da tavola</span></a>
      @if (sessione.io(); as io) {
        <div class="utente">
          <span>{{ io.username }}</span>
          <button class="esci" type="button" (click)="sessione.esci()">Esci</button>
        </div>
      }
    </div>
  `,
})
export class Testata {
  readonly sessione = inject(Sessione);
  /** Dove porta il marchio: l'elenco delle serate o l'amministrazione. */
  readonly casa = input('/regia');
}
