import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Icone a tratto 1.75 in currentColor, disegnate per questo progetto. */
@Component({
  selector: 'app-icona',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display:inline-flex' },
  template: `
    <svg class="icona" viewBox="0 0 24 24" [style.width.px]="misura()" [style.height.px]="misura()">
      @switch (nome()) {
        @case ('prove') { <rect x="3" y="6" width="18" height="13" rx="1.5"/><path d="M3 7l9 6 9-6"/><circle cx="12" cy="15.5" r="2.2"/> }
        @case ('documento') { <path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/> }
        @case ('oggetto') { <circle cx="8" cy="15" r="4"/><path d="M11 12l8-8"/><path d="M16 7l3 3"/> }
        @case ('testimonianza') { <path d="M5 17V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 4Z"/><path d="M9 10h6"/> }
        @case ('foto') { <rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/> }
        @case ('audio') { <path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/> }
        @case ('video') { <rect x="3" y="6" width="13" height="12" rx="1.5"/><path d="M16 10l5-3v10l-5-3"/> }
        @case ('invitati') { <circle cx="8" cy="8" r="3"/><path d="M3 19c.6-3 2.6-4.8 5-4.8s4.4 1.8 5 4.8"/><path d="M15 7h6M15 11h6M15 15h4"/> }
        @case ('resoconto') { <path d="M4 20h16"/><path d="M7 16v-4M12 16V6M17 16V9"/> }
        @case ('volti') { <circle cx="9" cy="8" r="3.2"/><path d="M3 20c.8-3.4 3.2-5.4 6-5.4s5.2 2 6 5.4"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.6c2.4.2 4.2 2 5 5"/> }
        @case ('taccuino') { <path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/> }
        @case ('accusa') { <path d="M5 20 15 10"/><path d="M13 4l7 7-3 3-7-7z"/><path d="M3 21h8"/> }
        @case ('candela') { <path d="M12 3c-1.6 2-2.2 3.4-2.2 4.4a2.2 2.2 0 0 0 4.4 0c0-1-.6-2.4-2.2-4.4Z"/><rect x="8" y="11" width="8" height="10" rx="1"/> }
        @case ('corvo') { <path d="M3 15c3-1 5-4 6-7 1.5 1.5 3 2 5 2l3-3 1 3 3 1-3 2c0 4-3 6-7 6-3 0-5-1-6-3l-2 1Z"/> }
        @case ('chiudi') { <path d="M6 6l12 12M18 6 6 18"/> }
        @case ('onda') { <rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/> }
        @case ('scene') { <path d="M4 5h16v14H4z"/><path d="M4 9h16M9 5v4M15 5v4"/> }
        @case ('caso') { <path d="M3 7h7l2 2h9v10H3z"/> }
        @case ('squadre') { <path d="M3 15c3-1 5-4 6-7 1.5 1.5 3 2 5 2l3-3 1 3 3 1-3 2c0 4-3 6-7 6-3 0-5-1-6-3l-2 1Z"/> }
        @case ('strumenti') { <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/> }
        @case ('avanti') { <path d="M6 5l8 7-8 7z"/><path d="M18 5v14"/> }
        @case ('piu') { <path d="M12 5v14M5 12h14"/> }
        @case ('esci') { <path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/> }
        @case ('indietro') { <path d="M15 18l-6-6 6-6"/> }
        @case ('lucchetto') { <rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/> }
        @case ('copia') { <rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/> }
      }
    </svg>
  `,
})
export class Icona {
  readonly nome = input.required<string>();
  readonly misura = input(22);
}

/** Sigillo di ceralacca, usato sulle prove chiuse e nel foglio del codice. */
@Component({
  selector: 'app-sigillo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display:inline-block' },
  template: `
    <svg viewBox="0 0 100 100" width="100%" height="100%">
      <path fill="var(--sigillo)" d="M50 4c6 0 9 5 14 6s11-2 15 2 2 10 5 14 9 6 9 12-5 9-5 14 4 10 1 15-10 4-13 8-3 10-8 12-11-1-16 0-9 6-15 3-6-9-11-12-12-2-14-7 3-10 1-15-8-8-6-13 8-7 9-12-2-12 3-15 11 0 15-3 6-9 11-10Z"/>
      <circle cx="50" cy="50" r="29" fill="none" stroke="var(--sigillo-luce)" stroke-width="2.5"/>
      <path fill="none" stroke="var(--sigillo-segno)" stroke-width="3" stroke-linecap="round" d="M57 34a17 17 0 1 0 0 32 13 13 0 1 1 0-32Z"/>
    </svg>
  `,
})
export class Sigillo {}
