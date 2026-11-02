import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, ErroreApi, Ruolo } from '../api';
import { Sessione } from '../sessione';
import { Firma } from '../firma';
import { applicaTema } from '../temi/applica';
import { TEMI } from '../temi/catalogo';
import { Copertina } from '../temi/copertina';
import { Testata } from './testata';

const STILE = `
  :host { display: block; min-height: 100dvh; position: relative; overflow: hidden; }
  .luna { position: absolute; width: min(70vw, 560px); aspect-ratio: 1; border-radius: 50%; background: var(--disco);
    right: max(-22vw, -200px); top: -12vh; opacity: 0.95; }
  .pagina { position: relative; z-index: 1; min-height: 100dvh; display: grid; align-content: center; gap: 28px;
    max-width: 440px; margin: 0 auto; padding-block: 48px; padding-left: max(20px, env(safe-area-inset-left)); padding-right: max(20px, env(safe-area-inset-right)); }
  h1 { font-family: var(--titoli); font-size: clamp(44px, 12vw, 64px); line-height: 0.95; }
  .intro { color: var(--testo-2); }
  form { display: grid; gap: 16px; padding: 24px; background: var(--fondo-2); border-radius: 16px; }
  .nota { color: var(--testo-2); font-size: 15px; }
  .bottone { width: 100%; }
`;

@Component({
  selector: 'app-accesso',
  imports: [FormsModule, RouterLink, Firma],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: STILE,
  template: `
    <div class="luna" aria-hidden="true"></div>
    <main class="pagina">
      <h1>Cena con delitto</h1>
      <p class="intro">Entra con le credenziali che ti ha dato la regia: quelle della tua squadra, del proiettore o della regia stessa.</p>
      <form (ngSubmit)="entra()">
        <label class="etichetta" for="utente">Nome utente
          <input id="utente" class="campo" name="utente" autocomplete="username" autocapitalize="none" spellcheck="false" [(ngModel)]="username" required>
        </label>
        <label class="etichetta" for="pw">Password
          <input id="pw" class="campo" name="pw" type="password" autocomplete="current-password" [(ngModel)]="password" required>
        </label>
        @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
        <button class="bottone bottone--pieno" type="submit" [disabled]="attesa()">{{ attesa() ? 'Entro…' : 'Entra' }}</button>
      </form>
      @if (daConfigurare()) {
        <p class="nota">Il sito non ha ancora un'amministrazione. <a routerLink="/avvio">Creala</a> con il codice di primo avvio.</p>
      }
      <p class="nota">Organizzi le serate? <a routerLink="/regia/accedi">Entra nella regia</a>.</p>
      <app-firma />
    </main>
  `,
})
export class Accesso implements OnInit {
  private api = inject(Api);
  private sessione = inject(Sessione);
  private router = inject(Router);
  username = '';
  password = '';
  readonly errore = signal('');
  readonly attesa = signal(false);
  readonly daConfigurare = signal(false);

  async ngOnInit() {
    const io = await this.sessione.carica(true);
    if (io) {
      await this.router.navigateByUrl(this.sessione.pagina(io.ruolo, io.admin));
      return;
    }
    const a = await this.api.get<{ configurato: boolean; tema?: string }>('/api/avvio').catch(() => ({ configurato: true, tema: undefined }));
    this.daConfigurare.set(!a.configurato);
    if (a.tema) applicaTema(a.tema);
  }

  async entra() {
    this.errore.set('');
    this.attesa.set(true);
    try {
      const r = await this.api.post<{ ruolo: Ruolo; admin?: boolean }>('/api/accesso', { username: this.username, password: this.password });
      await this.sessione.carica(true);
      await this.router.navigateByUrl(this.sessione.pagina(r.ruolo, r.admin));
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Accesso non riuscito.');
    } finally {
      this.attesa.set(false);
    }
  }
}

