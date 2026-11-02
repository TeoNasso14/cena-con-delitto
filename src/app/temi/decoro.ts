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

    /* Vittoriano, Viaggio, Gatsby, Natale: un disegno per tema, che si spegne come gli altri quando il disco fa da quadrante o da anello. */
    .disegno { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity 700ms ease; }
    :host-context([data-scena="conto"]) .disegno, :host-context([data-scena="avanzamento"]) .disegno, :host-context([data-scena="rivelazione"]) .disegno { opacity: 0; }
  `,
  template: `
    @switch (tema()) {
      @case ('vittoriano') {
        <svg class="disegno" viewBox="0 0 1000 1000">
          <!-- Le righe del taccuino si vedono solo sotto la lente: fuori dall'anello resta carta liscia. -->
          <clipPath id="vetro-lente"><circle cx="500" cy="500" r="428"/></clipPath>
          <g clip-path="url(#vetro-lente)">
            <g stroke="var(--decoro)" stroke-width="6" opacity="0.35">
              @for (y of righe; track y) { <path [attr.d]="'M0 ' + y + 'H1000'"/> }
            </g>
            <path d="M210 0V1000" stroke="var(--sigillo)" stroke-width="6" opacity="0.5"/>
          </g>
          <circle cx="500" cy="500" r="472" fill="none" stroke="var(--decoro)" stroke-width="44"/>
          <circle cx="500" cy="500" r="430" fill="none" stroke="var(--decoro)" stroke-width="6" opacity="0.6"/>
          <path d="M260 230A340 340 0 0 1 470 150" fill="none" stroke="var(--carta)" stroke-width="22" stroke-linecap="round" opacity="0.9"/>
        </svg>
      }
      @case ('viaggio') {
        <svg class="disegno" viewBox="0 0 1000 1000">
          <g stroke="var(--su-disco)" stroke-linecap="butt"><path d="M500 60L500 22" stroke-width="16"/><path d="M548 47L550 25" stroke-width="6"/><path d="M595 55L599 32" stroke-width="6"/><path d="M641 67L648 45" stroke-width="6"/><path d="M685 84L694 63" stroke-width="6"/><path d="M720 119L739 86" stroke-width="16"/><path d="M767 132L781 113" stroke-width="6"/><path d="M804 162L820 145" stroke-width="6"/><path d="M838 196L855 180" stroke-width="6"/><path d="M868 233L887 219" stroke-width="6"/><path d="M881 280L914 261" stroke-width="16"/><path d="M916 315L937 306" stroke-width="6"/><path d="M933 359L955 352" stroke-width="6"/><path d="M945 405L968 401" stroke-width="6"/><path d="M953 452L975 450" stroke-width="6"/><path d="M940 500L978 500" stroke-width="16"/><path d="M953 548L975 550" stroke-width="6"/><path d="M945 595L968 599" stroke-width="6"/><path d="M933 641L955 648" stroke-width="6"/><path d="M916 685L937 694" stroke-width="6"/><path d="M881 720L914 739" stroke-width="16"/><path d="M868 767L887 781" stroke-width="6"/><path d="M838 804L855 820" stroke-width="6"/><path d="M804 838L820 855" stroke-width="6"/><path d="M767 868L781 887" stroke-width="6"/><path d="M720 881L739 914" stroke-width="16"/><path d="M685 916L694 937" stroke-width="6"/><path d="M641 933L648 955" stroke-width="6"/><path d="M595 945L599 968" stroke-width="6"/><path d="M548 953L550 975" stroke-width="6"/><path d="M500 940L500 978" stroke-width="16"/><path d="M452 953L450 975" stroke-width="6"/><path d="M405 945L401 968" stroke-width="6"/><path d="M359 933L352 955" stroke-width="6"/><path d="M315 916L306 937" stroke-width="6"/><path d="M280 881L261 914" stroke-width="16"/><path d="M233 868L219 887" stroke-width="6"/><path d="M196 838L180 855" stroke-width="6"/><path d="M162 804L145 820" stroke-width="6"/><path d="M132 767L113 781" stroke-width="6"/><path d="M119 720L86 739" stroke-width="16"/><path d="M84 685L63 694" stroke-width="6"/><path d="M67 641L45 648" stroke-width="6"/><path d="M55 595L32 599" stroke-width="6"/><path d="M47 548L25 550" stroke-width="6"/><path d="M60 500L22 500" stroke-width="16"/><path d="M47 452L25 450" stroke-width="6"/><path d="M55 405L32 401" stroke-width="6"/><path d="M67 359L45 352" stroke-width="6"/><path d="M84 315L63 306" stroke-width="6"/><path d="M119 280L86 261" stroke-width="16"/><path d="M132 233L113 219" stroke-width="6"/><path d="M162 196L145 180" stroke-width="6"/><path d="M196 162L180 145" stroke-width="6"/><path d="M233 132L219 113" stroke-width="6"/><path d="M280 119L261 86" stroke-width="16"/><path d="M315 84L306 63" stroke-width="6"/><path d="M359 67L352 45" stroke-width="6"/><path d="M405 55L401 32" stroke-width="6"/><path d="M452 47L450 25" stroke-width="6"/></g>
          <path d="M500 500L265 414" stroke="var(--su-disco)" stroke-width="30" stroke-linecap="round"/>
          <path d="M500 500L171 690" stroke="var(--su-disco)" stroke-width="18" stroke-linecap="round"/>
          <circle cx="500" cy="500" r="26" fill="var(--accento)" stroke="var(--su-disco)" stroke-width="6"/>
        </svg>
      }
      @case ('gatsby') {
        <svg class="disegno" viewBox="0 0 1000 1000">
          <g stroke="var(--decoro)" stroke-width="10"><path d="M500 1000L1369 767"/><path d="M500 1000L1316 620"/><path d="M500 1000L1237 484"/><path d="M500 1000L1136 364"/><path d="M500 1000L1016 263"/><path d="M500 1000L880 184"/><path d="M500 1000L733 131"/><path d="M500 1000L578 103"/><path d="M500 1000L422 103"/><path d="M500 1000L267 131"/><path d="M500 1000L120 184"/><path d="M500 1000L-16 263"/><path d="M500 1000L-136 364"/><path d="M500 1000L-237 484"/><path d="M500 1000L-316 620"/><path d="M500 1000L-369 767"/></g>
          <g fill="none" stroke="var(--su-disco)" stroke-width="18">
            <path d="M260 1000V900A240 240 0 0 1 740 900V1000"/><path d="M340 1000V930A160 160 0 0 1 660 930V1000"/><path d="M420 1000V960A80 80 0 0 1 580 960V1000"/>
          </g>
        </svg>
      }
      @case ('natale') {
        <svg class="disegno" viewBox="0 0 1000 1000">
          <path d="M0 1000V760L120 660L240 760V700H300V640L420 540L540 640V720L640 620L780 740V690H840V650L1000 560V1000Z" fill="var(--fondo-2)"/>
          <path d="M0 760L120 660L240 760M300 640L420 540L540 640M540 720L640 620L780 740M840 650L1000 560" fill="none" stroke="var(--carta)" stroke-width="22" stroke-linejoin="round"/>
          <g fill="#ffc86b"><rect x="150" y="790" width="40" height="50"/><rect x="390" y="700" width="44" height="56"/><rect x="620" y="760" width="40" height="50"/></g>
          <path d="M700 170l18 52h55l-44 32 17 52-46-32-46 32 17-52-44-32h55z" fill="var(--fondo)"/>
        </svg>
      }
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
  /** Le righe del taccuino viste sotto la lente del Vittoriano. */
  readonly righe = [130, 230, 330, 430, 530, 630, 730, 830];
}
