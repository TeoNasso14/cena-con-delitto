import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api, ErroreApi, Ruolo } from '../api';
import { Sessione } from '../sessione';
import { Firma } from '../firma';
import { applicaTema } from '../temi/applica';
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
