import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, ErroreApi } from '../api';
import { Firma } from '../firma';
import { Testata } from '../pagine/testata';
import { Sessione } from '../sessione';
import { applicaTema } from '../temi/applica';
import { temaDa } from '../temi/catalogo';
import { Copertina } from '../temi/copertina';

interface SerataElenco {
  id: number; titolo: string; slug: string; tema: string; stato: 'bozza' | 'in_corso' | 'in_pausa' | 'chiusa';
  archiviata: boolean; creata: string; aggiornata: string; squadre: number;
}

/**
 * Le serate della regia, nel marchio Il Movente: ogni serata è un volume numerato della collana, con la copertina del suo tema.
 * Crea, apri, duplica, archivia, riattiva, cambia l'indirizzo, elimina.
 */
@Component({
  selector: 'app-serate',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, Copertina, Firma, Testata],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .pagina { max-width: 1440px; margin: 0 auto; padding: 0 max(16px, min(3vw, 48px)) 48px; }
    .apertura { padding: 28px 0 22px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--filetto); }
    .apertura h1 { font: 400 clamp(40px, 5vw, 56px)/1 var(--titoli); }
    .apertura p { margin-top: 10px; color: var(--testo-2); font-size: 17px; }
    .nuova { margin-top: 20px; max-width: 640px; }
    .avviso { margin-top: 20px; }

    .parete { list-style: none; margin: 28px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 32px 28px; }
    .copertina { position: relative; display: flex; flex-direction: column; aspect-ratio: 9 / 10; padding: 0 11px; background: var(--accento); color: var(--su-accento);
      border: 1.5px solid var(--su-accento); border-radius: 2px; text-decoration: none; }
    .fascia { min-height: 40px; display: flex; align-items: center; gap: 10px; }
    .numero { font: 400 26px/1 var(--titoli); }
    .numero small { margin-right: 2px; font: 700 14px/1 var(--corpo); }
    .stato { display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border: 1.5px solid var(--su-accento); border-radius: 2px; font: 700 12.5px/1.2 var(--corpo); }
    .stato--vivo { background: var(--su-accento); color: var(--accento); }
    .stato--vivo::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--accento); }
    /* Il colophon della collana: il marchio ripetuto in piccolo, nero con il nome in giallo. */
    .collana { margin-left: auto; padding: 3px 7px; border-radius: 2px; background: var(--su-accento); color: var(--accento); font: 700 12.5px/1.2 var(--corpo); }
    .arte { flex: 1; min-height: 0; border: 1.5px solid var(--su-accento); overflow: hidden; background: var(--su-accento); }
    .arte app-copertina { height: 100%; }
    .copertina h2 { min-height: 76px; display: flex; align-items: center; font: 400 24px/1.05 var(--titoli); text-wrap: balance; overflow-wrap: anywhere; }
    @media (hover: hover) { a.copertina:hover { outline: 2px solid var(--accento); outline-offset: 3px; } }
    @media (hover: hover) and (prefers-reduced-motion: no-preference) { .parete a.copertina:hover { transform: translateY(-4px); } }

    .dati { padding: 14px 2px 0; display: grid; gap: 3px; }
    .dati .tema { font-weight: 700; }
    .dati .tema span { font-weight: 400; color: var(--testo-2); margin-left: 6px; }
    .dati .indirizzo { font-weight: 600; font-size: 14px; overflow-wrap: anywhere; }
    .dati .quando { color: var(--testo-2); font-size: 14px; }
    .comandi { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .comandi .bottone { min-height: 40px; padding: 0 16px; font-size: 15px; }
    .dati .r-link { justify-self: start; margin-top: 4px; padding-left: 0; padding-right: 0; font-size: 14px; }
    .altro { display: grid; gap: 16px; margin-top: 12px; padding: 14px; background: var(--fondo-2); border: 1px solid var(--filetto); border-radius: 2px; }
    .altro p { font-size: 14px; color: var(--testo-2); }

    .vuota { width: 100%; aspect-ratio: 9 / 10; display: flex; flex-direction: column; padding: 0 11px 11px; background: var(--fondo-2); color: var(--testo-2);
      border: 1px solid var(--filetto); border-radius: 2px; font: inherit; text-align: center; cursor: pointer; }
    .vuota .fascia { width: 100%; }
    .vuota .dentro { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; padding: 0 20px; border: 1px dashed var(--filetto); }
    .vuota .dentro b { font: 400 60px/1 var(--titoli); color: var(--filetto); }
    @media (hover: hover) { .vuota:hover { border-color: var(--accento); color: var(--testo-1); } .vuota:hover .dentro b { color: var(--accento); } }

    .sezione { display: flex; align-items: baseline; gap: 14px; margin: 40px 0 16px; padding-top: 18px; border-top: 1px solid var(--filetto); }
    .sezione h2 { font: 400 28px/1 var(--titoli); }
    .sezione span { color: var(--testo-2); }
    .archiviate { list-style: none; margin: 0; padding: 0; display: grid; gap: 20px; }
    .archiviata { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 20px; align-items: start; }
    /* Spenta per scelta, non sbiadita: cornice grigia, numero spento, illustrazione in grigio. */
    .archiviata .copertina { aspect-ratio: 3 / 4; padding: 0 7px 7px; background: var(--fondo-3); color: var(--testo-2); border-color: var(--filetto); }
    .archiviata .copertina .arte { border-color: var(--filetto); }
    .archiviata .copertina .fascia { min-height: 30px; }
    .archiviata .copertina .numero { font-size: 19px; }
    .archiviata .arte { filter: grayscale(1); }
    .archiviata h3 { font: 400 24px/1.05 var(--titoli); text-wrap: balance; }
    .archiviata .dati { padding-top: 2px; }
    @media (prefers-reduced-motion: no-preference) { .copertina, .vuota { transition: transform 220ms var(--curva-uscita), outline-color 160ms var(--curva-uscita), border-color 160ms var(--curva-uscita); } }
    .caricamento { margin-top: 28px; }
    .a-sinistra { justify-self: start; }
  `,
  template: `
    <app-testata />

    <main class="pagina">
      <div class="apertura">
        <div><h1>Le tue serate</h1><p>Ogni serata ha il suo caso, le sue squadre e il suo indirizzo per entrare.</p></div>
        @if (!nuova()) { <button class="bottone bottone--pieno" type="button" (click)="nuova.set(true)">Nuova serata</button> }
      </div>

      @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }

      @if (nuova()) {
        <form class="r-scheda r-modulo nuova" (ngSubmit)="crea()">
          <label class="etichetta" for="nuovo-titolo">Titolo della serata <small>Lo vedono le squadre e il proiettore. Puoi cambiarlo dopo.</small>
            <input id="nuovo-titolo" name="nuovo-titolo" class="campo" maxlength="120" required [(ngModel)]="titolo">
          </label>
          <div class="r-azioni">
            <button class="bottone bottone--pieno" type="submit" [disabled]="!titolo.trim() || occupato()">Crea la serata</button>
            <button class="bottone" type="button" (click)="nuova.set(false)">Annulla</button>
          </div>
        </form>
      }

      @if (!caricate()) { <p class="secondario caricamento" role="status">Carico le serate…</p> }
      @else {
        <ul class="parete" aria-label="Serate aperte">
          @for (s of attive(); track s.id) {
            <li>
              <a class="copertina" [routerLink]="['/regia/s', s.id]" [attr.aria-label]="'Apri ' + s.titolo">
                <span class="fascia">
                  <span class="numero"><small>N.</small>{{ volume(s) }}</span>
                  <span class="stato" [class.stato--vivo]="s.stato === 'in_corso'">{{ stati[s.stato] }}</span>
                  <span class="collana">Il Movente</span>
                </span>
                <span class="arte"><app-copertina [tema]="s.tema" /></span>
                <h2>{{ s.titolo }}</h2>
              </a>
              <ng-container *ngTemplateOutlet="dati; context: { $implicit: s }" />
            </li>
          }
          <li>
            <button class="vuota" type="button" (click)="nuova.set(true)">
              <span class="fascia"><span class="numero"><small>N.</small>{{ prossimo() }}</span></span>
              <span class="dentro"><b>N. {{ prossimo() }}</b><span>Il prossimo volume della collana. Dagli un titolo, poi scegli il tema e la copertina si disegna da sola.</span></span>
            </button>
          </li>
        </ul>

        @if (archiviate().length) {
          <section aria-labelledby="t-archiviate">
            <div class="sezione"><h2 id="t-archiviate">Archiviate</h2><span>{{ archiviate().length === 1 ? '1 serata' : archiviate().length + ' serate' }}</span></div>
            <ul class="archiviate">
              @for (s of archiviate(); track s.id) {
                <li class="archiviata">
                  <a class="copertina" [routerLink]="['/regia/s', s.id]" [attr.aria-label]="'Consulta ' + s.titolo">
                    <span class="fascia"><span class="numero"><small>N.</small>{{ volume(s) }}</span></span>
                    <span class="arte"><app-copertina [tema]="s.tema" /></span>
                  </a>
                  <div>
                    <h3>{{ s.titolo }}</h3>
                    <ng-container *ngTemplateOutlet="dati; context: { $implicit: s }" />
                  </div>
                </li>
              }
            </ul>
          </section>
        }
      }

      <ng-template #dati let-s>
        <div class="dati">
          <span class="tema">{{ nomeTema(s.tema) }}<span>{{ s.archiviata ? 'archiviata' : squadre(s.squadre) }}</span></span>
          <span class="indirizzo">{{ origine }}/s/{{ s.slug }}</span>
          <span class="quando">Modificata {{ quando(s.aggiornata) }}</span>
          <div class="comandi">
            <a class="bottone bottone--pieno" [routerLink]="['/regia/s', s.id]">{{ s.archiviata ? 'Consulta' : 'Apri' }}</a>
            <button class="bottone" type="button" [disabled]="occupato()" (click)="duplica(s)">Duplica</button>
            <button class="bottone" type="button" [disabled]="occupato()" (click)="archivia(s, !s.archiviata)">{{ s.archiviata ? 'Riattiva' : 'Archivia' }}</button>
          </div>
          <button class="r-link" type="button" [attr.aria-expanded]="altro() === s.id" (click)="apriAltro(s)">Indirizzo ed eliminazione</button>
          @if (altro() === s.id) {
            <div class="altro">
              <form class="r-modulo" (ngSubmit)="salvaIndirizzo(s)">
                <label class="etichetta" [for]="'slug-' + s.id">Indirizzo <small>{{ origine }}/s/…, lettere minuscole, numeri e trattini.</small>
                  <input class="campo" [id]="'slug-' + s.id" name="slug" maxlength="60" [(ngModel)]="slug">
                </label>
                <button class="bottone bottone--piccolo a-sinistra" type="submit" [disabled]="!slug.trim() || slug === s.slug">Salva l'indirizzo</button>
              </form>
              <div class="r-modulo">
                <p>Eliminare cancella per sempre caso, squadre, accessi e allegati di questa serata. Se pensi di riusarla, archiviala.</p>
                <label class="etichetta" [for]="'elimina-' + s.id">Per eliminare scrivi il titolo: {{ s.titolo }}
                  <input class="campo" [id]="'elimina-' + s.id" name="conferma" autocomplete="off" [(ngModel)]="conferma">
                </label>
                <button class="bottone bottone--piccolo bottone--pericolo a-sinistra" type="button"
                  [disabled]="conferma.trim() !== s.titolo.trim() || occupato()" (click)="elimina(s)">Elimina la serata</button>
              </div>
            </div>
          }
        </div>
      </ng-template>

      <app-firma />
    </main>
  `,
})
export class SerateVista implements OnInit {
  private api = inject(Api);
  private router = inject(Router);
  readonly sessione = inject(Sessione);
  readonly origine = location.origin.replace(/^https?:\/\//, '');
  readonly stati: Record<string, string> = { bozza: 'In preparazione', in_corso: 'In corso', in_pausa: 'In pausa', chiusa: 'Chiusa' };
  readonly serate = signal<SerataElenco[]>([]);
  readonly caricate = signal(false);
  readonly attive = computed(() => this.serate().filter((s) => !s.archiviata));
  readonly archiviate = computed(() => this.serate().filter((s) => s.archiviata));
  /** Il numero di volume: l'ordine in cui le serate sono nate. */
  private readonly volumi = computed(() => new Map([...this.serate()].sort((a, b) => a.id - b.id).map((s, i) => [s.id, i + 1])));
  readonly prossimo = computed(() => this.serate().length + 1);
  readonly nuova = signal(false);
  readonly altro = signal<number | null>(null);
  readonly occupato = signal(false);
  readonly errore = signal('');
  titolo = '';
  slug = '';
  conferma = '';

  ngOnInit() {
    // Fuori da una serata vale il marchio, Il Movente.
    applicaTema('marchio');
    this.api.scegliSerata(null);
    this.sessione.carica();
    this.carica();
  }

  volume(s: SerataElenco) { return this.volumi().get(s.id) ?? 0; }
  nomeTema(id: string) { return temaDa(id).nome; }
  squadre(n: number) { return n === 0 ? 'nessuna squadra' : n === 1 ? '1 squadra' : `${n} squadre`; }
  quando(d: string) {
    const fmt = (x: Date) => x.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    const giorno = fmt(new Date(d));
    return giorno === fmt(new Date()) ? 'oggi' : `il ${giorno}`;
  }

  async carica() {
    try {
      this.serate.set((await this.api.get<{ serate: SerataElenco[] }>('/api/regia/serate')).serate);
      this.caricate.set(true);
    } catch (e) {
      if (e instanceof ErroreApi && e.stato === 401) await this.router.navigateByUrl('/accesso');
      else this.errore.set((e as Error).message);
    }
  }

  /** Esegue un'azione sulle serate, ricarica l'elenco e mostra l'eventuale errore. */
  private async fai<T>(azione: () => Promise<T>): Promise<T | undefined> {
    this.errore.set('');
    this.occupato.set(true);
    try {
      const r = await azione();
      await this.carica();
      return r;
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Operazione non riuscita.');
      return undefined;
    } finally {
      this.occupato.set(false);
    }
  }

  async crea() {
    const r = await this.fai(() => this.api.post<{ id: number }>('/api/regia/serate', { titolo: this.titolo.trim() }));
    if (r) {
      this.titolo = '';
      this.nuova.set(false);
      await this.router.navigate(['/regia/s', r.id, 'caso']);
    }
  }
  duplica(s: SerataElenco) { this.fai(() => this.api.post(`/api/regia/serate/${s.id}/duplica`)); }
  archivia(s: SerataElenco, archiviata: boolean) { this.fai(() => this.api.post(`/api/regia/serate/${s.id}/archivia`, { archiviata })); }
  apriAltro(s: SerataElenco) {
    this.altro.set(this.altro() === s.id ? null : s.id);
    this.slug = s.slug;
    this.conferma = '';
  }
  async salvaIndirizzo(s: SerataElenco) {
    const r = await this.fai(() => this.api.put<{ slug: string }>(`/api/regia/serate/${s.id}`, { slug: this.slug }));
    if (r) this.slug = r.slug;
  }
  async elimina(s: SerataElenco) {
    const r = await this.fai(() => this.api.post(`/api/regia/serate/${s.id}/elimina`, { conferma: this.conferma }));
    if (r) this.altro.set(null);
  }
}
