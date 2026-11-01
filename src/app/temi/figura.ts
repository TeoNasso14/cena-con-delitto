import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Figura as NomeFigura } from './catalogo';

/** Piccole figure animate (disegnate qui, nessun file esterno) che "parlano" dalle nuvolette. Ogni tema ne usa sei. */
@Component({
  selector: 'app-figura',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host { display: block; }
    svg { width: 100%; height: 100%; overflow: visible; }

    /* fantasma */
    .fantasma { animation: fluttua 2.4s ease-in-out infinite; transform-origin: 50% 50%; }
    @keyframes fluttua { 0%, 100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-6px) rotate(3deg); } }
    /* pipistrello */
    .ala { transform-box: fill-box; animation: sbatti 0.32s ease-in-out infinite alternate; }
    .ala.sx { transform-origin: 100% 40%; }
    .ala.dx { transform-origin: 0% 40%; }
    @keyframes sbatti { from { transform: scaleY(1); } to { transform: scaleY(0.35); } }
    .volo { animation: plana 1.6s ease-in-out infinite; }
    @keyframes plana { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(4px, -5px); } }
    /* ragno */
    .ragno { animation: scende 2.2s ease-in-out infinite; }
    @keyframes scende { 0%, 100% { transform: translateY(-8px); } 50% { transform: translateY(4px); } }
    .zampe { transform-box: fill-box; transform-origin: 50% 50%; animation: zampetta 0.5s steps(2) infinite; }
    @keyframes zampetta { to { transform: scaleX(0.88); } }
    /* zucca */
    .bagliore { animation: guizza 1.1s steps(1) infinite; }
    @keyframes guizza { 0%, 100% { opacity: 1; } 30% { opacity: 0.55; } 45% { opacity: 1; } 70% { opacity: 0.8; } }
    .zucca { transform-box: fill-box; transform-origin: 50% 100%; animation: dondola 1.8s ease-in-out infinite; }
    @keyframes dondola { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
    /* occhi */
    .palpebra { transform-box: fill-box; transform-origin: 50% 50%; animation: batti 3.2s infinite; }
    .palpebra.due { animation-delay: 0.9s; }
    @keyframes batti { 0%, 44%, 52%, 100% { transform: scaleY(1); } 48% { transform: scaleY(0.08); } }
    .sguardo { animation: guarda 3.2s ease-in-out infinite; }
    @keyframes guarda { 0%, 100% { transform: translateX(0); } 30% { transform: translateX(-1.5px); } 70% { transform: translateX(1.5px); } }
    /* candela */
    .fiamma { transform-box: fill-box; transform-origin: 50% 100%; animation: fiamma 0.6s ease-in-out infinite alternate; }
    @keyframes fiamma { from { transform: scale(1, 1) rotate(-3deg); } to { transform: scale(0.85, 1.12) rotate(3deg); } }

    /* cappello */
    .cappello { transform-box: fill-box; transform-origin: 50% 100%; animation: saluta 3s ease-in-out infinite; }
    @keyframes saluta { 0%, 70%, 100% { transform: rotate(0); } 80% { transform: translateY(-3px) rotate(-8deg); } 90% { transform: rotate(0); } }
    /* sigaretta */
    .fumo { animation: fumo 2.8s ease-out infinite; }
    .fumo.due { animation-delay: 1.4s; }
    @keyframes fumo { from { opacity: 0.8; transform: translateY(0); } to { opacity: 0; transform: translate(4px, -10px); } }
    .brace { animation: brace 1.6s ease-in-out infinite; }
    @keyframes brace { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
    /* macchina da scrivere */
    .foglio-macchina { animation: batte 1.2s steps(4) infinite; }
    @keyframes batte { from { transform: translateX(3px); } to { transform: translateX(-3px); } }
    .martelletto { transform-box: fill-box; transform-origin: 50% 100%; animation: colpo 0.3s ease-in-out infinite alternate; }
    @keyframes colpo { from { transform: rotate(0); } to { transform: rotate(-30deg); } }
    /* bicchiere */
    .liquido { transform-box: fill-box; transform-origin: 50% 100%; animation: ondeggia 2.2s ease-in-out infinite; }
    @keyframes ondeggia { 0%, 100% { transform: skewY(-4deg); } 50% { transform: skewY(4deg); } }
    /* lampione */
    .luce { opacity: 0.28; animation: tremola 2.4s steps(1) infinite; }
    @keyframes tremola { 0%, 100% { opacity: 0.28; } 40% { opacity: 0.12; } 46% { opacity: 0.28; } 72% { opacity: 0.2; } }
    /* impronta */
    .impronta { stroke-dasharray: 60; animation: rileva 3.2s ease-in-out infinite; }
    @keyframes rileva { 0% { stroke-dashoffset: 60; } 50%, 100% { stroke-dashoffset: 0; } }

    @media (prefers-reduced-motion: reduce) {
      svg * { animation: none !important; }
      .impronta { stroke-dasharray: none; }
    }
  `,
  template: `
    @switch (nome()) {
      @case ('fantasma') {
        <svg viewBox="0 0 56 56"><g class="fantasma">
          <path d="M14 46V24a14 14 0 0 1 28 0v22l-4.7-4-4.6 4-4.7-4-4.6 4-4.7-4z" fill="var(--testo-1)"/>
          <ellipse cx="23" cy="24" rx="2.6" ry="3.6" fill="var(--fondo)"/><ellipse cx="33" cy="24" rx="2.6" ry="3.6" fill="var(--fondo)"/>
          <ellipse cx="28" cy="33" rx="3" ry="2.2" fill="var(--fondo)"/>
        </g></svg>
      }
      @case ('pipistrello') {
        <svg viewBox="0 0 56 56"><g class="volo">
          <path class="ala sx" d="M24 28c-4-6-10-7-18-4 4 2 5 6 4 9 3-2 6-2 8 1 1-3 3-5 6-6z" fill="var(--testo-2)"/>
          <path class="ala dx" d="M32 28c4-6 10-7 18-4-4 2-5 6-4 9-3-2-6-2-8 1-1-3-3-5-6-6z" fill="var(--testo-2)"/>
          <ellipse cx="28" cy="30" rx="5" ry="7" fill="var(--testo-2)"/>
          <path d="M24 24l1.5-5 2 4M32 24l-1.5-5-2 4" fill="var(--testo-2)"/>
          <circle cx="26" cy="27" r="1.2" fill="var(--accento)"/><circle cx="30" cy="27" r="1.2" fill="var(--accento)"/>
        </g></svg>
      }
      @case ('ragno') {
        <svg viewBox="0 0 56 56"><g class="ragno">
          <line x1="28" y1="-30" x2="28" y2="22" stroke="var(--testo-2)" stroke-width="1"/>
          <g class="zampe" stroke="var(--testo-2)" stroke-width="2" fill="none" stroke-linecap="round">
            <path d="M23 28l-8-5-3 3M23 31l-9 0-3 4M23 34l-8 4-2 5M33 28l8-5 3 3M33 31l9 0 3 4M33 34l8 4 2 5"/>
          </g>
          <ellipse cx="28" cy="31" rx="7" ry="8" fill="var(--testo-2)"/>
          <circle cx="25.5" cy="29" r="1.6" fill="var(--allarme)"/><circle cx="30.5" cy="29" r="1.6" fill="var(--allarme)"/>
        </g></svg>
      }
      @case ('zucca') {
        <svg viewBox="0 0 56 56"><g class="zucca">
          <path d="M28 14c1-4 4-6 7-6" stroke="#6b8f3a" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse cx="20" cy="32" rx="11" ry="15" fill="var(--accento)"/><ellipse cx="36" cy="32" rx="11" ry="15" fill="var(--accento)"/>
          <ellipse cx="28" cy="32" rx="10" ry="16" fill="var(--accento-chiaro)"/>
          <g class="bagliore" fill="#ffe08a">
            <path d="M18 27l5 4h-6zM38 27l-5 4h6z"/>
            <path d="M17 37q11 8 22 0l-3 1-2 3-3-2-3 2-3-2-3 2-2-3z"/>
          </g>
        </g></svg>
      }
      @case ('occhi') {
        <svg viewBox="0 0 56 56">
          <circle cx="28" cy="30" r="24" fill="var(--fondo-3)"/>
          <g class="sguardo">
            <g class="palpebra"><ellipse cx="18" cy="26" rx="5" ry="3.4" fill="#ffe08a"/><circle cx="18.5" cy="26" r="1.6" fill="var(--fondo)"/>
              <ellipse cx="29" cy="26" rx="5" ry="3.4" fill="#ffe08a"/><circle cx="29.5" cy="26" r="1.6" fill="var(--fondo)"/></g>
            <g class="palpebra due"><ellipse cx="36" cy="38" rx="3.6" ry="2.4" fill="var(--allarme)"/><ellipse cx="44" cy="38" rx="3.6" ry="2.4" fill="var(--allarme)"/></g>
          </g>
        </svg>
      }
      @case ('candela') {
        <svg viewBox="0 0 56 56">
          <ellipse cx="28" cy="20" rx="9" ry="11" fill="var(--accento)" opacity="0.18" class="fiamma"/>
          <path class="fiamma" d="M28 9c4 5 5 8 5 11a5 5 0 0 1-10 0c0-3 1-6 5-11z" fill="var(--accento)"/>
          <path class="fiamma" d="M28 15c2 3 2.5 4.5 2.5 6a2.5 2.5 0 0 1-5 0c0-1.5.5-3 2.5-6z" fill="#ffe08a"/>
          <rect x="22" y="27" width="12" height="22" rx="2" fill="var(--testo-1)"/>
          <path d="M22 30q3 4 2 9" stroke="var(--testo-2)" stroke-width="2" fill="none"/>
          <rect x="17" y="48" width="22" height="4" rx="2" fill="var(--testo-2)"/>
        </svg>
      }
      @case ('cappello') {
        <svg viewBox="0 0 56 56"><g class="cappello">
          <path d="M17 34c0-8 2-15 5-18 2-2 4-1 6 1 2-2 4-3 6-1 3 3 5 10 5 18z" fill="var(--testo-2)"/>
          <path d="M17 31h22v4H17z" fill="var(--fondo)"/>
          <ellipse cx="28" cy="36" rx="20" ry="4.5" fill="var(--testo-2)"/>
        </g></svg>
      }
      @case ('sigaretta') {
        <svg viewBox="0 0 56 56">
          <path class="fumo" d="M42 30c-3-4 3-7 0-11" stroke="var(--testo-2)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path class="fumo due" d="M45 28c-3-4 3-7 0-11" stroke="var(--testo-2)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <rect x="8" y="33" width="28" height="6" rx="1" fill="var(--testo-1)"/>
          <rect x="8" y="33" width="9" height="6" rx="1" fill="var(--testo-2)"/>
          <rect class="brace" x="36" y="33" width="5" height="6" rx="1" fill="var(--accento)"/>
        </svg>
      }
      @case ('macchina') {
        <svg viewBox="0 0 56 56">
          <g class="foglio-macchina"><rect x="17" y="6" width="22" height="20" fill="var(--testo-1)"/>
            <path d="M20 12h14M20 16h16M20 20h10" stroke="var(--fondo-3)" stroke-width="1.4"/></g>
          <rect x="8" y="24" width="40" height="7" rx="2" fill="var(--testo-2)"/>
          <path d="M6 33h44l-4 15H10z" fill="var(--testo-2)"/>
          <g fill="var(--fondo)"><circle cx="16" cy="38" r="1.8"/><circle cx="22" cy="38" r="1.8"/><circle cx="28" cy="38" r="1.8"/><circle cx="34" cy="38" r="1.8"/><circle cx="40" cy="38" r="1.8"/>
            <rect x="17" y="42" width="22" height="3" rx="1.5"/></g>
          <path class="martelletto" d="M28 31v-6" stroke="var(--fondo)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      }
      @case ('bicchiere') {
        <svg viewBox="0 0 56 56">
          <path class="liquido" d="M17.6 32h20.8l-1.8 14H19.4z" fill="var(--testo-2)" opacity="0.55"/>
          <rect x="23" y="27" width="9" height="9" rx="1.5" fill="var(--testo-1)" opacity="0.7" transform="rotate(12 27.5 31.5)"/>
          <path d="M16 18h24l-3 30H19z" fill="none" stroke="var(--testo-1)" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      }
      @case ('lampione') {
        <svg viewBox="0 0 56 56">
          <path class="luce" d="M24 17h8l10 33H14z" fill="var(--testo-1)"/>
          <path d="M28 6v4" stroke="var(--testo-2)" stroke-width="2"/>
          <path d="M21 10h14l-3 7h-8z" fill="var(--testo-2)"/>
          <path d="M28 17v33M22 50h12" stroke="var(--testo-2)" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
      }
      @case ('impronta') {
        <svg viewBox="0 0 56 56">
          <g class="impronta" fill="none" stroke="var(--testo-1)" stroke-width="1.8" stroke-linecap="round">
            <path d="M18 40c-3-6-3-14 2-19s13-6 18 0 5 14 2 20"/>
            <path d="M22 42c-2-5-2-11 1-15s9-5 12 0 3 10 1 15"/>
            <path d="M26 44c-1-4-1-8 1-11s5-3 6 0 1 7 0 11"/>
            <path d="M29.5 34c.5 3 .5 7-.5 11"/>
            <path d="M15 32c0-9 5-16 13-16s13 7 13 16"/>
          </g>
        </svg>
      }
    }
  `,
})
export class Figura {
  readonly nome = input.required<NomeFigura>();
}
