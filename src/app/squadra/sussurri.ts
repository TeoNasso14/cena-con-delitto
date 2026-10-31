import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';

/** Frasi brevi, solo atmosfera: non devono sembrare indizi del caso. */
const FRASI = [
  'Qualcuno vi sta guardando.',
  'Non voltatevi.',
  'Hai sentito anche tu?',
  'La candela ha tremato.',
  'Contate i commensali. Siete ancora tutti?',
  'Le ombre si allungano.',
  'Chi ha spento la luce?',
  'Qualcosa gratta sotto il tavolo.',
  'Il gufo ha smesso di cantare.',
  'Mezzanotte si avvicina.',
  'Il ritratto ha cambiato espressione.',
  'Un passo, poi silenzio.',
  'Dietro la porta, un respiro.',
  'Il vento conosce il tuo nome.',
  'Non era il gatto.',
  'Fa più freddo di prima, vero?',

  // Tre per ciascun commensale, cattive quanto quelle di Pietro.
  'Ali, il fantasma ti ha chiesto l\'amicizia. Poi ti ha bloccato.',
  'Ali, anche il vampiro ha detto: no, grazie.',
  'Ali, se sparisci stasera, nessuno se ne accorge.',
  'Mela, anche le streghe avvelenate ti scartano.',
  'Mela, Biancaneve ti ha morso e ha sputato.',
  'Mela, marcia dentro, come da tradizione.',
  'Laura, il maggiordomo ha detto che sei la più sospetta. E la più antipatica.',
  'Laura, sotto la tovaglia c\'è qualcosa. Più simpatico di te.',
  'Laura, la casa stregata ha chiesto di cambiare ospite.',
  'Sasso, hai la sensibilità del tuo nome.',
  'Sasso, la cripta ti ha tenuto un posto. Ti ci vedono bene.',
  'Sasso, anche le lapidi hanno più conversazione.',
  'Losco: il nome dice già tutto. Anche la faccia.',
  'Losco, l\'assassino ti ha copiato lo sguardo.',
  'Losco, la polizia ti ha già in rubrica.',
  'Tenca, il lago ti rivuole indietro. Noi no.',
  'Tenca, anche i pesci ti trovano noioso.',
  'Tenca, abbocchi a qualsiasi indizio, come da nome.',
  'Teo, hai fatto il sito perché a giocare saresti stato inutile.',
  'Teo, il sito l\'ha fatto Claude. Tu hai detto bravo.',
  'Teo, chi ha fatto questo sito non dorme da giorni. Si vede.',
  'Giulia, il ritratto ti fissa. Si sta chiedendo chi ti ha invitata.',
  'Giulia, i fantasmi ti passano attraverso per non salutarti.',
  'Giulia, la strega ti ha offerto un passaggio. Di sola andata.',
  'Andre, la mano fredda sulla spalla era solo per spingerti fuori.',
  'Andre, sei l\'unico che lo zombie non insegue. Troppo lento anche per lui.',
  'Andre, il testamento ti nomina solo per lasciarti le bollette.',
  'Bianca, sei così pallida che i fantasmi ti chiedono il segreto.',
  'Bianca, il vampiro ti ha guardata e ha scelto il pomodoro.',
  'Bianca, ti hanno scambiata per la tovaglia.',
  'Chiara, la candela si spegne quando passi tu. Anche la conversazione.',
  'Chiara, di chiaro c\'è solo che non hai capito niente.',
  'Chiara, la tua ombra ha chiesto il trasferimento.',
  'Gabri, il corvo ha imparato il tuo nome. Lo usa come insulto.',
  'Gabri, anche il gatto nero si gira dall\'altra parte.',
  'Gabri, la zucca intagliata ha un\'espressione più sveglia.',
  'Gio, ti ho visto ieri notte. Peccato.',
  'Gio, il fantasma ha chiesto di cambiare tavolo.',
  'Gio, il buio ti dona. Restaci.',
  'Sara, il tuo riflesso è rimasto indietro: si vergognava.',
  'Sara, lo specchio si è incrinato. Colpa tua.',
  'Sara, la strega ti ha guardata e ha posato la scopa: inutile.',

  // E quattordici per Pietro, che se le merita tutte.
  'Pietro, anche i fantasmi fingono di non conoscerti.',
  'Pietro, il vampiro ti ha assaggiato e ha chiesto il conto.',
  'Pietro, sei il primo sospettato. Di tutto. Da sempre.',
  'Pietro, la zucca ha più capelli di te. E idee.',
  'Pietro, gli zombie cercano cervelli: con te sono a posto.',
  'Pietro, la strega ti ha guardato e ha chiuso il calderone.',
  'Pietro, il corvo ride di te. Ha ragione.',
  'Pietro, stasera muori tu. Di vergogna, come al solito.',
  'Pietro, spegnete le candele: basta la sua testa a fare luce.',
  'Pietro, la casa era tranquilla prima che entrassi.',
  'Pietro, il cimitero ha rifiutato la tua prenotazione: troppo noioso.',
  'Pietro, i fantasmi si specchiano sulla tua testa per sistemarsi il lenzuolo.',
  'Pietro, l\'assassino ha un alibi. Tu neanche una scusa.',
  'Pietro, il teschio sullo scaffale ti ha scambiato per un cugino.',

  // Altre, a sorpresa.
  'Ali, la tua squadra ha votato: sei tu la vittima sacrificale.',
  'Ali, il lupo mannaro ti ha annusato e ha preferito la luna.',
  'Mela, il verme dentro di te ha chiesto un affitto più basso.',
  'Mela, la strega ti ha messa nel cesto degli scarti.',
  'Laura, il fantasma del castello ti ha chiesto di abbassare la voce.',
  'Laura, l\'unico mistero stasera è perché sei qui.',
  'Sasso, rotoli verso la soluzione. Molto lentamente.',
  'Sasso, la gargoyle ti ha scambiato per un parente.',
  'Losco, se muore qualcuno, la regia guarda te.',
  'Losco, perfino l\'ombra ti tiene d\'occhio.',
  'Tenca, l\'acqua stagnante ha più movimento di te.',
  'Tenca, hai la memoria di un pesce e si vede dall\'accusa.',
  'Teo, architetto di cosa? Hai spostato due pulsanti.',
  'Teo, il fantasma dice che il tuo codice infesta Netlify.',
  'Giulia, la bambola maledetta ti ha chiesto di smettere di fissarla.',
  'Giulia, anche il buio si annoia con te.',
  'Andre, il becchino ti ha preso le misure. Per scrupolo.',
  'Andre, sei l\'indizio falso della serata.',
  'Bianca, la mummia ha più colorito.',
  'Bianca, il lenzuolo del fantasma ti sta largo.',
  'Chiara, la sfera di cristallo si è appannata appena ti ha vista.',
  'Chiara, i pipistrelli ci vedono meglio di te al buio. E alla luce.',
  'Gabri, il cappello della strega ti starebbe bene. Copre.',
  'Gabri, i ragni hanno tessuto la tela sulla tua ultima idea.',
  'Gio, sei il tipo di invitato che il cadavere avrebbe evitato.',
  'Gio, il pozzo nel giardino ha più profondità di te.',
  'Sara, il gatto nero ti ha dato sfortuna. Anzi no, eri già così.',
  'Sara, la scopa della strega ha chiesto di non volare con te.',
  'Pietro, la luna piena si è vista riflessa. Sulla tua testa.',
  'Pietro, i pipistrelli usano la tua testa come pista d\'atterraggio.',
  'Pietro, il lupo mannaro ti invidia: almeno lui i peli li ha.',
  'Pietro, l\'esorcista ha provato. Il demone era più simpatico.',
  'Pietro, la bara è pronta. Hanno scelto la più economica.',
  'Pietro, sei la prova che i morti viventi esistono.',
  'La regia vi osserva. E ride.',
  'Uno di voi non tornerà a casa. Speriamo Pietro.',
  'Il cadavere era più vivace di questa squadra.',
  'Qualcuno ha già sbagliato l\'accusa. Si vede dalla faccia.',
];

