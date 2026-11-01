# Piano della 1.1: tema della serata

Concordato il 1 novembre 2026. Il tema è un'impostazione della serata, scelta dalla regia; Halloween classico resta il predefinito.

## Temi
| Id | Tema | Idea |
|---|---|---|
| `halloween` | Halloween classico | quello della 1.0 |
| `noir` | Noir anni '40 | bianco, nero e pioggia, macchina da scrivere |
| `vittoriano` | Vittoriano alla Sherlock | carta, inchiostro, lente |
| `viaggio` | Delitto in viaggio | treno o nave, biglietti e cabine |
| `gatsby` | Anni '20 Gatsby | oro, nero, art déco |
| `natale` | Natale con delitto | per dicembre |

Ogni tema cambia: colori, i due caratteri (titoli e testo), decorazione del proiettore, sei figure delle nuvolette, frasi pronte delle nuvolette, un piccolo lessico di testi. La regia prende il tema della serata come telefoni e proiettore.

## Decisioni
- **Dati**: `serata.tema TEXT NOT NULL DEFAULT 'halloween'`. Il catalogo dei temi è nel codice (oggetti TypeScript); il server accetta solo id conosciuti.
- **Colori per ruolo**: `--fondo`, `--fondo-2`, `--fondo-3`, `--filetto`, `--testo-1`, `--testo-2`, `--accento`, `--accento-chiaro`, `--sigillo`, `--sigillo-luce`, `--sigillo-segno`, `--allarme`, `--carta`, `--inchiostro`, `--carta-filetto`, `--decoro`; caratteri `--titoli` e `--corpo`. Si aggiunge `--su-accento` per il testo sopra l'accento, e ogni tema dichiara `color-scheme` (un tema chiaro, per esempio il vittoriano, è possibile).
- **Applicazione**: attributo `data-tema` su `<html>` e variabili impostate dal catalogo. `index.html` riapplica subito l'ultimo tema visto (`localStorage`, in try/catch) per evitare il lampo di Halloween; anche `theme-color` segue il tema.
- **Caratteri**: due per tema, entrambi diversi da tema a tema, self-hosted, licenza OFL. Le `@font-face` sono dichiarate tutte; il browser scarica solo quelle usate. Vincoli: cifre ben leggibili (tastierino, orologio, punteggi) e titoli che stanno in due righe sul proiettore.
- **Proiettore**: il disco e i suoi movimenti per scena restano (il conto alla rovescia ci si appoggia); il disegno dentro diventa un componente per tema.
- **Pagina di accesso**: `GET /api/avvio`, già pubblico, restituisce in più solo l'id del tema.
- **Nuvolette dalla regia** (anticipato dalla 2.1): le frasi non stanno più nel codice.
  - Tabella `sussurro` (`serata_id`, `testo`, `ordine`) e `serata.sussurri_attivi BOOLEAN NOT NULL DEFAULT TRUE`.
  - La migrazione copia nella serata esistente le frasi di oggi, così Halloween 2026 non perde nulla; poi le frasi escono da `sussurri.ts`.
  - Regia, in Strumenti: elenco delle frasi modificabile, aggiungi e togli, "Riparti dalle frasi del tema", accese o spente.
  - Una serata senza frasi proprie usa quelle pronte del suo tema.
  - Restano per la 2.1: lista invitati, frequenza e durata decise dalla regia.

## Proposte per tema (da rifinire con Impeccable)
| Tema | Caratteri (candidati) | Disco del proiettore | Figure delle nuvolette |
|---|---|---|---|
| Halloween | Grenze Gotisch, Barlow | luna con crateri e ramo | fantasma, pipistrello, ragno, zucca, occhi, candela |
| Noir | Bodoni Moda, Courier Prime | finestra con veneziane, pioggia a righe | cappello, sigaretta, macchina da scrivere, bicchiere, impronta, lampione |
| Vittoriano | IM Fell English, EB Garamond | lente d'ingrandimento | pipa, lente, cilindro, orologio da taschino, calamaio, lampione a gas |
| Viaggio | Bebas Neue, Work Sans | orologio di stazione o oblò | biglietto, valigia, locomotiva, ancora, chiave di cabina, bussola |
| Gatsby | Limelight, Josefin Sans | raggiera art déco | coppa, piuma, perle, grammofono, ventaglio, bocchino |
| Natale | Cinzel, Lato | luna d'inverno con neve | pallina, regalo, stella, candela, campanella, fiocco di neve |

Le regole di DESIGN.md valgono per tutti: niente gradienti, niente ombre su elementi fermi, niente emoji, titoli entro due righe, due caratteri, niente caratteri che imitano la scrittura a mano.

## Passi
1. **Colori per ruolo**, senza differenze visibili. Fatto: variabili rinominate, colori scritti a mano sostituiti (velo e allarmi con `color-mix`), superfici di carta su `--carta` e `--inchiostro`.
2. **Infrastruttura**. Fatto: migrazione `…_tema_serata`, `tema` nelle risposte di squadra e proiettore, `PUT /api/regia/tema`, tema in `GET /api/avvio`, catalogo con il solo Halloween, `data-tema` e anti-lampo, scelta del tema in regia con anteprime. Revisione dei `var(--fondo)` usati come testo sull'accento, che diventano `--su-accento`.
3. **Nuvolette dalla regia**: migrazione `…_sussurri` con copia delle frasi attuali, API, sezione in regia, componente che legge le frasi dalla serata.
4. **Spazi per tema**: decorazione del proiettore, figure, frasi pronte, lessico, caratteri. Halloween passa dentro questi spazi senza cambiare aspetto.
5. **I cinque temi nuovi**, un commit ciascuno, con la loro sezione in DESIGN.md.
6. **Documenti**: DESIGN.md diviso in regole comuni e sezioni per tema, PRODUCT.md, README, CHANGELOG 1.1.0, STORIA.

## Test
- Migrazioni: un database con lo schema della 1.0 e una serata in uso finisce con `tema = 'halloween'`, le frasi copiate e nient'altro toccato.
- API: tema sconosciuto rifiutato; cambio di tema e di frasi aumenta `versione`; `/api/avvio` restituisce solo il tema; le squadre ricevono le frasi della loro serata.
- Contrasto, per ogni tema del catalogo: testo secondario su ogni livello di fondo almeno 4.5:1, testo sull'accento e sulla carta leggibile, allarme distinguibile dall'accento.
- `npm test`, `npm run verifica`, `npm run build`, poi un giro in locale con `?sussurri=subito` su telefono, proiettore e regia per ogni tema.
