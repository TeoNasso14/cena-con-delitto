---
name: La notte di Villa Corvina
description: Cena con delitto di Halloween in tre superfici sincronizzate, proiettore, telefono di squadra e regia.
colors:
  notte: "#0e0b14"
  notte-2: "#17121f"
  notte-3: "#231b2e"
  filetto: "#3a2f48"
  osso: "#eee6d6"
  osso-2: "#b8aec4"
  zucca: "#ff7a1a"
  zucca-chiara: "#ff9a4d"
  cera: "#8e1b24"
  cera-luce: "#b8323c"
  sangue: "#ff5a5f"
  cratere: "#f47318"
  carta-filetto: "#c9bfae"
typography:
  display:
    fontFamily: "Grenze Gotisch, serif"
    fontSize: "clamp(64px, 16vh, 190px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0"
  headline:
    fontFamily: "Grenze Gotisch, serif"
    fontSize: "clamp(48px, 10vh, 120px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0"
  title:
    fontFamily: "Grenze Gotisch, serif"
    fontSize: "clamp(38px, 11vw, 48px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0"
  title-sm:
    fontFamily: "Grenze Gotisch, serif"
    fontSize: "30px"
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
  body-sm:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
  title-xs:
    fontFamily: "Grenze Gotisch, serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  body-md:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
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
rounded:
  netto: "2px"
  fuoco: "4px"
  casella: "12px"
  campo: "10px"
  scheda: "14px"
  tasto: "16px"
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
    textColor: "{colors.osso}"
    typography: "{typography.body}"
    rounded: "{rounded.pillola}"
    padding: "0 22px"
    height: "48px"
  bottone-hover:
    textColor: "{colors.osso}"
  bottone-pieno:
    backgroundColor: "{colors.zucca}"
    textColor: "{colors.notte}"
    rounded: "{rounded.pillola}"
    padding: "0 22px"
    height: "48px"
  bottone-pieno-hover:
    backgroundColor: "{colors.zucca-chiara}"
  bottone-disabilitato:
    backgroundColor: "{colors.notte-3}"
    textColor: "{colors.osso-2}"
  campo:
    backgroundColor: "{colors.notte}"
    textColor: "{colors.osso}"
    rounded: "{rounded.campo}"
    padding: "10px 14px"
    height: "48px"
  reperto-aperto:
    backgroundColor: "{colors.notte-2}"
    textColor: "{colors.osso}"
    rounded: "{rounded.netto}"
    padding: "0 0 14px"
  reperto-sigillato:
    backgroundColor: "{colors.notte}"
    textColor: "{colors.osso}"
    rounded: "{rounded.netto}"
    padding: "0 0 14px"
  documento:
    backgroundColor: "{colors.osso}"
    textColor: "{colors.notte}"
    rounded: "{rounded.netto}"
    padding: "0 18px 22px"
  tasto:
    backgroundColor: "{colors.notte-3}"
    textColor: "{colors.osso}"
    rounded: "{rounded.tasto}"
    height: "64px"
  tasto-apri:
    backgroundColor: "{colors.zucca}"
    textColor: "{colors.notte}"
    rounded: "{rounded.tasto}"
    height: "64px"
  scheda-regia:
    backgroundColor: "{colors.notte-2}"
    textColor: "{colors.osso}"
    rounded: "{rounded.scheda}"
    padding: "14px 16px"
  foglio:
    backgroundColor: "{colors.notte-2}"
    textColor: "{colors.osso}"
    rounded: "{rounded.foglio}"
    padding: "10px 24px 24px"
  etichetta-nuova:
    backgroundColor: "{colors.zucca}"
    textColor: "{colors.notte}"
    typography: "{typography.label}"
    rounded: "{rounded.netto}"
    padding: "1px 7px"
---

# Design System: La notte di Villa Corvina

## Overview

**Creative North Star: "La sala di proiezione e il fascicolo"**

La serata è un film horror classico proiettato in sala, e le prove sono i file di un videogioco investigativo. Il mondo è una notte viola-nera piena, su cui sorge una sola luna arancio zucca piatta: è l'unica fonte di colore che urla. Il testo è color osso, la ceralacca è rosso cupo, il sangue compare solo quando qualcosa va storto. Il canone di Halloween eseguito alla lettera e senza ironia, al livello di finitura delle locandine horror e delle schede indizi dei videogiochi, non della festa di paese.

