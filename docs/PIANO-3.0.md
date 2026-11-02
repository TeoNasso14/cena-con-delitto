# Piano della 3.0

Avviato il 2 novembre 2026 su `develop`, dopo la pubblicazione della 2.3. Prima parte: l'amministrazione. Le altre funzioni della 3.0 sono ancora da decidere con Teo.

## Amministrazione: più numeri, mai contenuti
La regola resta quella di sempre: Teo è l'amministrazione e gioca alle serate. Da `/api/admin` escono solo account, numeri, stati e date. Mai titoli, indirizzi (`slug`, che nasce dal titolo), temi, trame, prove, squadre per nome, invitati.

### 1. Numeri per account
- Serate in preparazione, in corso o in pausa, chiuse, archiviate; squadre (senza la prova generale); data dell'ultima serata giocata (la prima fase avviata più recente); spazio occupato dagli allegati delle sue serate.

### 2. Stato del sito
- Versione dell'applicazione (`VERSIONE` in `server/base.ts`, un test la confronta con `package.json`), ultima migrazione del database, tempo reale acceso o spento, serate e squadre in tutto, allegati (file, spazio, file ancora da misurare).
- Spazio degli allegati: dalla 3.0 ogni file caricato o copiato si registra nella tabella `allegato` (chiave, serata, byte, tipo). Netlify Blobs non dà la grandezza senza scaricare il file, quindi i file di prima si misurano con "Misura i file di prima": dieci alla volta, finché non ne restano.

### 3. Registro dell'amministrazione
- Tabella `registro_admin`: chi, cosa, su chi, quando. Si scrivono inviti creati, rigenerati e revocati, account sospesi e riattivati, link per la password, account eliminati, serate passate a un'altra regia, l'amministrazione creata, gli inviti accettati. Nomi utente copiati nel registro, così restano leggibili anche dopo l'eliminazione.

### 4. Gestione account
- **Elimina**: solo un account regia senza serate (anche archiviate), mai l'amministrazione né sé stessi. Gli inviti per quell'account spariscono con lui.
- **Passa le serate a un'altra regia**: tutte le serate di un account passano a un altro account regia, senza che l'amministrazione le veda. Dopo, l'account vuoto si può eliminare.

## Test
- Migrazione da un database 2.3 in uso.
- Nessun titolo, indirizzo o tema nelle risposte di `/api/admin`, anche con serate piene.
- Numeri per account e del sito, misura dei file di prima a gruppi, registro, eliminazione con i suoi rifiuti, passaggio delle serate.
