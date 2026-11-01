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
