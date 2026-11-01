/**
 * Catalogo dei temi della serata. Solo dati, niente Angular: lo leggono anche i test.
 * Gli id devono coincidere con TEMI in server/regia.ts.
 */

export const COLORI = [
  'fondo', 'fondo-2', 'fondo-3', 'filetto', 'testo-1', 'testo-2',
  'accento', 'accento-chiaro', 'su-accento', 'disco', 'su-disco',
  'sigillo', 'sigillo-luce', 'sigillo-segno', 'allarme',
  'carta', 'inchiostro', 'carta-filetto', 'decoro',
] as const;
export type Colore = (typeof COLORI)[number];

/** Le figure disegnate in figura.ts. */
export const FIGURE = [
  'fantasma', 'pipistrello', 'ragno', 'zucca', 'occhi', 'candela',
  'cappello', 'sigaretta', 'macchina', 'bicchiere', 'lampione', 'impronta',
] as const;
export type Figura = (typeof FIGURE)[number];

export interface Tema {
  id: string;
  nome: string;
  /** Una riga per la scheda in regia. */
  descrizione: string;
  scuro: boolean;
  colori: Record<Colore, string>;
  titoli: string;
  corpo: string;
  /** Frasi pronte delle nuvolette, per le serate che non ne hanno di proprie. Solo atmosfera, mai indizi. */
  frasi: readonly string[];
  /** Sei figure che parlano dalle nuvolette. */
  figure: readonly Figura[];
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
      accento: '#ff7a1a', 'accento-chiaro': '#ff9a4d', 'su-accento': '#0e0b14', disco: '#ff7a1a', 'su-disco': '#0e0b14',
      sigillo: '#8e1b24', 'sigillo-luce': '#b8323c', 'sigillo-segno': '#e7a39a', allarme: '#ff5a5f',
      carta: '#eee6d6', inchiostro: '#0e0b14', 'carta-filetto': '#c9bfae', decoro: '#f47318',
    },
    titoli: '"Grenze Gotisch", Georgia, serif',
    corpo: '"Barlow", system-ui, sans-serif',
    frasi: [
      'Qualcuno vi sta guardando.',
      'Non voltatevi.',
      'Hai sentito anche tu?',
      'La candela ha tremato.',
      'Contate i commensali. Siete ancora tutti?',
      'Le ombre si allungano.',
      'Chi ha spento la luce?',
      'Qualcosa gratta sotto il tavolo.',
      'Il gufo ha smesso di cantare.',
      'Mezzanotte si avvicina.',
      'Il ritratto ha cambiato espressione.',
      'Un passo, poi silenzio.',
      'Dietro la porta, un respiro.',
      'Il vento conosce il tuo nome.',
      'Non era il gatto.',
      'Fa più freddo di prima, vero?',
    ],
    figure: ['fantasma', 'pipistrello', 'ragno', 'zucca', 'occhi', 'candela'],
  },
  {
    id: 'noir',
    nome: "Noir anni '40",
    descrizione: 'Bianco e nero, pioggia e macchina da scrivere. Un solo rossetto.',
    scuro: true,
    colori: {
      fondo: '#0c0c0d', 'fondo-2': '#161617', 'fondo-3': '#222224', filetto: '#3a3a3d',
      'testo-1': '#e7e6e2', 'testo-2': '#a7a6a2',
      accento: '#e5404d', 'accento-chiaro': '#ee6670', 'su-accento': '#0c0c0d', disco: '#d9d6ce', 'su-disco': '#0c0c0d',
      sigillo: '#5c1119', 'sigillo-luce': '#8a1d29', 'sigillo-segno': '#d98a92', allarme: '#f2c230',
      carta: '#ebe7dd', inchiostro: '#111111', 'carta-filetto': '#c4bfb2', decoro: '#222224',
    },
    titoli: '"League Gothic", "Arial Narrow", sans-serif',
    corpo: '"Courier Prime", "Courier New", monospace',
    frasi: [
      'Piove da tre giorni. Nessuno ha visto niente.',
      'In questa città tutti hanno un segreto.',
      'Il telefono ha squillato due volte. Poi più niente.',
      'Qualcuno ha pagato per il silenzio.',
      'Le luci del molo si sono spente.',
      'Il barista sa più di quanto dice.',
      'Una sigaretta ancora accesa nel posacenere.',
      'Fuori, una macchina col motore acceso.',
      'La pioggia lava tutto, tranne la colpa.',
      'Chi ha chiuso la porta a chiave?',
      'Il fumo sale piano verso il soffitto.',
      'Il caso sembra semplice. Non lo è mai.',
      'Le veneziane non nascondono tutto.',
      'Mezzanotte. Il jazz si è fermato.',
      'Nessuno dorme in questa città.',
      'Fidarsi è il primo errore.',
    ],
    figure: ['cappello', 'sigaretta', 'macchina', 'bicchiere', 'lampione', 'impronta'],
  },
];

export const PREDEFINITO = TEMI[0];

export function temaDa(id: string | null | undefined): Tema {
  return TEMI.find((t) => t.id === id) ?? PREDEFINITO;
}

/** Le frasi che le nuvolette pescano: quelle della serata, altrimenti quelle pronte del tema. Spente, nessuna. */
export function frasiDaMostrare(tema: string | null | undefined, s: { attivi: boolean; frasi: readonly string[] } | undefined): readonly string[] {
  if (!s?.attivi) return [];
  return s.frasi.length ? s.frasi : temaDa(tema).frasi;
}

/** Le variabili CSS che il tema imposta su <html>. */
export function variabili(t: Tema): Record<string, string> {
  const v: Record<string, string> = { '--titoli': t.titoli, '--corpo': t.corpo };
  for (const c of COLORI) v[`--${c}`] = t.colori[c];
  return v;
}
