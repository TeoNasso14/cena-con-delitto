import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api, ora } from '../api';
import { Icona } from '../icona';
import { Allegato } from './allegato';
import { temaDa, TEMI } from '../temi/catalogo';
import { RegiaStato, ScenaR, TIPI_SCENA } from './stato';

/* ---------- Scene del proiettore ---------- */

@Component({
  selector: 'app-scene-regia',
  imports: [FormsModule, Icona, Allegato],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .voce-scena { grid-template-columns: auto minmax(0, 1fr) auto; }
    .ordine { display: grid; gap: 2px; }
    .ordine button { width: 36px; height: 30px; border-radius: 10px; border: 1px solid var(--filetto); background: transparent; color: var(--testo-2); font-size: 14px; }
    .ordine button:disabled { opacity: 0.35; }
    .bottoni { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .aiuto { font-size: 14px; color: var(--testo-2); }
    .sfondo { display: grid; grid-template-columns: minmax(0, 260px) minmax(0, 1fr); gap: 20px; align-items: start; margin-bottom: 24px; }
    @media (max-width: 640px) { .sfondo { grid-template-columns: minmax(0, 1fr); } }
    .sfondo h2 { font-family: var(--titoli); font-size: 24px; line-height: 1.1; }
    .anteprima-sfondo { position: relative; aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden; background: var(--fondo); border: 1px solid var(--filetto); }
    .anteprima-sfondo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .anteprima-sfondo .luna-mini { position: absolute; width: 62%; aspect-ratio: 1; border-radius: 50%; background: var(--disco); right: -14%; top: 50%; transform: translateY(-50%); }
    .anteprima-sfondo span { position: absolute; left: 8%; top: 40%; font-family: var(--titoli); font-size: 22px; color: var(--testo-1); }
    .sfondo-campi { display: grid; gap: 12px; }
    .sfondo-campi input[type=range] { width: 100%; accent-color: var(--accento); }
  `,
  template: `
    <header class="r-testa">
      <div><h1>Scene del proiettore</h1><p>La scaletta che porta la storia in sala. In diretta mandi in onda la successiva con un tocco, o una qualsiasi dall'elenco.</p></div>
      <button class="bottone bottone--pieno" type="button" (click)="nuova()"><app-icona nome="piu" />Nuova scena</button>
    </header>
    <section class="r-scheda sfondo" aria-labelledby="t-sfondo">
      @let se = st.t()!.serata;
      <div class="anteprima-sfondo" aria-hidden="true">
        @if (se.sfondo_key) { <img [src]="'/api/file/' + se.sfondo_key" [style.opacity]="opacita()" alt=""> }
        <i class="luna-mini"></i>
        <span>{{ se.titolo }}</span>
      </div>
      <div class="sfondo-campi">
        <h2 id="t-sfondo">Sfondo del proiettore</h2>
        <p class="aiuto">Una foto, per esempio quella di gruppo, che resta trasparente dietro a tutte le scene. Con lo schermo nero non si vede.</p>
        <app-allegato etichetta="Foto di sfondo" campo="sfondo-foto" accetta="image/*" [chiave]="se.sfondo_key" (chiaveChange)="salvaSfondo($event)" />
        @if (se.sfondo_key) {
          <label class="etichetta" for="sfondo-op">Quanto si vede: {{ percentuale() }}%
            <input id="sfondo-op" type="range" min="5" max="80" step="1" [value]="percentuale()" (input)="opacitaLocale.set(+$any($event.target).value / 100)" (change)="salvaOpacita()">
          </label>
        }
      </div>
    </section>
    <div class="r-colonne">
      <ul class="r-elenco r-colonna" style="gap:10px">
        @for (s of st.t()!.scene; track s.id; let i = $index, ultimo = $last, primo = $first) {
          <li class="r-voce voce-scena" [class.r-voce--scelta]="s.id === b?.id">
            <div class="ordine">
              <button type="button" [disabled]="primo" [attr.aria-label]="'Sposta su ' + (s.titolo || 'la scena')" (click)="sposta(i, -1)">↑</button>
              <button type="button" [disabled]="ultimo" [attr.aria-label]="'Sposta giù ' + (s.titolo || 'la scena')" (click)="sposta(i, 1)">↓</button>
            </div>
            <div>
              <h3>{{ s.titolo || nome(s.tipo) }}</h3>
              <p>{{ nome(s.tipo) }}{{ s.fase_numero ? ', fase ' + s.fase_numero : '' }}{{ s.avvio_automatico ? ', parte da sola' : '' }}
                @if (s.id === st.t()!.serata.scena_in_onda) { <span class="r-pillola r-pillola--accento">In onda</span> }</p>
            </div>
            <div class="bottoni">
              <button class="bottone bottone--piccolo" type="button" (click)="inOnda(s.id)">In onda</button>
              <button class="bottone bottone--piccolo" type="button" (click)="modifica(s)">Modifica</button>
            </div>
          </li>
        } @empty { <li class="r-vuoto">Nessuna scena. Una buona scaletta parte da un'attesa, poi una narrazione per fase, il conto alla rovescia e la rivelazione.</li> }
      </ul>

      @if (b) {
        <form class="r-colonna r-scheda r-modulo" (ngSubmit)="salva()">
          <h2 class="gotico" style="font-size:26px">{{ b.id ? 'Modifica scena' : 'Nuova scena' }}</h2>
          <label class="etichetta" for="sc-tipo">Tipo
            <select id="sc-tipo" name="sc-tipo" class="campo" [(ngModel)]="b.tipo">
              @for (t of tipi; track t[0]) { <option [value]="t[0]">{{ t[1] }}</option> }
            </select>
          </label>
          <p class="aiuto">{{ aiuto[b.tipo] }}</p>
          <label class="etichetta" for="sc-titolo">Titolo<input id="sc-titolo" name="sc-titolo" class="campo" [(ngModel)]="b.titolo" maxlength="160"></label>
          @if (['narrazione', 'audio', 'conto', 'attesa'].includes(b.tipo)) {
            <label class="etichetta" for="sc-testo">Testo<textarea id="sc-testo" name="sc-testo" class="campo" rows="5" [(ngModel)]="b.testo"></textarea></label>
          }
          @if (['immagine', 'video', 'audio'].includes(b.tipo)) {
            <app-allegato etichetta="File da proiettare" campo="sc-allegato" [accetta]="b.tipo === 'immagine' ? 'image/*' : b.tipo === 'video' ? 'video/mp4,video/webm' : 'audio/*'" [(chiave)]="b.allegato_key" [(tipo)]="b.allegato_tipo" />
          }
          <div class="r-due">
            <label class="etichetta" for="sc-fase">Legata alla fase
              <select id="sc-fase" name="sc-fase" class="campo" [(ngModel)]="b.fase_numero">
                <option [ngValue]="null">Nessuna</option>
                @for (f of st.t()!.fasi; track f.numero) { <option [ngValue]="f.numero">{{ f.numero }}. {{ f.nome }}</option> }
              </select>
            </label>
            <label class="r-check" for="sc-auto"><input id="sc-auto" name="sc-auto" type="checkbox" [(ngModel)]="b.avvio_automatico" [disabled]="!b.fase_numero">Va in onda quando inizia la fase</label>
          </div>
          <div class="r-azioni">
            <button class="bottone bottone--pieno" type="submit">Salva la scena</button>
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
export class SceneRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly tipi = Object.entries(TIPI_SCENA);
  readonly nome = (t: string) => TIPI_SCENA[t] ?? t;
  readonly aiuto: Record<string, string> = {
    narrazione: 'Titolo gotico grande e testo da leggere in sala.',
    immagine: 'Un\'immagine a tutto schermo con il titolo come didascalia.',
    video: 'Un video breve a tutto schermo. L\'audio parte dopo che qualcuno ha toccato lo schermo del proiettore una volta.',
    audio: 'Titolo e testo, con un audio che parte quando la scena va in onda.',
    conto: 'Il tempo che resta alla fase corrente. Serve una durata nella fase.',
    avanzamento: 'Le squadre a confronto: quante prove ha aperto ciascuna, senza dire quali.',
    annuncio: 'Mostra l\'ultimo annuncio mandato a tutte le squadre.',
    rivelazione: 'Prima della rivelazione mostra il titolo; dopo, colpevole, movente, arma e chi ha indovinato.',
    attesa: 'La copertina della serata, per l\'inizio o le pause.',
  };
  b: (Omit<ScenaR, 'id' | 'in_onda_dal'> & { id?: number }) | null = null;
  conferma = false;
  /** Valore del cursore mentre lo si trascina, prima di salvarlo. */
  readonly opacitaLocale = signal<number | null>(null);
  opacita() { return this.opacitaLocale() ?? this.st.t()!.serata.sfondo_opacita ?? 0.25; }
  percentuale() { return Math.round(this.opacita() * 100); }
  salvaSfondo(key: string | null) {
    this.st.fai(() => this.api.put('/api/regia/sfondo', { key }), key ? 'Sfondo del proiettore aggiornato' : 'Sfondo tolto dal proiettore');
  }
  async salvaOpacita() {
    const o = this.opacita();
    await this.st.fai(() => this.api.put('/api/regia/sfondo', { opacita: o }));
    this.opacitaLocale.set(null);
  }

  nuova() {
    this.conferma = false;
    const scene = this.st.t()!.scene;
    this.b = { ordine: (scene.at(-1)?.ordine ?? 0) + 10, tipo: 'narrazione', titolo: '', testo: '', allegato_key: null, allegato_tipo: null, fase_numero: null, avvio_automatico: false };
  }
  modifica(s: ScenaR) { this.conferma = false; this.b = { ...s }; }
  async salva() {
    const b = this.b!;
    const corpo = { ...b, avvio_automatico: !!b.fase_numero && b.avvio_automatico };
    const ok = await this.st.fai(() => (b.id ? this.api.put(`/api/regia/scene/${b.id}`, corpo) : this.api.post('/api/regia/scene', corpo)), 'Scena salvata');
    if (ok) this.b = null;
  }
  async elimina() {
    const ok = await this.st.fai(() => this.api.del(`/api/regia/scene/${this.b!.id}`), 'Scena eliminata');
    if (ok) this.b = null;
  }
  inOnda(id: number) { this.st.fai(() => this.api.post('/api/regia/onda', { scena_id: id }), 'In onda'); }
  async sposta(i: number, verso: number) {
    const scene = [...this.st.t()!.scene];
    const [a, c] = [scene[i], scene[i + verso]];
    await this.st.fai(async () => {
      await this.api.put(`/api/regia/scene/${a.id}`, { ...a, ordine: c.ordine });
      await this.api.put(`/api/regia/scene/${c.id}`, { ...c, ordine: a.ordine === c.ordine ? a.ordine + verso : a.ordine });
    });
  }
}

/* ---------- Squadre e accessi ---------- */

@Component({
  selector: 'app-squadre-regia',
  imports: [FormsModule, Icona],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .pallino { width: 14px; height: 14px; border-radius: 50%; display: inline-block; margin-right: 8px; vertical-align: -1px; }
    .voce-sq { grid-template-columns: minmax(0, 1fr); }
    .righe { display: flex; flex-wrap: wrap; gap: 8px; }
    .colore { display: grid; grid-template-columns: 56px minmax(0, 1fr); gap: 10px; align-items: center; }
    .colore input[type=color] { width: 56px; height: 48px; border-radius: 10px; border: 1px solid var(--filetto); background: var(--fondo); padding: 4px; }
  `,
  template: `
    <header class="r-testa">
      <div><h1>Squadre e accessi</h1><p>Ogni squadra ha un suo accesso: nome utente e password da dare al tavolo. Anche il proiettore ha il suo. Le password si vedono una volta sola: se le perdi, ne generi una nuova e quella vecchia smette di funzionare.</p></div>
    </header>

    @if (credenziali(); as c) {
      <div class="r-credenziali" role="status" style="margin-bottom:28px">
        <p><strong>{{ c.titolo }}</strong>. Scrivila adesso: dopo non si potrà più leggere.</p>
        <dl><dt>Nome utente</dt><dd>{{ c.username }}</dd><dt>Password</dt><dd>{{ c.password }}</dd></dl>
        <button class="bottone bottone--piccolo" type="button" (click)="copia(c)">{{ copiato() ? 'Copiate' : 'Copia le credenziali' }}</button>
        <button class="r-link" type="button" style="color:var(--inchiostro); justify-self:start" (click)="credenziali.set(null)">Fatto, nascondi</button>
      </div>
    }

    <div class="r-colonne">
      <div class="r-colonna">
        <section class="r-blocco">
          <h2>Nuova squadra</h2>
          <form class="r-scheda r-modulo" (ngSubmit)="crea()">
            <label class="etichetta" for="sq-nome">Nome della squadra<input id="sq-nome" name="sq-nome" class="campo" [(ngModel)]="nome" required maxlength="40" placeholder="I Corvi"></label>
            <label class="etichetta" for="sq-colore">Colore
              <span class="colore"><input id="sq-colore" name="sq-colore" type="color" [(ngModel)]="colore"><span class="secondario">Distingue la squadra sul proiettore e in regia.</span></span>
            </label>
            <button class="bottone bottone--pieno" type="submit" style="justify-self:start" [disabled]="!nome.trim()">Crea squadra e accesso</button>
          </form>
        </section>
        <section class="r-blocco">
          <h2>Proiettore</h2>
          <div class="r-scheda">
            <p class="secondario">Apri il sito sul computer collegato al proiettore ed entra con questo accesso. Vede solo le scene che mandi in onda.</p>
            @for (s of st.t()!.schermi; track s.id) {
              <div class="r-voce" style="background:var(--fondo)">
                <div><h3>{{ s.username }}</h3><p>{{ s.ultimo_accesso ? 'Ultimo accesso alle ' + ora(s.ultimo_accesso) : 'Mai entrato' }}</p></div>
                <div class="righe">
                  <button class="bottone bottone--piccolo" type="button" (click)="password(s.id, 'Nuova password del proiettore')">Nuova password</button>
                  <button class="bottone bottone--piccolo bottone--pericolo" type="button" (click)="togliSchermo(s.id)">Togli</button>
                </div>
              </div>
            }
            <button class="bottone bottone--piccolo" type="button" style="justify-self:start" (click)="creaSchermo()"><app-icona nome="piu" />Crea accesso proiettore</button>
          </div>
        </section>
      </div>

      <section class="r-colonna r-blocco">
        <h2>Le squadre</h2>
        <ul class="r-elenco">
          @for (q of st.t()!.squadre; track q.id) {
            <li class="r-voce voce-sq">
              @if (modifica === q.id) {
                <form class="r-modulo" (ngSubmit)="salva(q.id)">
                  <label class="etichetta" [for]="'mn-' + q.id">Nome<input class="campo" [id]="'mn-' + q.id" [name]="'mn-' + q.id" [(ngModel)]="modNome" required></label>
                  <label class="etichetta" [for]="'mc-' + q.id">Colore<input type="color" [id]="'mc-' + q.id" [name]="'mc-' + q.id" [(ngModel)]="modColore" style="width:56px;height:44px"></label>
                  <div class="righe">
                    <button class="bottone bottone--piccolo bottone--pieno" type="submit">Salva</button>
                    <button class="bottone bottone--piccolo" type="button" (click)="modifica = null">Annulla</button>
                    @if (confermaElimina === q.id) {
                      <button class="bottone bottone--piccolo bottone--pericolo" type="button" (click)="elimina(q.id)">Sì, elimina squadra e progressi</button>
                    } @else {
                      <button class="bottone bottone--piccolo bottone--pericolo" type="button" (click)="confermaElimina = q.id">Elimina</button>
                    }
                  </div>
                </form>
              } @else {
                <div>
                  <h3><span class="pallino" [style.background]="q.colore"></span>{{ q.nome }}</h3>
                  <p>Accesso: <strong>{{ q.username }}</strong>. {{ q.ultimo_accesso ? 'Entrata alle ' + ora(q.ultimo_accesso) : 'Non ancora entrata' }}. {{ q.aperte }} prove aperte.</p>
                </div>
                <div class="righe">
                  <button class="bottone bottone--piccolo" type="button" (click)="password(q.account_id!, 'Nuova password per ' + q.nome)">Nuova password</button>
                  <button class="bottone bottone--piccolo" type="button" (click)="apriModifica(q.id, q.nome, q.colore)">Modifica</button>
                </div>
              }
            </li>
          } @empty { <li class="r-vuoto">Nessuna squadra. Creane due, tre o quattro: ognuna avrà il suo accesso.</li> }
        </ul>
      </section>
    </div>
  `,
})
export class SquadreRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly ora = ora;
  readonly credenziali = signal<{ titolo: string; username: string; password: string } | null>(null);
  readonly copiato = signal(false);
  nome = '';
  /** Il colore proposto per una squadra nuova è quello del disco del tema (non l'accento, che segna le cose vive); la regia lo può cambiare. */
  colore = temaDa(this.st.t()?.serata.tema).colori.disco;
  modifica: number | null = null;
  modNome = '';
  modColore = '';
  confermaElimina: number | null = null;

  private mostra(titolo: string, r: { username: string; password: string } | undefined) {
    if (!r) return;
    this.copiato.set(false);
    this.credenziali.set({ titolo, username: r.username, password: r.password });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async crea() {
    const r = await this.st.fai(() => this.api.post<{ username: string; password: string }>('/api/regia/squadre', { nome: this.nome, colore: this.colore }), 'Squadra creata');
    if (r) { this.mostra(`Accesso della squadra ${this.nome}`, r); this.nome = ''; }
  }
  async creaSchermo() {
    const r = await this.st.fai(() => this.api.post<{ username: string; password: string }>('/api/regia/schermi'), 'Accesso del proiettore creato');
    this.mostra('Accesso del proiettore', r);
  }
  async password(accountId: number, titolo: string) {
    const r = await this.st.fai(() => this.api.post<{ username: string; password: string }>(`/api/regia/account/${accountId}/password`), 'Password cambiata: la vecchia non vale più');
    this.mostra(titolo, r);
  }
  togliSchermo(id: number) { this.st.fai(() => this.api.del(`/api/regia/schermi/${id}`), 'Accesso del proiettore tolto'); }
  apriModifica(id: number, nome: string, colore: string) { this.modifica = id; this.modNome = nome; this.modColore = colore; this.confermaElimina = null; }
  async salva(id: number) {
    const ok = await this.st.fai(() => this.api.put(`/api/regia/squadre/${id}`, { nome: this.modNome, colore: this.modColore }), 'Squadra salvata');
    if (ok) this.modifica = null;
  }
  async elimina(id: number) {
    const ok = await this.st.fai(() => this.api.del(`/api/regia/squadre/${id}`), 'Squadra eliminata');
    if (ok) this.modifica = null;
  }
  async copia(c: { username: string; password: string }) {
    const testo = `Nome utente: ${c.username}\nPassword: ${c.password}\nSito: ${location.origin}`;
    try { await navigator.clipboard.writeText(testo); this.copiato.set(true); } catch { this.st.dimmi('Non riesco a copiare: seleziona il testo a mano.', true); }
  }
}

/* ---------- Accuse e verdetto ---------- */

@Component({
  selector: 'app-accuse-regia',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .accusa { display: grid; gap: 10px; }
    .accusa dl { margin: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 14px; }
    .accusa dt { color: var(--testo-2); font-size: 14px; }
    .accusa dd { margin: 0; }
    .punti { display: flex; gap: 10px; align-items: end; flex-wrap: wrap; }
    .punti .campo { width: 110px; }
  `,
  template: `
    @let t = st.t()!;
    <header class="r-testa">
      <div><h1>Accuse e verdetto</h1><p>Ogni squadra consegna una sola accusa. Quando riveli, il sito assegna i punti confrontando le risposte con la soluzione: 2 per il colpevole, 1 per il movente, 1 per l'arma. Puoi correggerli a mano prima o dopo.</p></div>
      <div class="r-azioni">
        @if (t.serata.rivelata) {
          <span class="r-pillola r-pillola--accento">Soluzione rivelata</span>
          <button class="r-link" type="button" (click)="nascondi()">Nascondi di nuovo</button>
        }
        @else if (conferma()) {
          <button class="bottone bottone--pieno" type="button" (click)="rivela()">Sì, rivela sul proiettore</button>
          <button class="bottone" type="button" (click)="conferma.set(false)">Non ancora</button>
        } @else {
          <button class="bottone bottone--pieno" type="button" (click)="conferma.set(true)" [disabled]="!t.serata.colpevole">Rivela la soluzione</button>
        }
      </div>
    </header>
    @if (!t.serata.colpevole) { <p class="avviso" style="margin-bottom:24px">Scrivi prima la soluzione in Il caso e le fasi.</p> }
    <div class="r-colonne">
      <section class="r-colonna r-blocco">
        <h2>La soluzione</h2>
        <div class="r-scheda accusa">
          <dl><dt>Colpevole</dt><dd>{{ t.serata.colpevole || 'non scritto' }}</dd><dt>Movente</dt><dd>{{ t.serata.movente || 'non scritto' }}</dd><dt>Arma</dt><dd>{{ t.serata.arma || 'non scritta' }}</dd></dl>
        </div>
      </section>
      <section class="r-colonna r-blocco">
        <h2>Le accuse</h2>
        @for (a of t.accuse; track a.squadra_id) {
          <div class="r-scheda accusa">
            <h3 style="font-size:18px">{{ a.squadra }} <span class="secondario" style="font-weight:400; font-size:14px">alle {{ ora(a.consegnata_alle) }}</span></h3>
            <dl><dt>Colpevole</dt><dd>{{ a.colpevole }}</dd><dt>Movente</dt><dd>{{ a.movente }}</dd><dt>Arma</dt><dd>{{ a.arma }}</dd>
              @if (a.spiegazione) { <dt>Racconto</dt><dd style="white-space:pre-line">{{ a.spiegazione }}</dd> }</dl>
            <form class="punti" (ngSubmit)="punti(a.squadra_id, $any(p.value))">
              <label class="etichetta" [for]="'pt-' + a.squadra_id">Punti<input #p class="campo" type="number" min="0" max="1000" [id]="'pt-' + a.squadra_id" [value]="a.punteggio ?? ''" placeholder="Da dare"></label>
              <button class="bottone bottone--piccolo" type="submit">Salva i punti</button>
            </form>
          </div>
        } @empty { <p class="r-vuoto">Nessuna accusa consegnata.</p> }
      </section>
    </div>
  `,
})
export class AccuseRegia {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly ora = ora;
  readonly conferma = signal(false);
  nascondi() { this.st.fai(() => this.api.post('/api/regia/nascondi-soluzione'), 'Soluzione nascosta: il proiettore torna all\'attesa'); }
  rivela() { this.conferma.set(false); this.st.fai(() => this.api.post('/api/regia/rivela'), 'Soluzione rivelata'); }
  punti(id: number, v: string) {
    const punteggio = v === '' ? null : Number(v);
    this.st.fai(() => this.api.put(`/api/regia/accuse/${id}`, { punteggio }), 'Punti salvati');
  }
}

/* ---------- Strumenti ---------- */

@Component({
  selector: 'app-strumenti',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .in-alto { margin-bottom: 32px; }
    .temi { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .tema { width: 100%; height: 100%; display: grid; align-content: start; gap: 6px; padding: 10px 10px 14px; text-align: left; border-radius: 14px;
      border: 1px solid transparent; background: var(--fondo-2); color: var(--testo-1); font: inherit; cursor: pointer; }
    .tema--scelto { border-color: var(--accento); }
    @media (hover: hover) { .tema:hover { background: var(--fondo-3); } }
    .tema-anteprima { position: relative; display: block; aspect-ratio: 16 / 9; margin-bottom: 4px; border-radius: 10px; border: 1px solid; overflow: hidden; }
    .tema-anteprima i { position: absolute; width: 62%; aspect-ratio: 1; border-radius: 50%; right: -14%; top: 50%; transform: translateY(-50%); }
    .tema-anteprima b { position: absolute; left: 8%; top: 50%; transform: translateY(-50%); max-width: 42%; font-size: 18px; line-height: 1; font-weight: 700;
      text-wrap: balance; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .tema-nome { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-weight: 600; }
    .tema-descrizione { font-size: 14px; color: var(--testo-2); }
  `,
  template: `
    @let t = st.t()!;
    <header class="r-testa"><div><h1>Strumenti</h1><p>Tema e nuvolette, accesso della regia, stato della serata, salvataggio del caso e ripartenza da zero.</p></div></header>
    <section class="r-blocco in-alto">
      <h2>Tema della serata</h2>
      <p class="secondario">Colori, caratteri e decorazioni di telefoni, proiettore e regia. Cambia per tutti entro pochi secondi, anche a serata in corso.</p>
      <ul class="temi">
        @for (tm of temi; track tm.id) {
          <li>
            <button type="button" class="tema" [class.tema--scelto]="tm.id === t.serata.tema" [attr.aria-pressed]="tm.id === t.serata.tema" (click)="scegliTema(tm.id)">
              <span class="tema-anteprima" aria-hidden="true" [style.background]="tm.colori.fondo" [style.border-color]="tm.colori.filetto">
                <i [style.background]="tm.colori.disco"></i>
                <b [style.font-family]="tm.titoli" [style.color]="tm.colori['testo-1']">{{ t.serata.titolo }}</b>
              </span>
              <span class="tema-nome">{{ tm.nome }}@if (tm.id === t.serata.tema) { <span class="r-pillola r-pillola--accento">In uso</span> }</span>
              <span class="tema-descrizione">{{ tm.descrizione }}</span>
            </button>
          </li>
        }
      </ul>
    </section>
    <section class="r-blocco in-alto">
      <h2>Nuvolette</h2>
      <div class="r-scheda r-modulo">
        <p class="secondario">Frasi brevi che compaiono ogni tanto sui telefoni e sul proiettore, con una piccola figura del tema. Solo atmosfera: niente che sembri un indizio.</p>
        <label class="r-check" for="su-accese"><input id="su-accese" type="checkbox" [checked]="t.serata.sussurri_attivi" (change)="accendiSussurri($any($event.target).checked)">Nuvolette accese</label>
        <label class="etichetta" for="su-frasi">Frasi della serata <small>Una per riga. Se lasci vuoto, compaiono le {{ temaInUso().frasi.length }} frasi pronte del tema.</small>
          <textarea id="su-frasi" name="su-frasi" class="campo" rows="10" [(ngModel)]="frasi"></textarea>
        </label>
        <div class="r-azioni">
          <button class="bottone bottone--pieno" type="button" [disabled]="!frasiCambiate()" (click)="salvaFrasi()">Salva le frasi</button>
          <button class="bottone" type="button" (click)="frasiDelTema()">Metti le frasi pronte del tema</button>
        </div>
      </div>
    </section>
    <div class="r-colonne">
      <div class="r-colonna">
        <section class="r-blocco">
          <h2>Accesso della regia</h2>
          <form class="r-scheda r-modulo" (ngSubmit)="cambia()">
            <p class="secondario">Se consegni la regia a un'altra persona, falle scegliere nome utente e password qui: da quel momento il vecchio accesso non vale più.</p>
            <label class="etichetta" for="rg-user">Nome utente<input id="rg-user" name="rg-user" class="campo" autocomplete="username" [(ngModel)]="username"></label>
            <label class="etichetta" for="rg-att">Password attuale<input id="rg-att" name="rg-att" class="campo" type="password" autocomplete="current-password" [(ngModel)]="attuale" required></label>
            <label class="etichetta" for="rg-nuova">Nuova password <small>Almeno 10 caratteri.</small><input id="rg-nuova" name="rg-nuova" class="campo" type="password" autocomplete="new-password" [(ngModel)]="nuova" required minlength="10"></label>
            <button class="bottone bottone--pieno" type="submit" style="justify-self:start">Cambia l'accesso</button>
          </form>
        </section>
        <section class="r-blocco">
          <h2>Stato della serata</h2>
          <div class="r-scheda r-modulo">
            <p class="secondario">Ora: <strong>{{ stati[t.serata.stato] }}</strong>. I codici funzionano solo quando la serata è in corso.</p>
            <div class="r-azioni">
              @for (s of ordineStati; track s) {
                @if (s !== t.serata.stato) { <button class="bottone bottone--piccolo" type="button" (click)="stato(s)">{{ azioniStato[s] }}</button> }
              }
            </div>
          </div>
        </section>
      </div>
      <div class="r-colonna">
        <section class="r-blocco">
          <h2>Salva o carica il caso</h2>
          <div class="r-scheda r-modulo">
            <p class="secondario">Scarica il caso in un file per tenerne una copia o riusarlo un'altra sera: contiene trama, fasi, personaggi, prove con i loro codici e scene. Non contiene squadre, accessi e allegati.</p>
            <button class="bottone" type="button" style="justify-self:start" (click)="esporta()">Scarica il caso</button>
            <p class="secondario">Puoi anche caricare un caso da file: sostituisce quello attuale.</p>
            <label class="bottone bottone--piccolo" for="imp-file" style="justify-self:start; cursor:pointer">Carica un caso da file</label>
            <input class="sr" id="imp-file" type="file" accept="application/json,.json" (change)="leggi($event)">
            @if (daImportare()) {
              <label class="etichetta" for="imp-conf">Per sostituire il caso attuale scrivi SOSTITUISCI<input id="imp-conf" name="imp-conf" class="campo" [(ngModel)]="confImporta"></label>
              <button class="bottone bottone--pericolo" type="button" style="justify-self:start" [disabled]="confImporta !== 'SOSTITUISCI'" (click)="importa()">Sostituisci il caso</button>
            }
          </div>
        </section>
        <section class="r-blocco">
          <h2>Ricomincia da zero</h2>
          <div class="r-scheda r-modulo">
            <p class="secondario">Cancella prove aperte, codici tentati, accuse, annunci e registro. Restano il caso, le squadre e i loro accessi. Utile dopo le prove generali.</p>
            <label class="etichetta" for="az-conf">Scrivi AZZERA per confermare<input id="az-conf" name="az-conf" class="campo" [(ngModel)]="confAzzera"></label>
            <button class="bottone bottone--pericolo" type="button" style="justify-self:start" [disabled]="confAzzera !== 'AZZERA'" (click)="azzera()">Azzera la serata</button>
          </div>
        </section>
      </div>
    </div>
  `,
})
export class Strumenti {
  readonly st = inject(RegiaStato);
  private api = inject(Api);
  readonly stati: Record<string, string> = { bozza: 'in preparazione', in_corso: 'in corso', in_pausa: 'in pausa', chiusa: 'chiusa' };
  readonly azioniStato: Record<string, string> = { bozza: 'Torna in preparazione', in_corso: 'Metti in corso', in_pausa: 'Metti in pausa', chiusa: 'Chiudi la serata' };
  readonly ordineStati = ['bozza', 'in_corso', 'in_pausa', 'chiusa'];
  readonly temi = TEMI;
  readonly temaInUso = () => temaDa(this.st.t()?.serata.tema);
  frasi = (this.st.t()?.sussurri ?? []).join('\n');
  username = this.st.t()?.io.username ?? '';
  attuale = '';
  nuova = '';
  confAzzera = '';
  confImporta = '';
  readonly daImportare = signal<unknown>(null);

  async cambia() {
    const ok = await this.st.fai(() => this.api.put('/api/regia/password', { attuale: this.attuale, nuova: this.nuova, username: this.username }), 'Accesso della regia aggiornato');
    if (ok) { this.attuale = ''; this.nuova = ''; }
  }
  stato(s: string) { this.st.fai(() => this.api.post('/api/regia/stato', { stato: s }), 'Stato aggiornato'); }
  private righe() { return this.frasi.split('\n').map((f) => f.trim()).filter(Boolean); }
  frasiCambiate() { return this.righe().join('\n') !== (this.st.t()?.sussurri ?? []).join('\n'); }
  frasiDelTema() { this.frasi = this.temaInUso().frasi.join('\n'); }
  async salvaFrasi() {
    const frasi = this.righe();
    const ok = await this.st.fai(() => this.api.put('/api/regia/sussurri', { frasi }), frasi.length ? `Frasi salvate: ${frasi.length}` : 'Ora compaiono le frasi pronte del tema');
    if (ok) this.frasi = frasi.join('\n');
  }
  accendiSussurri(attivi: boolean) {
    this.st.fai(() => this.api.put('/api/regia/sussurri', { attivi }), attivi ? 'Nuvolette accese' : 'Nuvolette spente');
  }
  scegliTema(id: string) {
    if (id === this.st.t()?.serata.tema) return;
    this.st.fai(() => this.api.put('/api/regia/tema', { tema: id }), 'Tema della serata cambiato');
  }
  async esporta() {
    const dati = await this.st.fai(() => this.api.get('/api/regia/esporta'));
    if (!dati) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(dati, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `caso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async leggi(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    try {
      this.daImportare.set(JSON.parse(await f.text()));
    } catch {
      this.st.dimmi('Il file non è leggibile come caso.', true);
    }
  }
  async importa() {
    const ok = await this.st.fai(() => this.api.post('/api/regia/importa', { conferma: this.confImporta, caso: this.daImportare() }), 'Caso caricato');
    if (ok) { this.daImportare.set(null); this.confImporta = ''; }
  }
  async azzera() {
    const ok = await this.st.fai(() => this.api.post('/api/regia/azzera', { conferma: this.confAzzera }), 'Serata azzerata');
    if (ok) this.confAzzera = '';
  }
}