/** Piccole figure animate (disegnate qui, nessun file esterno) che "parlano" dalla nuvoletta. */
const FIGURE = ['fantasma', 'pipistrello', 'ragno', 'zucca', 'occhi', 'candela'] as const;
type Figura = (typeof FIGURE)[number];

const PRIMA = 10_000;
const ATTESA_MIN = 20_000;
const ATTESA_MAX = 45_000;
const DURATA = 5_500;

/** Nuvolette inquietanti che compaiono ogni tanto in basso, sui telefoni delle squadre. */
@Component({
  selector: 'app-sussurri',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.proiettore]': 'proiettore()' },
  styles: `
    :host { position: fixed; left: 0; right: 0; bottom: calc(76px + env(safe-area-inset-bottom)); z-index: 7; pointer-events: none;
      display: flex; justify-content: center; padding: 0 20px; }
    .sussurro { pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; border: 0; background: none; padding: 0; cursor: pointer; font: inherit;
      animation: entra 520ms var(--curva-cassetto) both; }
    .sussurro.via { animation: esce 380ms var(--curva-uscita) forwards; }
    .nuvola { position: relative; max-width: 290px; padding: 9px 15px; border-radius: 18px; background: var(--osso); color: var(--notte);
      font-family: var(--gotico); font-size: 19px; line-height: 1.2; text-align: center; }
    .nuvola::after { content: ''; position: absolute; left: 50%; bottom: -6px; width: 13px; height: 13px; background: var(--osso); transform: translateX(-50%) rotate(45deg); border-radius: 2px; }
    svg { width: 56px; height: 56px; overflow: visible; }
    /* Sul proiettore: più grandi, in basso al centro, senza barra delle schede sotto. */
    :host(.proiettore) { bottom: 4vh; z-index: 20; }
    :host(.proiettore) .nuvola { max-width: min(46vw, 820px); padding: 1.1vh 2vw; border-radius: 2.4vh; font-size: clamp(22px, 2.6vw, 52px); }
    :host(.proiettore) .nuvola::after { width: 2vh; height: 2vh; bottom: -0.9vh; }
    :host(.proiettore) svg { width: 11vh; height: 11vh; }
    @keyframes entra { from { opacity: 0; transform: translateY(18px) scale(0.92); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
    @keyframes esce { to { opacity: 0; transform: translateY(10px) scale(0.96); filter: blur(4px); } }

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
      .sussurro, .sussurro.via, svg * { animation: none !important; }
      .sussurro.via { opacity: 0; }
    }
  `,
  template: `
    @if (frase(); as f) {
      <button type="button" class="sussurro" tabindex="-1" [class.via]="uscita()" (click)="chiudi()">
        <span class="nuvola">{{ f }}</span>
        @switch (figura()) {
          @case ('fantasma') {
            <svg viewBox="0 0 56 56"><g class="fantasma">
              <path d="M14 46V24a14 14 0 0 1 28 0v22l-4.7-4-4.6 4-4.7-4-4.6 4-4.7-4z" fill="var(--osso)"/>
              <ellipse cx="23" cy="24" rx="2.6" ry="3.6" fill="var(--notte)"/><ellipse cx="33" cy="24" rx="2.6" ry="3.6" fill="var(--notte)"/>
              <ellipse cx="28" cy="33" rx="3" ry="2.2" fill="var(--notte)"/>
            </g></svg>
          }
          @case ('pipistrello') {
            <svg viewBox="0 0 56 56"><g class="volo">
              <path class="ala sx" d="M24 28c-4-6-10-7-18-4 4 2 5 6 4 9 3-2 6-2 8 1 1-3 3-5 6-6z" fill="var(--osso-2)"/>
              <path class="ala dx" d="M32 28c4-6 10-7 18-4-4 2-5 6-4 9-3-2-6-2-8 1-1-3-3-5-6-6z" fill="var(--osso-2)"/>
              <ellipse cx="28" cy="30" rx="5" ry="7" fill="var(--osso-2)"/>
              <path d="M24 24l1.5-5 2 4M32 24l-1.5-5-2 4" fill="var(--osso-2)"/>
              <circle cx="26" cy="27" r="1.2" fill="var(--zucca)"/><circle cx="30" cy="27" r="1.2" fill="var(--zucca)"/>
            </g></svg>
          }
          @case ('ragno') {
            <svg viewBox="0 0 56 56"><g class="ragno">
              <line x1="28" y1="-30" x2="28" y2="22" stroke="var(--osso-2)" stroke-width="1"/>
              <g class="zampe" stroke="var(--osso-2)" stroke-width="2" fill="none" stroke-linecap="round">
                <path d="M23 28l-8-5-3 3M23 31l-9 0-3 4M23 34l-8 4-2 5M33 28l8-5 3 3M33 31l9 0 3 4M33 34l8 4 2 5"/>
              </g>
              <ellipse cx="28" cy="31" rx="7" ry="8" fill="var(--osso-2)"/>
              <circle cx="25.5" cy="29" r="1.6" fill="var(--sangue)"/><circle cx="30.5" cy="29" r="1.6" fill="var(--sangue)"/>
            </g></svg>
          }
          @case ('zucca') {
            <svg viewBox="0 0 56 56"><g class="zucca">
              <path d="M28 14c1-4 4-6 7-6" stroke="#6b8f3a" stroke-width="3" fill="none" stroke-linecap="round"/>
              <ellipse cx="20" cy="32" rx="11" ry="15" fill="var(--zucca)"/><ellipse cx="36" cy="32" rx="11" ry="15" fill="var(--zucca)"/>
              <ellipse cx="28" cy="32" rx="10" ry="16" fill="var(--zucca-chiara)"/>
              <g class="bagliore" fill="#ffe08a">
                <path d="M18 27l5 4h-6zM38 27l-5 4h6z"/>
                <path d="M17 37q11 8 22 0l-3 1-2 3-3-2-3 2-3-2-3 2-2-3z"/>
              </g>
            </g></svg>
          }
          @case ('occhi') {
            <svg viewBox="0 0 56 56">
              <circle cx="28" cy="30" r="24" fill="var(--notte-3)"/>
              <g class="sguardo">
                <g class="palpebra"><ellipse cx="18" cy="26" rx="5" ry="3.4" fill="#ffe08a"/><circle cx="18.5" cy="26" r="1.6" fill="var(--notte)"/>
                  <ellipse cx="29" cy="26" rx="5" ry="3.4" fill="#ffe08a"/><circle cx="29.5" cy="26" r="1.6" fill="var(--notte)"/></g>
                <g class="palpebra due"><ellipse cx="36" cy="38" rx="3.6" ry="2.4" fill="var(--sangue)"/><ellipse cx="44" cy="38" rx="3.6" ry="2.4" fill="var(--sangue)"/></g>
              </g>
            </svg>
          }
          @case ('candela') {
            <svg viewBox="0 0 56 56">
              <ellipse cx="28" cy="20" rx="9" ry="11" fill="var(--zucca)" opacity="0.18" class="fiamma"/>
              <path class="fiamma" d="M28 9c4 5 5 8 5 11a5 5 0 0 1-10 0c0-3 1-6 5-11z" fill="var(--zucca)"/>
              <path class="fiamma" d="M28 15c2 3 2.5 4.5 2.5 6a2.5 2.5 0 0 1-5 0c0-1.5.5-3 2.5-6z" fill="#ffe08a"/>
              <rect x="22" y="27" width="12" height="22" rx="2" fill="var(--osso)"/>
              <path d="M22 30q3 4 2 9" stroke="var(--osso-2)" stroke-width="2" fill="none"/>
              <rect x="17" y="48" width="22" height="4" rx="2" fill="var(--osso-2)"/>
            </svg>
          }
        }
      </button>
    }
  `,
})
export class Sussurri {
  /** Sul proiettore le nuvolette sono più grandi e non ci sono fogli da rispettare. */
  readonly proiettore = input(false);
  readonly frase = signal<string | null>(null);
  readonly figura = signal<Figura>('fantasma');
  readonly uscita = signal(false);
  private timer?: ReturnType<typeof setTimeout>;
  private ultimaFrase = -1;
  private ultimaFigura = -1;

