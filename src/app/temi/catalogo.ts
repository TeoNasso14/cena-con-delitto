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
  'taccuino', 'lente', 'cilindro', 'orologio', 'calamaio', 'chiave',
  'biglietto', 'valigia', 'locomotiva', 'fischietto', 'lanterna', 'tazza',
  'coppa', 'grammofono', 'bocchino', 'carte', 'bottiglia', 'perle',
  'pallina', 'regalo', 'stella', 'campanella', 'bastoncino', 'pupazzo',
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
  /** Per caratteri dei titoli molto larghi (maiuscole): riduce i titoli del proiettore perché stiano in due righe. Predefinito 1. */
  scalaTitoli?: number;
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
  {
    id: 'vittoriano',
    nome: 'Vittoriano alla Sherlock',
    descrizione: 'Carta avorio, inchiostro e lente: un taccuino della Londra vittoriana.',
    scuro: false,
    colori: {
      fondo: '#f3ead8', 'fondo-2': '#ebe0c9', 'fondo-3': '#e0d3b8', filetto: '#c2b190',
      'testo-1': '#2a1f17', 'testo-2': '#5e4b3a',
      accento: '#1f3a5f', 'accento-chiaro': '#2c5282', 'su-accento': '#f8f2e4', disco: '#e6d8b8', 'su-disco': '#2a1f17',
      sigillo: '#8e1b24', 'sigillo-luce': '#b8323c', 'sigillo-segno': '#e7a39a', allarme: '#a8261b',
      carta: '#fbf7ee', inchiostro: '#1d1712', 'carta-filetto': '#d9ccb2', decoro: '#2a1f17',
    },
    titoli: '"IM Fell English", Georgia, serif',
    corpo: '"EB Garamond", Georgia, serif',
    frasi: [
      'La nebbia sale dal Tamigi.',
      'Elementare? Non ancora.',
      'Un dettaglio è sfuggito a tutti.',
      'Il lampionaio è passato in ritardo.',
      'Qualcuno ha bussato tre volte.',
      'La carrozza non si è fermata.',
      'Un orologio da taschino si è fermato alle undici.',
      'Nessun indizio è troppo piccolo.',
      'Il tè si è raffreddato nella tazza.',
      'Scotland Yard brancola nel buio.',
      'Una lettera senza firma.',
      'Il fuoco nel camino si sta spegnendo.',
      'Osservate, non guardate.',
      'Big Ben ha suonato la mezzanotte.',
      'Un passo leggero sulle scale.',
      'La verità ama nascondersi in vista.',
    ],
    figure: ['taccuino', 'lente', 'cilindro', 'orologio', 'calamaio', 'chiave'],
  },
  {
    id: 'viaggio',
    nome: 'Delitto in viaggio',
    descrizione: 'Un treno di lusso che corre di notte: livrea blu, ottone e biglietti.',
    scuro: true,
    colori: {
      fondo: '#0e1626', 'fondo-2': '#152036', 'fondo-3': '#1d2a44', filetto: '#33415f',
      'testo-1': '#eee6d4', 'testo-2': '#a9b0c0',
      accento: '#c9a24a', 'accento-chiaro': '#ddb85e', 'su-accento': '#0e1626', disco: '#eee6d4', 'su-disco': '#0e1626',
      sigillo: '#7a1f2a', 'sigillo-luce': '#a3313d', 'sigillo-segno': '#e7a39a', allarme: '#ff7a6b',
      carta: '#efe4c8', inchiostro: '#1a1410', 'carta-filetto': '#cdbf9f', decoro: '#0e1626',
    },
    titoli: '"Cinzel", Georgia, serif',
    corpo: '"Work Sans", system-ui, sans-serif',
    scalaTitoli: 0.72,
    frasi: [
      'Il treno non si ferma fino all\'alba.',
      'Qualcuno ha cambiato cabina.',
      'Il capotreno conta i biglietti due volte.',
      'Una valigia senza etichetta.',
      'Prossima fermata: nessuna.',
      'Il vagone ristorante è chiuso da un\'ora.',
      'Le tende della cabina 7 sono tirate.',
      'Il fischio della locomotiva nella notte.',
      'Fuori, solo neve e binari.',
      'Un biglietto di sola andata.',
      'Il controllore ha visto qualcosa.',
      'La porta tra i vagoni sbatte ancora.',
      'Tutti hanno un alibi. Troppi.',
      'Siamo in ritardo di sei minuti.',
      'Il bagaglio a mano pesa troppo.',
      'In galleria si spengono le luci.',
    ],
    figure: ['biglietto', 'valigia', 'locomotiva', 'fischietto', 'lanterna', 'tazza'],
  },
  {
    id: 'gatsby',
    nome: "Anni '20 Gatsby",
    descrizione: 'Uno speakeasy degli anni venti: nero velluto, oro spento, geometrie déco.',
    scuro: true,
    colori: {
      fondo: '#0d0c0a', 'fondo-2': '#171511', 'fondo-3': '#211e18', filetto: '#3b3529',
      'testo-1': '#f1e7cf', 'testo-2': '#b3a587',
      accento: '#d6b25e', 'accento-chiaro': '#e6c677', 'su-accento': '#0d0c0a', disco: '#d6b25e', 'su-disco': '#0d0c0a',
      sigillo: '#7a2030', 'sigillo-luce': '#a3354a', 'sigillo-segno': '#e7a39a', allarme: '#ff7f6e',
      carta: '#f1e7cf', inchiostro: '#14110c', 'carta-filetto': '#cfc0a0', decoro: '#8f6f2c',
    },
    titoli: '"Federo", Georgia, serif',
    corpo: '"Josefin Sans", system-ui, sans-serif',
    frasi: [
      'La parola d\'ordine è cambiata stasera.',
      'Il proibizionismo non vale qui dentro.',
      'Il pianista conosce tutti i segreti.',
      'Un bicchiere lasciato a metà.',
      'Bussate due volte, poi una.',
      'Il fumo nasconde molti volti.',
      'Qualcuno ha pagato in contanti.',
      'Il jazz copre ogni rumore.',
      'Una perla è rotolata sotto il tavolo.',
      'La polizia è stata avvisata. Forse.',
      'Il proprietario non si fa vedere.',
      'Champagne per tutti, tranne uno.',
      'Dietro la libreria c\'è una porta.',
      'Le carte sono truccate.',
      'Il grammofono gira a vuoto.',
      'Stanotte tutti mentono con eleganza.',
    ],
    figure: ['coppa', 'grammofono', 'bocchino', 'carte', 'bottiglia', 'perle'],
  },
  {
    id: 'natale',
    nome: 'Natale con delitto',
    descrizione: 'Il delitto in casa la sera di Natale: verde abete, luci calde, neve.',
    scuro: true,
    colori: {
      fondo: '#0f1d17', 'fondo-2': '#15261e', 'fondo-3': '#1d3328', filetto: '#2f4a3c',
      'testo-1': '#f4ecdc', 'testo-2': '#b8c2b4',
      accento: '#f24b4b', 'accento-chiaro': '#f56b6b', 'su-accento': '#0f1d17', disco: '#f4ecdc', 'su-disco': '#0f1d17',
      sigillo: '#8e1b24', 'sigillo-luce': '#b8323c', 'sigillo-segno': '#e7a39a', allarme: '#f2c14e',
      carta: '#fbf4e4', inchiostro: '#1a1410', 'carta-filetto': '#d9ccb2', decoro: '#0f1d17',
    },
    titoli: '"Gloock", Georgia, serif',
    corpo: '"Nunito", system-ui, sans-serif',
    frasi: [
      'Un regalo in più sotto l\'albero.',
      'Chi ha spento le luci dell\'albero?',
      'La neve ha coperto le impronte.',
      'Manca un posto a tavola.',
      'Il panettone è stato tagliato. Da chi?',
      'Le campane suonano a mezzanotte.',
      'Un biglietto d\'auguri senza firma.',
      'Lo zio non è ancora arrivato.',
      'Il camino è acceso, la porta no.',
      'Qualcuno ha scartato un regalo in anticipo.',
      'Fuori nevica sempre più forte.',
      'La tombola è sospesa.',
      'Il presepe ha un pastore in meno.',
      'Nessuno è uscito, eppure.',
      'Le calze sul camino sono cinque. Eravamo in sei.',
      'Buon Natale. Forse.',
    ],
    figure: ['pallina', 'regalo', 'stella', 'campanella', 'bastoncino', 'pupazzo'],
  },
];

