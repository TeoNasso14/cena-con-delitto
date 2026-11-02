import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api, ErroreApi } from '../api';
import { Firma } from '../firma';
import { applicaTema } from '../temi/applica';

interface Invito {
  nome: string;
  serata: { titolo: string; tema: string; quando: string | null; dove: string; dressCode: string; nota: string; chiusa: boolean };
  personaggio: { nome: string; ruolo: string; scheda: string; copione: string } | null;
  risposta: { presenza: 'si' | 'no' | 'forse' | null; nota: string };
}

/** L'invito personale di un ospite: /ospite/<token>, nel tema della serata. Non fa entrare nella serata. */
@Component({
  selector: 'app-ospite',
  imports: [FormsModule, Firma],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; min-height: 100dvh; position: relative; overflow: hidden; }
    .luna { position: absolute; width: min(70vw, 560px); aspect-ratio: 1; border-radius: 50%; background: var(--disco); right: max(-22vw, -200px); top: -12vh; opacity: 0.95; }
    .pagina { position: relative; z-index: 1; display: grid; gap: 28px; max-width: 560px; margin: 0 auto; padding-block: 56px 32px;
      padding-left: max(20px, env(safe-area-inset-left)); padding-right: max(20px, env(safe-area-inset-right)); }
    h1 { font-family: var(--titoli); font-size: clamp(42px, 11vw, 64px); line-height: 0.95; text-wrap: balance; max-width: 12ch; }
    .intro { font-size: 19px; }
    .scheda { display: grid; gap: 14px; padding: 22px; background: var(--fondo-2); border-radius: 16px; }
    dl { margin: 0; display: grid; gap: 12px; }
    dt { color: var(--testo-2); font-size: 14px; font-weight: 600; }
    dd { margin: 2px 0 0; font-size: 18px; white-space: pre-line; }
    h2 { font-family: var(--titoli); font-size: 30px; line-height: 1.05; }
    .personaggio { display: grid; gap: 10px; padding: 22px; background: var(--carta); color: var(--inchiostro); border-top: 4px solid var(--accento); border-radius: 2px; }
    .personaggio h3 { font: 700 15px/1.2 var(--corpo); margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--carta-filetto); }
    .personaggio p { white-space: pre-line; }
    .ruolo { font-weight: 700; }
    .segreto { font-size: 14px; font-style: italic; }
    .scelte { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .scelte button { min-height: 52px; border-radius: 999px; border: 1px solid var(--filetto); background: transparent; color: var(--testo-1); font: inherit; font-weight: 600; }
    .scelte button[aria-pressed="true"] { background: var(--accento); border-color: var(--accento); color: var(--su-accento); }
    @media (max-width: 380px) { .scelte { grid-template-columns: minmax(0, 1fr); } }
  `,
  template: `
    <div class="luna" aria-hidden="true"></div>
    <main class="pagina">
      @if (invito(); as i) {
        <h1>{{ i.serata.titolo }}</h1>
        <p class="intro">{{ i.nome }}, ti aspettiamo a una cena con delitto.</p>
        @if (i.serata.quando || i.serata.dove || i.serata.dressCode || i.serata.nota) {
          <section class="scheda" aria-label="Dettagli della cena">
            <dl>
              @if (i.serata.quando) { <div><dt>Quando</dt><dd>{{ quando(i.serata.quando) }}</dd></div> }
              @if (i.serata.dove) { <div><dt>Dove</dt><dd>{{ i.serata.dove }}</dd></div> }
              @if (i.serata.dressCode) { <div><dt>Come vestirsi</dt><dd>{{ i.serata.dressCode }}</dd></div> }
              @if (i.serata.nota) { <div><dt>Da sapere</dt><dd>{{ i.serata.nota }}</dd></div> }
            </dl>
          </section>
        }

        @if (i.personaggio; as p) {
          <article class="personaggio" aria-labelledby="t-personaggio">
            <p class="segreto">Interpreterai questo personaggio. Tienilo per te fino alla cena.</p>
            <h2 id="t-personaggio">{{ p.nome }}</h2>
            @if (p.ruolo) { <p class="ruolo">{{ p.ruolo }}</p> }
            @if (p.scheda) { <h3>Cosa sanno tutti</h3><p>{{ p.scheda }}</p> }
            @if (p.copione) { <h3>Cosa sai solo tu</h3><p>{{ p.copione }}</p> }
          </article>
        }

        <section class="scheda" aria-labelledby="t-risposta">
          <h2 id="t-risposta">Ci sarai?</h2>
          @if (i.serata.chiusa) {
            <p class="avviso" role="status">La serata è passata: le risposte sono chiuse.</p>
          } @else {
            <div class="scelte" role="group" aria-label="La tua risposta">
              <button type="button" [attr.aria-pressed]="presenza() === 'si'" (click)="presenza.set('si')">Ci sarò</button>
              <button type="button" [attr.aria-pressed]="presenza() === 'forse'" (click)="presenza.set('forse')">Forse</button>
              <button type="button" [attr.aria-pressed]="presenza() === 'no'" (click)="presenza.set('no')">Non ci sarò</button>
            </div>
            <label class="etichetta" for="nota">Qualcosa da dire a chi organizza? <small>Allergie, intolleranze, un ritardo.</small>
              <textarea id="nota" name="nota" class="campo" rows="3" maxlength="500" [(ngModel)]="nota"></textarea>
            </label>
            @if (errore()) { <p class="avviso avviso--errore" role="alert">{{ errore() }}</p> }
            @if (salvato()) { <p class="avviso" role="status">Risposta inviata. Puoi cambiarla quando vuoi da questa pagina.</p> }
            <button class="bottone bottone--pieno" type="button" [disabled]="!presenza() || attesa()" (click)="rispondi()">{{ attesa() ? 'Invio…' : 'Invia la risposta' }}</button>
          }
        </section>
      } @else if (errore()) {
        <h1>Invito non trovato</h1>
        <p class="avviso avviso--errore" role="alert">{{ errore() }}</p>
      } @else {
        <p class="intro" role="status">Apro l'invito…</p>
      }
      <app-firma />
    </main>
  `,
})
export class OspiteVista implements OnInit {
  private api = inject(Api);
  private rotta = inject(ActivatedRoute);
  readonly invito = signal<Invito | null>(null);
  readonly presenza = signal<'si' | 'no' | 'forse' | null>(null);
  readonly errore = signal('');
  readonly attesa = signal(false);
  readonly salvato = signal(false);
  nota = '';
  private token = '';

  async ngOnInit() {
    this.token = this.rotta.snapshot.paramMap.get('token') ?? '';
    try {
      const i = await this.api.get<Invito>(`/api/ospite/${encodeURIComponent(this.token)}`);
      applicaTema(i.serata.tema);
      this.invito.set(i);
      this.presenza.set(i.risposta.presenza);
      this.nota = i.risposta.nota;
    } catch (e) {
      applicaTema('marchio');
      this.errore.set(e instanceof ErroreApi ? e.message : 'Non riesco ad aprire l\'invito. Riprova tra poco.');
    }
  }

  quando(d: string) {
    const t = new Date(d);
    return `${t.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}, alle ${t.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
  }

  async rispondi() {
    this.errore.set('');
    this.salvato.set(false);
    this.attesa.set(true);
    try {
      await this.api.post(`/api/ospite/${encodeURIComponent(this.token)}`, { presenza: this.presenza(), nota: this.nota });
      this.salvato.set(true);
    } catch (e) {
      this.errore.set(e instanceof ErroreApi ? e.message : 'Risposta non inviata. Riprova.');
    } finally {
      this.attesa.set(false);
    }
  }
}
