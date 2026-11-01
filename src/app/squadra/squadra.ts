import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from '../api';
import { Icona } from '../icona';
import { Sessione } from '../sessione';
import { StatoSquadraService } from './stato';
import { Firma } from '../firma';
import { Sussurri } from './sussurri';
import { frasiDaMostrare } from '../temi/catalogo';

@Component({
  selector: 'app-squadra',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icona, Firma, Sussurri],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .app { max-width: 520px; margin: 0 auto; min-height: 100dvh; padding-bottom: calc(84px + env(safe-area-inset-bottom)); }
    .testata { position: sticky; top: 0; z-index: 5; background: var(--fondo); display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: calc(12px + env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 12px max(20px, env(safe-area-inset-left)); border-bottom: 1px solid var(--fondo-3); }
    .squadra { display: flex; align-items: center; gap: 10px; font-weight: 600; min-width: 0; }
    .squadra span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stemma { width: 36px; height: 36px; border-radius: 50%; color: var(--fondo); display: grid; place-items: center; flex: none; }
    .fase { font-size: 14px; color: var(--testo-2); text-align: right; line-height: 1.3; flex: none; }
    .fase strong { display: block; color: var(--testo-1); font-weight: 600; font-size: 15px; }
    .esci { border: 0; background: transparent; color: var(--testo-2); width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; }
    .ferma { margin: 12px 20px 0; }
    .schede { position: fixed; bottom: 0; left: 0; right: 0; z-index: 6; background: var(--fondo); border-top: 1px solid var(--fondo-3); padding-bottom: env(safe-area-inset-bottom); }
    .schede ul { max-width: 520px; margin: 0 auto; padding: 6px 8px; list-style: none; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .schede a { min-height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 13px; font-weight: 500; color: var(--testo-2); text-decoration: none; border-radius: 12px; }
    .schede a.attiva { color: var(--accento); font-weight: 700; }
    @media (hover: hover) { .schede a:hover { color: var(--testo-1); } .esci:hover { color: var(--testo-1); background: var(--fondo-2); } }
  `,
  template: `
    @let s = st.stato();
    <div class="app">
      <header class="testata">
        <div class="squadra">
          <span class="stemma" [style.background]="s?.squadra?.colore ?? 'var(--accento)'"><app-icona nome="corvo" [misura]="20" /></span>
          <span>{{ s?.squadra?.nome ?? 'La tua squadra' }}</span>
        </div>
        <div style="display:flex; align-items:center; gap:6px">
          @if (s && s.fase.numero > 0) {
            <div class="fase">Fase {{ s.fase.numero }} di {{ s.fase.totale }}<strong>{{ s.fase.nome }}</strong></div>
          } @else if (s) {
            <div class="fase">{{ s.serata.stato === 'bozza' ? 'Si comincia presto' : '' }}</div>
          }
          <button class="esci" type="button" aria-label="Esci" (click)="sessione.esci()"><app-icona nome="esci" /></button>
        </div>
      </header>
      @if (s && s.serata.stato === 'in_pausa') { <p class="avviso ferma" role="status">La regia ha messo in pausa la serata. I sigilli si riaprono quando riparte.</p> }
      @if (st.errore() && !s) { <p class="avviso avviso--errore ferma" role="alert">{{ st.errore() }}</p> }
      <router-outlet />
      <app-firma />
    </div>
    <app-sussurri [frasi]="frasi()" [tema]="st.stato()?.tema" />
    <nav class="schede" aria-label="Sezioni">
      <ul>
        <li><a routerLink="/squadra" routerLinkActive="attiva" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page"><app-icona nome="prove" />Prove</a></li>
        <li><a routerLink="/squadra/personaggi" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="volti" />Personaggi</a></li>
        <li><a routerLink="/squadra/taccuino" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="taccuino" />Taccuino</a></li>
        <li><a routerLink="/squadra/accusa" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="accusa" />Accusa</a></li>
      </ul>
    </nav>
  `,
})
export class SquadraShell implements OnInit, OnDestroy {
  readonly st = inject(StatoSquadraService);
  readonly sessione = inject(Sessione);
  private api = inject(Api);
  private router = inject(Router);
  readonly frasi = computed(() => frasiDaMostrare(this.st.stato()?.tema, this.st.stato()?.sussurri));

  constructor() {
    effect(() => {
      if (this.api.sessioneScaduta()) this.router.navigateByUrl(this.sessione.paginaAccesso());
    });
  }
  ngOnInit() { this.st.avvia(); }
  ngOnDestroy() { this.st.arresta(); }
}
