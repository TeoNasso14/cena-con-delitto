# Come è nato il progetto

Riassunto della conversazione con Claude che ha portato alla versione 1.0.0 (23 ottobre - 1 novembre 2026). Serve a riprendere il lavoro senza perdere decisioni e motivi. Non contiene nulla del caso giocato: trama, soluzione e codici esistono solo nel database del sito.

## Punto di partenza
- Teo doveva preparare il sito per una cena con delitto di Halloween. Il caso l'ha scritto un'altra persona (in un PowerPoint), che fa anche regia e conduzione davanti al proiettore.
- **Teo gioca**: non deve vedere trama, soluzione, codici o contenuti delle prove. Per questo tutto il contenuto lo inserisce la regia dal sito, e nel codice c'è solo un caso dimostrativo finto.
- Serata in un locale o ristorante, 2-4 squadre, 10-20 persone. Prove che si aprono con PIN: nascosti in sala, detti dagli attori, a catena, rilasciati dalla regia a fasi.
- Tre superfici: telefono di squadra, proiettore (il filo narrativo principale), regia.

## Decisioni di fondo
- **Design** con la skill Impeccable (PRODUCT.md, DESIGN.md, `.impeccable/`), direzione "Halloween classico": nero notte, arancio zucca, osso; Grenze Gotisch per i titoli. Regole di stile in DESIGN.md e CLAUDE.md.
- **Stack**: Angular 21 (standalone, signals, zoneless), Netlify Functions in un'unica funzione `/api/*`, Postgres esterno su Neon (piano gratuito; Netlify Database non era disponibile sul piano Free), Netlify Blobs per gli allegati.
- **Accessi**: un account per ruolo. La regia nasce con un codice di primo avvio (`SETUP_CODE`), squadre e proiettore li crea la regia, che vede le password una volta e può rigenerarle.
- **Motore delle prove**: regole componibili (codice, dopo una prova, da una fase) raggruppate in "modi" alternativi, anche per una sola squadra; propagazione a catena; limite ai codici sbagliati.
- **Aggiornamenti** con polling (proiettore 2 s, telefoni e regia 4 s): semplice e sufficiente per una serata.

## Problemi incontrati e soluzioni
- `ng build` restava appeso a fine compilazione (processo esbuild figlio) e Netlify andava in timeout: wrapper `scripts/build.mjs`.
- Sul piano Free di Netlify le variabili d'ambiente "secret" o con ambito solo Functions non si salvavano: impostate non segrete con ambito "all".
- Le immagini caricate "non si vedevano": il proiettore non era aperto e l'anteprima della regia non mostrava i media. Aggiunti anteprima reale e link "Apri il proiettore".
- Audio che si fermavano dopo circa un minuto su iPhone: il server non rispondeva alle richieste a pezzi (Range). Ora risponde con 206.
- Il tasto "Rivela la soluzione" in diretta compariva solo con la scena di rivelazione in onda: ora c'è sempre e porta da solo il proiettore alla rivelazione. Aggiunto "Nascondi di nuovo la soluzione".

## Richieste dell'organizzatrice durante la preparazione
1. Cartelle per organizzare le prove, senza perdere quelle esistenti.
2. Cartelle visibili anche alle squadre, a scelta; titolo leggibile anche da sigillata.
3. Le squadre vedono solo le prove scelte dalla regia: tre stati prima dell'apertura (nascosta, solo sigillo, titolo). Poi: tutte nascoste di default.
4. Prove "dopo un'altra prova + codice": compaiono sigillate quando manca solo il codice; il codice resta necessario.
5. Consegna a mano di una prova con codice: compare con il titolo e si apre col codice; a catena compaiono, sempre con il titolo, quelle che vengono dopo, ognuna con le sue condizioni. Le prove legate a una fase futura non entrano nella catena finché la fase non inizia.

## Atmosfera e personalizzazioni della serata
- Nuvolette con frasi e piccole figure animate (fantasma, pipistrello, ragno, zucca, occhi, candela) su telefoni e proiettore; frequenza attuale: prima dopo 10-20 s, poi ogni 20-45 s, visibili 10 s. Si provano con `?sussurri=subito`.
- Le frasi includono prese in giro con i nomi degli invitati di Halloween 2026: sono scritte in `src/app/squadra/sussurri.ts` e vanno tolte o cambiate per un'altra serata (vedi prossimi rilasci, punto 3).
- Firma in fondo alle pagine: "Developed by Claude · Architect by Teo" (non sul proiettore).
- Foto di sfondo trasparente sul proiettore (Scene del proiettore → Sfondo del proiettore), con cursore della trasparenza.
- Per una sera il proiettore ha mostrato come vincitrice la squadra "Rainbow" a prescindere: era uno scherzo, rimosso il giorno dopo.

## Stato al rilascio 1.0.0
- Sito: https://cena-con-delitto.netlify.app (sito Netlify `cena-con-delitto`).
- Repository: https://github.com/TeoNasso14/cena-con-delitto, ramo `main`.
- Database Neon creato come "claimable": va reclamato su un account Neon per non rischiare che venga cancellato.
- Manuale della regia scritto come documento a parte (Claude Docs, "Manuale della regia"): non ancora aggiornato con cartelle, visibilità, consegna a catena, sfondo e nuvolette.

