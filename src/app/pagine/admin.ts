import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api, ErroreApi } from '../api';
import { Firma } from '../firma';
import { Sessione } from '../sessione';
import { applicaTema } from '../temi/applica';
import { Testata } from './testata';

interface Utente {
  id: number; username: string; nome: string; email: string | null; admin: boolean; stato: 'attivo' | 'sospeso'; ultimo_accesso: string | null; creato: string;
  serate: number; in_preparazione: number; in_corso: number; chiuse: number; archiviate: number; squadre: number; ultima_partita: string | null; spazio: number;
}
interface Sito {
  versione: string; database: { ultimaMigrazione: string | null; migrazioni: number }; tempoReale: boolean; serate: number; squadre: number;
  allegati: { file: number; byte: number; daMisurare: number } | null;
}
interface Voce { id: number; autore: string; azione: string; bersaglio: string; ora: string }
interface Invito { id: number; tipo: 'regia' | 'password'; nome: string; email: string | null; creato: string; scade: string; utente_id: number | null; username: string | null; stato: 'attesa' | 'scaduto' }
interface Link { per: string; url: string; scade: string; tipo: 'regia' | 'password' }

/** Amministrazione degli account regia e degli inviti. Solo account e numeri: le serate non si vedono mai da qui. */
@Component({
  selector: 'app-admin',
  imports: [FormsModule, Firma, Testata],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .pagina { max-width: 1440px; margin: 0 auto; padding: 0 max(16px, min(3vw, 48px)) 48px; }
    .apertura { padding: 28px 0 22px; display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--filetto); }
    .apertura h1 { font: 400 clamp(40px, 5vw, 56px)/1 var(--titoli); text-wrap: balance; }
    .apertura p { margin-top: 10px; color: var(--testo-2); font-size: 17px; max-width: 70ch; }
    .modulo { margin-top: 20px; max-width: 640px; }
    .avviso { margin-top: 20px; }
    .link { margin-top: 20px; max-width: 760px; }
    .link .url { font: 700 16px/1.4 var(--corpo); overflow-wrap: anywhere; }

    .sezione { display: flex; align-items: baseline; gap: 14px; margin: 32px 0 14px; }
    .sezione h2 { font: 400 28px/1 var(--titoli); }
    .sezione span { color: var(--testo-2); }
    .scorre { overflow-x: auto; border: 1px solid var(--filetto); border-radius: 2px; background: var(--fondo-2); }
    table { width: 100%; min-width: 880px; border-collapse: collapse; }
    th { text-align: left; font: 600 14px/1.2 var(--corpo); color: var(--testo-2); padding: 13px 20px; background: var(--fondo-3); border-bottom: 1px solid var(--filetto); }
    td { padding: 12px 20px; border-top: 1px solid var(--filetto); vertical-align: middle; }
    tr:first-child td { border-top: 0; }
    .chi { display: flex; align-items: center; gap: 14px; }
    .iniziale { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--accento); color: var(--su-accento); font: 700 16px/1 var(--corpo); }
    .nome { font: 400 22px/1.1 var(--titoli); }
    .chi small { display: block; color: var(--testo-2); font-size: 14px; }
    .stato { display: inline-flex; align-items: center; gap: 7px; font-weight: 700; }
    .stato::before { content: ''; width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--testo-1); }
    .stato--attivo::before { background: var(--accento); border-color: var(--accento); }
    /* Le serate come dorsi della collana: si contano, non si leggono. */
    .volumi { display: flex; align-items: center; gap: 12px; }
    .dorsi { display: flex; align-items: flex-end; gap: 3px; height: 36px; }
    .dorsi i { position: relative; width: 12px; background: var(--accento); border-radius: 1px; }
    .dorsi i::after { content: ''; position: absolute; left: 3px; right: 3px; top: 6px; bottom: 6px; background: var(--su-accento); }
    .dorsi i:nth-child(3n + 1) { height: 36px; } .dorsi i:nth-child(3n + 2) { height: 31px; } .dorsi i:nth-child(3n) { height: 34px; }
    .volumi b { font: 700 20px/1 var(--corpo); color: var(--accento); }
    .volumi span { color: var(--testo-2); }
    .spento td, .spento .nome { color: var(--testo-2); }
    .spento .iniziale { background: var(--fondo-3); color: var(--testo-2); border: 1px solid var(--filetto); }
    .spento .dorsi i { background: var(--filetto); }
    .comandi { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
    .comandi .bottone { min-height: 40px; padding: 0 16px; font-size: 15px; }
    .scaduto { color: var(--allarme); font-weight: 700; }
    .tenue { color: var(--testo-2); }
    .vuoto { padding: 18px 20px; color: var(--testo-2); }
    .caricamento { margin-top: 28px; }
    .numeri { margin-top: 6px; color: var(--testo-2); font-size: 14px; line-height: 1.4; }
    .sito { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); border: 1px solid var(--filetto); border-radius: 2px; background: var(--fondo-2); }
    .sito > div { padding: 16px 20px; border-right: 1px solid var(--filetto); display: grid; gap: 4px; align-content: start; }
    .sito > div:last-child { border-right: 0; }
    .sito dt { color: var(--testo-2); font-size: 14px; font-weight: 600; }
    .sito dd { margin: 0; font: 700 22px/1.15 var(--corpo); }
    .sito small { color: var(--testo-2); font-size: 14px; }
    .sito .bottone { justify-self: start; min-height: 36px; padding: 0 14px; font-size: 14px; margin-top: 6px; }
    .azione-riga td { background: var(--fondo-3); }
    .azione { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; }
    .azione .etichetta { flex: 1 1 240px; max-width: 360px; }
    .registro { list-style: none; margin: 0; padding: 4px 20px; border: 1px solid var(--filetto); border-radius: 2px; background: var(--fondo-2); max-height: 420px; overflow-y: auto; }
    .registro li { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 12px; padding: 10px 0; border-top: 1px solid var(--filetto); }
    .registro li:first-child { border-top: 0; }
    .registro time { color: var(--testo-2); font-size: 14px; }
    @media (max-width: 560px) { .registro li { grid-template-columns: minmax(0, 1fr); gap: 2px; } }
  `,
  template: `
    <app-testata casa="/admin" />
    <main class="pagina">
      <div class="apertura">
        <div><h1>Amministrazione</h1><p>Il sito, gli account della regia e il registro. Qui vedi solo account, numeri e date, mai il contenuto delle serate.</p></div>
        @if (!nuovo()) { <button class="bottone bottone--pieno" type="button" (click)="nuovo.set(true)">Nuovo invito</button> }
      </div>

      @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }

      @if (nuovo()) {
        <form class="r-scheda r-modulo modulo" (ngSubmit)="invita()">
          <label class="etichetta" for="inv-nome">Nome di chi inviti <small>Lo vede nella pagina dell'invito.</small>
            <input id="inv-nome" name="inv-nome" class="campo" maxlength="80" required [(ngModel)]="nome">
          </label>
          <label class="etichetta" for="inv-email">Email <small>Facoltativa, solo per ricordarti a chi l'hai mandato.</small>
            <input id="inv-email" name="inv-email" class="campo" type="email" maxlength="200" [(ngModel)]="email">
          </label>
          <div class="r-azioni">
            <button class="bottone bottone--pieno" type="submit" [disabled]="!nome.trim() || occupato()">Crea il link d'invito</button>
            <button class="bottone" type="button" (click)="nuovo.set(false)">Annulla</button>
          </div>
        </form>
      }

      @if (link(); as l) {
        <div class="r-credenziali link" role="status">
          <p>{{ l.tipo === 'regia' ? 'Link d\\'invito per ' + l.per : 'Link per la nuova password di ' + l.per }}. Mandalo tu: si vede solo adesso, funziona una volta e scade il {{ data(l.scade) }}.</p>
          <p class="url">{{ l.url }}</p>
          <div class="r-azioni">
            <button class="bottone" type="button" (click)="copia(l.url)">{{ copiato() ? 'Copiato' : 'Copia il link' }}</button>
            <button class="r-link" type="button" (click)="link.set(null)">Fatto, nascondi</button>
          </div>
        </div>
      }

      @if (vista(); as v) {
        <div class="sezione"><h2>Il sito</h2></div>
        <dl class="sito">
          <div><dt>Versione</dt><dd>{{ v.sito.versione }}</dd><small>{{ v.sito.database.migrazioni }} aggiornamenti del database</small></div>
          <div><dt>Serate e squadre</dt><dd>{{ v.sito.serate }} e {{ v.sito.squadre }}</dd><small>in tutto, di tutte le regie</small></div>
          <div><dt>Tempo reale</dt><dd>{{ v.sito.tempoReale ? 'Acceso' : 'Spento' }}</dd><small>{{ v.sito.tempoReale ? 'Con Ably: i cambi arrivano subito' : 'Senza ABLY_API_KEY: aggiornamenti in circa un secondo' }}</small></div>
          <div><dt>Allegati</dt>
            @if (v.sito.allegati; as a) {
              <dd>{{ peso(a.byte) }}</dd><small>{{ conta(a.file, 'file', 'file') }}{{ a.daMisurare ? ', ' + a.daMisurare + ' ancora da misurare' : '' }}</small>
              @if (a.daMisurare) { <button class="bottone" type="button" [disabled]="occupato()" (click)="misura()">{{ misurando() ? 'Misuro…' : 'Misura i file di prima' }}</button> }
            } @else { <dd>Non raggiungibili</dd><small>L'archivio degli allegati non risponde: riprova tra poco.</small> }
          </div>
        </dl>

        <div class="sezione"><h2>Account</h2><span>{{ conta(v.utenti.length, 'account', 'account') }}</span></div>
        <div class="scorre">
          <table>
            <thead><tr><th scope="col">Nome</th><th scope="col">Stato</th><th scope="col">Serate</th><th scope="col">Ultimo accesso</th><th scope="col"><span class="sr">Comandi</span></th></tr></thead>
            <tbody>
              @for (u of v.utenti; track u.id) {
                <tr [class.spento]="u.stato === 'sospeso'">
                  <td><div class="chi"><span class="iniziale" aria-hidden="true">{{ (u.nome || u.username).charAt(0).toUpperCase() }}</span>
                    <div><span class="nome">{{ u.nome || u.username }}</span><small>{{ u.username }}{{ u.admin ? ', amministrazione' : '' }}{{ u.email ? ', ' + u.email : '' }}</small></div></div></td>
                  <td><span class="stato" [class.stato--attivo]="u.stato === 'attivo'">{{ u.stato === 'attivo' ? 'Attivo' : 'Sospeso' }}</span></td>
                  <td>
                    @if (u.admin) { <span class="tenue">Non gestisce serate</span> }
                    @else {
                      <div class="volumi">
                        @if (u.serate) { <span class="dorsi" aria-hidden="true">@for (x of dorsi(u.serate); track $index) { <i></i> }</span> }
                        <b>{{ u.serate }}</b><span>{{ u.serate === 1 ? 'serata' : 'serate' }}</span>
                      </div>
                      @if (u.serate || u.spazio) { <p class="numeri">{{ numeri(u) }}</p> }
                    }
                  </td>
                  <td>{{ u.ultimo_accesso ? quando(u.ultimo_accesso) : 'mai' }}</td>
                  <td>
                    <div class="comandi">
                      <button class="bottone" type="button" [disabled]="occupato()" (click)="linkPassword(u)">Link per la password</button>
                      @if (u.id !== v.io.id) {
                        @if (u.stato === 'attivo') { <button class="bottone bottone--pericolo" type="button" [disabled]="occupato()" (click)="sospendi(u, true)">Sospendi</button> }
                        @else { <button class="bottone" type="button" [disabled]="occupato()" (click)="sospendi(u, false)">Riattiva</button> }
                      }
                      @if (!u.admin && u.serate && riceventi(u).length) { <button class="bottone" type="button" [disabled]="occupato()" (click)="apri('passa', u)">Passa le serate</button> }
                      @if (!u.admin && !u.serate && u.id !== v.io.id) { <button class="bottone bottone--pericolo" type="button" [disabled]="occupato()" (click)="apri('elimina', u)">Elimina</button> }
                    </div>
                  </td>
                </tr>
                @if (azione()?.u?.id === u.id) {
                  <tr class="azione-riga"><td colspan="5">
                    @if (azione()!.tipo === 'passa') {
                      <form class="azione" (ngSubmit)="passa(u)">
                        <label class="etichetta" for="passa-a">Passa {{ u.serate === 1 ? 'la sua serata' : 'le sue ' + u.serate + ' serate' }} a <small>Cambia solo chi le gestisce: tu non le vedi.</small>
                          <select id="passa-a" name="passa-a" class="campo" [(ngModel)]="ricevente" required>
                            <option [ngValue]="null" disabled>Scegli l'account</option>
                            @for (x of riceventi(u); track x.id) { <option [ngValue]="x.id">{{ x.nome || x.username }} ({{ x.username }})</option> }
                          </select>
                        </label>
                        <button class="bottone bottone--pieno" type="submit" [disabled]="!ricevente || occupato()">Passa le serate</button>
                        <button class="bottone" type="button" (click)="azione.set(null)">Annulla</button>
                      </form>
                    } @else {
                      <form class="azione" (ngSubmit)="elimina(u)">
                        <label class="etichetta" for="elimina-conf">Per eliminare l'account scrivi {{ u.username }} <small>Non ha serate. Si elimina per sempre, insieme ai suoi link aperti.</small>
                          <input id="elimina-conf" name="elimina-conf" class="campo" autocomplete="off" [(ngModel)]="conferma">
                        </label>
                        <button class="bottone bottone--pericolo" type="submit" [disabled]="conferma !== u.username || occupato()">Elimina l'account</button>
                        <button class="bottone" type="button" (click)="azione.set(null)">Annulla</button>
                      </form>
                    }
                  </td></tr>
                }
              }
            </tbody>
          </table>
        </div>

        <div class="sezione"><h2>Inviti in attesa</h2><span>{{ conta(v.inviti.length, 'invito', 'inviti') }}</span></div>
        <div class="scorre">
          @if (v.inviti.length) {
            <table>
              <thead><tr><th scope="col">Per</th><th scope="col">Tipo</th><th scope="col">Scadenza</th><th scope="col"><span class="sr">Comandi</span></th></tr></thead>
              <tbody>
                @for (i of v.inviti; track i.id) {
                  <tr>
                    <td><div class="chi"><div><span class="nome">{{ i.nome }}</span><small>{{ i.email || (i.username ? i.username : 'nessuna email') }}</small></div></div></td>
                    <td>{{ i.tipo === 'regia' ? 'Nuovo account regia' : 'Nuova password' }}</td>
                    <td>@if (i.stato === 'scaduto') { <span class="scaduto">Scaduto il {{ data(i.scade) }}</span> } @else { Scade il {{ data(i.scade) }} }</td>
                    <td>
                      <div class="comandi">
                        <button class="bottone" type="button" [disabled]="occupato()" (click)="rigenera(i)">{{ i.stato === 'scaduto' ? 'Rigenera' : 'Nuovo link' }}</button>
                        <button class="bottone bottone--pericolo" type="button" [disabled]="occupato()" (click)="revoca(i)">Revoca</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else { <p class="vuoto">Nessun invito in attesa.</p> }
        </div>

        <div class="sezione"><h2>Registro</h2><span>le ultime {{ v.registro.length }} azioni</span></div>
        @if (v.registro.length) {
          <ol class="registro">
            @for (r of v.registro; track r.id) {
              <li><time>{{ quando(r.ora) }}, {{ orario(r.ora) }}</time><span>{{ r.azione }}{{ r.bersaglio ? ': ' + r.bersaglio : '' }}{{ r.autore && r.autore !== v.io.username ? ', da ' + r.autore : '' }}</span></li>
            }
          </ol>
        } @else { <p class="vuoto">Ancora nessuna azione.</p> }
      } @else if (!errore()) { <p class="secondario caricamento" role="status">Carico gli account…</p> }

      <app-firma />
    </main>
  `,
})
export class AdminVista implements OnInit {
  private api = inject(Api);
  private router = inject(Router);
  readonly sessione = inject(Sessione);
  readonly vista = signal<{ io: { id: number; username: string }; utenti: Utente[]; inviti: Invito[]; registro: Voce[]; sito: Sito } | null>(null);
  readonly azione = signal<{ tipo: 'passa' | 'elimina'; u: Utente } | null>(null);
  readonly misurando = signal(false);
  ricevente: number | null = null;
  conferma = '';
  readonly nuovo = signal(false);
  readonly link = signal<Link | null>(null);
  readonly copiato = signal(false);
  readonly occupato = signal(false);
  readonly errore = signal('');
  nome = '';
  email = '';

  ngOnInit() {
    applicaTema('marchio');
    this.sessione.carica();
    this.carica();
  }

  conta(n: number, uno: string, tanti: string) { return `${n} ${n === 1 ? uno : tanti}`; }
  /** Al massimo dodici dorsi: oltre conta il numero. */
  dorsi(n: number) { return Array.from({ length: Math.min(n, 12) }); }
  data(d: string) { return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }); }
  quando(d: string) {
    const giorno = new Date(d).toDateString();
    return giorno === new Date().toDateString() ? 'oggi' : this.data(d);
  }
  orario(d: string) { return new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); }
  peso(b: number) {
    if (b < 1024 * 1024) return `${Math.round(b / 1024)} kB`;
    return `${(b / (1024 * 1024)).toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB`;
  }
  /** I numeri di un account in una riga: stati delle serate, squadre, ultima partita, spazio. */
  numeri(u: Utente) {
    const stati = [
      u.in_preparazione ? `${u.in_preparazione} in preparazione` : '', u.in_corso ? `${u.in_corso} in corso` : '',
      u.chiuse ? `${u.chiuse} ${u.chiuse === 1 ? 'chiusa' : 'chiuse'}` : '', u.archiviate ? `${u.archiviate} ${u.archiviate === 1 ? 'archiviata' : 'archiviate'}` : '',
    ].filter(Boolean).join(', ');
    const altro = [this.conta(u.squadre, 'squadra', 'squadre'), u.ultima_partita ? `ultima partita ${this.quando(u.ultima_partita)}` : 'mai giocato', u.spazio ? `${this.peso(u.spazio)} di allegati` : ''];
    return [stati, ...altro].filter(Boolean).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join('. ') + '.';
  }
  /** Chi può ricevere le serate: un altro account regia. */
  riceventi(u: Utente) { return (this.vista()?.utenti ?? []).filter((x) => !x.admin && x.id !== u.id); }
  apri(tipo: 'passa' | 'elimina', u: Utente) {
    this.ricevente = null;
    this.conferma = '';
    this.azione.set({ tipo, u });
  }
  async passa(u: Utente) {
    const r = await this.fai(() => this.api.post<{ serate: number }>(`/api/admin/utenti/${u.id}/trasferisci`, { a: this.ricevente }));
    if (r) this.azione.set(null);
  }
  async elimina(u: Utente) {
    const r = await this.fai(() => this.api.post(`/api/admin/utenti/${u.id}/elimina`, { conferma: this.conferma }));
    if (r) this.azione.set(null);
  }
  /** Misura i file di prima della 3.0, dieci alla volta, finché non ne restano. */
  async misura() {
    this.misurando.set(true);
    try {
      for (let giri = 0; giri < 200; giri++) {
        const r = await this.fai(() => this.api.post<{ misurati: number; restanti: number }>('/api/admin/allegati/misura'));
        if (!r || !r.restanti || !r.misurati) break;
      }
    } finally {
      this.misurando.set(false);
    }
  }
  private url(token: string) { return `${location.origin}/invito/${token}`; }

  async carica() {
    try {
      this.vista.set(await this.api.get('/api/admin'));
    } catch (e) {
      if (e instanceof ErroreApi && e.stato === 401) await this.router.navigateByUrl('/regia/accedi');
      else this.errore.set((e as Error).message);
    }
  }

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

  private mostra(per: string, r: { token: string; scade: string } | undefined, tipo: Link['tipo']) {
    if (!r) return;
    this.copiato.set(false);
    this.link.set({ per, url: this.url(r.token), scade: r.scade, tipo });
  }

  async invita() {
    const per = this.nome.trim();
    const r = await this.fai(() => this.api.post<{ token: string; scade: string }>('/api/admin/inviti', { nome: per, email: this.email.trim() }));
    if (r) {
      this.nome = '';
      this.email = '';
      this.nuovo.set(false);
    }
    this.mostra(per, r, 'regia');
  }
  async rigenera(i: Invito) {
    this.mostra(i.nome, await this.fai(() => this.api.post<{ token: string; scade: string }>(`/api/admin/inviti/${i.id}/rigenera`)), i.tipo);
  }
  revoca(i: Invito) { this.fai(() => this.api.post(`/api/admin/inviti/${i.id}/revoca`)); }
  sospendi(u: Utente, sospeso: boolean) { this.fai(() => this.api.post(`/api/admin/utenti/${u.id}/sospendi`, { sospeso })); }
  async linkPassword(u: Utente) {
    this.mostra(u.nome || u.username, await this.fai(() => this.api.post<{ token: string; scade: string }>(`/api/admin/utenti/${u.id}/password`)), 'password');
  }
  async copia(testo: string) {
    try {
      await navigator.clipboard.writeText(testo);
      this.copiato.set(true);
    } catch {
      this.errore.set('Copia non riuscita: seleziona il link e copialo a mano.');
    }
  }
}
