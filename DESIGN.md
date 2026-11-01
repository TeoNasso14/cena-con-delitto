---
name: Cena con delitto
description: Cene con delitto in tre superfici sincronizzate, proiettore, telefono di squadra e regia, vestite dal tema della serata.
colors:
  fondo: "#0e0b14"
  fondo-2: "#17121f"
  fondo-3: "#231b2e"
  filetto: "#3a2f48"
  testo-1: "#eee6d6"
  testo-2: "#b8aec4"
  accento: "#ff7a1a"
  accento-chiaro: "#ff9a4d"
  su-accento: "#0e0b14"
  disco: "#ff7a1a"
  su-disco: "#0e0b14"
  sigillo: "#8e1b24"
  sigillo-luce: "#b8323c"
  sigillo-segno: "#e7a39a"
  allarme: "#ff5a5f"
  carta: "#eee6d6"
  inchiostro: "#0e0b14"
  carta-filetto: "#c9bfae"
  decoro: "#f47318"
  noir-fondo: "#0c0c0d"
  noir-fondo-2: "#161617"
  noir-fondo-3: "#222224"
  noir-filetto: "#3a3a3d"
  noir-testo-1: "#e7e6e2"
  noir-testo-2: "#a7a6a2"
  noir-accento: "#e5404d"
  noir-accento-chiaro: "#ee6670"
  noir-su-accento: "#0c0c0d"
  noir-disco: "#d9d6ce"
  noir-su-disco: "#0c0c0d"
  noir-sigillo: "#5c1119"
  noir-sigillo-luce: "#8a1d29"
  noir-sigillo-segno: "#d98a92"
  noir-allarme: "#f2c230"
  noir-carta: "#ebe7dd"
  noir-inchiostro: "#111111"
  noir-carta-filetto: "#c4bfb2"
  noir-decoro: "#222224"
typography:
  display:
    fontFamily: "Grenze Gotisch, Georgia, serif"
    fontSize: "clamp(56px, 14vh, 190px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0"
  headline:
    fontFamily: "Grenze Gotisch, Georgia, serif"
    fontSize: "clamp(48px, 10vh, 120px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0"
  title:
    fontFamily: "Grenze Gotisch, Georgia, serif"
    fontSize: "clamp(38px, 11vw, 48px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
  title-sm:
    fontFamily: "Grenze Gotisch, Georgia, serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  title-xs:
    fontFamily: "Grenze Gotisch, Georgia, serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  body-sala:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "clamp(22px, 3.6vh, 44px)"
    fontWeight: 400
    lineHeight: 1.38
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
  body-md:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  caption:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
  orologio:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "20vh"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\" 1"
  noir-display:
    fontFamily: "League Gothic, Arial Narrow, sans-serif"
    fontSize: "clamp(56px, 14vh, 190px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0"
  noir-title:
    fontFamily: "League Gothic, Arial Narrow, sans-serif"
    fontSize: "clamp(38px, 11vw, 48px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
  noir-body-sala:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "clamp(22px, 3.6vh, 44px)"
    fontWeight: 400
    lineHeight: 1.38
  noir-body:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  noir-label:
    fontFamily: "Courier Prime, Courier New, monospace"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.04em"
rounded:
  netto: "2px"
  fuoco: "4px"
  campo: "10px"
  casella: "12px"
  scheda: "14px"
  tasto: "16px"
  nuvola: "18px"
  foglio: "22px"
  pillola: "999px"
spacing:
  xs: "4px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  xl: "32px"
  xxl: "40px"
