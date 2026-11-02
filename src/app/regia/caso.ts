import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../api';
import { Icona } from '../icona';
import { Allegato } from './allegato';
import { PersonaggioR, RegiaStato } from './stato';

@Component({
  selector: 'app-caso',
  imports: [FormsModule, Icona],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .fase { display: grid; grid-template-columns: auto minmax(0, 1fr) 120px auto; gap: 10px; align-items: end; }
    .fase .n { font-family: var(--titoli); font-size: 28px; width: 32px; padding-bottom: 6px; color: var(--testo-2); }
    .togli { width: 44px; height: 48px; border-radius: 10px; border: 1px solid var(--filetto); background: transparent; color: var(--testo-2); display: grid; place-items: center; }
    @media (max-width: 520px) { .fase { grid-template-columns: auto minmax(0, 1fr) auto; } .fase .durata { grid-column: 2; } }
    .soluzione { border: 1px solid var(--sigillo-luce); }
  `,
  template: `
    <header class="r-testa">
      <div>
        <h1>Il caso e le fasi</h1>
        <p>Titolo e premessa compaiono sui telefoni e sul proiettore. La soluzione la vede solo la regia, finché non la riveli.</p>
      </div>
    </header>
    <div class="r-colonne">
      <form class="r-colonna" (ngSubmit)="salvaCaso()">
        <section class="r-blocco">
          <h2>Il caso</h2>
          <div class="r-scheda r-modulo">
            <label class="etichetta" for="titolo">Titolo<input id="titolo" name="titolo" class="campo" [(ngModel)]="caso.titolo" required maxlength="120"></label>
            <label class="etichetta" for="premessa">Premessa <small>Le prime righe che leggono le squadre.</small>
              <textarea id="premessa" name="premessa" class="campo" rows="6" [(ngModel)]="caso.premessa"></textarea></label>
          </div>
        </section>
        <section class="r-blocco">
          <h2>La soluzione</h2>
          <div class="r-scheda r-modulo soluzione">
            <p class="secondario">Serve per la rivelazione e per dare i punti alle accuse: il confronto accetta risposte simili, poi puoi correggere i punti a mano.</p>
            <label class="etichetta" for="colpevole">Colpevole<input id="colpevole" name="colpevole" class="campo" [(ngModel)]="caso.colpevole"></label>
            <label class="etichetta" for="movente">Movente<input id="movente" name="movente" class="campo" [(ngModel)]="caso.movente"></label>
            <label class="etichetta" for="arma">Arma<input id="arma" name="arma" class="campo" [(ngModel)]="caso.arma"></label>
          </div>
        </section>
        <button class="bottone bottone--pieno" type="submit" style="justify-self:start">Salva il caso</button>
      </form>

      <form class="r-colonna" (ngSubmit)="salvaFasi()">
        <section class="r-blocco">
          <h2>Le fasi</h2>
          <div class="r-scheda r-modulo">
            <p class="secondario">La serata avanza per fasi: le avvii tu dalla diretta. Una prova può aprirsi da sola a una fase, e una scena può andare in onda all'inizio della sua fase. La durata, se c'è, alimenta il conto alla rovescia del proiettore.</p>
            @for (f of fasi; track $index; let i = $index) {
              <div class="fase">
                <span class="n" aria-hidden="true">{{ i + 1 }}</span>
                <label class="etichetta" [for]="'fase-' + i">Nome<input [id]="'fase-' + i" [name]="'fase-' + i" class="campo" [(ngModel)]="f.nome" required maxlength="80"></label>
                <label class="etichetta durata" [for]="'durata-' + i">Minuti<input [id]="'durata-' + i" [name]="'durata-' + i" class="campo" type="number" min="1" max="600" [(ngModel)]="f.durata_minuti"></label>
                <button class="togli" type="button" [attr.aria-label]="'Togli la fase ' + (i + 1)" (click)="fasi.splice(i, 1)"><app-icona nome="chiudi" /></button>
              </div>
            }
            <button class="bottone bottone--piccolo" type="button" style="justify-self:start" (click)="fasi.push({ nome: '', durata_minuti: null })"><app-icona nome="piu" />Aggiungi una fase</button>
          </div>
        </section>
        <button class="bottone bottone--pieno" type="submit" style="justify-self:start">Salva le fasi</button>
      </form>
    </div>
  `,
})
export class CasoVista implements OnInit {
  private st = inject(RegiaStato);
  private api = inject(Api);
  caso = { titolo: '', premessa: '', colpevole: '', movente: '', arma: '' };
  fasi: Array<{ nome: string; durata_minuti: number | null }> = [];

  ngOnInit() {
    const t = this.st.t()!;
    const s = t.serata;
    this.caso = { titolo: s.titolo, premessa: s.premessa, colpevole: s.colpevole, movente: s.movente, arma: s.arma };
    this.fasi = t.fasi.map((f) => ({ nome: f.nome, durata_minuti: f.durata_minuti }));
    if (!this.fasi.length) this.fasi = [{ nome: '', durata_minuti: null }];
  }

  salvaCaso() { this.st.fai(() => this.api.put('/api/regia/caso', this.caso), 'Caso salvato'); }
  salvaFasi() {
    const fasi = this.fasi.filter((f) => f.nome.trim());
    this.st.fai(() => this.api.put('/api/regia/fasi', { fasi }), 'Fasi salvate');
  }
}

@Component({
  selector: 'app-personaggi-regia',
  imports: [FormsModule, Icona, Allegato],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="r-testa">
      <div><h1>Personaggi</h1><p>Le schede pubbliche compaiono sui telefoni. Le note di regia restano qui: battute, segreti, cosa rivelare e quando.</p></div>
      <button class="bottone bottone--pieno" type="button" (click)="nuovo()"><app-icona nome="piu" />Nuovo personaggio</button>
    </header>
    <div class="r-colonne">
      <ul class="r-elenco r-colonna" style="gap:10px">
        @for (p of st.t()!.personaggi; track p.id) {
          <li class="r-voce" [class.r-voce--scelta]="p.id === scelto?.id">
            <div><h3>{{ p.nome }}</h3><p>{{ p.ruolo || 'Senza ruolo' }}</p></div>
            <button class="bottone bottone--piccolo" type="button" (click)="modifica(p)">Modifica</button>
          </li>
        } @empty { <li class="r-vuoto">Nessun personaggio ancora.</li> }
      </ul>
      @if (scelto) {
        <form class="r-colonna r-scheda r-modulo" (ngSubmit)="salva()">
          <h2 class="gotico" style="font-size:26px">{{ scelto.id ? 'Modifica personaggio' : 'Nuovo personaggio' }}</h2>
          <div class="r-due">
            <label class="etichetta" for="p-nome">Nome<input id="p-nome" name="p-nome" class="campo" [(ngModel)]="scelto.nome" required maxlength="80"></label>
            <label class="etichetta" for="p-ruolo">Ruolo<input id="p-ruolo" name="p-ruolo" class="campo" [(ngModel)]="scelto.ruolo" placeholder="Ad esempio: la cuoca"></label>
          </div>
          <label class="etichetta" for="p-scheda">Scheda pubblica<textarea id="p-scheda" name="p-scheda" class="campo" rows="4" [(ngModel)]="scelto.scheda"></textarea></label>
          <label class="etichetta" for="p-note">Note di regia <small>Solo per te.</small><textarea id="p-note" name="p-note" class="campo" rows="4" [(ngModel)]="scelto.note_regia"></textarea></label>
          <label class="etichetta" for="p-copione">Per chi lo interpreta <small>Facoltativo. Se un invitato interpreta questo personaggio (lo scegli in Invitati), lo trova sulla sua scheda stampata: cosa sa, cosa nasconde, cosa deve dire. Le squadre non lo vedono.</small><textarea id="p-copione" name="p-copione" class="campo" rows="5" [(ngModel)]="scelto.copione"></textarea></label>
          <app-allegato etichetta="Ritratto" campo="p-foto" accetta="image/*" [(chiave)]="scelto.foto_key" />
          <div class="r-azioni">
            <button class="bottone bottone--pieno" type="submit">Salva</button>
            <button class="bottone" type="button" (click)="scelto = null">Annulla</button>
            @if (scelto.id) {
              @if (conferma) { <button class="bottone bottone--pericolo" type="button" (click)="elimina()">Sì, elimina</button> }
              @else { <button class="bottone bottone--pericolo" type="button" (click)="conferma = true">Elimina</button> }
            }
          </div>
        </form>
      }
    </div>
  `,
})
export class PersonaggiRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  scelto: (Omit<PersonaggioR, 'id'> & { id?: number }) | null = null;
  conferma = false;

  nuovo() { this.conferma = false; this.scelto = { nome: '', ruolo: '', scheda: '', note_regia: '', copione: '', foto_key: null, ordine: this.st.t()!.personaggi.length }; }
  modifica(p: PersonaggioR) { this.conferma = false; this.scelto = { ...p }; }
  async salva() {
    const p = this.scelto!;
    const ok = await this.st.fai(() => (p.id ? this.api.put(`/api/regia/personaggi/${p.id}`, p) : this.api.post('/api/regia/personaggi', p)), 'Personaggio salvato');
    if (ok) this.scelto = null;
  }
  async elimina() {
    const ok = await this.st.fai(() => this.api.del(`/api/regia/personaggi/${this.scelto!.id}`), 'Personaggio eliminato');
    if (ok) this.scelto = null;
  }
}
