import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../api';
import { Icona } from '../icona';
import { Allegato } from './allegato';
import { ProvaR, Regola, RegiaStato, TIPI_PROVA } from './stato';

interface Condizione { tipo: 'pin' | 'prova' | 'fase'; pin: string; prova_richiesta_id: number | null; fase_numero: number | null }
interface Modo { squadra_id: number | null; condizioni: Condizione[] }
interface Bozza {
  id?: number; numero: number; titolo: string; tipo: string; testo: string; nota_sigillo: string;
  allegato_key: string | null; allegato_tipo: string | null; modi: Modo[];
}

@Component({
  selector: 'app-prove-regia',
  imports: [FormsModule, Icona, Allegato],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .voce-prova { grid-template-columns: auto minmax(0, 1fr) auto; }
    .num { font-weight: 600; font-size: 20px; width: 40px; color: var(--osso-2); font-variant-numeric: tabular-nums; }
    .modo { border: 1px solid var(--filetto); border-radius: 12px; padding: 14px; display: grid; gap: 12px; }
    .modo-testa { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
    .modo-testa strong { font-size: 15px; }
    .cond { display: grid; grid-template-columns: 150px minmax(0, 1fr) auto; gap: 8px; align-items: end; }
    @media (max-width: 560px) { .cond { grid-template-columns: minmax(0, 1fr) auto; } .cond .valore { grid-column: 1 / -1; grid-row: 2; } }
    .togli { width: 44px; height: 48px; border-radius: 10px; border: 1px solid var(--filetto); background: transparent; color: var(--osso-2); display: grid; place-items: center; }
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
      <ul class="r-elenco r-colonna" style="gap:10px">
        @for (p of st.t()!.prove; track p.id) {
          <li class="r-voce voce-prova" [class.r-voce--scelta]="p.id === b?.id">
            <span class="num">{{ p.numero }}</span>
            <div><h3>{{ p.titolo }}</h3><p>{{ riassunto(p) }}</p></div>
            <button class="bottone bottone--piccolo" type="button" (click)="modifica(p)">Modifica</button>
          </li>
        } @empty { <li class="r-vuoto">Nessuna prova ancora. Creane una e decidi come si apre.</li> }
      </ul>

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
          <label class="etichetta" for="pr-titolo">Titolo <small>Le squadre lo vedono solo dopo averla aperta.</small><input id="pr-titolo" name="pr-titolo" class="campo" [(ngModel)]="b.titolo" required maxlength="120"></label>
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
      numero: (prove.at(-1)?.numero ?? 0) + 1, titolo: '', tipo: 'documento', testo: '', nota_sigillo: '',
      allegato_key: null, allegato_tipo: null, modi: [{ squadra_id: null, condizioni: [{ ...this.condizione('pin'), pin: this.codiceNuovo() }] }],
    };
  }

  modifica(p: ProvaR) {
    this.conferma = false;
    const gruppi = new Map<number, Regola[]>();
    p.regole.forEach((r) => gruppi.set(r.gruppo, [...(gruppi.get(r.gruppo) ?? []), r]));
    this.b = {
      id: p.id, numero: p.numero, titolo: p.titolo, tipo: p.tipo, testo: p.testo, nota_sigillo: p.nota_sigillo,
      allegato_key: p.allegato_key, allegato_tipo: p.allegato_tipo,
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
    const corpo = { ...b, regole };
    const ok = await this.st.fai(() => (b.id ? this.api.put(`/api/regia/prove/${b.id}`, corpo) : this.api.post('/api/regia/prove', corpo)), 'Prova salvata');
    if (ok) this.b = null;
  }

  async elimina() {
    const ok = await this.st.fai(() => this.api.del(`/api/regia/prove/${this.b!.id}`), 'Prova eliminata');
    if (ok) this.b = null;
  }
}
