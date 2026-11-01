import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, ErroreApi } from '../api';
import { Firma } from '../firma';
import { Icona } from '../icona';
import { Sessione } from '../sessione';
import { applicaTema } from '../temi/applica';
import { temaDa } from '../temi/catalogo';

interface SerataElenco {
  id: number; titolo: string; slug: string; tema: string; stato: 'bozza' | 'in_corso' | 'in_pausa' | 'chiusa';
  archiviata: boolean; creata: string; aggiornata: string;
}

/** Le serate della regia: crea, apri, duplica, archivia, riattiva, cambia l'indirizzo, elimina. */
@Component({
  selector: 'app-serate',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, Icona, Firma],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .pagina { max-width: 960px; margin: 0 auto; padding: 28px max(16px, min(3vw, 40px)) 64px; display: grid; gap: 32px; }
    .barra { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .marchio { font-family: var(--titoli); font-size: 30px; line-height: 1; }
    .serata { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    @media (min-width: 720px) { .serata { grid-template-columns: minmax(0, 1fr) auto; } }
    .serata h3 { font-family: var(--titoli); font-size: 26px; font-weight: 700; line-height: 1.05; text-wrap: balance; }
    .serata .r-azioni { justify-content: flex-start; }
    @media (min-width: 720px) { .serata .r-azioni { justify-content: flex-end; } }
    .indirizzo { overflow-wrap: anywhere; }
    .altro { grid-column: 1 / -1; display: grid; gap: 18px; padding-top: 14px; border-top: 1px solid var(--fondo-3); }
    .altro .r-modulo { gap: 10px; }
    .in-linea { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; }
    .in-linea .etichetta { flex: 1 1 260px; }
    .avviso { margin: 0; }
  `,
  template: `
    <main class="pagina">
      <div class="barra">
        <span class="marchio">Regia</span>
        <button class="bottone bottone--piccolo" type="button" (click)="sessione.esci()"><app-icona nome="esci" />Esci</button>
      </div>
      <header class="r-testa">
        <div><h1>Le tue serate</h1><p>Ogni serata ha il suo caso, le sue squadre e il suo indirizzo per entrare. Aprine una per prepararla o condurla.</p></div>
        @if (!nuova()) { <button class="bottone bottone--pieno" type="button" (click)="nuova.set(true)"><app-icona nome="piu" />Nuova serata</button> }
      </header>

      @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }

      @if (nuova()) {
        <form class="r-scheda r-modulo" (ngSubmit)="crea()">
          <label class="etichetta" for="nuovo-titolo">Titolo della serata <small>Lo vedono le squadre e il proiettore. Puoi cambiarlo dopo.</small>
            <input id="nuovo-titolo" name="nuovo-titolo" class="campo" maxlength="120" required [(ngModel)]="titolo">
          </label>
          <div class="r-azioni">
            <button class="bottone bottone--pieno" type="submit" [disabled]="!titolo.trim()">Crea la serata</button>
            <button class="bottone" type="button" (click)="nuova.set(false)">Annulla</button>
          </div>
        </form>
      }

      @if (!caricate()) { <p class="secondario" role="status">Carico le serate…</p> }
      @else {
        <ul class="r-elenco">
          @for (s of attive(); track s.id) {
            <ng-container *ngTemplateOutlet="voce; context: { $implicit: s }" />
          } @empty {
            <li class="r-vuoto">Nessuna serata aperta. Creane una nuova{{ archiviate().length ? ', oppure duplica o riattiva una di quelle archiviate' : '' }}.</li>
          }
        </ul>

        @if (archiviate().length) {
          <section class="r-blocco" aria-labelledby="t-archiviate">
            <h2 id="t-archiviate">Archiviate</h2>
            <p class="secondario">Si consultano in sola lettura e le squadre non possono entrare. Riattivale per usarle di nuovo, o duplicale per una serata nuova.</p>
            <ul class="r-elenco">
              @for (s of archiviate(); track s.id) {
                <ng-container *ngTemplateOutlet="voce; context: { $implicit: s }" />
              }
            </ul>
          </section>
        }
      }

      <ng-template #voce let-s>
        <li class="r-voce serata">
          <div>
            <h3>{{ s.titolo }}</h3>
            <p>{{ nomeTema(s.tema) }}, {{ s.archiviata ? 'archiviata' : stati[s.stato] }}, modificata {{ quando(s.aggiornata) }}</p>
            <p class="indirizzo">Indirizzo per squadre e proiettore: {{ origine }}/s/{{ s.slug }}</p>
          </div>
          <div class="r-azioni">
            <a class="bottone bottone--piccolo" [class.bottone--pieno]="!s.archiviata" [routerLink]="['/regia/s', s.id]">{{ s.archiviata ? 'Consulta' : 'Apri' }}</a>
            <button class="bottone bottone--piccolo" type="button" [disabled]="occupato()" (click)="duplica(s)"><app-icona nome="copia" />Duplica</button>
            <button class="bottone bottone--piccolo" type="button" [disabled]="occupato()" (click)="archivia(s, !s.archiviata)">{{ s.archiviata ? 'Riattiva' : 'Archivia' }}</button>
            <button class="r-link" type="button" [attr.aria-expanded]="altro() === s.id" (click)="apriAltro(s)">Indirizzo ed eliminazione</button>
          </div>
          @if (altro() === s.id) {
            <div class="altro">
              <form class="r-modulo" (ngSubmit)="salvaIndirizzo(s)">
                <div class="in-linea">
                  <label class="etichetta" [for]="'slug-' + s.id">Indirizzo <small>{{ origine }}/s/…, lettere minuscole, numeri e trattini.</small>
                    <input class="campo" [id]="'slug-' + s.id" name="slug" maxlength="60" [(ngModel)]="slug">
                  </label>
                  <button class="bottone bottone--piccolo" type="submit" [disabled]="!slug.trim() || slug === s.slug">Salva l'indirizzo</button>
                </div>
              </form>
              <div class="r-modulo">
                <p class="secondario">Eliminare cancella per sempre caso, squadre, accessi e allegati di questa serata. Se pensi di riusarla, archiviala.</p>
                <div class="in-linea">
                  <label class="etichetta" [for]="'elimina-' + s.id">Per eliminare scrivi il titolo: {{ s.titolo }}
                    <input class="campo" [id]="'elimina-' + s.id" name="conferma" autocomplete="off" [(ngModel)]="conferma">
                  </label>
                  <button class="bottone bottone--piccolo bottone--pericolo" type="button" [disabled]="conferma.trim() !== s.titolo.trim() || occupato()" (click)="elimina(s)">Elimina la serata</button>
                </div>
              </div>
            </div>
          }
        </li>
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
  readonly stati: Record<string, string> = { bozza: 'in preparazione', in_corso: 'in corso', in_pausa: 'in pausa', chiusa: 'chiusa' };
  readonly serate = signal<SerataElenco[]>([]);
  readonly caricate = signal(false);
  readonly attive = computed(() => this.serate().filter((s) => !s.archiviata));
  readonly archiviate = computed(() => this.serate().filter((s) => s.archiviata));
  readonly nuova = signal(false);
  readonly altro = signal<number | null>(null);
  readonly occupato = signal(false);
  readonly errore = signal('');
  titolo = '';
  slug = '';
  conferma = '';

  ngOnInit() {
    // Fuori da una serata la regia ha l'aspetto predefinito.
    applicaTema(null);
    this.api.scegliSerata(null);
    this.carica();
  }

  nomeTema(id: string) { return temaDa(id).nome; }
  quando(d: string) {
    const giorno = new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    return giorno === new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) ? 'oggi' : `il ${giorno}`;
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
