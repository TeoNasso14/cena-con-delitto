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
        @case ('vittoriano') {
          <rect width="200" height="180" fill="#f3ead8"/>
          <g stroke="#c2b190" stroke-width="2"><path d="M0 40h200M0 64h200M0 88h200M0 112h200M0 136h200M0 160h200"/></g>
          <path d="M34 0v180" stroke="#8e1b24" stroke-width="2" opacity="0.6"/>
          <circle cx="104" cy="84" r="38" fill="#e6d8b8" fill-opacity="0.7" stroke="#2a1f17" stroke-width="8"/>
          <path d="M132 112l34 34" stroke="#2a1f17" stroke-width="12" stroke-linecap="round"/>
        }
        @case ('viaggio') {
          <rect width="200" height="180" fill="#0e1626"/><circle cx="100" cy="62" r="36" fill="#eee6d4"/>
          <path d="M100 62V36M100 62l20 12" stroke="#0e1626" stroke-width="5" stroke-linecap="round"/>
          <rect y="118" width="200" height="2" fill="#c9a24a"/><path d="M80 180l18-60M120 180l-18-60" stroke="#c9a24a" stroke-width="4"/>
          <path d="M86 160h28M91 140h18M95 128h10" stroke="#c9a24a" stroke-width="3"/>
        }
        @case ('gatsby') {
          <rect width="200" height="180" fill="#0d0c0a"/>
          <g stroke="#d6b25e" stroke-width="2"><path d="M100 180L20 40M100 180L50 30M100 180L80 26M100 180L120 26M100 180L150 30M100 180L180 40"/></g>
          <path d="M60 180v-20a40 40 0 0 1 80 0v20" fill="none" stroke="#d6b25e" stroke-width="5"/>
          <path d="M92 70h16v14c6 4 8 8 8 14v40H84V98c0-6 2-10 8-14z" fill="#0d0c0a" stroke="#d6b25e" stroke-width="3"/>
        }
        @case ('natale') {
          <rect width="200" height="180" fill="#0f1d17"/><circle cx="140" cy="54" r="30" fill="#f4ecdc"/>
          <path d="M0 180V128l36-30 36 30v-10h14v-12l34-28 34 28v22l30-24 16 12v64z" fill="#15261e"/>
          <path d="M0 128l36-30 36 30M86 106l34-28 34 28M154 128l30-24 16 12" fill="none" stroke="#f4ecdc" stroke-width="5" stroke-linejoin="round"/>
          <g fill="#ffc86b"><rect x="30" y="138" width="12" height="14"/><rect x="112" y="118" width="14" height="16"/></g>
          <g fill="#ffffff"><circle cx="24" cy="30" r="2"/><circle cx="70" cy="56" r="2"/><circle cx="96" cy="20" r="2"/><circle cx="182" cy="96" r="2"/></g>
        }
        @case ('giallo') {
          <rect width="200" height="180" fill="#a6a84a"/>
          <g fill="none" stroke="#8d8f39" stroke-width="4"><circle cx="30" cy="30" r="20"/><circle cx="110" cy="30" r="20"/><circle cx="190" cy="30" r="20"/><circle cx="70" cy="70" r="20"/><circle cx="150" cy="70" r="20"/></g>
          <rect y="142" width="200" height="38" fill="#20150d"/>
          <path d="M56 86c0-16 20-24 44-24s44 8 44 24v8h-18v-8H74v8H56z" fill="#20150d"/><path d="M74 96h52l14 46H60z" fill="#e8762a"/>
          <circle cx="100" cy="118" r="16" fill="#20150d"/><circle cx="100" cy="118" r="6" fill="#f4e6cf"/>
        }
        @case ('nilo') {
          <rect width="200" height="180" fill="#f4e4c6"/><circle cx="108" cy="88" r="46" fill="#e58a2b"/>
          <rect y="112" width="200" height="68" fill="#0b6a6b"/>
          <g stroke="#f4e4c6" stroke-width="3" stroke-linecap="round"><path d="M84 124h48M96 138h22M70 152h34M122 152h30"/></g>
          <g fill="#2a1a0c"><path d="M28 106h82l-8 9H36z"/><rect x="38" y="94" width="62" height="12"/><rect x="62" y="74" width="9" height="20"/>
            <path d="M156 114c4-22 5-38 2-56l5-1c4 20 3 38-2 57z"/><path d="M160 58c-10-13-24-14-36-5 13-2 24 0 36 5zM160 58c9-14 26-15 38-3-14-3-26-2-38 3zM160 58c-11-1-21 5-25 20 7-11 14-16 25-20zM160 58c11-1 22 7 26 21-7-11-15-17-26-21z"/></g>
        }
        @case ('venezia') {
          <rect width="200" height="180" fill="#2a0a14"/><circle cx="100" cy="86" r="62" fill="#d9b15a"/>
          <path d="M58 180c4-44 18-68 42-68s38 24 42 68z" fill="#1f0710"/>
          <path d="M60 78c-12-6-18-16-20-26 12 5 32 8 60 8s48-3 60-8c-2 10-8 20-20 26z" fill="#1f0710"/>
          <path d="M74 62c0-14 11-24 26-24s26 10 26 24c0 16-3 26-8 34l-10 17c-4 4-12 4-16 0l-10-17c-5-8-8-18-8-34z" fill="#f6ecd8"/>
          <path d="M82 66c4-4 11-4 14 0-3 4-10 4-14 0zM104 66c3-4 10-4 14 0-4 4-11 4-14 0z" fill="#1f0710"/>
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
