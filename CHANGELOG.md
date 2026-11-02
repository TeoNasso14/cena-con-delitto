# Registro delle versioni

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
