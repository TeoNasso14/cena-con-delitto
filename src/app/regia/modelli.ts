import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, ErroreApi } from '../api';
import { Firma } from '../firma';
import { Testata } from '../pagine/testata';
import { Sessione } from '../sessione';
import { applicaTema } from '../temi/applica';
import { temaDa, TEMI } from '../temi/catalogo';

interface Segnaposto { etichetta: string; proposte: Record<string, string[]>; usato: boolean }
interface Modello {
  id: string; nome: string; descrizione: string; temi: string[]; privato: boolean; minimo: number;
  fasi: Array<{ nome: string; minuti: number | null }>;
  segnaposto: { luogo: Segnaposto; vittima: Segnaposto; anno: Segnaposto };
  sospetti: Array<{ chiave: string; ruolo: string; nomi: Record<string, string[]>; colpevole: boolean }>;
}

/** Il primo nome proposto per il tema, oppure per tutti i temi. */
const proposta = (p: Record<string, string[]>, tema: string) => (p[tema] ?? p['*'] ?? Object.values(p)[0] ?? [])[0] ?? '';

/** Una serata nuova da un modello: la regia sceglie quanto vuole, il resto lo propone il sito. */
@Component({
  selector: 'app-modelli',
  imports: [FormsModule, RouterLink, Firma, Testata],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .pagina { max-width: 1120px; margin: 0 auto; padding: 0 max(16px, min(3vw, 48px)) 48px; }
    .apertura { padding: 28px 0 22px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--filetto); }
    .apertura h1 { font: 400 clamp(38px, 5vw, 54px)/1 var(--titoli); text-wrap: balance; }
    .apertura p { margin-top: 10px; color: var(--testo-2); font-size: 17px; max-width: 70ch; }
    .sezione { font: 400 26px/1.1 var(--titoli); margin: 28px 0 12px; }
    .modelli { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .modello { width: 100%; height: 100%; display: grid; align-content: start; gap: 8px; padding: 18px; text-align: left; border: 1px solid var(--filetto); border-radius: 2px; background: var(--fondo-2); color: var(--testo-1); font: inherit; cursor: pointer; }
    .modello[aria-pressed="true"] { border-color: var(--accento); }
    .modello b { font: 400 24px/1.1 var(--titoli); }
    .modello span { color: var(--testo-2); font-size: 15px; }
    @media (hover: hover) { .modello:hover { background: var(--fondo-3); } }
    form { margin-top: 12px; display: grid; gap: 20px; }
    .griglia { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; }
    .nota { color: var(--testo-2); font-size: 15px; max-width: 70ch; }
    .elimina { margin-top: 8px; }
    input[type="range"] { width: 100%; accent-color: var(--accento); }
  `,
  template: `
    <app-testata casa="/regia" />
    <main class="pagina">
      <div class="apertura">
        <div><h1>Una serata da un modello</h1><p>Un caso pronto da adattare: scegli nomi, luogo, grandezza e difficoltà. Dopo è una serata come le altre e puoi cambiare tutto.</p></div>
        <a class="bottone" routerLink="/regia">Torna alle serate</a>
      </div>
      @if (errore()) { <p class="avviso avviso--errore" role="alert" style="margin-top:20px">{{ errore() }}</p> }

      @if (pronti().length) {
        <h2 class="sezione">I modelli pronti</h2>
        <ul class="modelli">
          @for (m of pronti(); track m.id) {
            <li><button class="modello" type="button" [attr.aria-pressed]="scelto()?.id === m.id" (click)="scegli(m)"><b>{{ m.nome }}</b><span>{{ m.descrizione }}</span></button></li>
          }
        </ul>
      } @else if (!errore()) { <p class="secondario" role="status" style="margin-top:20px">Carico i modelli…</p> }

      @if (miei().length) {
        <h2 class="sezione">I tuoi modelli</h2>
        <ul class="modelli">
          @for (m of miei(); track m.id) {
            <li>
              <button class="modello" type="button" [attr.aria-pressed]="scelto()?.id === m.id" (click)="scegli(m)"><b>{{ m.nome }}</b><span>{{ m.descrizione || (m.sospetti.length + ' personaggi, ' + m.fasi.length + ' fasi') }}</span></button>
              <button class="r-link elimina" type="button" (click)="elimina(m)">{{ daEliminare() === m.id ? 'Sì, elimina questo modello' : 'Elimina' }}</button>
            </li>
          }
        </ul>
      }

      @if (scelto(); as m) {
        <h2 class="sezione">{{ m.nome }}</h2>
        <form class="r-scheda r-modulo" (ngSubmit)="crea(m)">
          <div class="griglia">
            <label class="etichetta" for="mo-tema">Tema della serata
              <select id="mo-tema" name="mo-tema" class="campo" [ngModel]="tema()" (ngModelChange)="tema.set($event)">
                <optgroup label="Consigliati">@for (t of temi(m); track t.id) { @if (m.temi.includes(t.id)) { <option [value]="t.id">{{ t.nome }}</option> } }</optgroup>
                <optgroup label="Altri">@for (t of temi(m); track t.id) { @if (!m.temi.includes(t.id)) { <option [value]="t.id">{{ t.nome }}</option> } }</optgroup>
              </select>
            </label>
            <label class="etichetta" for="mo-titolo">Titolo <small>Se lo lasci vuoto lo scrive il modello.</small><input id="mo-titolo" name="mo-titolo" class="campo" maxlength="120" [(ngModel)]="titolo"></label>
            @if (m.segnaposto.luogo.usato) { <label class="etichetta" for="mo-luogo">{{ m.segnaposto.luogo.etichetta }}<input id="mo-luogo" name="mo-luogo" class="campo" maxlength="80" [(ngModel)]="luogo" [placeholder]="prop(m.segnaposto.luogo)"></label> }
            @if (m.segnaposto.vittima.usato) { <label class="etichetta" for="mo-vittima">{{ m.segnaposto.vittima.etichetta }}<input id="mo-vittima" name="mo-vittima" class="campo" maxlength="80" [(ngModel)]="vittima" [placeholder]="prop(m.segnaposto.vittima)"></label> }
            @if (m.segnaposto.anno.usato) { <label class="etichetta" for="mo-anno">{{ m.segnaposto.anno.etichetta }}<input id="mo-anno" name="mo-anno" class="campo" maxlength="80" [(ngModel)]="anno" [placeholder]="prop(m.segnaposto.anno)"></label> }
          </div>

          @if (!m.privato) {
            <div class="griglia">
              <label class="etichetta" for="mo-sosp">Sospetti: {{ sospetti() }} <small>Da {{ m.minimo }} a {{ m.sospetti.length }}. Più sospetti, più prove e più false piste.</small>
                <input id="mo-sosp" name="mo-sosp" type="range" [min]="m.minimo" [max]="m.sospetti.length" [ngModel]="sospetti()" (ngModelChange)="sospetti.set(+$event)">
              </label>
              <label class="etichetta" for="mo-diff">Difficoltà <small>Facile: indizi sui sigilli, niente false piste. Difficile: una prova in più.</small>
                <select id="mo-diff" name="mo-diff" class="campo" [(ngModel)]="difficolta">
                  <option [ngValue]="1">Facile</option>
                  <option [ngValue]="2">Media</option>
                  <option [ngValue]="3">Difficile</option>
                </select>
              </label>
              <label class="etichetta" for="mo-fasi">Fasi <small>{{ m.fasi[0].nome }}, {{ m.fasi[1].nome }}, {{ m.fasi[2].nome }}, {{ m.fasi[3].nome }}.</small>
                <select id="mo-fasi" name="mo-fasi" class="campo" [(ngModel)]="fasi">
                  <option [ngValue]="3">3 fasi, più corta</option>
                  <option [ngValue]="4">4 fasi</option>
                </select>
              </label>
              <label class="etichetta" for="mo-min">Minuti per fase <small>Vuoto: {{ minutiModello(m) }}.</small><input id="mo-min" name="mo-min" class="campo" type="number" min="1" max="600" [(ngModel)]="minuti"></label>
              <label class="etichetta" for="mo-colp">Colpevole <small>A sorte, lo sai solo se vai a leggere la soluzione.</small>
                <select id="mo-colp" name="mo-colp" class="campo" [(ngModel)]="colpevole">
                  <option value="sorte">A sorte</option>
                  @for (s of possibili(m); track s.chiave) { <option [value]="s.chiave">{{ nomi[s.chiave] || prop2(s.nomi) }}, {{ s.ruolo }}</option> }
                </select>
              </label>
            </div>
          }

          <div>
            <p class="nota" style="margin-bottom:10px">I nomi dei personaggi: quelli che lasci vuoti li propone il modello. Cambiano in tutti i testi.</p>
            <div class="griglia">
              @for (s of inGioco(m); track s.chiave) {
                <label class="etichetta" [for]="'mo-' + s.chiave">{{ s.ruolo }}<input [id]="'mo-' + s.chiave" [name]="'mo-' + s.chiave" class="campo" maxlength="80" [(ngModel)]="nomi[s.chiave]" [placeholder]="prop2(s.nomi)"></label>
              }
            </div>
          </div>
          @if (m.privato) { <p class="nota">I codici si rigenerano: se li avevi scritti su bigliettini o cartoncini, dovrai rifarli con quelli nuovi.</p> }
          <button class="bottone bottone--pieno" type="submit" style="justify-self:start" [disabled]="occupato()">{{ occupato() ? 'Preparo la serata…' : 'Crea la serata' }}</button>
        </form>
      }
      <app-firma />
    </main>
  `,
})
export class ModelliVista implements OnInit {
  private api = inject(Api);
  private router = inject(Router);
  readonly sessione = inject(Sessione);
  readonly modelli = signal<Modello[]>([]);
  readonly pronti = computed(() => this.modelli().filter((m) => !m.privato));
  readonly miei = computed(() => this.modelli().filter((m) => m.privato));
  readonly scelto = signal<Modello | null>(null);
  readonly tema = signal('halloween');
  readonly sospetti = signal(8);
  readonly errore = signal('');
  readonly occupato = signal(false);
  readonly daEliminare = signal<string | null>(null);
  titolo = ''; luogo = ''; vittima = ''; anno = '';
  difficolta: 1 | 2 | 3 = 2;
  fasi = 4;
  minuti: number | null = null;
  colpevole = 'sorte';
  nomi: Record<string, string> = {};

  async ngOnInit() {
    applicaTema('marchio');
    this.api.scegliSerata(null);
    this.sessione.carica();
    try {
      this.modelli.set((await this.api.get<{ modelli: Modello[] }>('/api/regia/modelli')).modelli);
    } catch (e) {
      if (e instanceof ErroreApi && e.stato === 401) await this.router.navigateByUrl('/regia/accedi');
      else this.errore.set((e as Error).message);
    }
  }

  /** Prima i temi consigliati dal modello, poi gli altri. */
  temi(m: Modello) { return [...TEMI].sort((a, b) => Number(m.temi.includes(b.id)) - Number(m.temi.includes(a.id))); }
  inGioco(m: Modello) { return m.privato ? m.sospetti : m.sospetti.slice(0, this.sospetti()); }
  possibili(m: Modello) { return this.inGioco(m).filter((s) => s.colpevole); }
  prop(s: Segnaposto) { return proposta(s.proposte, this.tema()); }
  prop2(n: Record<string, string[]>) { return proposta(n, this.tema()); }
  minutiModello(m: Modello) { return m.fasi.map((f) => f.minuti ?? 'senza limite').join(', '); }

  scegli(m: Modello) {
    this.scelto.set(m);
    const primo = m.temi.find((t) => temaDa(t).id === t) ?? 'halloween';
    this.tema.set(primo);
    this.sospetti.set(m.sospetti.length);
    this.fasi = m.fasi.length >= 4 ? 4 : m.fasi.length;
    this.colpevole = 'sorte';
    this.nomi = {};
    this.titolo = this.luogo = this.vittima = this.anno = '';
    this.minuti = null;
    this.difficolta = 2;
  }

  async crea(m: Modello) {
    this.errore.set('');
    this.occupato.set(true);
    try {
      const scelte = {
        tema: this.tema(), titolo: this.titolo, luogo: this.luogo, vittima: this.vittima, anno: this.anno,
        nomi: Object.fromEntries(this.inGioco(m).map((s) => [s.chiave, this.nomi[s.chiave] ?? ''])),
        // Il colpevole scelto deve restare in gioco anche se la regia ha tolto dei sospetti.
        ...(m.privato ? {} : { sospetti: this.sospetti(), fasi: this.fasi, difficolta: this.difficolta, colpevole: this.possibili(m).some((s) => s.chiave === this.colpevole) ? this.colpevole : 'sorte', ...(this.minuti ? { minuti: Number(this.minuti) } : {}) }),
      };
      const r = await this.api.post<{ id: number }>('/api/regia/serate/da-modello', { modello: m.id, scelte });
      await this.router.navigate(['/regia/s', r.id, 'strumenti']);
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Non riesco a creare la serata.');
    } finally {
      this.occupato.set(false);
    }
  }

  async elimina(m: Modello) {
    if (this.daEliminare() !== m.id) { this.daEliminare.set(m.id); return; }
    this.daEliminare.set(null);
    try {
      await this.api.del(`/api/regia/modelli/${m.id.slice(1)}`);
      if (this.scelto()?.id === m.id) this.scelto.set(null);
      this.modelli.update((l) => l.filter((x) => x.id !== m.id));
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Non riesco a eliminare il modello.');
    }
  }
}