/** Forma delle pagine brevi del marchio (primo avvio, invito): testata gialla, titolo e un modulo scuro. */
export const STILE_MARCHIO = `
  :host { display: block; min-height: 100dvh; }
  .pagina { max-width: 560px; margin: 0 auto; padding: 48px max(16px, min(3vw, 48px)) 48px; display: grid; gap: 24px; }
  h1 { font: 400 clamp(40px, 6vw, 56px)/1 var(--titoli); text-wrap: balance; }
  .intro { color: var(--testo-2); font-size: 17px; }
  form { display: grid; gap: 16px; padding: 24px; background: var(--fondo-2); border: 1px solid var(--filetto); border-radius: 2px; }
  .nota { color: var(--testo-2); font-size: 15px; }
  .bottone--pieno { width: 100%; }
`;

@Component({
  selector: 'app-avvio',
  imports: [FormsModule, RouterLink, Firma, Testata],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: STILE_MARCHIO,
  template: `
    <app-testata casa="/accesso" />
    <main class="pagina">
      <h1>Primo avvio</h1>
      <p class="intro">Crea l'account dell'amministrazione. Si fa una volta sola: poi l'amministrazione invita le regie, che creano e conducono le serate. L'amministrazione vede account e numeri, mai il contenuto delle serate.</p>
      <form (ngSubmit)="crea()">
        <label class="etichetta" for="codice">Codice di primo avvio <small>Quello impostato su Netlify come SETUP_CODE.</small>
          <input id="codice" class="campo" name="codice" type="password" autocomplete="off" [(ngModel)]="codice" required>
        </label>
        <label class="etichetta" for="nome">Il tuo nome <small>Facoltativo.</small>
          <input id="nome" class="campo" name="nome" autocomplete="name" [(ngModel)]="nome">
        </label>
        <label class="etichetta" for="utente">Nome utente <small>Minuscolo, almeno 3 caratteri.</small>
          <input id="utente" class="campo" name="utente" autocomplete="username" autocapitalize="none" spellcheck="false" [(ngModel)]="username" required>
        </label>
        <label class="etichetta" for="pw">Password <small>Almeno 10 caratteri.</small>
          <input id="pw" class="campo" name="pw" type="password" autocomplete="new-password" [(ngModel)]="password" required>
        </label>
        @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
        <button class="bottone bottone--pieno" type="submit" [disabled]="attesa()">Crea l'amministrazione</button>
      </form>
      <p class="nota"><a routerLink="/accesso">Torna all'accesso</a></p>
      <app-firma />
    </main>
  `,
})
export class Avvio implements OnInit {
  private api = inject(Api);
  private sessione = inject(Sessione);
  private router = inject(Router);
  codice = '';
  nome = '';
  username = '';
  password = '';
  readonly errore = signal('');
  readonly attesa = signal(false);

  ngOnInit() { applicaTema('marchio'); }

  async crea() {
    this.errore.set('');
    this.attesa.set(true);
    try {
      await this.api.post('/api/avvio', { codice: this.codice, nome: this.nome, username: this.username, password: this.password });
      await this.sessione.carica(true);
      await this.router.navigateByUrl('/admin');
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Creazione non riuscita.');
    } finally {
      this.attesa.set(false);
    }
  }
}