## Prossimi rilasci concordati
1. **Tema della serata** selezionabile dalla regia; Halloween classico resta il predefinito. Idee: Noir anni '40, Vittoriano alla Sherlock, Delitto in viaggio (treno/nave), Anni '20 Gatsby, Natale con delitto. Ogni tema: colori, caratteri, decorazione del proiettore, figure e frasi delle nuvolette, tono dei testi.
2. **Più serate per account**: crea, duplica, archivia, scegli quella attiva; squadre e proiettore legati alla loro serata. Oggi il database separa già tutto per `serata_id`, ma c'è un solo account regia e una sola serata.
3. **Nuvolette gestite dalla regia**: invitati, frasi, frequenza, durata, on/off; frasi pronte per ogni tema.
4. **Invitati e squadre**: lista invitati, sorteggio con vincoli ("questi divisi"), biglietti con QR per entrare.
5. **Caso completo in un file**, allegati compresi.
6. **Tempo reale** al posto del polling, per serate grandi.

# Dalla 1.0 alla 2.0 (1 novembre 2026)

Lavoro fatto sul ramo `develop`, senza pubblicare la 1.1 da sola (scelta di Teo). I piani con il dettaglio dei passi sono in docs/PIANO-1.1.md e docs/PIANO-2.0.md.

## Temi della serata (la 1.1)
- Il tema è una proprietà della serata, scelto dalla regia. Per renderlo possibile le variabili di colore hanno preso nomi per ruolo (fondo, accento, testo, sigillo, allarme, carta, disco) al posto dei nomi di Halloween; Halloween è rimasto identico, verificato con screenshot uguali byte per byte.
- Ogni tema cambia anche i due caratteri, il disegno nel disco del proiettore, uno strato d'atmosfera, le sei figure e le frasi pronte delle nuvolette. Un lessico di testi per tema non è servito: le parole dell'interfaccia sono già da indagine.
- I temi si disegnano con la skill Impeccable, installata a livello utente (`~/.claude/skills/impeccable`) con la copia manuale dal repository ufficiale: i suoi agenti di revisione e documentazione non si installano così, e al loro posto si usano agenti generici con le istruzioni di riserva della skill.
- Noir anni '40, chiesto da Teo come "bianco, nero e pioggia, macchina da scrivere": League Gothic e Courier Prime, un solo rossetto, errori in giallo nastro, luna argento dietro una veneziana, pioggia solo sul proiettore. Revisione finale chiusa con ship dopo due giri.

## Nuvolette dalla regia
- Teo ha chiesto di togliere le frasi dal codice subito, anticipando la 2.1. Le 115 frasi di Halloween 2026 (con i nomi degli invitati) sono passate nella serata con una migrazione; le frasi generiche sono diventate le frasi pronte del tema.

## Più regie, più serate (la 2.0)
- Decisione chiave: l'account regia della 1.0 è dell'organizzatrice e diventa una regia normale; l'amministrazione è Teo, con un account separato creato con `SETUP_CODE`, che non apre serate (regola "Teo gioca").
- La regia indica la serata su cui lavora a ogni richiesta (intestazione `x-serata`), così i gestori della 1.0 sono rimasti quasi intatti e due schede possono stare su due serate.
- Duplicare una serata copia anche gli allegati con chiavi nuove; eliminarla chiede il titolo scritto per intero.
- Squadre e proiettore entrano da `/s/<slug>` nel tema della serata; `/accesso` resta per la serata di Halloween.

## Marchio dell'applicazione
- Teo non voleva Halloween fuori dalle serate: serviva un marchio. Due mani di direzioni con Impeccable (tra cui gioco da tavolo, tabellone delle partenze, tableau dei tavoli, mappa della metropolitana, parete delle locandine), poi la scelta di Teo: un mix tra la collana gialla da edicola e la parete delle locandine, a tema scuro.
- Nome scelto tra tre proposte: Il Movente, con il sottotitolo "Gialli da tavola". Carattere dei titoli cercato in tre giri (più particolare, poi gotico, poi da detective): Limelight, la scritta sulla porta a vetri dell'agenzia. Testi in Source Sans 3.
- Limelight in piccolo fa leggere la G come una C: il marchio lo usa solo in grande. Per il futuro tema Gatsby servirà un altro carattere.

## Dopo la 2.0.0 (stesso giorno)
- **Quattro temi** con Impeccable, dopo un'intervista di una domanda per tema: Vittoriano chiaro (primo tema chiaro), treno di lusso notturno, speakeasy, Natale caldo. La revisione ha tolto la pipa e la piuma (rifiutate dai contratti), reso irregolari fumo e neve, spento le luci del treno sul quadrante; per Cinzel, largo e maiuscolo, i temi possono ridurre i titoli del proiettore.
- **2.1**: invitati con vincoli e sorteggio bilanciato; biglietti per tavolo con QR. Le password non si possono rileggere, quindi i biglietti le rinnovano; le credenziali del QR stanno dopo il `#` e non arrivano al server.
- **2.2**: caso completo con allegati, assemblato dal browser per il limite di grandezza delle risposte delle Netlify Functions. Il tempo reale vero richiederebbe un servizio esterno: al suo posto un controllo leggero della versione, che porta gli aggiornamenti a circa un secondo.

## Stato alla 2.0.0
- Tutto su `develop`, non ancora unito in `main` né pubblicato. Al passaggio l'organizzatrice rientra una volta con le sue credenziali, e Teo crea l'amministrazione da `/avvio`.
- Restano: Vittoriano, Delitto in viaggio, Gatsby, Natale; invitati e sorteggio (2.1); caso completo con allegati (2.2); tempo reale; il manuale della regia su Claude Docs da aggiornare.
