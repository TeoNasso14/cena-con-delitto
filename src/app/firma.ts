import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Firma in fondo alle pagine. Non compare sul proiettore. */
@Component({
  selector: 'app-firma',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'contentinfo' },
  styles: `
    :host { display: block; padding: 28px 20px 12px; text-align: center; font-size: 13px; color: var(--testo-2); letter-spacing: 0.02em; }
    b { color: var(--testo-1); font-weight: 600; }
    .sep { color: var(--accento); margin: 0 8px; }
  `,
  template: `Developed by <b>Claude</b><span class="sep" aria-hidden="true">·</span>Architect by <b>Teo</b>`,
})
export class Firma {}