components:
  bottone:
    backgroundColor: "transparent"
    textColor: "{colors.testo-1}"
    typography: "{typography.body}"
    rounded: "{rounded.pillola}"
    padding: "0 22px"
    height: "48px"
  bottone-hover:
    textColor: "{colors.testo-1}"
  bottone-pieno:
    backgroundColor: "{colors.accento}"
    textColor: "{colors.su-accento}"
    rounded: "{rounded.pillola}"
    padding: "0 22px"
    height: "48px"
  bottone-pieno-hover:
    backgroundColor: "{colors.accento-chiaro}"
  bottone-disabilitato:
    backgroundColor: "{colors.fondo-3}"
    textColor: "{colors.testo-2}"
  campo:
    backgroundColor: "{colors.fondo}"
    textColor: "{colors.testo-1}"
    rounded: "{rounded.campo}"
    padding: "10px 14px"
    height: "48px"
  reperto-aperto:
    backgroundColor: "{colors.fondo-2}"
    textColor: "{colors.testo-1}"
    rounded: "{rounded.netto}"
    padding: "0 0 14px"
  reperto-sigillato:
    backgroundColor: "{colors.fondo}"
    textColor: "{colors.testo-1}"
    rounded: "{rounded.netto}"
    padding: "0 0 14px"
  documento:
    backgroundColor: "{colors.carta}"
    textColor: "{colors.inchiostro}"
    rounded: "{rounded.netto}"
    padding: "0 18px 56px"
  tasto:
    backgroundColor: "{colors.fondo-3}"
    textColor: "{colors.testo-1}"
    rounded: "{rounded.tasto}"
    height: "64px"
  tasto-apri:
    backgroundColor: "{colors.accento}"
    textColor: "{colors.su-accento}"
    rounded: "{rounded.tasto}"
    height: "64px"
  scheda-regia:
    backgroundColor: "{colors.fondo-2}"
    textColor: "{colors.testo-1}"
    rounded: "{rounded.scheda}"
    padding: "14px 16px"
  scheda-tema:
    backgroundColor: "{colors.fondo-2}"
    textColor: "{colors.testo-1}"
    rounded: "{rounded.scheda}"
    padding: "10px 10px 14px"
  foglio:
    backgroundColor: "{colors.fondo-2}"
    textColor: "{colors.testo-1}"
    rounded: "{rounded.foglio}"
    padding: "10px 24px 24px"
  nuvoletta:
    backgroundColor: "{colors.testo-1}"
    textColor: "{colors.fondo}"
    rounded: "{rounded.nuvola}"
    padding: "9px 15px"
  etichetta-nuova:
    backgroundColor: "{colors.accento}"
    textColor: "{colors.su-accento}"
    typography: "{typography.label}"
    rounded: "{rounded.netto}"
    padding: "1px 7px"
---

# Design System: Cena con delitto

## Overview

**Creative North Star: "La sala di proiezione e il fascicolo"**

La serata è un film proiettato in sala, e le prove sono i file di un videogioco investigativo. Il film cambia genere col tema della serata: oggi Halloween classico (il predefinito) e Noir anni '40, domani altri. Il tema veste colori, caratteri, il disegno nel disco del proiettore, lo strato d'atmosfera della sala e le figure delle nuvolette. Struttura, componenti, forme, movimento e comandi restano gli stessi per tutti i temi: chi gioca riconosce lo strumento anche quando il film cambia.

Le tre superfici parlano la stessa lingua con densità diverse. Il proiettore è scena pura: titoli enormi, testo grande leggibile dal fondo della sala, il disco come scenografia che cambia posto e misura da scena a scena. Il telefono e la regia sono strumenti: ereditano fondo, testo, accento e titoli del tema, ma con misura, con obiettivi di tocco ampi e una gerarchia che si legge al buio con un'occhiata.

La profondità non viene dalle ombre ma dal fondo a strati e dai filetti sottili. La forma distingue gli oggetti del mondo (schede prova, documenti, timbri: angoli quasi netti, carta e inchiostro) dai comandi da toccare (pillole e tasti morbidi). La firma del sistema è il sigillo di ceralacca: si spacca in due quando il codice è giusto, trema una volta quando è sbagliato, in ogni tema.

Il tema è una proprietà della serata. La regia lo sceglie in Strumenti; il sito lo applica come variabili CSS su `<html>` (colori per ruolo, `--titoli`, `--corpo`), e un tema sconosciuto vale Halloween classico. I valori predefiniti in `:root` del foglio globale sono quelli di Halloween.

**Key Characteristics:**
- Fondo scuro pieno in tre livelli (`fondo`, `fondo-2`, `fondo-3`), mai bianco, mai gradienti.
- Un solo colore saturo per tema, l'accento, per ciò che è vivo o in corso: fase corrente, comando principale, prova nuova.
- Il carattere dei titoli solo per i nomi (titoli, nomi di scene, intestazioni di sezione); il carattere del corpo per tutto il resto. Due caratteri per tema.
- Nessuna ombra: livelli tonali e filetti da 1px.
- Oggetti del mondo ad angoli netti (2px), comandi arrotondati.
- Movimento a cassetto e uscita morbida, sempre ridotto con "riduci movimento".

## Colors

I colori hanno nomi per ruolo, non per tinta: ogni tema dà un valore a ciascun ruolo. Nel frontmatter le chiavi senza prefisso sono Halloween classico (i valori di `:root`), le chiavi `noir-` sono Noir anni '40. Un tema nuovo dà un valore a tutti i diciannove ruoli e aggiunge le sue chiavi col proprio prefisso.

