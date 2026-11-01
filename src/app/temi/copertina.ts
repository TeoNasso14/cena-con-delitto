import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * L'illustrazione di copertina di una serata nell'elenco della regia: piatta, nei colori del suo tema,
 * dentro la cornice gialla del marchio. Ogni tema nuovo aggiunge qui la sua; un tema senza copertina usa quella generica.
 */
@Component({
  selector: 'app-copertina',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  styles: `
    :host { display: block; }
    svg { display: block; width: 100%; height: 100%; }
  `,
  template: `
    <svg viewBox="0 0 200 180" preserveAspectRatio="xMidYMid slice">
      @switch (tema()) {
        @case ('halloween') {
          <rect width="200" height="180" fill="#0e0b14"/><circle cx="132" cy="62" r="40" fill="#ff7a1a"/><circle cx="146" cy="52" r="7" fill="#e5650c"/>
          <path d="M0 180V132h26v-22l20-26 20 26v16h22V98l14-22 14 22v38h84v44z" fill="#05040a"/>
          <rect x="52" y="116" width="7" height="9" fill="#ff7a1a"/><rect x="98" y="104" width="7" height="11" fill="#ff7a1a"/>
          <path d="M34 40q6-6 12 0q6-6 12 0" stroke="#f5f5f1" stroke-width="2" fill="none"/>
        }
        @case ('noir') {
          <rect width="200" height="180" fill="#0b0b0b"/>
          <g fill="#b8bcc2"><rect y="24" width="200" height="7"/><rect y="42" width="200" height="7"/><rect y="60" width="200" height="7"/><rect y="78" width="200" height="7"/></g>
          <path d="M60 130h80l-8-24H68zM44 132h112v8H44z" fill="#0b0b0b" stroke="#b8bcc2" stroke-width="2"/><circle cx="150" cy="158" r="7" fill="#d0213b"/>
        }
        @default {
          <!-- Una busta sigillata: il caso ancora da aprire, finché il tema non ha la sua copertina. -->
          <rect width="200" height="180" fill="#242424"/>
          <path d="M44 52h112v80H44z" fill="none" stroke="#f6c800" stroke-width="5" stroke-linejoin="round"/>
          <path d="M44 52l56 44 56-44" fill="none" stroke="#f6c800" stroke-width="5" stroke-linejoin="round"/>
          <circle cx="100" cy="96" r="14" fill="#8e1b24"/>
        }
      }
    </svg>
  `,
})
export class Copertina {
  readonly tema = input<string>('');
}
