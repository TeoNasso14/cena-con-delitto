import { MARCHIO, temaDa, variabili } from './catalogo';

/** Letta anche dallo script in index.html, che riapplica l'ultimo tema prima che parta Angular. */
const CHIAVE = 'cena-tema';
let attuale = '';

/** Veste tutto il sito col tema della serata, o col marchio ('marchio') fuori dalle serate. Un id sconosciuto vale Halloween classico. */
export function applicaTema(id: string | null | undefined) {
  const t = id === MARCHIO.id ? MARCHIO : temaDa(id);
  if (t.id === attuale) return;
  attuale = t.id;
  const html = document.documentElement;
  const v = variabili(t);
  for (const [k, valore] of Object.entries(v)) html.style.setProperty(k, valore);
  html.style.colorScheme = t.scuro ? 'dark' : 'light';
  html.dataset['tema'] = t.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.colori.fondo);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', t.scuro ? 'dark' : 'light');
  try {
    localStorage.setItem(CHIAVE, JSON.stringify({ id: t.id, scuro: t.scuro, variabili: v }));
  } catch {
    // Navigazione privata o memoria bloccata: alla prossima apertura si parte da Halloween.
  }
}