### Primary
- **Accento** (`accento`): il colore che urla. La fase corrente nella fila delle fasi, le barre di avanzamento, il bottone pieno, il tasto Apri, l'etichetta "Nuova", il bordo delle prove sigillate che si possono aprire, la scheda del tema scelto, il fuoco da tastiera, i link, la selezione del testo e il cursore.
- **Accento acceso** (`accento-chiaro`): solo lo stato hover dei comandi pieni e dei link. Non è un secondo accento.
- **Su accento** (`su-accento`): il testo sopra l'accento, sempre scuro.

### Secondary
- **Sigillo** (`sigillo`): il corpo del sigillo di ceralacca, l'inchiostro del timbro "AGLI ATTI" e dei link sul documento. Appartiene agli oggetti, non all'interfaccia.
- **Riflesso del sigillo** (`sigillo-luce`): l'anello in rilievo dentro il sigillo; in regia, il filetto attorno alla soluzione del caso.
- **Segno del sigillo** (`sigillo-segno`): la falce impressa nella ceralacca.

### Tertiary
- **Allarme** (`allarme`): solo errori e allarmi. Codice sbagliato (caselle e messaggio), squadra ferma in regia, tentativo errato nel registro, bottone di pericolo.

### Neutral
- **Fondo** (`fondo`): fondo di tutte le superfici, barre fisse, prove sigillate, campi di testo, il testo delle nuvolette, le silhouette dentro il disco.
- **Fondo velato** (`fondo-2`): primo livello rialzato. Foglio del sigillo, prove aperte, annunci della regia, schede e moduli della regia, schede dei temi, voce di menu corrente.
- **Fondo profondo** (`fondo-3`): secondo livello. Tasti del tastierino, binario delle barre e delle tacche, divisori delle barre fisse e del registro, comandi disabilitati, hover delle prove e delle schede.
- **Filetto** (`filetto`): bordi da 1px delle prove, dei bottoni a contorno e dei campi, maniglia del foglio, barra di scorrimento.
- **Testo** (`testo-1`): testo principale e titoli; fondo delle nuvolette.
- **Testo spento** (`testo-2`): testo secondario, metadati, orari, fasi non correnti, voci di navigazione a riposo, bordo delle prove aperte. Su `fondo` resta sopra 4.5:1 in ogni tema.

### Carta e scenografia
- **Carta** (`carta`), **Inchiostro** (`inchiostro`), **Filetto carta** (`carta-filetto`): il documento rivelato, il verbale e le credenziali della regia. La carta è l'unica superficie chiara.
- **Disco** (`disco`) e **Su disco** (`su-disco`): il grande disco del proiettore, le sue miniature in regia e nella pagina d'accesso, il colore proposto per una squadra nuova; `su-disco` è l'orologio e il testo del conto alla rovescia sopra il disco. Il disco è scenografia, non accento: può coincidere con l'accento (Halloween) o no (Noir).
- **Decoro** (`decoro`): il colore del disegno dentro il disco, quando il tema ne ha uno a colore.

### Dai nomi vecchi ai ruoli
Fino alla 1.0 i token avevano i nomi di Halloween. Corrispondenza, una volta per tutte: `notte` diventa `fondo`, `notte-2` `fondo-2`, `notte-3` `fondo-3`, `filetto` resta `filetto`; `osso` diventa `testo-1` (e `carta` per il documento), `osso-2` `testo-2`; `zucca` diventa `accento` (e `disco` per la luna), `zucca-chiara` `accento-chiaro`; la notte sopra la zucca diventa `su-accento` (e `su-disco`, e `inchiostro` sul documento); `cera` diventa `sigillo`, `cera-luce` `sigillo-luce`; `sangue` diventa `allarme`; `cratere` diventa `decoro`; `carta-filetto` resta. `sigillo-segno` è nuovo.

### Named Rules
**The Un Solo Accento Rule.** In ogni tema l'accento è l'unico colore saturo dell'interfaccia, e segna una cosa viva per volta. Se una seconda cosa vuole attenzione, prende `testo-1`, non un nuovo colore.

**The Allarme Rule.** Il colore d'allarme significa errore, e solo errore. Mai decorazione, mai atmosfera.

**The Sigillo Rule.** La ceralacca vive sugli oggetti del fascicolo (sigillo, timbro, link sul documento). Non diventa colore di bottoni, bordi o testi d'interfaccia.

## Typography

**Display Font:** il carattere dei titoli del tema (`--titoli`)
**Body Font:** il carattere del corpo del tema (`--corpo`)