Le tre superfici parlano la stessa lingua con densità diverse. Il proiettore è scena pura: titoli gotici enormi, testo grande leggibile dal fondo della sala, la luna come scenografia che cambia posto e misura da scena a scena. Il telefono e la regia sono strumenti: ereditano la notte, l'osso, la zucca e il gotico per i nomi, ma con misura, con obiettivi di tocco ampi e una gerarchia che si legge al buio con un'occhiata.

La profondità non viene dalle ombre ma dalla notte a strati e dai filetti sottili. La forma distingue gli oggetti del mondo (schede prova, documenti, timbri: angoli quasi netti, carta e inchiostro) dai comandi da toccare (pillole e tasti morbidi). La firma del sistema è il sigillo di ceralacca: si spacca in due quando il codice è giusto, trema una volta quando è sbagliato.

**Key Characteristics:**
- Fondo notte pieno (`notte`), mai bianco, mai gradienti.
- Un solo colore saturo, la zucca, per ciò che è vivo o in corso: luna, fase corrente, comando principale, prova nuova.
- Gotico leggibile solo per i nomi (titoli, nomi di scene, intestazioni di sezione); Barlow per tutto il resto.
- Nessuna ombra: livelli tonali e filetti da 1px.
- Oggetti del mondo ad angoli netti (2px), comandi arrotondati.
- Movimento a cassetto e uscita morbida, sempre ridotto con "riduci movimento".

## Colors

Una notte viola-nera in tre livelli, un osso caldo per leggere, una zucca sola per accendere, ceralacca e sangue con compiti stretti.

### Primary
- **Zucca di luna** (`zucca`): il colore che urla. La luna del proiettore, la fase corrente nella fila delle fasi, le barre di avanzamento, il bottone pieno, il tasto Apri, lo stemma della squadra, l'etichetta "Nuova", il bordo delle prove sigillate che si possono aprire, il fuoco da tastiera, la selezione del testo e il cursore. Il testo sopra la zucca è sempre `notte`.
- **Zucca accesa** (`zucca-chiara`): solo lo stato hover dei comandi zucca e dei link. Non è un secondo accento.

### Secondary
- **Ceralacca** (`cera`): il corpo del sigillo e l'inchiostro del timbro "AGLI ATTI" sul documento. Appartiene agli oggetti, non all'interfaccia.
- **Riflesso di cera** (`cera-luce`): l'anello in rilievo dentro il sigillo. Oggi vive come colore letterale nel simbolo SVG del sigillo.

### Tertiary
- **Sangue** (`sangue`): solo errori e allarmi. Codice sbagliato (caselle e messaggio), squadra ferma in regia, tentativo errato nel registro.

### Neutral
- **Notte** (`notte`): fondo di tutte le superfici, barre fisse, prove sigillate, campi di testo, il testo sopra la zucca e sopra il documento, la silhouette del ramo sulla luna.
- **Notte velata** (`notte-2`): primo livello rialzato. Foglio del sigillo, prove aperte, annunci della regia, schede e moduli della regia, voce di menu corrente.
- **Notte fonda viola** (`notte-3`): secondo livello. Tasti del tastierino, binario delle barre e delle tacche, divisori delle barre fisse e del registro, comandi disabilitati, hover delle prove.
- **Filetto** (`filetto`): bordi da 1px delle prove, dei bottoni a contorno e dei campi, maniglia del foglio, barra di scorrimento.
- **Osso** (`osso`): testo principale e titoli. Fondo carta del documento rivelato.
- **Osso spento** (`osso-2`): testo secondario, metadati, orari, fasi non correnti, voci di navigazione a riposo, bordo delle prove aperte. Su `notte` resta abbondantemente sopra 4.5:1.

### Named Rules
**The Luna Sola Rule.** La zucca è l'unico colore saturo dell'interfaccia. Se una seconda cosa vuole attenzione, prende l'osso, non un nuovo colore.

**The Sangue Rule.** Il rosso sangue significa errore, e solo errore. Mai decorazione, mai Halloween di contorno.

**The Cera Rule.** La ceralacca vive sugli oggetti del fascicolo (sigillo, timbro). Non diventa colore di bottoni, bordi o testi d'interfaccia.

