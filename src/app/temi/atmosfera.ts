import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Strato a tutto schermo del proiettore, sopra il disco e sotto i testi. Vuoto per i temi che non ne hanno.
 * Tace a schermo nero e sulle scene con immagini o video, e si ferma con "riduci movimento".
 */
@Component({
  selector: 'app-atmosfera',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.differenza]': "tema() === 'noir'" },
  styles: `
    :host { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; transition: opacity 600ms ease; }
    /* Noir: per differenza la pioggia è chiara sul nero e scura sulla luna, così si vede anche davanti al disco.
       La neve del Natale no: sulla luna diventerebbe una macchia scura, quindi lì sparisce come nella realtà. */
    :host(.differenza) { mix-blend-mode: difference; }
    :host-context([data-scena="nero"]), :host-context([data-scena="immagine"]), :host-context([data-scena="video"]) { opacity: 0; }

    /* Noir: pioggia sottile in diagonale, due piani a velocità diverse. Ogni piano scorre di una mattonella e ricomincia. */
    .pioggia { position: absolute; left: -20%; top: -30%; width: 140%; height: 160%; transform: rotate(14deg); }
    .piano { position: absolute; left: 0; right: 0; top: 0; animation: cade linear infinite; }
    .piano svg { display: block; width: 100%; height: 100%; }
    .vicino { bottom: -260px; animation-duration: 2.6s; --passo: 260px; opacity: 0.26; }
    .lontano { bottom: -400px; animation-duration: 5.2s; --passo: 400px; opacity: 0.18; }
    @keyframes cade { from { transform: translateY(calc(-1 * var(--passo))); } to { transform: translateY(0); } }

    /* Viaggio: luci basse che scorrono come dal finestrino del treno. */
    /* Solo a sinistra del disco e sopra la riga delle fasi: le luci di fuori non attraversano l'orologio. */
    .luci { position: absolute; left: 0; right: 42vw; bottom: 13vh; height: 9vh; overflow: hidden; opacity: 0.35; }
    .nastro { position: absolute; top: 0; bottom: 0; left: 0; right: -480px; animation: scorre 7s linear infinite; }
    .nastro svg { display: block; width: 100%; height: 100%; }
    /* Quando il disco fa da quadrante (conto alla rovescia, squadre a confronto, rivelazione) le luci si spengono. */
    :host-context([data-scena="conto"]) .luci, :host-context([data-scena="avanzamento"]) .luci, :host-context([data-scena="rivelazione"]) .luci { opacity: 0; transition: opacity 600ms ease; }
    @keyframes scorre { from { transform: translateX(0); } to { transform: translateX(-480px); } }
    /* Gatsby: poche volute irregolari che salgono e svaniscono, lontane dalla colonna del testo. */
    .voluta { position: absolute; bottom: -10vh; width: 7vw; height: 70vh; animation: voluta ease-out infinite; opacity: 0; }
    .voluta svg { display: block; width: 100%; height: 100%; overflow: visible; }
    .voluta--1 { left: 62vw; animation-duration: 17s; animation-delay: 0s; --forza: 0.22; }
    .voluta--2 { left: 70vw; animation-duration: 23s; animation-delay: -8s; --forza: 0.14; }
    .voluta--3 { left: 93vw; animation-duration: 19s; animation-delay: -13s; --forza: 0.18; }
    .voluta--4 { left: 3vw; animation-duration: 26s; animation-delay: -4s; --forza: 0.12; }
    @keyframes voluta { 0% { opacity: 0; transform: translateY(0); } 20% { opacity: var(--forza); } 100% { opacity: 0; transform: translateY(-35vh); } }
    /* Natale: neve che cade piano, due piani, chiusa sopra la riga delle fasi. */
    .cielo { position: absolute; inset: 0 0 12vh 0; overflow: hidden; }
    .neve { position: absolute; left: -10%; right: -10%; top: 0; animation: cade linear infinite; }
    .neve svg { display: block; width: 100%; height: 100%; }
    .neve--vicina { bottom: -1000px; --passo: 1000px; animation-duration: 38s; opacity: 0.6; }
    .neve--lontana { bottom: -900px; --passo: 900px; animation-duration: 60s; opacity: 0.35; }

    @media (prefers-reduced-motion: reduce) {
      .piano, .nastro, .neve { animation: none; }
      .voluta { animation: none; opacity: calc(var(--forza) * 0.6); }
    }
  `,
  template: `
    @switch (tema()) {
      @case ('viaggio') {
        <div class="luci">
          <div class="nastro">
            <svg>
              <defs>
                <pattern id="luci-finestrino" width="480" height="200" patternUnits="userSpaceOnUse">
                  <g stroke="var(--accento)" stroke-linecap="round">
                    <path d="M20 60h70M180 120h40M300 40h110M250 170h60" stroke-width="6"/>
                    <path d="M120 150h30M420 100h40" stroke-width="3"/>
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#luci-finestrino)"/>
            </svg>
          </div>
        </div>
      }
      @case ('gatsby') {
        <div class="voluta voluta--1"><svg viewBox="0 0 100 700" preserveAspectRatio="none"><path d="M40 700c-30-80 40-120 10-200s30-140 0-230" fill="none" stroke="var(--testo-1)" stroke-width="2.4" stroke-linecap="round"/></svg></div>
        <div class="voluta voluta--2"><svg viewBox="0 0 100 700" preserveAspectRatio="none"><path d="M30 700c25-90-35-130-5-210s-25-120 5-220" fill="none" stroke="var(--testo-1)" stroke-width="2.4" stroke-linecap="round"/></svg></div>
        <div class="voluta voluta--3"><svg viewBox="0 0 100 700" preserveAspectRatio="none"><path d="M50 700c-35-60 30-150 0-220s35-110 5-240" fill="none" stroke="var(--testo-1)" stroke-width="2.4" stroke-linecap="round"/></svg></div>
        <div class="voluta voluta--4"><svg viewBox="0 0 100 700" preserveAspectRatio="none"><path d="M30 700c20-70-30-140 0-210s-20-130 10-230" fill="none" stroke="var(--testo-1)" stroke-width="2.4" stroke-linecap="round"/></svg></div>
      }
      @case ('natale') {
        <div class="cielo">
          <div class="neve neve--lontana">
            <svg>
              <defs>
                <pattern id="neve-lontana" width="1100" height="900" patternUnits="userSpaceOnUse">
                  <g fill="#ffffff"><circle cx="926" cy="886" r="2.0"/><circle cx="953" cy="462" r="1.9"/><circle cx="388" cy="189" r="2.3"/><circle cx="974" cy="644" r="2.1"/><circle cx="381" cy="96" r="1.8"/><circle cx="290" cy="92" r="2.0"/><circle cx="85" cy="609" r="2.6"/><circle cx="927" cy="669" r="2.2"/><circle cx="322" cy="638" r="1.2"/><circle cx="1082" cy="64" r="1.3"/><circle cx="389" cy="900" r="1.5"/><circle cx="61" cy="796" r="1.8"/><circle cx="902" cy="605" r="2.4"/><circle cx="1063" cy="239" r="2.1"/><circle cx="1023" cy="4" r="2.1"/><circle cx="936" cy="670" r="1.6"/><circle cx="170" cy="724" r="1.6"/><circle cx="470" cy="525" r="1.6"/><circle cx="143" cy="576" r="2.3"/><circle cx="820" cy="110" r="2.4"/><circle cx="791" cy="68" r="2.5"/><circle cx="1" cy="218" r="1.5"/><circle cx="107" cy="481" r="1.7"/><circle cx="813" cy="429" r="1.3"/><circle cx="406" cy="797" r="2.1"/><circle cx="689" cy="89" r="1.6"/><circle cx="31" cy="419" r="2.3"/><circle cx="241" cy="137" r="1.5"/><circle cx="206" cy="11" r="1.3"/><circle cx="997" cy="181" r="2.2"/><circle cx="385" cy="458" r="1.9"/><circle cx="268" cy="429" r="2.1"/><circle cx="238" cy="404" r="1.8"/><circle cx="435" cy="0" r="1.6"/></g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#neve-lontana)"/>
            </svg>
          </div>
          <div class="neve neve--vicina">
            <svg>
              <defs>
                <pattern id="neve-vicina" width="1300" height="1000" patternUnits="userSpaceOnUse">
                  <g fill="#ffffff"><circle cx="1213" cy="311" r="5.0"/><circle cx="40" cy="215" r="3.0"/><circle cx="1232" cy="657" r="4.0"/><circle cx="86" cy="149" r="3.1"/><circle cx="528" cy="9" r="4.5"/><circle cx="673" cy="850" r="3.3"/><circle cx="150" cy="76" r="2.8"/><circle cx="1193" cy="651" r="3.2"/><circle cx="1231" cy="377" r="3.5"/><circle cx="928" cy="130" r="4.9"/><circle cx="990" cy="852" r="4.0"/><circle cx="790" cy="187" r="4.1"/><circle cx="636" cy="930" r="3.1"/><circle cx="1250" cy="255" r="4.3"/><circle cx="324" cy="757" r="4.1"/><circle cx="1134" cy="201" r="4.2"/><circle cx="795" cy="903" r="3.8"/><circle cx="160" cy="431" r="2.7"/></g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#neve-vicina)"/>
            </svg>
          </div>
        </div>
      }
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