**Character:** Ogni tema sceglie una coppia: un carattere di carattere forte che dà voce alla locandina e ai nomi delle cose, accanto a un carattere che porta istruzioni, numeri e comandi senza esitazione. I caratteri sono self-hosted in `public/fonti/` con `@font-face` nel foglio globale. Le misure sotto valgono per ogni tema; famiglie e pesi reali stanno nelle sezioni dei temi.

### Hierarchy
- **Display** (titoli 700, clamp(56px, 14vh, 190px), 0.95): titolo della scena di narrazione sul proiettore, su due righe al massimo. La scena d'attesa usa clamp(64px, 15vh, 190px).
- **Headline** (titoli 700, clamp(48px, 10vh, 120px), 0.95): titoli delle scene di avanzamento sul proiettore; la rivelazione usa 10vh.
- **Title** (titoli 700, clamp(38px, 11vw, 48px), 1): titolo del caso sul telefono. In regia il titolo di pagina usa clamp(34px, 4vw, 46px).
- **Title piccolo** (titoli 700, 24-34px, 1.05): titoli di sezione ("Le prove" 30px, blocchi della regia 26px), titolo del foglio del sigillo (34px), tipo di prova sul documento (28px).
- **Body sala** (corpo 400, clamp(22px, 3.6vh, 44px), 1.38): testo della scena sul proiettore, entro 32ch.
- **Body** (corpo 400, 17px base, 16px nei paragrafi del telefono, 1.5): testo corrente, entro 60-70ch. Cifre tabulari ovunque.
- **Body piccolo** (corpo 400-600, 14-15px, 1.3-1.4): metadati, registro, stato delle squadre, voci della barra a schede (13px).
- **Label** (corpo 600-700, 13px, 0.04em): numero di catalogo della prova ("N. 3") e intestazione del documento. Il maiuscolo compare solo nell'intestazione stampata del fascicolo e nel timbro (0.08em).
- **Orologio** (corpo 700, 20vh, 1, -0.02em): conto alla rovescia sul proiettore, in `su-disco` sopra il disco.
- **Cifre del codice** (corpo 600, 28-30px): tasti e caselle del PIN. Il codice rivelato sul documento usa 700, 18px, 0.08em.

### Named Rules
**The Due Caratteri Rule.** Ogni tema ha esattamente due caratteri, uno per i titoli e uno per il corpo. Nessun terzo carattere, nessun carattere di sistema per i titoli. Se un carattere ha meno pesi di quelli che il sistema chiede, li si dichiara come intervallo in `@font-face`, così il browser non inventa grassetti finti.

**The Titoli per i Nomi Rule.** Il carattere dei titoli nomina (scene, casi, sezioni, oggetti). Non porta mai paragrafi, numeri, orari, bottoni o etichette; quelli sono del corpo.

**The Due Righe Rule.** Ogni titolo sta entro due righe, con `text-wrap: balance`. Se non ci sta, si accorcia il titolo, non il corpo.

## Layout

Il proiettore è una griglia a tre righe a tutto schermo (testata, scena, fila delle fasi) con margini in unità di viewport (4.2vh 5vw 4vh). Il disco è posizionato in assoluto: enorme e decentrato a destra che taglia il bordo nella narrazione, centrato dietro l'orologio nel conto alla rovescia, piccolo in basso a destra nell'avanzamento, svuotato ad anello nella rivelazione. Il testo resta a sinistra del disco (54vw al massimo) e le scene si alternano in dissolvenza, mai scorrendo. Sopra il disco e sotto i testi può stare lo strato d'atmosfera del tema; le nuvolette stanno sopra tutto, in basso al centro.

Il telefono è una colonna unica di 480px al massimo con margine laterale di 20px, testata e barra a schede fisse, griglia delle prove a due colonne con 12px di spazio. Le sezioni si separano con aria (24-40px), non con linee. Il foglio del sigillo sale dal basso fino al 94dvh e rispetta le aree sicure. Le nuvolette compaiono sopra la barra a schede, larghe 290px al massimo.

La regia è un menu laterale da 260px più un centro flessibile; sotto 900px il menu passa sopra e il centro scorre in colonne che vanno a capo (380px minimo ciascuna). I comandi si dispongono in griglia auto-fit da 150px e diventano una colonna sotto 480px. Le schede dei temi stanno in una griglia auto-fill da 220px.

Ritmo degli spazi: 4px per le tacche, 10px tra comandi, 14px dentro le schede, 20px di margine sul telefono, 32px tra blocchi, 40px tra sezioni del telefono. Ogni obiettivo di tocco misura almeno 44px; bottoni e campi 48px, tasti del PIN 64px, voci della barra a schede 60px.

