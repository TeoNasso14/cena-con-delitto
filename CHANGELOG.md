# Registro delle versioni

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
