# Registro delle versioni

## 2.3.0

### Prima della serata
- **Controllo del caso** (Strumenti, e in diretta finché la serata è in preparazione): errori e avvisi prima che succedano. Prove che per una squadra non si aprono mai (catene circolari, fasi che non esistono, due codici nello stesso modo), soluzione incompleta, colpevole che non è tra i personaggi, file mancanti, scene legate a fasi inesistenti, più scene automatiche nella stessa fase, nessuna scena di rivelazione, nessun proiettore.
- **Prova generale** (in diretta): il telefono di una squadra nascosta in un'altra scheda, per provare codici, catene e aiuti come li vedranno gli invitati. I codici funzionano anche prima dell'inizio; la prova generale non compare su proiettore, elenchi, sorteggio, biglietti, accuse e resoconto, e non cambia nessuna password. "Ricomincia da capo" cancella solo i suoi progressi.
- **Personaggi agli invitati**, facoltativi: in Invitati ogni persona può interpretare un personaggio. I telefoni mostrano "interpretato da", i biglietti scrivono il ruolo accanto al nome, e "Schede per chi interpreta" stampa per ognuno il personaggio con quello che sa solo lui (campo nuovo "Per chi lo interpreta", mai mandato ai telefoni). Senza assegnazioni si gioca come prima.

### Durante la serata
- **Aiuti a richiesta**: la squadra chiede un aiuto dal telefono (al massimo 3 di serie, uno alla volta, anche su una prova precisa); la regia risponde in diretta con una penalità facoltativa, tolta dal punteggio dell'accusa. Un aiuto senza risposta non si conta. Spenti di serie, si accendono in Strumenti o in diretta.
- **Suoni d'ambiente** sul proiettore, generati nel browser per ogni tema (vento, pioggia, pendolo, treno, disco, camino), con volume e un abbassamento automatico durante le scene con audio o video. Spenti di serie.
- **Tempo reale** con Ably, se `ABLY_API_KEY` è impostata: i cambi arrivano subito e il controllo della versione rallenta a ogni 10 secondi. Passa solo il numero di versione, con un token che permette di ascoltare un solo canale. Senza chiave tutto resta come nella 2.2.

### Dopo la serata
- **Resoconto** (nuova voce della regia, da mostrare o stampare): classifica con il punteggio netto, numeri squadra per squadra (prove e come si sono aperte, codici sbagliati, aiuti, tempi, accusa), chi ha aperto ogni prova e quando. Dopo la rivelazione i telefoni vedono la classifica nella pagina dell'accusa.
- Sul proiettore vince chi ha il punteggio netto più alto, penalità comprese.

## 2.2.0

### Controlli automatici
- Su GitHub, a ogni push su `main` e `develop` e a ogni pull request: controllo dei tipi del server, partita completa di prova, build del sito (`.github/workflows/controlli.yml`).

### Invitati e biglietti, rifiniture
- Invitati raggruppati per squadra, con colore e numero; vincoli scritti come frase ("deve stare divisa da", "insieme a"). I biglietti hanno una pagina propria, con il ritorno agli invitati, e credenziali più grandi e facili da copiare.

### Caso completo in un file
- "Scarica il caso" in Strumenti mette nel file anche foto, audio e video, oltre a tema, nuvolette e sfondo (formato `cena-con-delitto/2`). Il browser della regia scarica gli allegati uno alla volta, perché una risposta unica sarebbe troppo grande per una Netlify Function.
- "Carica un caso da file" ricarica prima gli allegati nella serata, poi il caso con le chiavi nuove. I file del formato 1 si caricano ancora.

### Aggiornamenti più rapidi
- Telefoni, proiettore e regia chiedono spesso solo il numero di versione della serata (`/api/versione`) e scaricano lo stato completo quando cambia: gli aggiornamenti arrivano in circa un secondo (il proiettore controlla ogni secondo, gli altri ogni secondo e mezzo), con meno carico sul database. Senza servizi esterni: una connessione aperta vera richiederebbe un servizio a parte.

## 2.1.0

### Temi
- Quattro temi nuovi, disegnati con la skill Impeccable: **Vittoriano alla Sherlock** (il primo tema chiaro: carta avorio, inchiostro, una lente sul proiettore), **Delitto in viaggio** (treno di lusso notturno: livrea blu, ottone, orologio di stazione, luci dal finestrino), **Anni '20 Gatsby** (speakeasy: nero, oro, raggiera déco, fumo lento), **Natale con delitto** (verde abete, rosso festivo, luna con i tetti innevati, neve).
- Ogni tema può ridurre i titoli del proiettore (`scalaTitoli`) quando il suo carattere è molto largo.

### Invitati e squadre
- Nuova pagina della regia, **Invitati**: elenco degli invitati (anche incollato, uno per riga), vincoli "divisa da" e "insieme a", sorteggio delle squadre bilanciato che rispetta i vincoli, spostamenti a mano.
- In Squadre e accessi ogni squadra mostra i suoi componenti.
- **Biglietti per i tavoli**, da stampare: nome della squadra, componenti, credenziali e un QR che fa entrare direttamente. Le password vengono rinnovate quando si preparano (sono salvate solo come impronta); le credenziali del QR stanno dopo il `#` dell'indirizzo e non arrivano al server.

