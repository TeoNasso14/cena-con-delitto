import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../api';
import { Icona } from '../icona';
import { Allegato } from './allegato';
import { CartellaR, ProvaR, Regola, RegiaStato, TIPI_PROVA } from './stato';

interface Condizione { tipo: 'pin' | 'prova' | 'fase'; pin: string; prova_richiesta_id: number | null; fase_numero: number | null }
interface Modo { squadra_id: number | null; condizioni: Condizione[] }
interface Bozza {
  id?: number; numero: number; titolo: string; tipo: string; testo: string; nota_sigillo: string;
  allegato_key: string | null; allegato_tipo: string | null; cartella_id: number | null; prima: Prima; modi: Modo[];
}
type Filtro = 'tutte' | 'senza' | number;
/** Cosa vedono le squadre di una prova prima di aprirla. */
type Prima = 'nascosta' | 'sigillo' | 'titolo';
const PRIMA: Array<[Prima, string]> = [['nascosta', 'Non la vedono'], ['sigillo', 'Vedono solo il sigillo'], ['titolo', 'Leggono il titolo']];
interface Gruppo { cartella: CartellaR | null; prove: ProvaR[] }

@Component({
  selector: 'app-prove-regia',
  imports: [FormsModule, Icona, Allegato],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .voce-prova { grid-template-columns: auto auto minmax(0, 1fr) auto; }
    .scegli-prova { width: 20px; height: 20px; accent-color: var(--accento); }
    .filtri { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .filtri button { min-height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--filetto); background: transparent; color: var(--testo-2); font-size: 14px; font-weight: 500; }
    .filtri button.attivo { border-color: var(--accento); color: var(--accento); font-weight: 700; }
    @media (hover: hover) { .filtri button:hover { color: var(--testo-1); border-color: var(--testo-2); } }
    .filtri .n { color: var(--testo-2); font-weight: 400; margin-left: 4px; }
    .nuova-cartella { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .nuova-cartella .campo { width: auto; flex: 1 1 200px; min-height: 40px; }
    .gruppo { display: grid; gap: 10px; }
    .gruppo-testa { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding-top: 6px; }
    .gruppo-testa h3 { font-size: 17px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .gruppo-testa h3 app-icona { color: var(--accento); }
    .gruppo-testa .n { color: var(--testo-2); font-weight: 400; font-size: 14px; }
    .visibile { font-size: 13px; font-weight: 600; color: var(--accento); border: 1px solid var(--accento); border-radius: 999px; padding: 1px 9px; }
    .barra-sposta .bottone:not(.bottone--pieno) { color: var(--fondo); border-color: color-mix(in srgb, var(--fondo) 35%, transparent); }
    @media (hover: hover) { .barra-sposta .bottone:not(.bottone--pieno):hover { color: var(--fondo); border-color: var(--fondo); } }
    .barra-et { font-size: 14px; font-weight: 500; margin-right: -4px; }
    .barra-sposta .sep-v { width: 1px; align-self: stretch; background: var(--carta-filetto); }
    .gruppo-azioni { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
    .vuoto-cartella { color: var(--testo-2); font-size: 14px; padding: 12px 16px; border: 1px dashed var(--filetto); border-radius: 14px; }
    .barra-sposta { position: sticky; bottom: 12px; z-index: 2; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 14px; background: var(--testo-1); color: var(--fondo); }
    .barra-sposta .campo { width: auto; min-height: 40px; color: var(--testo-1); }
    .barra-sposta .bottone { min-height: 40px; }
    .barra-sposta .r-link { color: var(--fondo); min-height: 40px; }
    .num { font-weight: 600; font-size: 20px; width: 40px; color: var(--testo-2); font-variant-numeric: tabular-nums; }
    .modo { border: 1px solid var(--filetto); border-radius: 12px; padding: 14px; display: grid; gap: 12px; }
    .modo-testa { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
    .modo-testa strong { font-size: 15px; }
    .cond { display: grid; grid-template-columns: 150px minmax(0, 1fr) auto; gap: 8px; align-items: end; }
    @media (max-width: 560px) { .cond { grid-template-columns: minmax(0, 1fr) auto; } .cond .valore { grid-column: 1 / -1; grid-row: 2; } }
    .togli { width: 44px; height: 48px; border-radius: 10px; border: 1px solid var(--filetto); background: transparent; color: var(--testo-2); display: grid; place-items: center; }
    .sep { border: 0; border-top: 1px solid var(--filetto); margin: 2px 0; width: 100%; }
    .pin-riga { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
    .pin-riga .campo { text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
  `,
  template: `
    <header class="r-testa">
      <div><h1>Prove e codici</h1><p>Ogni prova resta sigillata finché non si apre in uno dei modi che scegli: con un codice, dopo un'altra prova, all'inizio di una fase. Puoi sempre consegnarla a mano dalla diretta.</p></div>
      <button class="bottone bottone--pieno" type="button" (click)="nuova()"><app-icona nome="piu" />Nuova prova</button>
    </header>
    <div class="r-colonne">
      <div class="r-colonna" style="gap:14px">
        <div class="filtri" role="group" aria-label="Mostra le prove">
          <button type="button" [class.attivo]="filtro() === 'tutte'" (click)="filtro.set('tutte')">Tutte<span class="n">{{ st.t()!.prove.length }}</span></button>
          @for (c of st.t()!.cartelle; track c.id) {
            <button type="button" [class.attivo]="filtro() === c.id" (click)="filtro.set(c.id)">{{ c.nome }}<span class="n">{{ conta(c.id) }}</span></button>
          }
          @if (st.t()!.cartelle.length) {
            <button type="button" [class.attivo]="filtro() === 'senza'" (click)="filtro.set('senza')">Senza cartella<span class="n">{{ conta(null) }}</span></button>
          }
          @if (!creaAperta()) {
            <button type="button" (click)="creaAperta.set(true)"><app-icona nome="piu" [misura]="18" />Nuova cartella</button>
          }
        </div>
        @if (creaAperta()) {
          <form class="nuova-cartella" (ngSubmit)="creaCartella()">
            <label class="sr" for="nome-cartella">Nome della nuova cartella</label>
            <input id="nome-cartella" name="nome-cartella" class="campo" [(ngModel)]="nomeCartella" maxlength="60" placeholder="Ad esempio: Cantina, Fase 2, Indizi falsi" required>
            <label class="r-check" for="vis-cartella"><input id="vis-cartella" name="vis-cartella" type="checkbox" [(ngModel)]="cartellaVisibile">Visibile alle squadre</label>
            <button class="bottone bottone--piccolo bottone--pieno" type="submit" [disabled]="!nomeCartella.trim()">Crea</button>
            <button class="bottone bottone--piccolo" type="button" (click)="creaAperta.set(false); nomeCartella = ''">Annulla</button>
          </form>
        }

        @for (g of gruppi(); track g.cartella?.id ?? 0) {
          <section class="gruppo" [attr.aria-label]="g.cartella?.nome ?? 'Senza cartella'">
            @if (mostraTesta(g)) {
              <div class="gruppo-testa">
                @if (rinomina === g.cartella?.id && g.cartella) {
                  <form class="nuova-cartella" style="flex:1" (ngSubmit)="salvaNome(g.cartella.id)">
                    <label class="sr" [for]="'rn-' + g.cartella.id">Nuovo nome</label>
                    <input class="campo" [id]="'rn-' + g.cartella.id" [name]="'rn-' + g.cartella.id" [(ngModel)]="nomeNuovo" maxlength="60" required>
                    <button class="bottone bottone--piccolo bottone--pieno" type="submit">Salva</button>
                    <button class="bottone bottone--piccolo" type="button" (click)="rinomina = null">Annulla</button>
                  </form>
                } @else {
                  <h3><app-icona [nome]="g.cartella ? 'caso' : 'prove'" [misura]="20" />{{ g.cartella?.nome ?? 'Senza cartella' }}<span class="n">{{ g.prove.length }}</span>@if (g.cartella?.visibile) {<span class="visibile">Visibile alle squadre</span>}</h3>
                  @if (g.cartella; as c) {
                    <div class="gruppo-azioni">
                      @if (eliminaCart === c.id) {
                        <span class="secondario" style="font-size:14px">{{ g.prove.length ? 'Le prove restano, finiscono in Senza cartella.' : '' }}</span>
                        <button class="bottone bottone--piccolo bottone--pericolo" type="button" (click)="eliminaCartella(c.id)">Sì, elimina la cartella</button>
                        <button class="r-link" type="button" (click)="eliminaCart = null">No</button>
                      } @else {
                        <button class="r-link" type="button" (click)="visibilita(c)">{{ c.visibile ? 'Nascondi alle squadre' : 'Mostra alle squadre' }}</button>
                        <button class="r-link" type="button" (click)="rinomina = c.id; nomeNuovo = c.nome">Rinomina</button>
                        <button class="r-link" type="button" (click)="eliminaCart = c.id">Elimina cartella</button>
                      }
                    </div>
                  }
                }
              </div>
            }
            <ul class="r-elenco" style="gap:10px">
              @for (p of g.prove; track p.id) {
                <li class="r-voce voce-prova" [class.r-voce--scelta]="p.id === b?.id">
                  <input class="scegli-prova" type="checkbox" [id]="'sel-' + p.id" [checked]="scelte().has(p.id)" (change)="scegli(p.id)" [attr.aria-label]="'Seleziona la prova ' + p.numero">
                  <span class="num">{{ p.numero }}</span>
                  <div><h3>{{ p.titolo }}</h3><p>{{ riassunto(p) }}@switch (prima(p)) { @case ('nascosta') {, nascosta alle squadre finché non la aprono} @case ('titolo') {, titolo visibile da sigillata} }</p></div>
                  <button class="bottone bottone--piccolo" type="button" (click)="modifica(p)">Modifica</button>
                </li>
              } @empty {
                <li class="vuoto-cartella">{{ g.cartella ? 'Cartella vuota. Seleziona delle prove e spostale qui, oppure creane una nuova.' : 'Nessuna prova fuori dalle cartelle.' }}</li>
              }
            </ul>
          </section>
        } @empty {
          <p class="r-vuoto">Nessuna prova ancora. Creane una e decidi come si apre.</p>
        }

        @if (scelte().size) {
          <div class="barra-sposta" role="region" aria-label="Sposta le prove selezionate">
            <strong>{{ scelte().size === 1 ? '1 prova selezionata' : scelte().size + ' prove selezionate' }}</strong>
            <label class="barra-et" for="dest-cartella">Sposta in</label>
            <select id="dest-cartella" class="campo" [(ngModel)]="destinazione">
              <option [ngValue]="null">Senza cartella</option>
              @for (c of st.t()!.cartelle; track c.id) { <option [ngValue]="c.id">{{ c.nome }}</option> }
            </select>
            <button class="bottone bottone--pieno" type="button" (click)="sposta()">Sposta</button>
            <span class="sep-v" aria-hidden="true"></span>
            <label class="barra-et" for="dest-prima">Prima di aprirle, le squadre</label>
            <select id="dest-prima" class="campo" [(ngModel)]="primaScelta">
              @for (o of opzioniPrima; track o[0]) { <option [ngValue]="o[0]">{{ o[1] }}</option> }
            </select>
            <button class="bottone" type="button" (click)="applicaPrima()">Applica</button>
            <button class="r-link" type="button" (click)="svuota()">Annulla la selezione</button>
          </div>
        }
      </div>

      @if (b) {
        <form class="r-colonna r-scheda r-modulo" (ngSubmit)="salva()">
          <h2 class="gotico" style="font-size:26px">{{ b.id ? 'Prova n. ' + b.numero : 'Nuova prova' }}</h2>
          <div class="r-due">
            <label class="etichetta" for="pr-num">Numero<input id="pr-num" name="pr-num" class="campo" type="number" min="1" max="999" [(ngModel)]="b.numero" required></label>
            <label class="etichetta" for="pr-tipo">Tipo
              <select id="pr-tipo" name="pr-tipo" class="campo" [(ngModel)]="b.tipo">
                @for (t of tipi; track t[0]) { <option [value]="t[0]">{{ t[1] }}</option> }
              </select>
            </label>
          </div>
          <label class="etichetta" for="pr-cartella">Cartella <small>Le squadre la vedono solo se la cartella è visibile alle squadre.</small>
            <select id="pr-cartella" name="pr-cartella" class="campo" [(ngModel)]="b.cartella_id">
              <option [ngValue]="null">Senza cartella</option>
              @for (c of st.t()!.cartelle; track c.id) { <option [ngValue]="c.id">{{ c.nome }}{{ c.visibile ? ' (visibile alle squadre)' : '' }}</option> }
            </select>
          </label>
          <label class="etichetta" for="pr-titolo">Titolo<input id="pr-titolo" name="pr-titolo" class="campo" [(ngModel)]="b.titolo" required maxlength="120"></label>
          <label class="etichetta" for="pr-prima">Prima di aprirla, le squadre <small>Una volta aperta, la vedono sempre. Se è nascosta e si apre dopo un'altra prova con un codice, compare sigillata appena quell'altra prova è aperta.</small>
            <select id="pr-prima" name="pr-prima" class="campo" [(ngModel)]="b.prima">
              @for (o of opzioniPrima; track o[0]) { <option [ngValue]="o[0]">{{ o[1] }}</option> }
            </select>
          </label>
          <label class="etichetta" for="pr-testo">Contenuto<textarea id="pr-testo" name="pr-testo" class="campo" rows="6" [(ngModel)]="b.testo"></textarea></label>
          <app-allegato etichetta="Allegato della prova" campo="pr-allegato" [(chiave)]="b.allegato_key" [(tipo)]="b.allegato_tipo" />

          <h3 class="gotico" style="font-size:22px; margin-top:8px">Come si apre</h3>
          @for (m of b.modi; track $index; let mi = $index) {
            <div class="modo">
              <div class="modo-testa">
                <strong>{{ nomeModo(mi) }}@if (m.condizioni.length > 1) {<span class="secondario" style="font-weight:400">, tutte le condizioni insieme</span>}</strong>
                <label class="sr" [for]="'sq-' + mi">Per chi</label>
                <select class="campo" style="width:auto; min-height:40px" [id]="'sq-' + mi" [name]="'sq-' + mi" [(ngModel)]="m.squadra_id">
                  <option [ngValue]="null">Vale per tutte le squadre</option>
                  @for (q of st.t()!.squadre; track q.id) { <option [ngValue]="q.id">Solo per {{ q.nome }}</option> }
                </select>
              </div>
              @for (c of m.condizioni; track $index; let ci = $index) {
                @if (ci > 0) { <hr class="sep" aria-hidden="true"> }
                <div class="cond">
                  <label class="etichetta" [for]="'t-' + mi + '-' + ci">Condizione
                    <select class="campo" [id]="'t-' + mi + '-' + ci" [name]="'t-' + mi + '-' + ci" [(ngModel)]="c.tipo">
                      <option value="pin">Un codice</option>
                      <option value="prova">Dopo una prova</option>
                      <option value="fase">Da una fase</option>
                    </select>
                  </label>
                  <div class="valore">
                    @switch (c.tipo) {
                      @case ('pin') {
                        <label class="etichetta" [for]="'v-' + mi + '-' + ci">Codice
                          <span class="pin-riga">
                            <input class="campo" [id]="'v-' + mi + '-' + ci" [name]="'v-' + mi + '-' + ci" [(ngModel)]="c.pin" autocomplete="off" maxlength="32" required>
                            <button class="bottone bottone--piccolo" type="button" (click)="c.pin = codiceNuovo()">Genera</button>
                          </span>
                        </label>
                      }
                      @case ('prova') {
                        <label class="etichetta" [for]="'v-' + mi + '-' + ci">Prova richiesta
                          <select class="campo" [id]="'v-' + mi + '-' + ci" [name]="'v-' + mi + '-' + ci" [(ngModel)]="c.prova_richiesta_id" required>
                            <option [ngValue]="null" disabled>Scegli</option>
                            @for (p of st.t()!.prove; track p.id) { @if (p.id !== b.id) { <option [ngValue]="p.id">N. {{ p.numero }}, {{ p.titolo }}</option> } }
                          </select>
                        </label>
                      }
                      @case ('fase') {
                        <label class="etichetta" [for]="'v-' + mi + '-' + ci">Fase
                          <select class="campo" [id]="'v-' + mi + '-' + ci" [name]="'v-' + mi + '-' + ci" [(ngModel)]="c.fase_numero" required>
                            <option [ngValue]="null" disabled>Scegli</option>
                            @for (f of st.t()!.fasi; track f.numero) { <option [ngValue]="f.numero">{{ f.numero }}. {{ f.nome }}</option> }
                          </select>
                        </label>
                      }
                    }
                  </div>
                  <button class="togli" type="button" aria-label="Togli la condizione" (click)="togliCondizione(mi, ci)"><app-icona nome="chiudi" /></button>
                </div>
              }
              <p class="secondario" style="font-size:14px">I codici di sole cifre si digitano sul tastierino; con lettere, le squadre li scrivono a mano.</p>
              <button class="r-link" type="button" style="justify-self:start" (click)="m.condizioni.push(condizione('pin'))">Aggiungi una condizione</button>
            </div>
          } @empty {
            <p class="secondario">Nessun modo: questa prova la consegni solo tu dalla diretta.</p>
          }
          <button class="bottone bottone--piccolo" type="button" style="justify-self:start" (click)="b.modi.push({ squadra_id: null, condizioni: [condizione('pin')] })"><app-icona nome="piu" />{{ b.modi.length ? 'Aggiungi un altro modo' : 'Aggiungi un modo' }}</button>

          <label class="etichetta" for="pr-nota">Indizio sul sigillo <small>Facoltativo. Se vuoto, le squadre leggono come si apre ("Serve un codice", "Si apre con la fase 2").</small>
            <input id="pr-nota" name="pr-nota" class="campo" [(ngModel)]="b.nota_sigillo" maxlength="120" placeholder="Il numero è dove nessuno guarda"></label>

          <div class="r-azioni">
            <button class="bottone bottone--pieno" type="submit">Salva la prova</button>
            <button class="bottone" type="button" (click)="b = null">Annulla</button>
            @if (b.id) {
              @if (conferma) { <button class="bottone bottone--pericolo" type="button" (click)="elimina()">Sì, elimina</button> }
              @else { <button class="bottone bottone--pericolo" type="button" (click)="conferma = true">Elimina</button> }
            }
          </div>
        </form>
      }
    </div>
  `,
})
export class ProveRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly tipi = Object.entries(TIPI_PROVA);
  b: Bozza | null = null;
  conferma = false;
  readonly filtro = signal<Filtro>('tutte');
  readonly creaAperta = signal(false);
  readonly scelte = signal<Set<number>>(new Set());
  nomeCartella = '';
  nomeNuovo = '';
  rinomina: number | null = null;
  eliminaCart: number | null = null;
  destinazione: number | null = null;
  cartellaVisibile = false;
  primaScelta: Prima = 'nascosta';
  readonly opzioniPrima = PRIMA;
  prima(p: ProvaR): Prima { return p.in_elenco === false ? 'nascosta' : p.titolo_visibile ? 'titolo' : 'sigillo'; }

  readonly gruppi = computed<Gruppo[]>(() => {
    const t = this.st.t()!;
    const f = this.filtro();
    const di = (id: number | null) => t.prove.filter((p) => (p.cartella_id ?? null) === id);
    if (f === 'senza') return [{ cartella: null, prove: di(null) }];
    if (typeof f === 'number') {
      const c = t.cartelle.find((x) => x.id === f);
      return c ? [{ cartella: c, prove: di(c.id) }] : [];
    }
    if (!t.cartelle.length) return t.prove.length ? [{ cartella: null, prove: t.prove }] : [];
    const out: Gruppo[] = t.cartelle.map((c) => ({ cartella: c, prove: di(c.id) }));
    const senza = di(null);
    if (senza.length) out.push({ cartella: null, prove: senza });
    return out;
  });

  conta(id: number | null) {
    return this.st.t()!.prove.filter((p) => (p.cartella_id ?? null) === id).length;
  }
  mostraTesta(g: Gruppo) {
    return !!g.cartella || this.st.t()!.cartelle.length > 0;
  }
  svuota() { this.scelte.set(new Set()); }
  scegli(id: number) {
    const s = new Set(this.scelte());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.scelte.set(s);
  }
  async creaCartella() {
    const r = await this.st.fai(() => this.api.post<{ id: number }>('/api/regia/cartelle', { nome: this.nomeCartella, visibile: this.cartellaVisibile }), 'Cartella creata');
    if (r) { this.nomeCartella = ''; this.cartellaVisibile = false; this.creaAperta.set(false); this.filtro.set(r.id); }
  }
  visibilita(c: CartellaR) {
    const v = !c.visibile;
    return this.st.fai(() => this.api.put(`/api/regia/cartelle/${c.id}`, { visibile: v }), v ? `Le squadre ora vedono la cartella ${c.nome}` : `Cartella ${c.nome} nascosta alle squadre`);
  }
  async applicaPrima() {
    const ids = [...this.scelte()];
    const prima = this.primaScelta;
    const n = ids.length === 1 ? '1 prova' : `${ids.length} prove`;
    const esito = { nascosta: `${n}: le squadre non le vedono finché non le aprono`, sigillo: `${n}: le squadre vedono solo il sigillo`, titolo: `${n}: le squadre leggono il titolo` }[prima];
    const ok = await this.st.fai(() => this.api.post('/api/regia/prove/visibilita', { prove: ids, prima }), esito);
    if (ok) this.scelte.set(new Set());
  }
  async salvaNome(id: number) {
    const ok = await this.st.fai(() => this.api.put(`/api/regia/cartelle/${id}`, { nome: this.nomeNuovo }), 'Cartella rinominata');
    if (ok) this.rinomina = null;
  }
  async eliminaCartella(id: number) {
    const r = await this.st.fai(() => this.api.del<{ prove_spostate: number }>(`/api/regia/cartelle/${id}`));
    if (!r) return;
    this.eliminaCart = null;
    if (this.filtro() === id) this.filtro.set('tutte');
    this.st.dimmi(r.prove_spostate ? `Cartella eliminata: ${r.prove_spostate === 1 ? '1 prova è passata' : r.prove_spostate + ' prove sono passate'} in Senza cartella` : 'Cartella eliminata');
  }
  async sposta() {
    const ids = [...this.scelte()];
    const dove = this.destinazione;
    const nome = dove === null ? 'Senza cartella' : this.st.t()!.cartelle.find((c) => c.id === dove)?.nome;
    const ok = await this.st.fai(() => this.api.post('/api/regia/prove/sposta', { prove: ids, cartella_id: dove }), `${ids.length === 1 ? 'Prova spostata' : ids.length + ' prove spostate'} in ${nome}`);
    if (ok) this.scelte.set(new Set());
  }

  nomeModo(i: number) {
    const n = this.b!.modi.length > 1 ? ` ${i + 1}` : '';
    return (i === 0 ? 'Modo' : 'Oppure') + n;
  }

  condizione(tipo: Condizione['tipo']): Condizione {
    return { tipo, pin: '', prova_richiesta_id: null, fase_numero: null };
  }

  riassunto(p: ProvaR) {
    if (!p.regole.length) return 'La consegni tu';
    const gruppi = new Map<number, Regola[]>();
    p.regole.forEach((r) => gruppi.set(r.gruppo, [...(gruppi.get(r.gruppo) ?? []), r]));
    return [...gruppi.values()].map((g) => {
      const chi = g[0].squadra_id ? ` (${this.st.nomeSquadra(g[0].squadra_id)})` : '';
      return g.map((r) => r.tipo === 'pin' ? `codice ${r.pin}` : r.tipo === 'prova' ? `dopo la n. ${this.st.numeroProva(r.prova_richiesta_id)}` : `fase ${r.fase_numero}`).join(' e ') + chi;
    }).join(' oppure ').replace(/^./, (c) => c.toUpperCase());
  }

  nuova() {
    const prove = this.st.t()!.prove;
    this.conferma = false;
    this.b = {
      numero: Math.max(0, ...prove.map((p) => p.numero)) + 1, titolo: '', tipo: 'documento', testo: '', nota_sigillo: '', prima: 'nascosta',
      allegato_key: null, allegato_tipo: null, cartella_id: typeof this.filtro() === 'number' ? (this.filtro() as number) : null, modi: [{ squadra_id: null, condizioni: [{ ...this.condizione('pin'), pin: this.codiceNuovo() }] }],
    };
  }

  modifica(p: ProvaR) {
    this.conferma = false;
    const gruppi = new Map<number, Regola[]>();
    p.regole.forEach((r) => gruppi.set(r.gruppo, [...(gruppi.get(r.gruppo) ?? []), r]));
    this.b = {
      id: p.id, numero: p.numero, titolo: p.titolo, tipo: p.tipo, testo: p.testo, nota_sigillo: p.nota_sigillo,
      allegato_key: p.allegato_key, allegato_tipo: p.allegato_tipo, cartella_id: p.cartella_id ?? null, prima: this.prima(p),
      modi: [...gruppi.values()].map((g) => ({
        squadra_id: g[0].squadra_id ?? null,
        condizioni: g.map((r) => ({ tipo: r.tipo, pin: r.pin ?? '', prova_richiesta_id: r.prova_richiesta_id ?? null, fase_numero: r.fase_numero ?? null })),
      })),
    };
  }

  togliCondizione(mi: number, ci: number) {
    const m = this.b!.modi[mi];
    m.condizioni.splice(ci, 1);
    if (!m.condizioni.length) this.b!.modi.splice(mi, 1);
  }

  /** Quattro cifre non ancora usate in questa serata. */
  codiceNuovo() {
    const usati = new Set(this.st.t()!.prove.flatMap((p) => p.regole.map((r) => r.pin)));
    this.b?.modi.forEach((m) => m.condizioni.forEach((c) => usati.add(c.pin)));
    let c = '';
    do { c = String(Math.floor(1000 + Math.random() * 9000)); } while (usati.has(c));
    return c;
  }

  async salva() {
    const b = this.b!;
    const regole = b.modi.flatMap((m, i) => m.condizioni.map((c) => ({
      tipo: c.tipo, gruppo: i + 1, squadra_id: m.squadra_id,
      ...(c.tipo === 'pin' ? { pin: c.pin } : c.tipo === 'prova' ? { prova_richiesta_id: c.prova_richiesta_id } : { fase_numero: c.fase_numero }),
    })));
    const { prima, ...resto } = b;
    const corpo = { ...resto, in_elenco: prima !== 'nascosta', titolo_visibile: prima === 'titolo', regole };
    const ok = await this.st.fai(() => (b.id ? this.api.put(`/api/regia/prove/${b.id}`, corpo) : this.api.post('/api/regia/prove', corpo)), 'Prova salvata');
    if (ok) this.b = null;
  }

  async elimina() {
    const ok = await this.st.fai(() => this.api.del(`/api/regia/prove/${this.b!.id}`), 'Prova eliminata');
    if (ok) this.b = null;
  }
}
