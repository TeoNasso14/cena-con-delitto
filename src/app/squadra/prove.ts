import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { ErroreApi, ora } from '../api';
import { Icona, Sigillo } from '../icona';
import { AiutiSquadra } from './aiuti';
import { VotiSquadra } from './voti';
import { Prova, ProvaAperta, StatoSquadraService } from './stato';

const TIPO: Record<string, string> = {
  documento: 'Documento', oggetto: 'Oggetto', testimonianza: 'Testimonianza', foto: 'Fotografia', audio: 'Registrazione', video: 'Filmato',
};

@Component({
  selector: 'app-prove',
  imports: [Icona, Sigillo, AiutiSquadra, VotiSquadra],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './prove.css',
  templateUrl: './prove.html',
})
export class ProveVista {
  readonly st = inject(StatoSquadraService);
  readonly ora = ora;
  readonly tipo = (t: string) => TIPO[t] ?? 'Prova';

  /** Filtro per cartella: 'tutte', 'altre' (fuori dalle cartelle) o l'id di una cartella. */
  readonly filtro = signal<'tutte' | 'altre' | number>('tutte');
  readonly cartelle = computed(() => this.st.stato()?.cartelle ?? []);
  readonly gruppi = computed(() => {
    const s = this.st.stato();
    if (!s) return [];
    const cart = this.cartelle();
    if (!cart.length) return [{ id: 0, nome: null as string | null, prove: s.prove }];
    const ids = new Set(cart.map((c) => c.id));
    const fuori = s.prove.filter((p) => p.cartella === null || !ids.has(p.cartella));
    const tutti = [
      ...cart.map((c) => ({ id: c.id, nome: c.nome as string | null, prove: s.prove.filter((p) => p.cartella === c.id) })),
      ...(fuori.length ? [{ id: -1, nome: 'Altre prove' as string | null, prove: fuori }] : []),
    ].filter((g) => g.prove.length);
    const f = this.filtro();
    if (f === 'tutte') return tutti;
    return tutti.filter((g) => (f === 'altre' ? g.id === -1 : g.id === f));
  });
  readonly haAltre = computed(() => {
    const s = this.st.stato();
    const ids = new Set(this.cartelle().map((c) => c.id));
    return !!s?.prove.some((p) => p.cartella === null || !ids.has(p.cartella));
  });
  aperteIn(prove: Prova[]) { return prove.filter((p) => p.aperta).length; }
  contaIn(id: number) { return this.st.stato()?.prove.filter((p) => p.cartella === id).length ?? 0; }

  readonly trovate = computed(() => this.st.stato()?.prove.filter((p) => p.aperta).length ?? 0);
  readonly ultimoAnnuncio = computed(() => this.st.stato()?.annunci[0] ?? null);

  /* Foglio */
  readonly modo = signal<'chiuso' | 'codice' | 'documento'>('chiuso');
  readonly cifre = signal('');
  readonly esito = signal<{ testo: string; errore: boolean }>({ testo: '', errore: false });
  readonly rotto = signal(false);
  readonly trema = signal(0);
  readonly attesa = signal(false);
  readonly mostrata = signal<number | null>(null);
  readonly altreAperte = signal<number[]>([]);
  readonly provaMostrata = computed(() => {
    const id = this.mostrata();
    const p = id == null ? undefined : this.st.prova(id);
    return p && p.aperta ? (p as ProvaAperta) : null;
  });
  readonly lunghezza = 4;
  readonly conLettere = signal(false);

