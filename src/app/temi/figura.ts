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

    /* Gesti comuni dei temi Vittoriano, Viaggio, Gatsby e Natale. */
    .f-oscilla { transform-box: fill-box; transform-origin: 50% 0%; animation: f-oscilla 2.6s ease-in-out infinite; }
    @keyframes f-oscilla { 0%, 100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
    .f-galleggia { animation: f-galleggia 2.8s ease-in-out infinite; }
    @keyframes f-galleggia { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
    .f-sale { animation: f-sale 2.6s ease-out infinite; }
    .f-sale.due { animation-delay: 1.3s; }
    @keyframes f-sale { from { opacity: 0.85; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } }
    .f-brilla { animation: f-brilla 1.8s steps(1) infinite; }
    @keyframes f-brilla { 0%, 100% { opacity: 1; } 40% { opacity: 0.45; } 60% { opacity: 1; } 80% { opacity: 0.7; } }
    .f-gira { transform-box: fill-box; transform-origin: 50% 50%; animation: f-gira 5s linear infinite; }
    @keyframes f-gira { to { transform: rotate(360deg); } }

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
      @case ('taccuino') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <rect x="14" y="10" width="28" height="36" rx="1.5" fill="var(--testo-1)"/>
          <path d="M20 18h16M20 24h16M20 30h12M20 36h14" stroke="var(--fondo)" stroke-width="1.6"/>
          <path d="M14 14h-3M14 22h-3M14 30h-3M14 38h-3" stroke="var(--testo-2)" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M38 10v14l3-2 3 2V10" fill="var(--sigillo)"/>
        </g></svg>
      }
      @case ('lente') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla">
          <circle cx="24" cy="22" r="12" fill="none" stroke="var(--testo-1)" stroke-width="3.5"/>
          <path d="M19 15a8 8 0 0 1 7-2" stroke="var(--testo-2)" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M33 31l12 12" stroke="var(--testo-1)" stroke-width="5" stroke-linecap="round"/>
        </g></svg>
      }
      @case ('cilindro') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <rect x="18" y="12" width="20" height="24" rx="1.5" fill="var(--testo-1)"/>
          <rect x="18" y="29" width="20" height="4" fill="var(--accento)"/>
          <ellipse cx="28" cy="37" rx="18" ry="4" fill="var(--testo-1)"/>
        </g></svg>
      }
      @case ('orologio') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla">
          <path d="M28 2v12" stroke="var(--testo-2)" stroke-width="1.6" stroke-dasharray="2 2"/>
          <circle cx="28" cy="14" r="2.5" fill="none" stroke="var(--testo-1)" stroke-width="2"/>
          <circle cx="28" cy="32" r="14" fill="var(--carta)" stroke="var(--testo-1)" stroke-width="3"/>
          <path d="M28 32v-8M28 32l6 3" stroke="var(--inchiostro)" stroke-width="2" stroke-linecap="round"/>
        </g></svg>
      }
      @case ('calamaio') {
        <svg viewBox="0 0 56 56">
          <path class="f-oscilla" d="M34 6c8 4 10 14 4 22l-6 6c0-8-2-16 2-28z" fill="var(--testo-2)"/>
          <path d="M16 34h22l2 14H14z" fill="var(--testo-1)"/>
          <rect x="21" y="29" width="12" height="6" rx="1" fill="var(--testo-1)"/>
        </svg>
      }
      @case ('chiave') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla">
          <circle cx="28" cy="14" r="8" fill="none" stroke="var(--testo-1)" stroke-width="3.5"/>
          <path d="M28 22v24M28 38h7M28 44h5" stroke="var(--testo-1)" stroke-width="3.5" stroke-linecap="square"/>
        </g></svg>
      }
      @case ('biglietto') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M8 18h40v6a4 4 0 0 0 0 8v6H8v-6a4 4 0 0 0 0-8z" fill="var(--carta)"/>
          <path d="M16 24h14M16 29h20M16 34h10" stroke="var(--inchiostro)" stroke-width="1.6"/>
          <circle cx="41" cy="28" r="2.5" fill="var(--fondo)"/>
        </g></svg>
      }
      @case ('valigia') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M22 18v-4h12v4" fill="none" stroke="var(--testo-1)" stroke-width="2.6"/>
          <rect x="10" y="18" width="36" height="26" rx="2" fill="var(--testo-2)"/>
          <path d="M18 18v26M38 18v26" stroke="var(--accento)" stroke-width="3"/>
        </g></svg>
      }
      @case ('locomotiva') {
        <svg viewBox="0 0 56 56">
          <circle class="f-sale" cx="16" cy="12" r="4" fill="var(--testo-2)"/>
          <circle class="f-sale due" cx="22" cy="8" r="3" fill="var(--testo-2)"/>
          <path d="M12 18h6v8h14v-8h10v20H8V26h4z" fill="var(--testo-1)"/>
          <rect x="34" y="21" width="6" height="5" fill="var(--accento)"/>
          <g fill="var(--fondo)" stroke="var(--testo-1)" stroke-width="2"><circle cx="16" cy="40" r="5"/><circle cx="34" cy="40" r="5"/></g>
        </svg>
      }
      @case ('fischietto') {
        <svg viewBox="0 0 56 56">
          <path d="M10 26h22a9 9 0 1 1-9 9H10z" fill="var(--accento)"/>
          <g class="f-brilla" stroke="var(--testo-1)" stroke-width="2" stroke-linecap="round"><path d="M38 18l5-6M43 26h7M40 21l7-3"/></g>
        </svg>
      }
      @case ('lanterna') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla">
          <path d="M28 4v6M20 10h16" stroke="var(--testo-1)" stroke-width="2.6"/>
          <path d="M18 14h20l-2 26H20z" fill="none" stroke="var(--testo-1)" stroke-width="2.6"/>
          <path class="f-brilla" d="M28 20c4 5 5 8 5 11a5 5 0 0 1-10 0c0-3 1-6 5-11z" fill="var(--accento)"/>
          <rect x="16" y="40" width="24" height="4" fill="var(--testo-1)"/>
        </g></svg>
      }
      @case ('tazza') {
        <svg viewBox="0 0 56 56">
          <path class="f-sale" d="M22 18c-3-4 3-7 0-11" stroke="var(--testo-2)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path class="f-sale due" d="M30 18c-3-4 3-7 0-11" stroke="var(--testo-2)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M12 24h28v6a12 12 0 0 1-24 0z" fill="var(--testo-1)"/>
          <path d="M40 27a5 5 0 0 1 0 8" stroke="var(--testo-1)" stroke-width="3" fill="none"/>
          <ellipse cx="27" cy="44" rx="17" ry="3" fill="var(--testo-2)"/>
        </svg>
      }
      @case ('telefono') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M8 18c0-6 9-9 20-9s20 3 20 9v3h-10v-4H18v4H8z" fill="var(--testo-1)"/>
          <path d="M18 22h20l7 20H11z" fill="var(--accento)"/>
          <circle cx="28" cy="33" r="7" fill="var(--fondo)"/><circle cx="28" cy="33" r="2.4" fill="var(--testo-1)"/>
        </g></svg>
      }
      @case ('guanto') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia" fill="none" stroke="var(--testo-2)" stroke-linecap="round">
          <path stroke-width="5" d="M20 28V12M27 27V9M34 28V11M41 30V16M14 34l-5-8"/>
          <path stroke-width="16" d="M21 36h13"/>
          <path stroke-width="5" d="M18 49h20" stroke="var(--accento)"/>
        </g></svg>
      }
      @case ('lampada') {
        <svg viewBox="0 0 56 56">
          <path class="bagliore" d="M18 10h20l7 18H11z" fill="var(--accento)"/>
          <path d="M28 28v16M18 47h20" stroke="var(--testo-1)" stroke-width="3" stroke-linecap="round"/>
        </svg>
      }
      @case ('palma') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M26 20c3 10 4 20 2 30" fill="none" stroke="var(--testo-2)" stroke-width="4" stroke-linecap="round"/>
          <g fill="var(--accento)"><path d="M26 20C20 11 11 11 4 18c8-2 15-1 22 2z"/><path d="M26 20c5-9 15-11 25-5-9-1-17 1-25 5z"/><path d="M26 20C22 13 22 7 27 3c0 6 1 11-1 17z"/><path d="M26 20c-7 1-13 6-14 15 4-7 8-11 14-15z"/><path d="M26 20c7 0 14 5 16 14-5-7-10-11-16-14z"/></g>
        </g></svg>
      }
      @case ('battello') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M6 36h44l-5 10H11z" fill="var(--testo-1)"/>
          <path d="M14 26h28v10H14z" fill="var(--testo-2)"/><path d="M12 26h32M18 26v10M26 26v10M34 26v10" stroke="var(--fondo)" stroke-width="1.6"/>
          <path d="M32 26V12h6v14z" fill="var(--accento)"/>
        </g><g fill="var(--testo-2)"><circle class="f-sale" cx="35" cy="8" r="2"/><circle class="f-sale due" cx="39" cy="5" r="1.6"/></g></svg>
      }
      @case ('scarabeo') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M14 22l-7-5M12 30H5M14 38l-7 5M42 22l7-5M44 30h7M42 38l7 5" stroke="var(--testo-2)" stroke-width="2.4" stroke-linecap="round"/>
          <circle cx="28" cy="13" r="6" fill="var(--testo-1)"/>
          <ellipse cx="28" cy="31" rx="15" ry="17" fill="var(--accento)"/>
          <path d="M28 15v33" stroke="var(--fondo)" stroke-width="2"/>
        </g></svg>
      }
      @case ('maschera') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M4 20c8 2 14 3 24 3s16-1 24-3c1 12-5 22-14 22-5 0-7-3-10-6-3 3-5 6-10 6-9 0-15-10-14-22z" fill="var(--carta)"/>
          <path d="M12 28c3-3 8-3 11 0-3 3-8 3-11 0zM33 28c3-3 8-3 11 0-3 3-8 3-11 0z" fill="var(--fondo)"/>
          <path d="M4 20C3 15 6 11 10 11M52 20c1-5-2-9-6-9" fill="none" stroke="var(--accento)" stroke-width="2.4" stroke-linecap="round"/>
        </g></svg>
      }
      @case ('ventaglio') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M28 46L5 22C11 12 19 8 28 8s17 4 23 14z" fill="var(--accento)"/>
          <path d="M28 46L17 13M28 46V8M28 46l11-33" stroke="var(--fondo)" stroke-width="1.8"/>
          <circle cx="28" cy="46" r="3" fill="var(--testo-1)"/>
        </g></svg>
      }
      @case ('gondola') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M3 30c8 9 30 12 43 3 3-2 5-6 6-14-3 5-5 8-9 9-12 4-27 4-40 2z" fill="var(--testo-1)"/>
          <path d="M50 21l3-7M47 14h7M47 18h6" stroke="var(--accento)" stroke-width="2" stroke-linecap="round"/>
          <path d="M20 26V8" stroke="var(--testo-2)" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M6 44h14M26 47h18" stroke="var(--accento)" stroke-width="2.4" stroke-linecap="round"/>
        </g></svg>
      }
      @case ('coppa') {
        <svg viewBox="0 0 56 56">
          <g fill="var(--accento)"><circle class="f-sale" cx="24" cy="16" r="1.6"/><circle class="f-sale due" cx="31" cy="13" r="1.4"/></g>
          <path d="M12 20h32c0 9-7 14-16 14s-16-5-16-14z" fill="var(--accento)" opacity="0.85"/>
          <path d="M28 34v12M20 47h16" stroke="var(--testo-1)" stroke-width="2.4" stroke-linecap="round"/>
        </svg>
      }
      @case ('grammofono') {
        <svg viewBox="0 0 56 56">
          <path d="M26 30L40 8c6 4 10 12 8 20z" fill="var(--accento)"/>
          <path d="M26 30v8" stroke="var(--testo-1)" stroke-width="2.4"/>
          <rect x="12" y="38" width="30" height="9" rx="1" fill="var(--testo-2)"/>
          <ellipse class="f-gira" cx="22" cy="37" rx="9" ry="2.4" fill="var(--testo-1)"/>
        </svg>
      }
      @case ('bocchino') {
        <svg viewBox="0 0 56 56">
          <path class="f-sale" d="M42 22c-3-4 3-7 0-11" stroke="var(--testo-2)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path class="f-sale due" d="M46 20c-3-4 3-7 0-11" stroke="var(--testo-2)" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M8 38L36 28" stroke="var(--testo-1)" stroke-width="3" stroke-linecap="round"/>
          <path d="M22 33l2 5" stroke="var(--accento)" stroke-width="3"/>
          <path d="M36 28l6-2" stroke="var(--testo-1)" stroke-width="5" stroke-linecap="round"/>
          <circle class="f-brilla" cx="43" cy="25.6" r="1.8" fill="var(--accento)"/>
        </svg>
      }
      @case ('carte') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <rect x="12" y="14" width="20" height="28" rx="2" fill="var(--carta)" transform="rotate(-12 22 28)"/>
          <rect x="24" y="12" width="20" height="28" rx="2" fill="var(--carta)" stroke="var(--fondo)" stroke-width="1" transform="rotate(10 34 26)"/>
          <path d="M34 20l4 6-4 6-4-6z" fill="var(--sigillo)" transform="rotate(10 34 26)"/>
        </g></svg>
      }
      @case ('bottiglia') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <path d="M24 6h8v10c5 3 6 7 6 12v20H18V28c0-5 1-9 6-12z" fill="var(--testo-2)"/>
          <rect x="20" y="30" width="16" height="10" fill="var(--accento)"/>
        </g></svg>
      }
      @case ('perle') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla" fill="var(--testo-1)">
          <circle cx="12" cy="14" r="3"/><circle cx="15" cy="22" r="3"/><circle cx="20" cy="29" r="3"/><circle cx="28" cy="32" r="3.4"/>
          <circle cx="36" cy="29" r="3"/><circle cx="41" cy="22" r="3"/><circle cx="44" cy="14" r="3"/>
          <circle cx="28" cy="40" r="4" fill="var(--accento)"/>
        </g></svg>
      }
      @case ('pallina') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla">
          <path d="M28 2v10" stroke="var(--testo-2)" stroke-width="1.4"/>
          <rect x="24" y="11" width="8" height="5" rx="1" fill="var(--testo-2)"/>
          <circle cx="28" cy="30" r="14" fill="var(--accento)"/>
          <path d="M20 24a10 10 0 0 1 6-5" stroke="var(--testo-1)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        </g></svg>
      }
      @case ('regalo') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <rect x="12" y="22" width="32" height="24" fill="var(--accento)"/>
          <rect x="10" y="16" width="36" height="7" fill="var(--accento)"/>
          <path d="M28 16v30" stroke="var(--testo-1)" stroke-width="4"/>
          <path d="M28 16c-6-8-14-4-8 0zM28 16c6-8 14-4 8 0z" fill="var(--testo-1)"/>
        </g></svg>
      }
      @case ('stella') {
        <svg viewBox="0 0 56 56"><path class="f-brilla" d="M28 6l6 15h16l-13 10 5 16-14-10-14 10 5-16L6 21h16z" fill="var(--testo-1)"/></svg>
      }
      @case ('campanella') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla">
          <path d="M28 6v5" stroke="var(--testo-1)" stroke-width="2.4"/>
          <path d="M16 38c3-4 3-10 3-14a9 9 0 0 1 18 0c0 4 0 10 3 14z" fill="var(--testo-1)"/>
          <circle cx="28" cy="42" r="3.6" fill="var(--accento)"/>
        </g></svg>
      }
      @case ('bastoncino') {
        <svg viewBox="0 0 56 56"><g class="f-oscilla">
          <path d="M34 48V18a7 7 0 0 0-14 0" fill="none" stroke="var(--testo-1)" stroke-width="7" stroke-linecap="round"/>
          <path d="M34 48V18a7 7 0 0 0-14 0" fill="none" stroke="var(--accento)" stroke-width="7" stroke-dasharray="4 5" stroke-linecap="butt"/>
        </g></svg>
      }
      @case ('pupazzo') {
        <svg viewBox="0 0 56 56"><g class="f-galleggia">
          <circle cx="28" cy="38" r="12" fill="var(--testo-1)"/>
          <circle cx="28" cy="18" r="8" fill="var(--testo-1)"/>
          <path d="M20 26h16l-2 4h-6z" fill="var(--accento)"/>
          <g fill="var(--fondo)"><circle cx="25" cy="17" r="1.4"/><circle cx="31" cy="17" r="1.4"/><circle cx="28" cy="36" r="1.6"/><circle cx="28" cy="42" r="1.6"/></g>
        </g></svg>
      }
    }
  `,
})
export class Figura {
  readonly nome = input.required<NomeFigura>();
}