### Nuvolette
- La regia decide anche ogni quanto compaiono e quanto restano visibili.

## 2.0.0

Più regie e più serate, temi della serata, nuvolette decise dalla regia, marchio dell'applicazione. Comprende quella che era stata pensata come 1.1 (temi e nuvolette), che non è uscita da sola.

### Marchio
- L'applicazione si chiama **Il Movente**, "Gialli da tavola": collana di gialli su una parete di locandine, a tema scuro, titoli in Limelight e testi in Source Sans 3. Veste le pagine fuori da una serata.

### Account e serate
- Amministrazione (`/admin`): crea inviti per gli account regia, li rigenera o revoca, sospende e riattiva account, manda link per una password nuova. Vede account e numeri, mai il contenuto delle serate, e non apre serate.
- `SETUP_CODE` crea il primo amministratore; gli account regia nascono dagli inviti (`/invito/<token>`), con nome utente e password scelti da chi li riceve. Link monouso, scadenza 7 giorni, nel database solo l'impronta.
- Accesso della regia da `/regia/accedi`; squadre e proiettore entrano da `/s/<indirizzo>` della loro serata, nella grafica del tema.
- Le tue serate (`/regia`): ogni serata è un volume della collana con la copertina del suo tema. Crea, apri, duplica (caso, fasi, personaggi, prove e regole, scene, tema, nuvolette, sfondo e allegati; niente squadre), archivia e riattiva, cambia l'indirizzo, elimina scrivendo il titolo.
- Serata archiviata: la regia la consulta in sola lettura, squadre e proiettore non entrano.
- Nomi utente di squadre e proiettore unici dentro la serata.

### Temi
- Tema della serata scelto in Regia, Strumenti: Halloween classico (predefinito) e Noir anni '40 (bianco, nero e pioggia, macchina da scrivere, un solo rossetto).
- Ogni tema cambia colori, caratteri, disegno nel disco del proiettore, atmosfera del proiettore, figure e frasi pronte delle nuvolette.

### Nuvolette
- Le frasi le decide la regia per ogni serata e si possono spegnere; una serata senza frasi usa quelle pronte del tema. Le frasi con i nomi degli invitati di Halloween 2026 sono passate dal codice alla serata.

### Passaggio dalla 1.0
- Automatico e senza perdite: l'account regia diventa un utente regia con la stessa password, proprietario della sua serata, che riceve un indirizzo. La regia rientra una volta; squadre e proiettore restano collegati; `/accesso` vale ancora per la serata di Halloween.

### Tecnica
- Variabili di colore per ruolo invece che per Halloween; catalogo dei temi in `src/app/temi/`.
- La regia indica la serata su cui lavora con l'intestazione `x-serata`; il server controlla che sia sua.
- Test sul passaggio da un database 1.x, sull'isolamento tra regie, sugli inviti e sul contrasto di ogni tema.

## 1.0.0, 1 novembre 2026

Prima versione, usata per la cena con delitto di Halloween 2026.

### Superfici
- **Telefono di squadra**: prove trovate e sigillate, codici con tastierino o lettere, personaggi, taccuino condiviso, accusa.
- **Proiettore**: scene in scaletta (narrazione, immagine, video, audio, conto alla rovescia, squadre a confronto, annuncio, rivelazione, attesa), fasi, schermo nero, foto di sfondo trasparente.
- **Regia**: diretta, scene, caso e fasi, personaggi, prove e codici, squadre e accessi, accuse e verdetto, strumenti.

### Accessi
- Un account per ruolo: la regia nasce con il codice di primo avvio, squadre e proiettore li crea la regia.
- Sessioni firmate, revocabili rigenerando la password; blocco dopo troppi accessi sbagliati.

### Prove
- Regole di apertura componibili: codice, dopo un'altra prova, da una fase; più modi alternativi, anche solo per una squadra.
- 5 codici sbagliati in 5 minuti fermano la squadra per 2 minuti.
- Cartelle per la regia, che può rendere visibili anche alle squadre.
- Visibilità prima dell'apertura: nascosta (predefinita), solo sigillo, titolo leggibile.
- Una prova nascosta con "dopo una prova" e codice compare sigillata quando manca solo il codice.
- Consegna a mano: le prove senza codice si aprono; quelle con codice compaiono sigillate con il titolo, insieme a quelle che vengono dopo, ognuna con le sue condizioni.

### Rivelazione
- "Rivela la soluzione" in diretta e in Accuse e verdetto, con punti automatici (colpevole 2, movente 1, arma 1) correggibili a mano.
- "Nascondi di nuovo la soluzione".

### Atmosfera
- Tema Halloween classico (vedi DESIGN.md).
- Nuvolette con frasi e figure animate su telefoni e proiettore. Le frasi con i nomi degli invitati sono scritte in `src/app/squadra/sussurri.ts`: vanno cambiate per un'altra serata.

### Tecnica
- Allegati serviti a pezzi (Range), così audio e video si ascoltano interi anche su iPhone.
- Foto più grandi di 4 MB rimpicciolite prima del caricamento.
- Schema del database applicato da solo alla prima richiesta, con migrazioni che non toccano i dati esistenti.
