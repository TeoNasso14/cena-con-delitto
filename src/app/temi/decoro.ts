import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Il disegno dentro il disco del proiettore. Il disco, con i suoi movimenti da una scena all'altra,
 * resta in schermo.css; qui c'è solo ciò che cambia col tema. Un tema sconosciuto vale Halloween.
 */
@Component({
  selector: 'app-decoro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host { position: absolute; inset: 0; display: block; }

    /* Halloween: crateri e un ramo con due pipistrelli. */
    .cratere { position: absolute; background: var(--decoro); border-radius: 47% 53% 41% 59% / 55% 44% 56% 45%; transition: opacity 600ms ease; }
    .cratere:nth-child(1) { width: 19%; height: 14%; left: 20%; top: 26%; transform: rotate(-12deg); }
    .cratere:nth-child(2) { width: 7%; height: 9%; left: 56%; top: 16%; }
    .cratere:nth-child(3) { width: 27%; height: 19%; left: 30%; top: 58%; transform: rotate(18deg); }
    .cratere:nth-child(4) { width: 11%; height: 7%; left: 62%; top: 40%; transform: rotate(-30deg); }
    .ramo { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity 700ms ease; }
    :host-context([data-scena="rivelazione"]) .cratere,
    :host-context([data-scena="conto"]) .ramo, :host-context([data-scena="avanzamento"]) .ramo, :host-context([data-scena="rivelazione"]) .ramo { opacity: 0; }

    /* Noir: la luna vista attraverso una veneziana, lamelle scure appena inclinate e il cordino. */
    .veneziana { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity 700ms ease; }
    :host-context([data-scena="conto"]) .veneziana, :host-context([data-scena="avanzamento"]) .veneziana, :host-context([data-scena="rivelazione"]) .veneziana { opacity: 0; }
  `,
  template: `
    @switch (tema()) {
      @case ('noir') {
        <svg class="veneziana" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <g fill="var(--fondo)" transform="rotate(-6 500 500)">
            @for (y of lamelle; track y) { <rect x="-200" [attr.y]="y" width="1400" height="32"/> }
          </g>
          <path d="M640 -20V1020" stroke="var(--fondo)" stroke-width="7"/>
        </svg>
      }
      @default {
        <i class="cratere"></i><i class="cratere"></i><i class="cratere"></i><i class="cratere"></i>
        <svg class="ramo" viewBox="0 0 1000 1000">
          <g fill="none" stroke="var(--fondo)" stroke-linecap="round" stroke-linejoin="round">
            <path stroke-width="58" d="M1060 820C930 790 840 735 760 700S600 650 470 668"/>
            <path stroke-width="34" d="M470 668C400 676 330 660 250 690S120 740 40 735"/>
            <path stroke-width="26" d="M760 700C735 640 742 585 790 520S840 430 830 360"/>
            <path stroke-width="16" d="M830 360C820 300 850 250 900 205"/>
            <path stroke-width="12" d="M800 505C760 470 700 462 650 430"/>
            <path stroke-width="18" d="M600 664C580 610 540 585 520 535S505 455 470 410"/>
            <path stroke-width="9" d="M520 535C480 530 450 508 420 470"/>
            <path stroke-width="14" d="M330 664C320 615 285 590 270 545"/>
            <path stroke-width="8" d="M270 545C255 512 260 480 285 450"/>
            <path stroke-width="8" d="M250 690C210 665 165 668 130 640"/>
            <path stroke-width="6" d="M900 205C915 180 940 168 965 165M650 430C630 400 600 392 575 395M285 450C300 425 300 400 290 380"/>
          </g>
          <g fill="var(--fondo)">
            <path d="M600 662c-6-30 6-58 32-72 18-10 36-8 50-2 8-16 24-24 40-20l26 2-24 9c6 16 2 34-12 48-14 14-34 22-54 26l-38 16-26 26c-4-10 0-20 6-33Z"/>
            <path d="M262 690c-4-22 6-42 26-52 14-7 27-5 38 0 6-12 18-18 30-15l20 2-18 7c4 12 1 25-9 36-11 10-26 16-41 19l-28 12-20 20c-3-8 0-16 2-29Z"/>
          </g>
        </svg>
      }
    }
  `,
})
export class Decoro {
  readonly tema = input<string | undefined>();
  /** Le lamelle della veneziana: fitte in alto, un po' più larghe verso il basso. */
  readonly lamelle = [-40, 50, 142, 236, 332, 430, 530, 632, 736, 842, 950];
}
