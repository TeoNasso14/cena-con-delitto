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
  admin?: boolean;
  squadra: { nome: string; colore: string; prova?: boolean } | null;
  /** Per squadre e proiettore: la serata, per tornare alla sua pagina d'accesso. */
  slug?: string | null;
}

/**
 * Prova generale: la regia apre il telefono di una squadra nascosta in un'altra scheda con #anteprima=<token>.
 * Il token resta nella memoria di quella scheda e viaggia nell'intestazione x-anteprima: il cookie della regia non cambia.
 */
const ANTEPRIMA = 'cena-anteprima';
function anteprimaIniziale(): string | null {
  const m = /^#anteprima=([A-Za-z0-9_.-]+)$/.exec(location.hash);
  try {
    if (m) {
      sessionStorage.setItem(ANTEPRIMA, m[1]);
      history.replaceState(null, '', location.pathname + location.search);
    }
    return sessionStorage.getItem(ANTEPRIMA);
  } catch {
    return m?.[1] ?? null;
  }
}

/** Un identificativo casuale del browser, per contare un voto per telefono. Non è un segreto e non identifica la persona. */
function dispositivo(): string {
  const k = 'cena-dispositivo';
  try {
    let d = localStorage.getItem(k);
    if (!d) { d = crypto.randomUUID().replace(/-/g, ''); localStorage.setItem(k, d); }
    return d;
  } catch {
    return (window as unknown as { __disp?: string }).__disp ??= crypto.randomUUID().replace(/-/g, '');
  }
}

/** Chiave della serata aperta dalla regia: per scheda, così due schede possono stare su due serate. */
const SERATA = 'cena-serata';

function serataIniziale(): number | null {
  // Il proiettore aperto dalla regia in un'altra scheda riceve la serata nell'indirizzo (?serata=).
  const daIndirizzo = Number(new URLSearchParams(location.search).get('serata'));
  if (Number.isInteger(daIndirizzo) && daIndirizzo > 0) return daIndirizzo;
  try {
    const n = Number(sessionStorage.getItem(SERATA));
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class Api {
  /** Diventa true quando una chiamata riceve 401: le pagine riportano all'accesso. */
  readonly sessioneScaduta = signal(false);
  /** La serata su cui lavora la regia: va al server come x-serata. Squadre e proiettore non ne hanno bisogno. */
  readonly serata = signal<number | null>(serataIniziale());
  /** Il token della prova generale, se questa scheda la sta facendo. */
  readonly anteprima = signal<string | null>(anteprimaIniziale());

  lasciaAnteprima() {
    this.anteprima.set(null);
    try { sessionStorage.removeItem(ANTEPRIMA); } catch { /* niente da togliere */ }
  }

  scegliSerata(id: number | null) {
    this.serata.set(id);
    try {
      if (id) sessionStorage.setItem(SERATA, String(id));
      else sessionStorage.removeItem(SERATA);
    } catch {
      // Memoria della scheda bloccata: la scelta vale finché la pagina resta aperta.
    }
  }

  private intestazioni(): Record<string, string> {
    const s = this.serata();
    const a = this.anteprima();
    return { ...(s ? { 'x-serata': String(s) } : {}), ...(a ? { 'x-anteprima': a } : {}), 'x-dispositivo': dispositivo() };
  }

  async chiama<T>(metodo: string, path: string, corpo?: unknown): Promise<T> {
    const init: RequestInit = { method: metodo, credentials: 'same-origin', headers: this.intestazioni() };
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
    const res = await fetch('/api/regia/allegati', { method: 'POST', body: file, headers: { ...this.intestazioni(), 'content-type': file.type }, credentials: 'same-origin' });
    const dati = await res.json().catch(() => ({}));
    if (!res.ok) throw new ErroreApi(res.status, dati.errore ?? 'Caricamento non riuscito.');
    return dati;
  }
}

/**
 * Tempo reale: se il sito ha una chiave Ably, il server dà un indirizzo per ascoltare il canale della serata
 * con EventSource. Ogni messaggio porta solo il nuovo numero di versione. Se la connessione cade si riapre
 * con un token nuovo, aspettando sempre di più (da 5 secondi a un minuto).
 */
function ascolta(api: Api, arriva: (versione: string | null) => void) {
  let es: EventSource | null = null;
  let fermo = false;
  let aperto = false;
  let attesa = 5000;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const apri = async () => {
    if (fermo || typeof EventSource === 'undefined') return;
    let t: { attivo: boolean; url?: string } | null = null;
    try { t = await api.get('/api/tempo-reale'); } catch { /* si riprova sotto */ }
    if (fermo) return;
    if (t && !t.attivo) return; // nessun servizio: resta il controllo della versione
    if (!t?.url) { riprova(); return; }
    es = new EventSource(t.url);
    es.onopen = () => { aperto = true; attesa = 5000; };
    es.onmessage = (e) => {
      let v: string | null = null;
      try { const m = JSON.parse(e.data); v = typeof m?.data === 'string' ? m.data : typeof m === 'string' ? m : null; } catch { /* messaggio senza busta */ }
      arriva(v);
    };
    // Token scaduto o rete caduta: EventSource riproverebbe con lo stesso token, quindi si chiude e si riapre.
    es.onerror = () => { es?.close(); es = null; aperto = false; riprova(); };
  };
  const riprova = () => {
    clearTimeout(timer);
    timer = setTimeout(apri, attesa);
    attesa = Math.min(attesa * 2, 60000);
  };
  apri();
  return { aperto: () => aperto, chiudi: () => { fermo = true; clearTimeout(timer); es?.close(); } };
}

/**
 * Ogni `ogni` ms chiede solo il numero di versione della serata e chiama `carica` quando cambia, oppure comunque
 * ogni `comunque` ms (orari, ultimi accessi). Con il tempo reale aperto i cambi arrivano subito e il controllo
 * rallenta a ogni 10 secondi, come rete di sicurezza.
 */
export function seguiVersione(api: Api, carica: () => Promise<unknown>, ogni = 1500, comunque = 15000): () => void {
  let nota: string | null = null;
  let ultima = 0;
  const rt = ascolta(api, (v) => {
    if (v !== null && v === nota) return;
    carica().then(() => { if (v !== null) nota = v; ultima = Date.now(); }, () => undefined);
  });
  const ferma = ripeti(async () => {
    let v: string | null = null;
    try {
      v = (await api.get<{ versione: string }>('/api/versione')).versione;
    } catch {
      // Senza risposta si prova comunque lo stato completo: è lì che arrivano gli errori da mostrare.
    }
    if (v === null || v !== nota || Date.now() - ultima > comunque) {
      await carica();
      nota = v;
      ultima = Date.now();
    }
  }, () => (rt.aperto() ? Math.max(ogni, 10000) : ogni));
  return () => { rt.chiudi(); ferma(); };
}

/** Ripete una funzione a intervalli, si ferma quando la scheda è nascosta e riparte subito quando torna visibile. */
export function ripeti(fn: () => Promise<unknown>, ms: number | (() => number)): () => void {
  let fermo = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const giro = async () => {
    if (fermo) return;
    if (document.visibilityState === 'visible') {
      try { await fn(); } catch { /* il prossimo giro riprova */ }
    }
    timer = setTimeout(giro, typeof ms === 'number' ? ms : ms());
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
