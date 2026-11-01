import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Strato a tutto schermo del proiettore, sopra il disco e sotto i testi. Vuoto per i temi che non ne hanno.
 * Tace a schermo nero e sulle scene con immagini o video, e si ferma con "riduci movimento".
 */
@Component({
  selector: 'app-atmosfera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; transition: opacity 600ms ease;
      /* Per differenza: chiara sul nero, scura sulla luna, così la pioggia si vede anche davanti al disco. */
      mix-blend-mode: difference; }
    :host-context([data-scena="nero"]), :host-context([data-scena="immagine"]), :host-context([data-scena="video"]) { opacity: 0; }

    /* Noir: pioggia sottile in diagonale, due piani a velocità diverse. Ogni piano scorre di una mattonella e ricomincia. */
    .pioggia { position: absolute; left: -20%; top: -30%; width: 140%; height: 160%; transform: rotate(14deg); }
    .piano { position: absolute; left: 0; right: 0; top: 0; animation: cade linear infinite; }
    .piano svg { display: block; width: 100%; height: 100%; }
    .vicino { bottom: -260px; animation-duration: 2.6s; --passo: 260px; opacity: 0.26; }
    .lontano { bottom: -400px; animation-duration: 5.2s; --passo: 400px; opacity: 0.18; }
    @keyframes cade { from { transform: translateY(calc(-1 * var(--passo))); } to { transform: translateY(0); } }

    @media (prefers-reduced-motion: reduce) {
      .piano { animation: none; }
    }
  `,
  template: `
    @switch (tema()) {
      @case ('noir') {
        <div class="pioggia">
          <div class="piano lontano">
            <svg>
              <defs>
                <pattern id="gocce-lontane" width="140" height="400" patternUnits="userSpaceOnUse">
                  <g stroke="var(--testo-1)" stroke-width="1" stroke-linecap="round">
                    <path d="M18 20v46M76 132v38M120 250v52M44 318v34M100 40v30M8 210v40"/>
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gocce-lontane)"/>
            </svg>
          </div>
          <div class="piano vicino">
            <svg>
              <defs>
                <pattern id="gocce-vicine" width="90" height="260" patternUnits="userSpaceOnUse">
                  <g stroke="var(--testo-1)" stroke-width="1.4" stroke-linecap="round">
                    <path d="M12 10v62M58 96v54M34 188v58M80 30v40M70 214v34"/>
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gocce-vicine)"/>
            </svg>
          </div>
        </div>
      }
    }
  `,
})
export class Atmosfera {
  readonly tema = input<string | undefined>();
}