export const PREDEFINITO = TEMI[0];

/**
 * Il marchio dell'applicazione, Il Movente: veste le pagine fuori da una serata (le tue serate, accesso della regia,
 * amministrazione). Non è un tema da scegliere per una serata, quindi non sta in TEMI. Vedi DESIGN.md, "Il marchio".
 */
export const MARCHIO: Tema = {
  id: 'marchio',
  nome: 'Il Movente',
  descrizione: 'Collana di gialli su una parete di locandine.',
  scuro: true,
  colori: {
    fondo: '#141414', 'fondo-2': '#1c1c1c', 'fondo-3': '#242424', filetto: '#3a3a3a',
    'testo-1': '#f5f5f1', 'testo-2': '#9e9e99',
    accento: '#f6c800', 'accento-chiaro': '#ffd61f', 'su-accento': '#111111', disco: '#f6c800', 'su-disco': '#111111',
    sigillo: '#8e1b24', 'sigillo-luce': '#b8323c', 'sigillo-segno': '#e7a39a', allarme: '#ff8a9a',
    carta: '#f5f5f1', inchiostro: '#111111', 'carta-filetto': '#c9c9c4', decoro: '#2e2e2e',
  },
  titoli: '"Limelight", Georgia, serif',
  corpo: '"Source Sans 3", system-ui, sans-serif',
  frasi: [],
  figure: [],
};

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
  const v: Record<string, string> = { '--titoli': t.titoli, '--corpo': t.corpo, '--scala-titoli': String(t.scalaTitoli ?? 1) };
  for (const c of COLORI) v[`--${c}`] = t.colori[c];
  return v;
}
