import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import qrcode from 'qrcode-generator';
import { Api } from '../api';
import { Icona } from '../icona';
import { RegiaStato } from './stato';
import { InvitiOspiti } from './ospiti';

/* ---------- Invitati, vincoli e sorteggio delle squadre ---------- */

@Component({
  selector: 'app-invitati-regia',
  imports: [FormsModule, RouterLink, Icona, InvitiOspiti],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    /* Una riga per invitato, con divisori: densità da strumento, anche a 390 px. */
    .gruppo { display: grid; gap: 6px; }
    .gruppo h3 { display: flex; align-items: center; gap: 8px; font: 600 16px/1.2 var(--corpo); padding: 6px 2px; }
    .gruppo h3 span { color: var(--testo-2); font-weight: 400; }
    .pallino { width: 12px; height: 12px; border-radius: 50%; flex: none; }
    .righe-invitati { list-style: none; margin: 0; padding: 0; background: var(--fondo-2); border-radius: 14px; }
    .invitato { display: grid; grid-template-columns: minmax(0, 1fr) minmax(110px, 200px) auto; gap: 8px; align-items: center; padding: 8px 10px 8px 14px; }
    .con-personaggi .invitato { grid-template-columns: minmax(0, 1fr) minmax(110px, 180px) minmax(110px, 180px) auto; }
    @media (max-width: 640px) { .con-personaggi .invitato { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; } .con-personaggi .invitato .nome { grid-column: 1 / -1; } }
    .invitato + .invitato { border-top: 1px solid var(--fondo-3); }
    .invitato .nome { font-weight: 600; overflow-wrap: anywhere; }
    .invitato select { min-height: 40px; padding-top: 6px; padding-bottom: 6px; }
    .invitato .bottone { min-height: 40px; padding: 0 12px; }
    .vincolo { grid-template-columns: minmax(0, 1fr) auto; }
    .riga-vincolo { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); gap: 10px; align-items: end; }
    @media (max-width: 560px) { .riga-vincolo { grid-template-columns: minmax(0, 1fr); } }
    .aiuto { font-size: 14px; color: var(--testo-2); }
    .sotto { margin-bottom: 24px; }
    .a-sinistra { justify-self: start; }
    .conteggio { color: var(--testo-2); font-weight: 400; font-size: 15px; margin-left: 8px; font-family: var(--corpo); }
  `,
  template: `
    @let t = st.t()!;
    <header class="r-testa">
      <div><h1>Invitati</h1><p>Chi viene alla serata. Scrivi i nomi, metti i vincoli (chi tenere diviso, chi insieme) e sorteggia le squadre. Poi prepara i biglietti per i tavoli.</p></div>
      <div class="r-azioni">
        <button class="bottone bottone--pieno" type="button" [disabled]="t.squadre.length < 2 || !t.invitati.length" (click)="sorteggia()">Sorteggia le squadre</button>
        <a class="bottone" [routerLink]="st.base() + '/invitati/biglietti'">Biglietti per i tavoli</a>
        @if (interpreti()) { <a class="bottone" [routerLink]="st.base() + '/invitati/schede'">Schede per chi interpreta</a> }
      </div>
    </header>
    @if (t.squadre.length < 2) {
      <p class="avviso sotto">Per il sorteggio servono almeno due squadre: <a [routerLink]="st.base() + '/squadre'">creale in Squadre e accessi</a>.</p>
    }
    <div class="r-colonne">
      <div class="r-colonna">
        <section class="r-blocco">
          <h2>Gli invitati<span class="conteggio">{{ t.invitati.length }}</span></h2>
          <form class="r-scheda r-modulo" (ngSubmit)="aggiungi()">
            <label class="etichetta" for="nuovi">Aggiungi invitati <small>Uno per riga: puoi incollare una lista.</small>
              <textarea id="nuovi" name="nuovi" class="campo" rows="4" [(ngModel)]="nuovi"></textarea>
            </label>
            <button class="bottone a-sinistra" type="submit" [disabled]="!nuovi.trim()"><app-icona nome="piu" />Aggiungi</button>
          </form>
          @if (!t.invitati.length) { <p class="r-vuoto">Nessun invitato. Scrivili qui sopra, uno per riga.</p> }
          @for (g of gruppi(); track g.id) {
            <section class="gruppo" [attr.aria-label]="g.nome">
              <h3>@if (g.colore) { <i class="pallino" [style.background]="g.colore" aria-hidden="true"></i> }{{ g.nome }} <span>{{ g.persone.length }}</span></h3>
              <ul class="righe-invitati" [class.con-personaggi]="t.personaggi.length">
                @for (i of g.persone; track i.id) {
                  <li class="invitato">
                    <span class="nome">{{ i.nome }}</span>
                    <select class="campo" [attr.aria-label]="'Squadra di ' + i.nome" [ngModel]="i.squadra_id" (ngModelChange)="sposta(i.id, $event)">
                      <option [ngValue]="null">Nessuna squadra</option>
                      @for (q of t.squadre; track q.id) { <option [ngValue]="q.id">{{ q.nome }}</option> }
                    </select>
                    @if (t.personaggi.length) {
                      <select class="campo" [attr.aria-label]="'Personaggio interpretato da ' + i.nome" [ngModel]="i.personaggio_id" (ngModelChange)="interpreta(i.id, $event)">
                        <option [ngValue]="null">Nessuno</option>
                        @for (p of t.personaggi; track p.id) { <option [ngValue]="p.id">{{ p.nome }}</option> }
                      </select>
                    }
                    <button class="bottone bottone--piccolo bottone--pericolo" type="button" [attr.aria-label]="'Togli ' + i.nome" (click)="togli(i.id)">Togli</button>
                  </li>
                }
              </ul>
            </section>
          }
        </section>
      </div>
      <div class="r-colonna">
        <section class="r-blocco">
          <h2>Vincoli</h2>
          <form class="r-scheda r-modulo" (ngSubmit)="vincola()">
            <div class="riga-vincolo">
              <label class="etichetta" for="va">Persona
                <select id="va" name="va" class="campo" [(ngModel)]="a"><option [ngValue]="null">Scegli</option>@for (i of t.invitati; track i.id) { <option [ngValue]="i.id">{{ i.nome }}</option> }</select>
              </label>
              <label class="etichetta" for="vt"><span class="sr">Tipo di vincolo</span>
                <select id="vt" name="vt" class="campo" [(ngModel)]="tipo"><option value="divisi">deve stare divisa da</option><option value="insieme">deve stare insieme a</option></select>
              </label>
              <label class="etichetta" for="vb">Persona
                <select id="vb" name="vb" class="campo" [(ngModel)]="b"><option [ngValue]="null">Scegli</option>@for (i of t.invitati; track i.id) { <option [ngValue]="i.id">{{ i.nome }}</option> }</select>
              </label>
            </div>
            <button class="bottone a-sinistra" type="submit" [disabled]="!a || !b || a === b">Aggiungi il vincolo</button>
          </form>
          <ul class="r-elenco">
            @for (v of t.vincoli; track v.id) {
              <li class="r-voce vincolo">
                <p><strong>{{ nome(v.a) }}</strong> {{ v.tipo === 'divisi' ? 'deve stare divisa da' : 'deve stare insieme a' }} <strong>{{ nome(v.b) }}</strong></p>
                <button class="bottone bottone--piccolo" type="button" (click)="togliVincolo(v.id)">Togli</button>
              </li>
            } @empty { <li class="r-vuoto">Nessun vincolo: il sorteggio fa squadre bilanciate a caso.</li> }
          </ul>
          @if (t.personaggi.length) {
            <p class="aiuto">Personaggi: se vuoi, ogni invitato ne interpreta uno. Sui telefoni compare "interpretato da", e in "Schede per chi interpreta" stampi a ognuno il suo personaggio con quello che sa. Puoi anche lasciarli tutti senza: i personaggi restano persone del racconto.</p>
          }
          <p class="aiuto">Il sorteggio fa squadre della stessa grandezza (al massimo una persona di differenza) e rispetta tutti i vincoli. Puoi rifarlo quante volte vuoi e poi spostare qualcuno a mano.</p>
        </section>
        <app-inviti-ospiti />
      </div>
    </div>
  `,
})
export class InvitatiRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  /** Gli invitati divisi per squadra, nell'ordine delle squadre; chi non ha squadra in fondo. */
  readonly gruppi = computed(() => {
    const t = this.st.t();
    if (!t) return [];
    const g = t.squadre.map((q) => ({ id: q.id, nome: q.nome, colore: q.colore as string | null, persone: t.invitati.filter((i) => i.squadra_id === q.id) }));
    const senza = t.invitati.filter((i) => !t.squadre.some((q) => q.id === i.squadra_id));
    return [...g.filter((x) => x.persone.length), ...(senza.length ? [{ id: 0, nome: 'Senza squadra', colore: null, persone: senza }] : [])];
  });
  nuovi = '';
  a: number | null = null;
  b: number | null = null;
  tipo: 'divisi' | 'insieme' = 'divisi';

  nome(id: number) { return this.st.t()?.invitati.find((i) => i.id === id)?.nome ?? '?'; }
  async aggiungi() {
    const nomi = this.nuovi.split('\n').map((n) => n.trim()).filter(Boolean);
    const ok = await this.st.fai(() => this.api.post('/api/regia/invitati', { nomi }), nomi.length === 1 ? 'Invitato aggiunto' : `${nomi.length} invitati aggiunti`);
    if (ok) this.nuovi = '';
  }
  readonly interpreti = computed(() => !!this.st.t()?.invitati.some((i) => i.personaggio_id !== null));
  interpreta(id: number, personaggio_id: number | null) { this.st.fai(() => this.api.put(`/api/regia/invitati/${id}`, { personaggio_id })); }
  sposta(id: number, squadra_id: number | null) { this.st.fai(() => this.api.put(`/api/regia/invitati/${id}`, { squadra_id })); }
  togli(id: number) { this.st.fai(() => this.api.del(`/api/regia/invitati/${id}`)); }
  async vincola() {
    const ok = await this.st.fai(() => this.api.post('/api/regia/vincoli', { a: this.a, b: this.b, tipo: this.tipo }), 'Vincolo aggiunto');
    if (ok) { this.a = null; this.b = null; }
  }
  togliVincolo(id: number) { this.st.fai(() => this.api.del(`/api/regia/vincoli/${id}`)); }
  sorteggia() { this.st.fai(() => this.api.post('/api/regia/sorteggio'), 'Squadre sorteggiate'); }
}

/* ---------- Biglietti per i tavoli, da stampare ---------- */

interface Biglietto { squadra: string; colore: string; username: string; password: string; componenti: string[] }

/** Il QR come percorso SVG, modulo per modulo: niente HTML da inserire a mano. */
function percorsoQr(testo: string) {
  const q = qrcode(0, 'M');
  q.addData(testo);
  q.make();
  const n = q.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  return { lato: n, d };
}

@Component({
  selector: 'app-biglietti-regia',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .avvertenza { max-width: 640px; }
    .a-sinistra { justify-self: start; }
    .sotto { margin-bottom: 20px; }
    .fogli { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    /* Il biglietto è l'oggetto della serata: carta, un filetto del tema in cima, credenziali grandi come nel riquadro delle credenziali. */
    .biglietto { display: grid; gap: 12px; padding: 20px; background: var(--carta); color: var(--inchiostro); border: 1px solid var(--carta-filetto); border-top: 4px solid var(--accento); border-radius: 2px; break-inside: avoid; }
    .biglietto h2 { display: flex; align-items: center; gap: 10px; font: 700 32px/1.05 var(--titoli); text-wrap: balance; }
    .biglietto h2 span { width: 16px; height: 16px; border-radius: 50%; flex: none; border: 1px solid var(--inchiostro); }
    .biglietto .serata { font-size: 14px; }
    .biglietto ul { margin: 0; padding-left: 18px; font-size: 15px; }
    .biglietto dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 15px; }
    .biglietto dt { font-weight: 700; }
    .biglietto dd { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.02em; overflow-wrap: anywhere; user-select: all; }
    .biglietto dt { align-self: center; }
    .qr { width: 150px; height: 150px; justify-self: start; }
    .indirizzo { font-size: 13px; overflow-wrap: anywhere; }
    @media print {
      .no-stampa { display: none !important; }
      .fogli { grid-template-columns: repeat(2, 1fr); }
      .biglietto { border-color: #999; border-top-color: #000; }
    }
  `,
  template: `
    @let t = st.t()!;
    <header class="r-testa no-stampa">
      <div><h1>Biglietti per i tavoli</h1><p>Un biglietto per squadra: nome, componenti, credenziali e un QR che fa entrare direttamente. Si stampano da qui.</p></div>
      <div class="r-azioni">
        <a class="bottone" [routerLink]="st.base() + '/invitati'">Torna agli invitati</a>
        @if (fogli()) { <button class="bottone bottone--pieno" type="button" (click)="stampa()">Stampa</button> }
      </div>
    </header>

    @if (!fogli()) {
      <section class="r-scheda r-modulo no-stampa avvertenza">
        <p>Le password delle squadre sono salvate in modo che nessuno possa rileggerle. Per stampare i biglietti ne preparo di nuove per tutte le {{ t.squadre.length }} squadre: le password di prima smettono di funzionare e chi è già entrato dovrà rientrare con il biglietto.</p>
        @if (t.squadre.length) {
          <button class="bottone bottone--pieno a-sinistra" type="button" (click)="prepara()">Prepara i biglietti con password nuove</button>
        } @else {
          <p>Non ci sono squadre: <a [routerLink]="st.base() + '/squadre'">creale in Squadre e accessi</a>.</p>
        }
      </section>
    } @else {
      <p class="avviso no-stampa sotto" role="status">Queste password si vedono solo adesso: stampa prima di lasciare la pagina.</p>
      <div class="fogli">
        @for (f of fogli(); track f.username) {
          <article class="biglietto">
            <h2><span [style.background]="f.colore" aria-hidden="true"></span>{{ f.squadra }}</h2>
            <p class="serata">{{ t.serata.titolo }}</p>
            @if (f.componenti.length) { <ul>@for (c of f.componenti; track $index) { <li>{{ c }}</li> }</ul> }
            <svg class="qr" [attr.viewBox]="'-2 -2 ' + (f.qr.lato + 4) + ' ' + (f.qr.lato + 4)" role="img" [attr.aria-label]="'QR per entrare come ' + f.squadra">
              <rect x="-2" y="-2" [attr.width]="f.qr.lato + 4" [attr.height]="f.qr.lato + 4" fill="#ffffff"/>
              <path [attr.d]="f.qr.d" fill="#000000"/>
            </svg>
            <dl><dt>Nome utente</dt><dd>{{ f.username }}</dd><dt>Password</dt><dd>{{ f.password }}</dd></dl>
            <p class="indirizzo">Oppure entra da {{ indirizzo() }}</p>
          </article>
        }
      </div>
    }
  `,
})
export class BigliettiRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly fogli = signal<Array<Biglietto & { qr: { lato: number; d: string } }> | null>(null);
  readonly indirizzo = computed(() => `${location.origin}/s/${this.st.t()?.serata.slug ?? ''}`);

  async prepara() {
    const r = await this.st.fai(() => this.api.post<{ slug: string; biglietti: Biglietto[] }>('/api/regia/biglietti', { conferma: true }), 'Biglietti pronti: password delle squadre rinnovate');
    if (!r) return;
    // Le credenziali vanno dopo il # dell'indirizzo: il browser non le manda mai al server.
    const base = `${location.origin}/s/${r.slug}#entra=`;
    this.fogli.set(r.biglietti.map((b) => ({ ...b, qr: percorsoQr(base + encodeURIComponent(`${b.username}:${b.password}`)) })));
  }
  stampa() { window.print(); }
}