/** Accesso di squadre e proiettore a una serata: /s/<slug>, nel tema della serata. */
@Component({
  selector: 'app-accesso-serata',
  imports: [FormsModule, Firma],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: STILE,
  template: `
    <div class="luna" aria-hidden="true"></div>
    <main class="pagina">
      @if (serata(); as s) {
        <h1>{{ s.titolo }}</h1>
        @if (s.aperta) {
          <p class="intro">Entra con le credenziali che ti ha dato la regia: quelle della tua squadra o del proiettore.</p>
          <form (ngSubmit)="entra()">
            <label class="etichetta" for="utente">Nome utente
              <input id="utente" class="campo" name="utente" autocomplete="username" autocapitalize="none" spellcheck="false" [(ngModel)]="username" required>
            </label>
            <label class="etichetta" for="pw">Password
              <input id="pw" class="campo" name="pw" type="password" autocomplete="current-password" [(ngModel)]="password" required>
            </label>
            @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
            <button class="bottone bottone--pieno" type="submit" [disabled]="attesa()">{{ attesa() ? 'Entro…' : 'Entra' }}</button>
          </form>
        } @else {
          <p class="avviso" role="status">Questa serata è archiviata: gli accessi sono chiusi.</p>
        }
      } @else if (errore()) {
        <h1>Serata non trovata</h1>
        <p class="avviso avviso--errore" role="alert">{{ errore() }}</p>
      } @else {
        <p class="intro" role="status">Apro la serata…</p>
      }
      <app-firma />
    </main>
  `,
})
export class AccessoSerata implements OnInit {
  private api = inject(Api);
  private sessione = inject(Sessione);
  private router = inject(Router);
  private slug = inject(ActivatedRoute).snapshot.paramMap.get('slug') ?? '';
  readonly serata = signal<{ titolo: string; tema: string; aperta: boolean } | null>(null);
  readonly errore = signal('');
  readonly attesa = signal(false);
  username = '';
  password = '';

  async ngOnInit() {
    const io = await this.sessione.carica(true);
    // Chi è già dentro questa serata va dritto alla sua pagina.
    if (io && io.ruolo !== 'regia' && io.slug === this.slug) {
      await this.router.navigateByUrl(this.sessione.pagina(io.ruolo));
      return;
    }
    try {
      const s = await this.api.get<{ titolo: string; tema: string; aperta: boolean }>(`/api/s/${encodeURIComponent(this.slug)}`);
      applicaTema(s.tema);
      this.serata.set(s);
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'La serata non si apre. Riprova tra poco.');
      return;
    }
    // Il QR del biglietto porta le credenziali dopo il #: entra da solo e le toglie subito dall'indirizzo.
    const entra = /^#entra=(.+)$/.exec(location.hash)?.[1];
    if (entra) {
      history.replaceState(null, '', location.pathname);
      const [u, ...p] = decodeURIComponent(entra).split(':');
      this.username = u;
      this.password = p.join(':');
      if (this.serata()?.aperta) await this.entra();
    }
  }

  async entra() {
    this.errore.set('');
    this.attesa.set(true);
    try {
      const r = await this.api.post<{ ruolo: Ruolo }>('/api/accesso', { username: this.username, password: this.password, slug: this.slug });
      await this.sessione.carica(true);
      await this.router.navigateByUrl(this.sessione.pagina(r.ruolo));
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Accesso non riuscito.');
    } finally {
      this.attesa.set(false);
    }
  }
}