## Elevation & Depth

Il sistema è piatto in ogni tema. Nessuna `box-shadow` in nessuna superficie. La profondità viene dal fondo a strati: `fondo` come base, `fondo-2` per ciò che sta sopra (foglio, schede, prove aperte), `fondo-3` per ciò che sta sopra ancora o che si preme (tasti, binari, hover). I filetti da 1px (`filetto`, `fondo-3`) separano dove il tono non basta. L'unico velo è quello dietro il foglio del sigillo, il fondo stesso al 78%.

### Named Rules
**The Fondo a Strati Rule.** Si sale di livello cambiando tono, non aggiungendo ombra. Tre fondi bastano; un quarto non serve. (Era "Notte a Strati" quando c'era solo Halloween.)

**The Niente Ombre Rule.** Nessun elemento fermo porta un'ombra, né morbida né netta. Neppure il disco ha alone: è un disco piatto.

## Shapes

Due famiglie di forme, separate per natura. Gli oggetti del mondo (scheda della prova, documento rivelato, timbro, etichetta "Nuova", credenziali) hanno angoli quasi netti (2px) e filetti sottili: sono carta, cartoncino, inchiostro. I comandi da toccare sono morbidi: bottoni a pillola (999px), tasti del PIN (16px), caselle del codice (12px), campi (10px), schede della regia e dei temi (14px), nuvolette (18px), foglio con angoli superiori da 22px. I cerchi sono riservati al disco, allo stemma della squadra, ai pallini delle fasi e al bottone di chiusura.

Le forme organiche esistono solo nella scenografia: il disegno dentro il disco, il bordo frastagliato della ceralacca, le figure delle nuvolette. Il timbro è ruotato di -9 gradi, come premuto a mano.

### Named Rules
**The Carta e Dito Rule.** Se è un oggetto del caso, angolo netto (2px). Se si tocca, angolo morbido. Una prova non diventa mai una pillola; un bottone non diventa mai un cartoncino.

## Components

I componenti sono gli stessi in ogni tema e prendono i colori solo dai ruoli; nessun componente conosce il nome di un tema. Ciò che cambia col tema vive in quattro posti: il catalogo dei temi (colori, caratteri, frasi pronte e figure delle nuvolette), il disegno nel disco, lo strato d'atmosfera del proiettore, le figure.

### Buttons
Comandi pieni e sicuri, a pillola, pensati per un dito al buio.
- **Shape:** pillola (999px), altezza minima 48px, padding orizzontale 22px, corpo 600 16px, icona da 22px con 10px di spazio. Il piccolo è alto 40px con padding 16px e 15px.
- **Primary (bottone pieno):** fondo `accento`, testo `su-accento`. Un solo bottone pieno per gruppo di azioni.
- **Secondary (bottone a contorno):** fondo trasparente, bordo 1px `filetto`, testo `testo-1`.
- **Pericolo:** contorno e testo `allarme`; in hover un velo d'allarme all'8%.
- **Hover / Focus:** hover solo su dispositivi con puntatore; il contorno passa a `testo-2`, il pieno passa a `accento-chiaro`. Fuoco: anello 2px `accento` a 3px di distanza. Pressione: scala a 0.97 in 120ms con curva di uscita.
- **Disabled:** fondo e bordo `fondo-3`, testo `testo-2`, cursore non consentito.

### Inputs / Fields
- **Style:** fondo `fondo`, bordo 1px `filetto`, raggio 10px, altezza minima 48px, padding 10px 14px. Segnaposto in `testo-2`. Le select perdono la freccia di sistema.
- **Focus:** anello globale 2px `accento`; cursore di testo `accento`.

### Navigation
- **Barra a schede del telefono:** fissa in basso su `fondo` con filetto superiore `fondo-3`, quattro voci a colonna (icona 22px sopra, corpo 500 13px sotto), alte 60px. A riposo `testo-2`, corrente `accento` in 700, hover `testo-1`.
- **Menu della regia:** colonna da 260px, voci alte 44px con raggio 10px, `testo-2` a riposo; la voce corrente prende fondo `fondo-2`, testo `testo-1` 600 e icona `accento`.
- **Fila delle fasi del proiettore:** una riga di nomi in corpo 600 con pallino; le passate barrate (2px) con pallino pieno, la corrente in `accento`, le future in `testo-2` con pallino vuoto.

### Cards / Containers
- **Scheda della regia, annuncio, modulo:** fondo `fondo-2`, raggio 14-16px, padding 14-16px, nessun bordo, nessuna ombra.
- **Anteprima "In onda":** riquadro 16:9 in `fondo` con il disco in miniatura (`disco`) e il titolo nel carattere dei titoli, etichetta di stato a pillola `accento` in alto a sinistra.
- **Scheda del tema (Strumenti):** fondo `fondo-2`, raggio 14px, bordo 1px trasparente che diventa `accento` sul tema in uso, hover `fondo-3`. In alto un'anteprima 16:9 dipinta coi colori di quel tema (fondo, filetto, disco) e il titolo della serata nel suo carattere dei titoli; sotto il nome, la pillola "In uso" e una riga di descrizione in `testo-2`.

### Prova d'inventario (signature)
La scheda del fascicolo. Raggio 2px, bordo 1px, altezza minima 164px, testata da 52px con icona o sigillo a sinistra e numero di catalogo a destra, separata da un filetto; titolo corpo 600 16px e nota 14px in fondo.
- **Aperta:** fondo `fondo-2`, bordo e filetto `testo-2`, icona a tratto `accento`.
- **Sigillata:** fondo `fondo`, sigillo di ceralacca da 40px, titolo "Sigillata" e una nota che dice perché e come si apre. Bordo `filetto` se ancora irraggiungibile, `accento` se si può aprire ora con un codice.
- **Nuova:** appena aperta, l'etichetta "Nuova" (fondo `accento`, testo `su-accento`, 2px) prende il posto del numero.
- **Hover:** fondo `fondo-3`.

### Sigillo e tastierino (signature)
Il foglio sale dal basso con la curva a cassetto (420ms) sopra il velo. Al centro il sigillo di ceralacca da 132px (corpo `sigillo`, anello `sigillo-luce`, falce `sigillo-segno`), poi il titolo, quattro caselle da 58 per 68px (bordo `filetto`, `accento` quando piene, `allarme` all'errore) e un tastierino 3 per 4 di tasti da 64px su `fondo-3` con raggio 16px. "Cancella" è trasparente in `testo-2`; "Apri" è `accento` con testo `su-accento` e resta disabilitato finché le cifre non sono quattro.
- **Codice giusto:** il sigillo si spacca in due metà lungo una crepa irregolare che scivolano via ruotando (620ms, curva di uscita), poi la prova sale dal basso (520ms, curva a cassetto).
- **Codice sbagliato:** il sigillo trema una volta (380ms), caselle e messaggio in `allarme`, il conteggio dei tentativi scende.

### Documento rivelato (signature)
Il foglio di carta della prova: fondo `carta`, testo `inchiostro`, raggio 2px, padding 0 18px 56px (lo spazio in fondo è per il timbro). Intestazione stampata in corpo 700 13px maiuscolo con filetto `inchiostro` da 1.5px; tipo di prova nel carattere dei titoli 28px; righe del testo separate da un filetto `carta-filetto`; timbro "AGLI ATTI" in `sigillo` a contorno 2px, ruotato di -9 gradi.

### Disco del proiettore (signature)
Un disco piatto `disco` che cambia posizione e misura tra le scene in 900ms con curva a cassetto; nella rivelazione si svuota in anello (bordo 1.2vh) e il disegno interno si spegne. Il disegno dentro il disco è del tema e sta in un solo componente; il disco e i suoi movimenti no.

### Strato d'atmosfera (solo proiettore)
Uno strato a tutto schermo sopra il disco e sotto i testi, vuoto per i temi che non ne hanno. Non riceve tocchi, tace (opacità 0 in 600ms) a schermo nero e sulle scene con immagine o video, e con "riduci movimento" si ferma. Non esiste sul telefono né in regia.

### Nuvolette
Frasi brevi di atmosfera che compaiono ogni tanto sui telefoni e sul proiettore. Nuvola `testo-1` con testo `fondo`, raggio 18px, padding 9px 15px, coda a rombo; sotto, una figura da 56px (11vh sul proiettore, dove la nuvola cresce fino a 52px di testo). Entra in 520ms con la curva a cassetto ed esce in 380ms con la curva di uscita. Le frasi le decide la regia per ogni serata e si possono spegnere; se la serata non ne ha, valgono le frasi pronte del tema. Ogni tema ha sei figure disegnate a tinte piatte coi soli ruoli di colore, ciascuna con un piccolo gesto animato che "riduci movimento" ferma.

## Do's and Don'ts

### Do:
- **Do** prendere ogni colore da un ruolo (`var(--fondo)`, `var(--accento)`...) e ogni carattere da `--titoli` o `--corpo`; un componente non scrive mai un colore letterale né il nome di un tema.
- **Do** tenere ogni superficie su `fondo` e salire di livello solo con `fondo-2` e `fondo-3`.
- **Do** usare l'accento per una cosa viva per volta: la fase corrente, il comando principale, la prova da aprire. Testo sopra l'accento sempre `su-accento`.
- **Do** dare ai titoli il carattere dei titoli entro due righe e a tutto il resto il carattere del corpo, con cifre tabulari.
- **Do** costruire le prove come schede d'inventario: raggio 2px, filetto 1px, testata con numero di catalogo, nota che dice perché è sigillata.
- **Do** garantire obiettivi di tocco di almeno 44px (bottoni e campi 48px, tasti del PIN 64px).
- **Do** muovere le cose con `--curva-cassetto` (cubic-bezier(0.32, 0.72, 0, 1)) per ciò che entra e `--curva-uscita` (cubic-bezier(0.23, 1, 0.32, 1)) per risposte e pressioni, e ridurre tutto con "riduci movimento".
- **Do** dimensionare i testi del proiettore in vh perché si leggano dal fondo della sala (corpo almeno 22px, titoli fino a 190px).
- **Do** aggiungere un tema come una nuova voce del catalogo che dà un valore a tutti i ruoli, due caratteri self-hosted, sei figure e le frasi pronte, più, se serve, un disegno per il disco e uno strato d'atmosfera; e una nuova sezione qui sotto.

### Don't:
- **Don't** usare gradienti, aloni o ombre su elementi fermi: il disco è piatto e la profondità è tonale.
- **Don't** introdurre un terzo carattere o un carattere che gocciola, sbava o imita la scrittura a mano.
- **Don't** mettere etichette o occhielli sopra i titoli; il maiuscolo spaziato vive solo nell'intestazione stampata del documento e nel timbro.
- **Don't** usare il colore d'allarme per altro che errori, e non usare la ceralacca per l'interfaccia.
- **Don't** spargere clip art del tema nell'interfaccia e non usare emoji: le icone sono SVG a tratto 1.75 in `currentColor`; le uniche figure illustrate sono le sei delle nuvolette e il disegno nel disco.
- **Don't** arrotondare le prove a pillola né squadrare i bottoni a cartoncino.
- **Don't** cambiare struttura, componenti o comandi da un tema all'altro: il tema veste, non ridisegna.
- **Don't** usare trattini lunghi nei testi.

## Tema: Halloween classico

Il predefinito, quello della prima serata (id `halloween`). Il canone di Halloween eseguito alla lettera e senza ironia, al livello di finitura delle locandine horror e delle schede indizi dei videogiochi, non della festa di paese. Il mondo è una notte viola-nera piena su cui sorge una sola luna arancio zucca piatta. Schermate di riferimento in `.impeccable/review/`.

### Colori
Una notte viola-nera in tre livelli, un osso caldo per leggere, una zucca sola per accendere, ceralacca e sangue con compiti stretti. Valori nelle chiavi senza prefisso del frontmatter.
- **Notte**, **Notte velata**, **Notte fonda viola** (`fondo`, `fondo-2`, `fondo-3`) e un **filetto** viola spento.
- **Osso** (`testo-1`, e `carta` per il documento) e **Osso spento** (`testo-2`), un grigio lilla.
- **Zucca di luna** (`accento` e `disco`): la luna e l'accento sono la stessa zucca. **Zucca accesa** (`accento-chiaro`) per l'hover. Sopra la zucca, sempre notte (`su-accento`, `su-disco`, `inchiostro`).
- **Ceralacca** rosso cupo (`sigillo`), **riflesso di cera** (`sigillo-luce`), falce rosa cipria (`sigillo-segno`).
- **Sangue** (`allarme`) per gli errori.
- **Cratere** (`decoro`), un arancio appena più scuro della zucca.

### Caratteri
Grenze Gotisch 500/700 (con Georgia, serif) per i titoli; Barlow 400/500/600/700 (con system-ui, sans-serif) per il corpo. Un gotico spezzato ma leggibile che dà voce alla locandina e ai nomi delle cose, accanto a una sans da interfaccia asciutta e un po' condensata che porta istruzioni, numeri e comandi senza esitazione.

### Disco del proiettore
La luna: disco piatto zucca con quattro crateri irregolari in `decoro` e la silhouette di un ramo con due pipistrelli in `fondo`. Nella rivelazione i crateri si spengono; il ramo si spegne anche nel conto alla rovescia e nell'avanzamento. Nessuno strato d'atmosfera.

### Nuvolette
Figure: fantasma, pipistrello, ragno, zucca, occhi, candela. Frasi pronte di paura domestica ("Non voltatevi.").

### Named Rules
**The Luna Sola Rule.** In Halloween la zucca è insieme la luna e l'accento, l'unico colore saturo. Se una seconda cosa vuole attenzione, prende l'osso, non un nuovo colore.

**The Sangue Rule.** Il rosso sangue è l'allarme di Halloween: errore, e solo errore. Mai decorazione, mai Halloween di contorno.

**The Cera Rule.** La ceralacca di Halloween è rosso cupo e vive sugli oggetti del fascicolo. Non diventa colore di bottoni, bordi o testi d'interfaccia.

## Tema: Noir anni '40

Un poliziesco in bianco e nero proiettato in sala in una notte di pioggia, con le prove come rapporti battuti a macchina (id `noir`). Struttura e comandi sono quelli di Halloween; cambiano colori, caratteri, disco, atmosfera e nuvolette. Schermate di riferimento in `.impeccable/review/noir/`.

### Colori
Nero pellicola neutro in tre grigi, testo argento, un solo rossetto piatto, giallo nastro della polizia per gli errori. Valori nelle chiavi `noir-` del frontmatter.
- **Nero pellicola**, **Nero velato**, **Grigio fumo** (`noir-fondo`, `noir-fondo-2`, `noir-fondo-3`): grigi neutri, senza tinta. Il filetto (`noir-filetto`) è un grigio canna di fucile.
- **Argento** (`noir-testo-1`) e **Argento spento** (`noir-testo-2`).
- **Rossetto** (`noir-accento`): l'unico colore saturo, per ciò che è vivo. Sopra il rossetto il testo è nero pellicola (`noir-su-accento`). **Rossetto acceso** (`noir-accento-chiaro`) per l'hover.
- **Luna d'argento** (`noir-disco`), con il nero sopra (`noir-su-disco`): il disco è argento, non rossetto. Anche il colore proposto per una squadra nuova viene da qui.
- **Nastro della polizia** (`noir-allarme`): giallo, solo per gli errori.
- **Ceralacca scura** (`noir-sigillo`, `noir-sigillo-luce`, `noir-sigillo-segno`), più cupa di quella di Halloween.
- **Carta da rapporto** (`noir-carta`), bianco sporco, con **inchiostro da macchina** (`noir-inchiostro`) e un filetto carta grigio (`noir-carta-filetto`).
- `noir-decoro` coincide con il grigio fumo: il disegno nel disco del Noir è dipinto in `fondo`.

### Caratteri
League Gothic (con Arial Narrow, sans-serif) per i titoli: titoli da locandina, alti e stretti. Ha un solo peso, dichiarato come intervallo 100-900 perché i titoli a 700 usino il disegno vero. Courier Prime (con Courier New, monospace) per tutto il resto: il testo a macchina dei rapporti. Due pesi, 400 dichiarato come 100-599 e 700 come 600-900. Entrambi in `public/fonti/`.

### Disco del proiettore
La luna d'argento vista attraverso una veneziana: lamelle in `fondo` appena inclinate (-6 gradi), un po' più larghe verso il basso, e il cordino verticale. La veneziana si spegne nel conto alla rovescia, nell'avanzamento e nella rivelazione.

### Atmosfera
Pioggia sottile in diagonale (14 gradi), due piani a velocità diverse (2.6s e 5.2s per mattonella, opacità 0.26 e 0.18), tratti in `testo-1`. Lo strato si fonde per differenza (`mix-blend-mode: difference`): chiaro sul nero, scuro sulla luna, così la pioggia si vede anche davanti al disco. Si ferma con "riduci movimento".

### Nuvolette
Figure: cappello, sigaretta, macchina da scrivere, bicchiere, lampione, impronta. La brace della sigaretta è l'unico punto di rossetto nelle figure. Frasi pronte da romanzo poliziesco ("La pioggia lava tutto, tranne la colpa.").

### Named Rules
**The Rossetto Rule.** Il rossetto è l'unico colore saturo del Noir e segna solo cose vive: fase corrente, comando principale, prova da aprire. Sopra, sempre testo nero pellicola.

**The Nastro Giallo Rule.** Il giallo nastro della polizia significa errore, e solo errore. Non è un secondo accento e non decora.

**The Pioggia in Sala Rule.** La pioggia cade solo sul proiettore, mai sul telefono né in regia, e mai sulle scene a schermo nero, con immagine o con video.

**The Argento Non Accento Rule.** La luna è argento: il disco del Noir non prende mai il rossetto, così l'accento resta raro anche quando la luna occupa mezzo schermo.
