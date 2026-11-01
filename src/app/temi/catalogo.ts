/**
 * Catalogo dei temi della serata. Solo dati, niente Angular: lo leggono anche i test.
 * Gli id devono coincidere con TEMI in server/regia.ts.
 */

export const COLORI = [
  'fondo', 'fondo-2', 'fondo-3', 'filetto', 'testo-1', 'testo-2',
  'accento', 'accento-chiaro', 'su-accento',
  'sigillo', 'sigillo-luce', 'sigillo-segno', 'allarme',
  'carta', 'inchiostro', 'carta-filetto', 'decoro',
] as const;
export type Colore = (typeof COLORI)[number];

export interface Tema {
  id: string;
  nome: string;
  /** Una riga per la scheda in regia. */
  descrizione: string;
  scuro: boolean;
  colori: Record<Colore, string>;
  titoli: string;
  corpo: string;
}

export const TEMI: readonly Tema[] = [
  {
    id: 'halloween',
    nome: 'Halloween classico',
    descrizione: 'Notte viola, luna arancio e gotico. Quello della prima serata.',
    scuro: true,
    colori: {
      fondo: '#0e0b14', 'fondo-2': '#17121f', 'fondo-3': '#231b2e', filetto: '#3a2f48',
      'testo-1': '#eee6d6', 'testo-2': '#b8aec4',
      accento: '#ff7a1a', 'accento-chiaro': '#ff9a4d', 'su-accento': '#0e0b14',
      sigillo: '#8e1b24', 'sigillo-luce': '#b8323c', 'sigillo-segno': '#e7a39a', allarme: '#ff5a5f',
      carta: '#eee6d6', inchiostro: '#0e0b14', 'carta-filetto': '#c9bfae', decoro: '#f47318',
    },
    titoli: '"Grenze Gotisch", Georgia, serif',
    corpo: '"Barlow", system-ui, sans-serif',
  },
];

export const PREDEFINITO = TEMI[0];

export function temaDa(id: string | null | undefined): Tema {
  return TEMI.find((t) => t.id === id) ?? PREDEFINITO;
}

/** Le variabili CSS che il tema imposta su <html>. */
export function variabili(t: Tema): Record<string, string> {
  const v: Record<string, string> = { '--titoli': t.titoli, '--corpo': t.corpo };
  for (const c of COLORI) v[`--${c}`] = t.colori[c];
  return v;
}
