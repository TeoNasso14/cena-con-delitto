# Piano della 3.0

Avviato il 2 novembre 2026 su `develop`, dopo la pubblicazione della 2.3. Scelte di Teo: amministrazione con più numeri, tre temi nuovi, modelli di caso molto personalizzabili, inviti agli ospiti, votazioni e premi. Tutto additivo. Ordine di lavoro: amministrazione (fatta), inviti, votazioni, modelli, temi.

## 1. Amministrazione: più numeri, mai contenuti (fatta)
La regola resta: Teo è l'amministrazione e gioca. Da `/api/admin` escono solo account, numeri, stati e date: mai titoli, indirizzi (`slug`, nasce dal titolo), temi, trame, prove, nomi di squadre o invitati, modelli.
- **Numeri per account**: serate in preparazione, in corso, chiuse, archiviate; squadre (senza la prova generale); ultima partita; spazio degli allegati.
- **Stato del sito**: versione (`VERSIONE` in `server/base.ts`, controllata contro `package.json`), aggiornamenti del database, tempo reale, totali, allegati. Dalla 3.0 ogni allegato si registra nella tabella `allegato` con la sua grandezza; quelli di prima si misurano dieci alla volta con "Misura i file di prima".
- **Registro** (`registro_admin`): inviti, sospensioni, link per la password, eliminazioni, serate passate, amministrazione creata, inviti accettati.
- **Gestione account**: eliminare un account regia senza serate (con il nome utente come conferma); passare tutte le serate di un account a un altro.

## 2. Inviti agli ospiti
- Nuovi campi della serata, scritti dalla regia in Invitati: data e ora, luogo della cena, dress code (con un suggerimento pronto per ogni tema), una nota.
- Ogni invitato ha un link personale, `/ospite/<token>`: una pagina con la veste del tema, il titolo della serata, data, ora, luogo, dress code e nota. Se interpreta un personaggio: la sua scheda e il copione (quello che sa solo lui), al posto della scheda stampata.
- **Conferma di presenza**: ci sarò, non ci sarò, forse, più una nota (allergie, intolleranze). La regia vede risposte e conteggi in Invitati.
- In Invitati: copia o condividi il link di ognuno, rigenera un link (quello di prima smette di valere).
- Il link apre solo quella pagina: non fa entrare nella serata come squadra. L'amministrazione non vede niente di tutto questo.

## 3. Votazioni e premi
- La regia crea i premi (per esempio Miglior attore, Costume più bello) e sceglie tra chi si vota: invitati, personaggi o squadre.
- Durante la serata apre e chiude il voto dalla diretta. **Vota ogni telefono entrato**, un voto per premio, anche se della stessa squadra (il telefono si riconosce con un identificativo casuale salvato nel browser).
- La regia vede i voti mentre arrivano; quando vuole rivela il vincitore sul proiettore, con una scena nuova "Premi".

## 4. Modelli di caso
Un modello è lo scheletro di un caso, da cui la regia crea una serata normale, modificabile in tutto dopo.
- **Colpevole a sorte**: ogni modello ha più colpevoli possibili, ognuno con il suo movente, la sua arma e le sue prove, più prove comuni e false piste. Il sito ne estrae uno, oppure lo sceglie la regia. Così un modello si gioca più volte, e anche chi lo ha letto non sa come andrà.
- **Nomi e luogo**: personaggi, vittima, luogo e anno sono segnaposto. La regia li scrive o accetta quelli proposti per il tema; tutti i testi si aggiornano da soli.
- **Grandezza e difficoltà**: da 4 a 8 sospetti, numero di fasi e durata, difficoltà (quante prove, catene più lunghe, false piste, indizi sul sigillo). I codici sono sempre generati a caso, diversi per ogni serata.
- **Salva come modello**: la regia trasforma una sua serata in un modello privato. I nomi dei personaggi e il luogo diventano segnaposto; il colpevole resta quello della serata.
- Tre modelli pronti all'inizio, scritti nel codice (`modelli/`), pensati per i temi: una villa in campagna, un viaggio, una festa in maschera.
- Il generatore è una funzione pura: i test controllano che ogni colpevole, ogni grandezza e ogni difficoltà diano un caso che passa il controllo del caso senza errori, senza segnaposto rimasti, con codici unici.

## 5. Tre temi nuovi
Con la skill Impeccable, come gli altri: una domanda di direzione per tema, poi colori, caratteri, disegno del proiettore, atmosfera, figure e frasi delle nuvolette, copertina.
- **Giallo all'italiana**, direzione "provincia elegante": villa italiana anni '70, arancio, marrone, verde oliva, carta da parati, telefono a disco. Più salotto che horror.
- **Crociera sul Nilo**, direzione "ponte al tramonto": sabbia, ocra e turchese, sole basso sul fiume, battello a vapore e palme. Caldo e luminoso.
- **Carnevale di Venezia**, direzione "ballo in maschera": velluto bordeaux, oro e nero, candele e maschere bianche, un palazzo durante la festa.

## Test
- Migrazioni da un database in uso, una per gruppo di funzioni.
- Inviti: il link mostra solo il suo invitato; il copione solo a chi interpreta quel personaggio; la conferma arriva alla regia; un link rigenerato non vale più.
- Votazioni: un voto per telefono e per premio, solo a voto aperto, candidati della serata; il proiettore mostra il vincitore solo quando la regia lo rivela.
- Modelli: generatore su tutte le combinazioni; serata creata da un modello; salva come modello con i segnaposto.
- Amministrazione: nessun titolo, indirizzo o tema nelle risposte, anche con serate piene.
