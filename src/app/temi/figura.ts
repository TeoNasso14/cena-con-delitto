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

    @media (prefers-reduced-motion: reduce) {
      svg * { animation: none !important; }
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
    }
  `,
})
export class Figura {
  readonly nome = input.required<NomeFigura>();
}
