import { ChangeDetectionStrategy, Component, input, model, signal, inject } from '@angular/core';
import { Api, ErroreApi } from '../api';

/** Carica un file per una prova, una scena o un personaggio e ne restituisce la chiave. */
@Component({
  selector: 'app-allegato',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: grid; gap: 8px; }
    .riga { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .anteprima { max-width: 220px; max-height: 160px; border-radius: 2px; object-fit: cover; }
    .scegli { justify-self: start; cursor: pointer; }
    input:focus-visible + .scegli, .scegli:has(+ input:focus-visible) { outline: 2px solid var(--zucca); outline-offset: 3px; }
  `,
  template: `
    <span class="etichetta" style="font-weight:600">{{ etichetta() }} <small>JPG, PNG, WEBP, MP3, M4A, MP4, WEBM o PDF fino a 4 MB.</small></span>
    @if (chiave()) {
      @if (tipo()?.startsWith('image/')) { <img class="anteprima" [src]="'/api/file/' + chiave()" alt="Anteprima dell'allegato"> }
      @else { <span class="secondario">File allegato ({{ tipo() }})</span> }
      <div class="riga"><button class="r-link" type="button" (click)="chiave.set(null); tipo.set(null)">Togli l'allegato</button></div>
    }
    <label class="bottone bottone--piccolo scegli" [attr.for]="campo()">{{ chiave() ? 'Sostituisci il file' : 'Scegli un file' }}</label>
    <input class="sr" type="file" [attr.id]="campo()" [accept]="accetta()" (change)="scelto($event)" [disabled]="attesa()">
    @if (attesa()) { <span class="secondario" role="status">Carico…</span> }
    @if (errore()) { <span class="errore-testo" role="alert">{{ errore() }}</span> }
  `,
})
export class Allegato {
  private api = inject(Api);
  readonly chiave = model<string | null>(null);
  readonly tipo = model<string | null>(null);
  readonly etichetta = input('Allegato');
  readonly campo = input('allegato');
  readonly accetta = input('image/*,audio/*,video/mp4,video/webm,application/pdf');
  readonly attesa = signal(false);
  readonly errore = signal('');

  async scelto(e: Event) {
    const el = e.target as HTMLInputElement;
    const f = el.files?.[0];
    if (!f) return;
    this.errore.set('');
    if (f.size > 4 * 1024 * 1024) { this.errore.set('Il file supera 4 MB. Riducilo e riprova.'); el.value = ''; return; }
    this.attesa.set(true);
    try {
      const r = await this.api.carica(f);
      this.chiave.set(r.key);
      this.tipo.set(r.tipo);
    } catch (err) {
      this.errore.set(err instanceof ErroreApi ? err.message : 'Caricamento non riuscito.');
    } finally {
      this.attesa.set(false);
      el.value = '';
    }
  }
}