/* ---------- Schede per chi interpreta un personaggio, da stampare e consegnare prima della cena ---------- */

@Component({
  selector: 'app-schede-regia',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .fogli { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
    .scheda { display: grid; gap: 10px; align-content: start; padding: 22px; background: var(--carta); color: var(--inchiostro); border: 1px solid var(--carta-filetto); border-top: 4px solid var(--accento); border-radius: 2px; break-inside: avoid; }
    .per { font-size: 14px; }
    .scheda h2 { font: 700 30px/1.05 var(--titoli); text-wrap: balance; }
    .ruolo { font-weight: 700; }
    .scheda h3 { font: 700 15px/1.2 var(--corpo); margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--carta-filetto); }
    .testo { font-size: 15px; white-space: pre-line; }
    .segreto { font-size: 13px; font-style: italic; }
    @media print {
      .no-stampa { display: none !important; }
      .fogli { grid-template-columns: repeat(2, 1fr); }
      .scheda { border-color: #999; border-top-color: #000; }
    }
  `,
  template: `
    @let t = st.t()!;
    <header class="r-testa no-stampa">
      <div><h1>Schede per chi interpreta</h1><p>Una scheda per ogni invitato che interpreta un personaggio: chi è, cosa sanno tutti e cosa sa solo lui. Stampale e consegnale prima della cena, piegate.</p></div>
      <div class="r-azioni">
        <a class="bottone" [routerLink]="st.base() + '/invitati'">Torna agli invitati</a>
        @if (schede().length) { <button class="bottone bottone--pieno" type="button" (click)="stampa()">Stampa</button> }
      </div>
    </header>
    @if (!schede().length) {
      <p class="r-vuoto">Nessun invitato interpreta un personaggio. Sceglilo in <a [routerLink]="st.base() + '/invitati'">Invitati</a>, accanto a ogni nome.</p>
    }
    <div class="fogli">
      @for (s of schede(); track s.id) {
        <article class="scheda">
          <p class="per">Per {{ s.invitato }}{{ s.squadra ? ', squadra ' + s.squadra : '' }}. {{ t.serata.titolo }}</p>
          <h2>{{ s.p.nome }}</h2>
          @if (s.p.ruolo) { <p class="ruolo">{{ s.p.ruolo }}</p> }
          @if (s.p.scheda) { <h3>Cosa sanno tutti</h3><p class="testo">{{ s.p.scheda }}</p> }
          @if (s.p.copione) { <h3>Cosa sai solo tu</h3><p class="testo">{{ s.p.copione }}</p> }
          @else { <p class="segreto">Nessun segreto scritto per questo personaggio: improvvisa restando nella parte.</p> }
        </article>
      }
    </div>
  `,
})
export class SchedeRegia {
  readonly st = inject(RegiaStato);
  readonly schede = computed(() => {
    const t = this.st.t();
    if (!t) return [];
    return t.invitati
      .filter((i) => i.personaggio_id !== null)
      .map((i) => ({ id: i.id, invitato: i.nome, squadra: t.squadre.find((q) => q.id === i.squadra_id)?.nome ?? null, p: t.personaggi.find((p) => p.id === i.personaggio_id)! }))
      .filter((s) => s.p);
  });
  stampa() { window.print(); }
}
