import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api, ErroreApi } from '../api';
import { Firma } from '../firma';
import { Sessione } from '../sessione';
import { applicaTema } from '../temi/applica';
import { STILE_MARCHIO } from './accesso';
import { Testata } from './testata';

interface Invito { tipo: 'regia' | 'password'; nome: string; username: string | null }

/** Il link mandato dall'amministrazione: diventare regia, o scegliere una password nuova. Nome utente e password restano di chi lo apre. */
@Component({
  selector: 'app-invito',
  imports: [FormsModule, RouterLink, Firma, Testata],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: STILE_MARCHIO,
  template: `
    <app-testata casa="/accesso" />
    <main class="pagina">
      @if (invito(); as i) {
        @if (i.tipo === 'regia') {
          <h1>Ciao{{ i.nome ? ', ' + i.nome : '' }}</h1>
          <p class="intro">Hai ricevuto un invito a creare e condurre serate con Il Movente. Scegli il tuo nome utente e una password: li conosci solo tu.</p>
        } @else {
          <h1>Una password nuova</h1>
          <p class="intro">Scegli la nuova password per l'account <strong>{{ i.username }}</strong>. Quella di prima smette di funzionare e le sessioni aperte si chiudono.</p>
        }
        <form (ngSubmit)="conferma()">
          @if (i.tipo === 'regia') {
            <label class="etichetta" for="utente">Nome utente <small>Minuscolo, da 3 a 40 caratteri: lettere, numeri, punto, trattino.</small>
              <input id="utente" class="campo" name="utente" autocomplete="username" autocapitalize="none" spellcheck="false" [(ngModel)]="username" required>
            </label>
          }
          <label class="etichetta" for="pw">Password <small>Almeno 10 caratteri.</small>
            <input id="pw" class="campo" name="pw" type="password" autocomplete="new-password" [(ngModel)]="password" required minlength="10">
          </label>
          <label class="etichetta" for="pw2">Ripeti la password
            <input id="pw2" class="campo" name="pw2" type="password" autocomplete="new-password" [(ngModel)]="ripeti" required>
          </label>
          @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
          <button class="bottone bottone--pieno" type="submit" [disabled]="attesa()">{{ i.tipo === 'regia' ? 'Crea il tuo accesso' : 'Salva la password' }}</button>
        </form>
      } @else if (errore()) {
        <h1>Link non valido</h1>
        <p class="avviso avviso--errore" role="alert">{{ errore() }}</p>
        <p class="nota"><a routerLink="/accesso">Vai all'accesso</a></p>
      } @else {
        <p class="secondario" role="status">Controllo il link…</p>
      }
      <app-firma />
    </main>
  `,
})
export class InvitoVista implements OnInit {
  private api = inject(Api);
  private sessione = inject(Sessione);
  private router = inject(Router);
  private token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';
  readonly invito = signal<Invito | null>(null);
  readonly errore = signal('');
  readonly attesa = signal(false);
  username = '';
  password = '';
  ripeti = '';

  async ngOnInit() {
    applicaTema('marchio');
    try {
      this.invito.set(await this.api.get<Invito>(`/api/invito/${encodeURIComponent(this.token)}`));
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Il link non si apre. Riprova tra poco.');
    }
  }

  async conferma() {
    this.errore.set('');
    if (this.password !== this.ripeti) {
      this.errore.set('Le due password non sono uguali.');
      return;
    }
    this.attesa.set(true);
    try {
      const r = await this.api.post<{ ruolo: 'regia'; admin: boolean }>(`/api/invito/${encodeURIComponent(this.token)}`, { username: this.username, password: this.password });
      await this.sessione.carica(true);
      await this.router.navigateByUrl(this.sessione.pagina(r.ruolo, r.admin));
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Non è andata. Riprova.');
    } finally {
      this.attesa.set(false);
    }
  }
}