/** Accesso della regia e dell'amministrazione: /regia/accedi, nel marchio. Le squadre qui non entrano. */
@Component({
  selector: 'app-accesso-regia',
  imports: [FormsModule, RouterLink, Firma, Testata, Copertina],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; min-height: 100dvh; }
    .scena { max-width: 1440px; margin: 0 auto; padding: 48px max(16px, min(3vw, 48px)); display: grid; gap: 48px; align-items: center; }
    @media (min-width: 900px) { .scena { grid-template-columns: minmax(0, 1fr) minmax(0, 460px); min-height: calc(100dvh - 66px); } }
    /* I volumi della collana, uno per tema: grandi finché i temi sono pochi, più fitti quando cresceranno. */
    .collana { list-style: none; margin: 0 auto; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 250px)); justify-content: center; gap: 28px; width: 100%; max-width: 620px; }
    @media (max-width: 899px) { .collana { display: none; } }
    .volume { aspect-ratio: 3 / 4; display: flex; flex-direction: column; padding: 0 9px 9px; background: var(--accento); color: var(--su-accento); border: 1.5px solid var(--su-accento); border-radius: 2px; }
    .volume:nth-child(odd) { transform: rotate(-2deg); } .volume:nth-child(even) { transform: rotate(1.5deg) translateY(10px); }
    .volume .fascia { min-height: 32px; display: flex; align-items: center; justify-content: space-between; }
    .volume .fascia b { font: 400 22px/1 var(--titoli); }
    .volume .fascia span { padding: 2px 6px; border-radius: 2px; background: var(--su-accento); color: var(--accento); font: 700 11.5px/1.2 var(--corpo); }
    .volume .arte { flex: 1; min-height: 0; border: 1.5px solid var(--su-accento); background: var(--su-accento); overflow: hidden; }
    .volume .arte app-copertina { height: 100%; }
    .volume p { margin-top: 10px; font: 400 20px/1.1 var(--titoli); }
    .lato { display: grid; gap: 22px; }
    h1 { font: 400 clamp(40px, 5vw, 56px)/1 var(--titoli); text-wrap: balance; }
    .intro { color: var(--testo-2); font-size: 17px; }
    form { display: grid; gap: 16px; padding: 24px; background: var(--fondo-2); border: 1px solid var(--filetto); border-radius: 2px; }
    .bottone--pieno { width: 100%; }
    .nota { color: var(--testo-2); font-size: 15px; }
  `,
  template: `
    <app-testata casa="/regia/accedi" />
    <div class="scena">
      <ul class="collana" aria-hidden="true">
        @for (t of temi; track t.id; let i = $index) {
          <li class="volume">
            <span class="fascia"><b>N. {{ i + 1 }}</b><span>Il Movente</span></span>
            <span class="arte"><app-copertina [tema]="t.id" /></span>
            <p>{{ t.nome }}</p>
          </li>
        }
      </ul>
      <main class="lato">
        <h1>Entra nella regia</h1>
        <p class="intro">Prepara e conduci le tue serate.</p>
        <form (ngSubmit)="entra()">
          <label class="etichetta" for="utente">Nome utente
            <input id="utente" class="campo" name="utente" autocomplete="username" autocapitalize="none" spellcheck="false" [(ngModel)]="username" required>
          </label>
          <label class="etichetta" for="pw">Password
            <input id="pw" class="campo" name="pw" type="password" autocomplete="current-password" [(ngModel)]="password" required>
          </label>
          @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
          <button class="bottone bottone--pieno" type="submit" [disabled]="attesa()">{{ attesa() ? 'Entro…' : 'Entra' }}</button>
          <p class="nota">Hai perso la password? Chiedi all'amministrazione un link nuovo.</p>
        </form>
        <p class="nota">Giochi in una squadra? Entra dall'indirizzo della tua serata.
          @if (daConfigurare()) { Il sito non ha ancora un'amministrazione: <a routerLink="/avvio">creala</a> con il codice di primo avvio. }</p>
        <app-firma />
      </main>
    </div>
  `,
})
export class AccessoRegia implements OnInit {
  private api = inject(Api);
  private sessione = inject(Sessione);
  private router = inject(Router);
  readonly temi = TEMI;
  readonly errore = signal('');
  readonly attesa = signal(false);
  readonly daConfigurare = signal(false);
  username = '';
  password = '';

  async ngOnInit() {
    applicaTema('marchio');
    const io = await this.sessione.carica(true);
    if (io?.ruolo === 'regia') {
      await this.router.navigateByUrl(this.sessione.pagina(io.ruolo, io.admin));
      return;
    }
    const a = await this.api.get<{ configurato: boolean }>('/api/avvio').catch(() => ({ configurato: true }));
    this.daConfigurare.set(!a.configurato);
  }

  async entra() {
    this.errore.set('');
    this.attesa.set(true);
    try {
      const r = await this.api.post<{ ruolo: Ruolo; admin?: boolean }>('/api/accesso', { username: this.username, password: this.password, regia: true });
      await this.sessione.carica(true);
      await this.router.navigateByUrl(this.sessione.pagina(r.ruolo, r.admin));
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Accesso non riuscito.');
    } finally {
      this.attesa.set(false);
    }
  }
}