  scrivi(v: string) {
    this.cifre.set(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32));
  }
  readonly tasti = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'canc', '0', 'apri'];
  private ultimoFocus: HTMLElement | null = null;
  private primoTasto = viewChild<ElementRef<HTMLButtonElement>>('primoTasto');
  private chiudiBtn = viewChild<ElementRef<HTMLButtonElement>>('chiudiBtn');

  readonly bloccato = computed(() => (this.st.stato()?.codici.bloccatoPer ?? 0) > 0);
  readonly fermo = computed(() => this.st.stato()?.serata.stato !== 'in_corso' && !this.st.stato()?.squadra.prova);

  nuova(p: Prova) {
    return p.aperta && !this.st.viste().has(p.id);
  }

  apriCodice() {
    this.ultimoFocus = document.activeElement as HTMLElement;
    this.cifre.set('');
    this.rotto.set(false);
    this.conLettere.set(false);
    const s = this.st.stato();
    if (this.fermo()) this.esito.set({ testo: s?.serata.stato === 'bozza' ? 'La serata non è ancora cominciata: i sigilli sono fermi.' : 'La serata è ferma: i sigilli si riaprono quando la regia riparte.', errore: false });
    else if (this.bloccato()) this.esito.set({ testo: `Troppi codici sbagliati. Riprovate tra ${s?.codici.bloccatoPer} secondi.`, errore: true });
    else this.esito.set({ testo: `${s?.codici.tentativiRimasti ?? 5} tentativi prima di una pausa di due minuti`, errore: false });
    this.modo.set('codice');
    setTimeout(() => this.primoTasto()?.nativeElement.focus(), 80);
  }

  apriDocumento(id: number) {
    this.ultimoFocus = document.activeElement as HTMLElement;
    this.mostrata.set(id);
    this.altreAperte.set([]);
    this.st.segnaVista(id);
    this.modo.set('documento');
    setTimeout(() => this.chiudiBtn()?.nativeElement.focus(), 80);
  }

  chiudi() {
    this.modo.set('chiuso');
    this.ultimoFocus?.focus();
  }

  @HostListener('document:keydown', ['$event'])
  tastiera(e: KeyboardEvent) {
    if (this.modo() === 'chiuso') return;
    if (e.key === 'Escape') { this.chiudi(); return; }
    if (this.modo() !== 'codice' || this.rotto() || this.conLettere()) return;
    if (/^[0-9]$/.test(e.key)) this.premi(e.key);
    else if (e.key === 'Backspace') this.premi('canc');
    else if (e.key === 'Enter') this.premi('apri');
  }

  premi(t: string) {
    if (this.attesa() || this.rotto() || this.fermo() || this.bloccato()) return;
    if (t === 'canc') { this.cifre.update((c) => c.slice(0, -1)); return; }
    if (t === 'apri') { if (this.cifre().length >= 2) this.verifica(); return; }
    if (this.cifre().length < 12) this.cifre.update((c) => c + t);
  }

  private async verifica() {
    this.attesa.set(true);
    try {
      const r = await this.st.codice(this.cifre());
      if (r.esito === 'aperta' || r.esito === 'gia_aperta') {
        this.rotto.set(true);
        this.esito.set({ testo: r.esito === 'aperta' ? 'Sigillo rotto' : 'Questa prova è già vostra', errore: false });
        setTimeout(() => {
          this.mostrata.set(r.prove[0]);
          this.altreAperte.set(r.prove.slice(1));
          r.prove.forEach((id) => this.st.segnaVista(id));
          this.modo.set('documento');
          setTimeout(() => this.chiudiBtn()?.nativeElement.focus(), 60);
        }, 620);
        return;
      }
      this.cifre.set('');
      this.trema.update((n) => n + 1);
      if (r.esito === 'non_ancora') this.esito.set({ testo: 'Il codice è giusto, ma il sigillo non cede ancora. Manca qualcosa.', errore: false });
      else if (r.esito === 'bloccato') this.esito.set({ testo: `Troppi codici sbagliati. Riprovate tra ${r.secondi} secondi.`, errore: true });
      else this.esito.set({ testo: `Codice sbagliato. ${r.rimasti === 1 ? 'Resta 1 tentativo' : `Restano ${r.rimasti} tentativi`} prima della pausa.`, errore: true });
    } catch (e) {
      this.esito.set({ testo: e instanceof ErroreApi ? e.message : 'Non riesco a verificare il codice. Riprovate.', errore: true });
    } finally {
      this.attesa.set(false);
    }
  }

  caselle() {
    const n = Math.max(this.lunghezza, this.cifre().length);
    return Array.from({ length: n }, (_, i) => i < this.cifre().length);
  }
}
