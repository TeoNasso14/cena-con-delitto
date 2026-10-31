import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from '../api';
import { Icona } from '../icona';
import { Sessione } from '../sessione';
import { RegiaStato } from './stato';
import { Firma } from '../firma';

@Component({
  selector: 'app-regia',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icona, Firma],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-wrap: wrap; min-height: 100dvh; }
    .menu { flex: 0 1 260px; max-width: 100%; padding: 24px 16px; border-right: 1px solid var(--notte-3); display: flex; flex-direction: column; gap: 2px; }
    .marchio { font-family: var(--gotico); font-size: 30px; padding: 0 12px 20px; line-height: 1; }
    .menu a, .menu button { min-height: 44px; display: flex; align-items: center; gap: 12px; padding: 0 12px; border-radius: 10px; color: var(--osso-2);
      text-decoration: none; font-weight: 500; border: 0; background: transparent; font-size: 16px; text-align: left; white-space: nowrap; }
    .menu a.attiva { background: var(--notte-2); color: var(--osso); font-weight: 600; }
    .menu a.attiva app-icona { color: var(--zucca); }
    .menu .fondo { margin-top: auto; padding-top: 16px; }
    @media (hover: hover) { .menu a:hover, .menu button:hover { color: var(--osso); background: var(--notte-2); } }
    .centro { flex: 999 1 640px; min-width: 0; padding: 28px max(16px, min(3vw, 40px)) 64px; }
    .avviso-regia { position: fixed; z-index: 30; left: 50%; bottom: calc(20px + env(safe-area-inset-bottom)); transform: translateX(-50%); max-width: min(560px, calc(100vw - 32px));
      padding: 12px 18px; border-radius: 12px; background: var(--osso); color: var(--notte); font-weight: 600; animation: sale 300ms var(--curva-cassetto); }
    .avviso-regia.errore { background: var(--sangue); color: var(--notte); }
    @keyframes sale { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @media (max-width: 899px) {
      .menu { flex: 1 1 100%; flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--notte-3); padding: 12px 12px; gap: 4px;
        padding-left: max(12px, env(safe-area-inset-left)); padding-right: max(12px, env(safe-area-inset-right)); }
      .marchio { font-size: 24px; padding: 8px 8px 0 4px; }
      .menu .fondo { margin: 0; padding: 0; }
    }
  `,
  template: `
    <nav class="menu" aria-label="Regia">
      <span class="marchio">Regia</span>
      <a routerLink="/regia" routerLinkActive="attiva" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page"><app-icona nome="onda" />In diretta</a>
      <a routerLink="/regia/scene" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="scene" />Scene del proiettore</a>
      <a routerLink="/regia/caso" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="caso" />Il caso e le fasi</a>
      <a routerLink="/regia/personaggi" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="volti" />Personaggi</a>
      <a routerLink="/regia/prove" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="prove" />Prove e codici</a>
      <a routerLink="/regia/squadre" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="squadre" />Squadre e accessi</a>
      <a routerLink="/regia/accuse" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="accusa" />Accuse e verdetto</a>
      <a routerLink="/regia/strumenti" routerLinkActive="attiva" ariaCurrentWhenActive="page"><app-icona nome="strumenti" />Strumenti</a>
      <div class="fondo"><button type="button" (click)="sessione.esci()"><app-icona nome="esci" />Esci</button></div>
    </nav>
    <main class="centro">
      @if (st.t()) { <router-outlet /> } @else { <p class="secondario" role="status">Apro la regia…</p> }
      <app-firma />
    </main>
    @if (st.avviso(); as a) {
      <p class="avviso-regia" [class.errore]="a.errore" role="status">{{ a.testo }}</p>
    }
  `,
})
export class RegiaShell implements OnInit, OnDestroy {
  readonly st = inject(RegiaStato);
  readonly sessione = inject(Sessione);
  private api = inject(Api);
  private router = inject(Router);
  constructor() {
    effect(() => {
      if (this.api.sessioneScaduta()) this.router.navigateByUrl('/accesso');
    });
  }
  ngOnInit() { this.st.avvia(); }
  ngOnDestroy() { this.st.arresta(); }
}