  constructor() {
    // ?sussurri=subito fa comparire la prima nuvoletta dopo un attimo: serve per provarle.
    const subito = new URLSearchParams(location.search).get('sussurri') === 'subito';
    this.programma(subito ? 1_500 : PRIMA + Math.random() * 10_000);
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  private programma(ms: number) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.mostra(), ms);
  }

  private pesca(n: number, ultima: number) {
    let i: number;
    do { i = Math.floor(Math.random() * n); } while (i === ultima && n > 1);
    return i;
  }

  private mostra() {
    // Non disturba mentre la squadra ha aperto un foglio (codice o documento) o la pagina non è in vista.
    // Sul proiettore tace a schermo nero.
    if (document.hidden || document.querySelector('.foglio.aperto, .schermo[data-scena="nero"]')) { this.programma(15_000); return; }
    this.ultimaFrase = this.pesca(FRASI.length, this.ultimaFrase);
    this.ultimaFigura = this.pesca(FIGURE.length, this.ultimaFigura);
    this.uscita.set(false);
    this.figura.set(FIGURE[this.ultimaFigura]);
    this.frase.set(FRASI[this.ultimaFrase]);
    this.timer = setTimeout(() => this.chiudi(), DURATA);
  }

  chiudi() {
    if (!this.frase() || this.uscita()) return;
    clearTimeout(this.timer);
    this.uscita.set(true);
    this.timer = setTimeout(() => {
      this.frase.set(null);
      this.programma(ATTESA_MIN + Math.random() * (ATTESA_MAX - ATTESA_MIN));
    }, 400);
  }
}
