import { inject, Injectable, signal } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Api, Io, Ruolo } from './api';

@Injectable({ providedIn: 'root' })
export class Sessione {
  private api = inject(Api);
  private router = inject(Router);
  readonly io = signal<Io | null>(null);
  private caricato = false;

  async carica(forza = false): Promise<Io | null> {
    if (this.caricato && !forza) return this.io();
    try {
      const io = await this.api.get<Io | { ruolo: null }>('/api/io');
      this.io.set(io.ruolo ? (io as Io) : null);
    } catch {
      this.io.set(null);
    }
    this.caricato = true;
    this.api.sessioneScaduta.set(false);
    return this.io();
  }

  /** La pagina di casa: l'amministrazione ha solo la sua. */
  pagina(ruolo: Ruolo, admin = false) {
    if (admin) return '/admin';
    return ruolo === 'regia' ? '/regia' : ruolo === 'schermo' ? '/schermo' : '/squadra';
  }

  /** Dove si rientra: squadre e proiettore dalla pagina della loro serata, regia e amministrazione da /regia/accedi. */
  paginaAccesso(io: Io | null = this.io()) {
    if (io && io.ruolo !== 'regia') return io.slug ? `/s/${io.slug}` : '/accesso';
    return '/regia/accedi';
  }

  async esci() {
    // La prova generale non ha un cookie suo: uscire vuol dire lasciare l'anteprima, non chiudere la sessione della regia.
    if (this.api.anteprima()) {
      this.api.lasciaAnteprima();
      this.io.set(null);
      this.caricato = false;
      window.close();
      await this.router.navigateByUrl('/regia');
      return;
    }
    const dove = this.paginaAccesso();
    await this.api.post('/api/uscita').catch(() => undefined);
    this.api.scegliSerata(null);
    this.io.set(null);
    this.caricato = true;
    await this.router.navigateByUrl(dove);
  }
}

/** Lascia entrare solo chi ha il ruolo giusto; gli altri vanno all'accesso o alla propria pagina. */
export const soloPer = (...ruoli: Ruolo[]): CanMatchFn => async () => {
  const s = inject(Sessione);
  const router = inject(Router);
  const io = await s.carica();
  if (!io) return router.parseUrl(ruoli.includes('regia') && !ruoli.includes('squadra') && !ruoli.includes('schermo') ? '/regia/accedi' : '/accesso');
  // L'amministrazione non apre serate, quindi non entra nelle pagine di regia, squadre e proiettore.
  if (io.admin || !ruoli.includes(io.ruolo)) return router.parseUrl(s.pagina(io.ruolo, io.admin));
  return true;
};

/** Solo per l'amministrazione. */
export const soloAdmin: CanMatchFn = async () => {
  const s = inject(Sessione);
  const router = inject(Router);
  const io = await s.carica();
  if (!io) return router.parseUrl('/regia/accedi');
  return io.admin ? true : router.parseUrl(s.pagina(io.ruolo));
};
