import { Injectable, signal } from '@angular/core';

export class ErroreApi extends Error {
  constructor(public stato: number, messaggio: string, public codice = 'errore') {
    super(messaggio);
  }
}

export type Ruolo = 'regia' | 'squadra' | 'schermo';
export interface Io {
  ruolo: Ruolo;
  username: string;
  squadra: { nome: string; colore: string } | null;
}

@Injectable({ providedIn: 'root' })
export class Api {
  /** Diventa true quando una chiamata riceve 401: le pagine riportano all'accesso. */
  readonly sessioneScaduta = signal(false);

  async chiama<T>(metodo: string, path: string, corpo?: unknown): Promise<T> {
    const init: RequestInit = { method: metodo, credentials: 'same-origin', headers: {} };
    if (corpo !== undefined) {
      init.body = JSON.stringify(corpo);
      (init.headers as Record<string, string>)['content-type'] = 'application/json';
    }
    let res: Response;
    try {
      res = await fetch(path, init);
    } catch {
      throw new ErroreApi(0, 'Connessione assente. Controlla la rete e riprova.', 'rete');
    }
    const dati = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) this.sessioneScaduta.set(true);
      throw new ErroreApi(res.status, dati.errore ?? 'Qualcosa non ha funzionato.', dati.codice);
    }
    return dati as T;
  }

  get<T>(p: string) { return this.chiama<T>('GET', p); }
  post<T>(p: string, b: unknown = {}) { return this.chiama<T>('POST', p, b); }
  put<T>(p: string, b: unknown) { return this.chiama<T>('PUT', p, b); }
  del<T>(p: string) { return this.chiama<T>('DELETE', p); }

  async carica(file: File): Promise<{ key: string; tipo: string }> {
    const res = await fetch('/api/regia/allegati', { method: 'POST', body: file, headers: { 'content-type': file.type }, credentials: 'same-origin' });
    const dati = await res.json().catch(() => ({}));
    if (!res.ok) throw new ErroreApi(res.status, dati.errore ?? 'Caricamento non riuscito.');
    return dati;
  }
}

/** Ripete una funzione a intervalli, si ferma quando la scheda è nascosta e riparte subito quando torna visibile. */
export function ripeti(fn: () => Promise<unknown>, ms: number): () => void {
  let fermo = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const giro = async () => {
    if (fermo) return;
    if (document.visibilityState === 'visible') {
      try { await fn(); } catch { /* il prossimo giro riprova */ }
    }
    timer = setTimeout(giro, ms);
  };
  const visibile = () => {
    if (document.visibilityState === 'visible' && !fermo) {
      clearTimeout(timer);
      giro();
    }
  };
  document.addEventListener('visibilitychange', visibile);
  giro();
  return () => {
    fermo = true;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', visibile);
  };
}

export function ora(d: string | Date | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
