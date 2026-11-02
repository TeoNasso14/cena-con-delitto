import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../api';
import { RegiaStato } from './stato';

/** Un suggerimento di dress code per tema, da modificare a piacere. */
const DRESS: Record<string, string> = {
  halloween: 'Nero e arancio, un tocco gotico: mantelli, cappelli, trucco scuro.',
  noir: "Anni '40: cappello, trench, cravatta sottile, rossetto rosso.",
  vittoriano: "Ottocento inglese: gilet, cravatta, gonne lunghe, guanti. Una lente d'ingrandimento è benvenuta.",
  viaggio: 'Elegante da vagone letto: abito da sera, cappotto lungo, una valigia piccola.',
  gatsby: "Anni '20: frange, piume, perle, papillon e bretelle.",
  natale: 'Elegante e caldo: un maglione bello o un abito scuro, con un dettaglio rosso o verde.',
};

type Presenza = 'si' | 'no' | 'forse' | null;
const PRESENZA: Record<string, string> = { si: 'Ci sarà', no: 'Non ci sarà', forse: 'Forse', nessuna: 'Non ha risposto' };

/** In Invitati: data, luogo e dress code della cena, e il link personale di ogni ospite con la sua risposta. */
@Component({
  selector: 'app-inviti-ospiti',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: contents; }
    .conti { display: flex; flex-wrap: wrap; gap: 8px; }
    .ospiti { list-style: none; margin: 0; padding: 0; background: var(--fondo-2); border-radius: 14px; }
    .ospiti li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 10px; align-items: center; padding: 10px 14px; }
    .ospiti li + li { border-top: 1px solid var(--fondo-3); }
    .ospiti .nome { font-weight: 600; }
    .ospiti small { grid-column: 1; color: var(--testo-2); font-size: 14px; }
    .ospiti .comandi { grid-row: 1 / span 2; grid-column: 2; display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .ospiti .bottone { min-height: 36px; padding: 0 12px; font-size: 14px; }
    .due { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
  `,
  template: `
    @let t = st.t()!;
    <section class="r-blocco">
      <h2>Inviti agli ospiti</h2>
      <form class="r-scheda r-modulo" (ngSubmit)="salva()">
        <p class="secondario">Ogni invitato riceve un link alla sua pagina: dettagli della cena, il suo personaggio con quello che sa solo lui, e la risposta ci sarò, forse, non ci sarò. Il link non fa entrare nella serata.</p>
        <div class="due">
          <label class="etichetta" for="os-quando">Quando<input id="os-quando" name="os-quando" class="campo" type="datetime-local" [(ngModel)]="quando"></label>
          <label class="etichetta" for="os-dove">Dove<input id="os-dove" name="os-dove" class="campo" maxlength="300" [(ngModel)]="dove" placeholder="Via, città, citofono"></label>
        </div>
        <label class="etichetta" for="os-dress">Come vestirsi
          <textarea id="os-dress" name="os-dress" class="campo" rows="2" maxlength="500" [(ngModel)]="dress"></textarea>
        </label>
        @if (suggerimento() && dress !== suggerimento()) {
          <button class="r-link" type="button" style="justify-self:start" (click)="dress = suggerimento()">Usa il suggerimento del tema: {{ suggerimento() }}</button>
        }
        <label class="etichetta" for="os-nota">Da sapere <small>Facoltativo: parcheggio, orari, cosa portare.</small>
          <textarea id="os-nota" name="os-nota" class="campo" rows="2" maxlength="2000" [(ngModel)]="nota"></textarea>
        </label>
        <button class="bottone bottone--pieno" type="submit" style="justify-self:start">Salva l'invito</button>
      </form>

      @if (t.invitati.length) {
        <div class="conti" aria-label="Risposte">
          @for (c of conti(); track c.chiave) { <span class="r-pillola" [class.r-pillola--accento]="c.chiave === 'si'">{{ c.n }} {{ c.testo }}</span> }
        </div>
        @if (senzaLink()) { <button class="bottone" type="button" style="justify-self:start" (click)="tutti()">Crea i link per tutti</button> }
        <ul class="ospiti">
          @for (i of t.invitati; track i.id) {
            <li>
              <span class="nome">{{ i.nome }}</span>
              <small>{{ presenza(i.presenza) }}{{ i.nota_ospite ? ': ' + i.nota_ospite : '' }}</small>
              <div class="comandi">
                @if (i.token) {
                  <button class="bottone" type="button" (click)="condividi(i.nome, i.token)">{{ copiato() === i.token ? 'Copiato' : 'Copia il link' }}</button>
                  <button class="bottone" type="button" [attr.aria-label]="'Nuovo link per ' + i.nome" (click)="rinnova(i.id, i.nome)">Nuovo link</button>
                } @else {
                  <button class="bottone" type="button" (click)="rinnova(i.id, i.nome)">Crea il link</button>
                }
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class InvitiOspiti {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  private s = this.st.t()!.serata;
  quando = this.s.cena_quando ? locale(this.s.cena_quando) : '';
  dove = this.s.cena_dove ?? '';
  dress = this.s.dress_code ?? '';
  nota = this.s.nota_invito ?? '';
  readonly copiato = signal<string | null>(null);
  readonly suggerimento = computed(() => DRESS[this.st.t()?.serata.tema ?? ''] ?? '');
  readonly senzaLink = computed(() => (this.st.t()?.invitati ?? []).some((i) => !i.token));
  readonly conti = computed(() => {
    const inv = this.st.t()?.invitati ?? [];
    return (['si', 'forse', 'no', 'nessuna'] as const)
      .map((k) => ({ chiave: k, n: inv.filter((i) => (i.presenza ?? 'nessuna') === k).length, testo: { si: 'sì', forse: 'forse', no: 'no', nessuna: 'senza risposta' }[k] }))
      .filter((c) => c.n);
  });
  presenza(p: Presenza) { return PRESENZA[p ?? 'nessuna']; }
  private url(token: string) { return `${location.origin}/ospite/${token}`; }

  salva() {
    this.st.fai(() => this.api.put('/api/regia/invito-ospiti', { quando: this.quando ? new Date(this.quando).toISOString() : null, dove: this.dove, dress_code: this.dress, nota: this.nota }), 'Invito salvato');
  }
  tutti() { this.st.fai(() => this.api.post('/api/regia/invitati/link'), 'Link creati per tutti'); }
  rinnova(id: number, nome: string) { this.st.fai(() => this.api.post(`/api/regia/invitati/${id}/link`), `Link nuovo per ${nome}: quello di prima non vale più`); }

  /** Sul telefono apre la condivisione (WhatsApp, messaggi); altrove copia il link. */
  async condividi(nome: string, token: string) {
    const url = this.url(token);
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title: this.st.t()!.serata.titolo, text: `${nome}, ecco il tuo invito`, url }); return; } catch { /* annullato: si copia */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      this.copiato.set(token);
      setTimeout(() => this.copiato.set(null), 2500);
    } catch {
      this.st.dimmi(`Copia non riuscita: ${url}`, true);
    }
  }
}

/** Da ISO al formato del campo datetime-local, nell'ora del browser. */
function locale(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