## Typography

**Display Font:** Grenze Gotisch 500/700 (con serif), self-hosted in `prototipo/fonti/`
**Body Font:** Barlow 400/500/600/700 (con system-ui, sans-serif), self-hosted

**Character:** Un gotico spezzato ma leggibile che dà voce alla locandina e ai nomi delle cose, accanto a una sans da interfaccia asciutta e un po' condensata che porta istruzioni, numeri e comandi senza esitazione.

### Hierarchy
- **Display** (Grenze Gotisch 700, clamp(64px, 16vh, 190px), 0.95): titolo della scena sul proiettore, su due righe al massimo.
- **Headline** (Grenze Gotisch 700, clamp(48px, 10vh, 120px), 0.95): titoli delle scene di avanzamento e rivelazione sul proiettore.
- **Title** (Grenze Gotisch 700, clamp(38px, 11vw, 48px), 1): titolo del caso sul telefono. In regia il titolo di fase usa clamp(34px, 4vw, 46px).
- **Title piccolo** (Grenze Gotisch 700, 24-34px, 1.05): titoli di sezione ("Le prove", blocchi della regia), titolo del foglio del sigillo, tipo di prova sul documento (28px).
- **Body sala** (Barlow 400, clamp(22px, 3.6vh, 44px), 1.38): testo della scena sul proiettore, entro 30ch.
- **Body** (Barlow 400, 17px base, 16px nei paragrafi del telefono, 1.5): testo corrente, entro 60ch. Cifre tabulari ovunque.
- **Body piccolo** (Barlow 400-600, 14-15px, 1.3-1.4): metadati, registro, stato delle squadre, voci della barra a schede (13px).
- **Label** (Barlow 600-700, 13px, 0.04em): numero di catalogo della prova ("N. 3") e intestazione del documento. Il maiuscolo compare solo nell'intestazione stampata del fascicolo e nel timbro (0.08em).
- **Orologio** (Barlow 700, 20vh, 1, -0.02em): conto alla rovescia sul proiettore, in `notte` sopra la luna.
- **Cifre del codice** (Barlow 600, 28-30px): tasti e caselle del PIN. Il codice rivelato sul documento usa 700, 18px, 0.08em.

### Named Rules
**The Due Caratteri Rule.** Grenze Gotisch e Barlow, nessun terzo carattere, nessun carattere di sistema per i titoli.

**The Gotico per i Nomi Rule.** Il gotico nomina (scene, casi, sezioni, oggetti). Non porta mai frasi lunghe, numeri, orari, bottoni o etichette; quelli sono Barlow.

**The Due Righe Rule.** Ogni titolo sta entro due righe, con `text-wrap: balance`. Se non ci sta, si accorcia il titolo, non il corpo.

## Layout

Il proiettore è una griglia a tre righe a tutto schermo (testata, scena, fila delle fasi) con margini in unità di viewport (4.2vh 5vw 4vh). La luna è posizionata in assoluto: enorme e decentrata a destra che taglia il bordo nella narrazione, centrata dietro l'orologio nel conto alla rovescia, piccola in basso a destra nell'avanzamento, svuotata a anello nella rivelazione. Il testo resta a sinistra della luna (60vw al massimo) e le scene si alternano in dissolvenza, mai scorrendo.

Il telefono è una colonna unica di 480px al massimo con margine laterale di 20px, testata e barra a schede fisse, griglia delle prove a due colonne con 12px di spazio. Le sezioni si separano con aria (24-40px), non con linee. Il foglio del sigillo sale dal basso fino al 94dvh e rispetta le aree sicure.

La regia è un menu laterale da 260px più un centro flessibile; sotto 900px il menu passa sopra e il centro scorre in colonne che vanno a capo (380px minimo ciascuna). I comandi si dispongono in griglia auto-fit da 150px e diventano una colonna sotto 480px.

Ritmo degli spazi: 4px per le tacche, 10px tra comandi, 14px dentro le schede, 20px di margine sul telefono, 32px tra blocchi, 40px tra sezioni del telefono. Ogni obiettivo di tocco misura almeno 44px; bottoni e campi 48px, tasti del PIN 64px, voci della barra a schede 60px.

## Elevation & Depth

