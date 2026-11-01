import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';
import { Figura as NomeFigura, temaDa } from '../temi/catalogo';
import { Figura } from '../temi/figura';

const PRIMA = 10_000;
const ATTESA_MIN = 20_000;
const ATTESA_MAX = 45_000;
const DURATA = 10_000;

/** Nuvolette inquietanti che compaiono ogni tanto in basso, sui telefoni delle squadre. */
@Component({
  selector: 'app-sussurri',
  imports: [Figura],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[class.proiettore]': 'proiettore()' },
  styles: `
    :host { position: fixed; left: 0; right: 0; bottom: calc(76px + env(safe-area-inset-bottom)); z-index: 7; pointer-events: none;
      display: flex; justify-content: center; padding: 0 20px; }
    .sussurro { pointer-events: auto; display: flex; flex-direction: column; align-items: center; gap: 4px; border: 0; background: none; padding: 0; cursor: pointer; font: inherit;
      animation: entra 520ms var(--curva-cassetto) both; }
    .sussurro.via { animation: esce 380ms var(--curva-uscita) forwards; }
    .nuvola { position: relative; max-width: 290px; padding: 9px 15px; border-radius: 18px; background: var(--testo-1); color: var(--fondo);
      font-family: var(--titoli); font-size: 19px; line-height: 1.2; text-align: center; }
    .nuvola::after { content: ''; position: absolute; left: 50%; bottom: -6px; width: 13px; height: 13px; background: var(--testo-1); transform: translateX(-50%) rotate(45deg); border-radius: 2px; }
    app-figura { width: 56px; height: 56px; }
    /* Sul proiettore: più grandi, in basso al centro, senza barra delle schede sotto. */
    :host(.proiettore) { bottom: 4vh; z-index: 20; }
    :host(.proiettore) .nuvola { max-width: min(46vw, 820px); padding: 1.1vh 2vw; border-radius: 2.4vh; font-size: clamp(22px, 2.6vw, 52px); }
    :host(.proiettore) .nuvola::after { width: 2vh; height: 2vh; bottom: -0.9vh; }
    :host(.proiettore) app-figura { width: 11vh; height: 11vh; }
    @keyframes entra { from { opacity: 0; transform: translateY(18px) scale(0.92); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
    @keyframes esce { to { opacity: 0; transform: translateY(10px) scale(0.96); filter: blur(4px); } }

    @media (prefers-reduced-motion: reduce) {
      .sussurro, .sussurro.via { animation: none !important; }
      .sussurro.via { opacity: 0; }
    }
  `,
  template: `
    @if (frase(); as f) {
      <button type="button" class="sussurro" tabindex="-1" [class.via]="uscita()" (click)="chiudi()">
        <span class="nuvola">{{ f }}</span>
        <app-figura [nome]="figura()" />
      </button>
    }
  `,
})
export class Sussurri {
  /** Sul proiettore le nuvolette sono più grandi e non ci sono fogli da rispettare. */
  readonly proiettore = input(false);
  /** Le frasi le decide la regia (vedi frasiDaMostrare): elenco vuoto, nessuna nuvoletta. */
  readonly frasi = input<readonly string[]>([]);
  /** Le figure che parlano dalla nuvoletta cambiano col tema. */
  readonly tema = input<string | undefined>();
  readonly frase = signal<string | null>(null);
  readonly figura = signal<NomeFigura>('fantasma');
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
    const frasi = this.frasi();
    if (!frasi.length) { this.programma(15_000); return; }
    this.ultimaFrase = this.pesca(frasi.length, this.ultimaFrase);
    const figure = temaDa(this.tema()).figure;
    this.ultimaFigura = this.pesca(figure.length, this.ultimaFigura);
    this.uscita.set(false);
    this.figura.set(figure[this.ultimaFigura]);
    this.frase.set(frasi[this.ultimaFrase]);
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