Il sistema è piatto. Nessuna `box-shadow` in nessuna superficie. La profondità viene dalla notte a strati: `notte` come fondo, `notte-2` per ciò che sta sopra (foglio, schede, prove aperte), `notte-3` per ciò che sta sopra ancora o che si preme (tasti, binari, hover). I filetti da 1px (`filetto`, `notte-3`) separano dove il tono non basta. L'unico velo è quello dietro il foglio del sigillo, la notte stessa al 78% (`rgb(14 11 20 / 0.78)`).

### Named Rules
**The Notte a Strati Rule.** Si sale di livello cambiando tono, non aggiungendo ombra. Tre notti bastano; una quarta non serve.

**The Niente Ombre Rule.** Nessun elemento fermo porta un'ombra, né morbida né netta. Neppure la luna ha alone: è un disco piatto.

## Shapes

Due famiglie di forme, separate per natura. Gli oggetti del mondo (scheda della prova, documento rivelato, timbro, etichetta "Nuova") hanno angoli quasi netti (2px) e filetti sottili: sono carta, cartoncino, inchiostro. I comandi da toccare sono morbidi: bottoni a pillola (999px), tasti del PIN (16px), caselle del codice (12px), campi (10px), schede della regia (14px), foglio con angoli superiori da 22px. I cerchi sono riservati alla luna, allo stemma della squadra, ai pallini delle fasi e al bottone di chiusura.

Le forme organiche esistono solo nella scenografia: i crateri della luna con raggi irregolari, il ramo e i pipistrelli in silhouette `notte` sulla luna, il bordo frastagliato della ceralacca. Il timbro è ruotato di -9 gradi, come premuto a mano.

### Named Rules
**The Carta e Dito Rule.** Se è un oggetto del caso, angolo netto (2px). Se si tocca, angolo morbido. Una prova non diventa mai una pillola; un bottone non diventa mai un cartoncino.

## Components

### Buttons
Comandi pieni e sicuri, a pillola, pensati per un dito al buio.
- **Shape:** pillola (999px), altezza minima 48px, padding orizzontale 22px, Barlow 600 16px, icona da 22px con 10px di spazio.
- **Primary (bottone pieno):** fondo `zucca`, testo `notte`. Un solo bottone pieno per gruppo di azioni.
- **Secondary (bottone a contorno):** fondo trasparente, bordo 1px `filetto`, testo `osso`.
- **Hover / Focus:** hover solo su dispositivi con puntatore; il contorno passa a `osso-2`, il pieno passa a `zucca-chiara`. Fuoco: anello 2px `zucca` a 3px di distanza. Pressione: scala a 0.97 in 120ms con curva di uscita.
- **Disabled:** fondo e bordo `notte-3`, testo `osso-2`, cursore non consentito.

### Inputs / Fields
- **Style:** fondo `notte`, bordo 1px `filetto`, raggio 10px, altezza minima 48px, padding 10px 14px. Segnaposto in `osso-2`. Le select perdono la freccia di sistema.
- **Focus:** anello globale 2px `zucca`; cursore di testo `zucca`.

### Navigation
- **Barra a schede del telefono:** fissa in basso su `notte` con filetto superiore `notte-3`, quattro voci a colonna (icona 22px sopra, Barlow 500 13px sotto), alte 60px. A riposo `osso-2`, corrente `zucca` in 700, hover `osso`.
- **Menu della regia:** colonna da 260px, voci alte 44px con raggio 10px, `osso-2` a riposo; la voce corrente prende fondo `notte-2`, testo `osso` 600 e icona `zucca`.
- **Fila delle fasi del proiettore:** una riga di nomi in Barlow 600 con pallino; le passate barrate (2px) con pallino pieno, la corrente in `zucca`, le future in `osso-2` con pallino vuoto.

### Cards / Containers
- **Scheda della regia, annuncio, modulo:** fondo `notte-2`, raggio 14-16px, padding 14-16px, nessun bordo, nessuna ombra.
- **Anteprima "In onda":** riquadro 16:9 in `notte` con la luna in miniatura e il titolo gotico, etichetta di stato a pillola `zucca` in alto a sinistra.

### Prova d'inventario (signature)
La scheda del fascicolo. Raggio 2px, bordo 1px, altezza minima 164px, testata da 52px con icona o sigillo a sinistra e numero di catalogo a destra, separata da un filetto; titolo Barlow 600 16px e nota 14px in fondo.
- **Aperta:** fondo `notte-2`, bordo e filetto `osso-2`, icona a tratto `zucca`.
- **Sigillata:** fondo `notte`, sigillo di ceralacca da 40px, titolo "Sigillata" e una nota che dice perché e come si apre. Bordo `filetto` se ancora irraggiungibile, `zucca` se si può aprire ora con un codice.
- **Nuova:** appena aperta, l'etichetta "Nuova" (fondo `zucca`, testo `notte`, 2px) prende il posto del numero.
- **Hover:** fondo `notte-3`.

### Sigillo e tastierino (signature)
Il foglio sale dal basso con la curva a cassetto (420ms) sopra il velo. Al centro il sigillo di ceralacca da 132px, poi il titolo gotico, quattro caselle da 58 per 68px (bordo `filetto`, `zucca` quando piene, `sangue` all'errore) e un tastierino 3 per 4 di tasti da 64px su `notte-3` con raggio 16px. "Cancella" è trasparente in `osso-2`; "Apri" è `zucca` su `notte` e resta disabilitato finché le cifre non sono quattro.
- **Codice giusto:** il sigillo si spacca in due metà lungo una crepa irregolare che scivolano via ruotando (620ms, curva di uscita), poi la prova sale dal basso (520ms, curva a cassetto).
- **Codice sbagliato:** il sigillo trema una volta (380ms), caselle e messaggio in `sangue`, il conteggio dei tentativi scende.

### Documento rivelato (signature)
Il foglio di carta della prova: fondo `osso`, testo `notte`, raggio 2px, padding 0 18px 22px. Intestazione stampata in Barlow 700 13px maiuscolo con filetto `notte` da 1.5px; tipo di prova in gotico 28px; righe del testo separate da un filetto carta (`#c9bfae`); timbro "AGLI ATTI" in `cera` a contorno 2px, ruotato di -9 gradi.

### Luna (signature del proiettore)
Disco piatto `zucca` con quattro crateri irregolari di un arancio appena più scuro e la silhouette di un ramo con pipistrelli in `notte`. Cambia posizione e misura tra le scene in 900ms con curva a cassetto; nella rivelazione si svuota in anello e i crateri e il ramo si spengono.

## Do's and Don'ts

### Do:
- **Do** tenere ogni superficie su `notte` e salire di livello solo con `notte-2` e `notte-3`.
- **Do** usare la zucca (`zucca`) per una cosa viva per volta: la fase corrente, il comando principale, la prova da aprire. Testo sopra la zucca sempre `notte`.
- **Do** dare ai titoli Grenze Gotisch 700 entro due righe e a tutto il resto Barlow, con cifre tabulari.
- **Do** costruire le prove come schede d'inventario: raggio 2px, filetto 1px, testata con numero di catalogo, nota che dice perché è sigillata.
- **Do** garantire obiettivi di tocco di almeno 44px (bottoni e campi 48px, tasti del PIN 64px).
- **Do** muovere le cose con `--curva-cassetto` (cubic-bezier(0.32, 0.72, 0, 1)) per ciò che entra e `--curva-uscita` (cubic-bezier(0.23, 1, 0.32, 1)) per risposte e pressioni, e ridurre tutto con "riduci movimento".
- **Do** dimensionare i testi del proiettore in vh perché si leggano dal fondo della sala (corpo almeno 22px, titoli fino a 190px).

### Don't:
- **Don't** usare gradienti, aloni o ombre su elementi fermi: la luna è un disco piatto e la profondità è tonale.
- **Don't** introdurre un terzo carattere o un carattere che gocciola, sbava o imita la scrittura a mano.
- **Don't** mettere etichette o occhielli sopra i titoli; il maiuscolo spaziato vive solo nell'intestazione stampata del documento e nel timbro.
- **Don't** usare il rosso `sangue` per altro che errori, e non usare la ceralacca per l'interfaccia.
- **Don't** disegnare zucche, fantasmi o clip art di Halloween, e non usare emoji: le icone sono SVG a tratto 1.75 in `currentColor`.
- **Don't** arrotondare le prove a pillola né squadrare i bottoni a cartoncino.
- **Don't** usare trattini lunghi nei testi.
