# Piano della 2.0: più regie e più serate

Parte da `docs/ROADMAP.md` (architettura e decisioni del 1 novembre 2026) e dal codice della 1.1 su `develop`. Si lavora su `develop`; la 1.1 non viene pubblicata da sola.

## Cosa c'è oggi
- Una sola tabella `account` per tutti: regia, squadre, proiettore. Ogni account appartiene a una serata (`serata_id`) e il nome utente è unico in tutto il sito.
- Ogni API della regia lavora sulla serata dell'account (`u.serata_id`): non esiste la scelta della serata.
- I file su Netlify Blobs hanno la serata nella chiave (`s<id>-...`) e il server lo controlla.
- La sessione è un cookie firmato con id dell'account, ruolo e versione del token.

## Modello dati (tutto additivo, una migrazione per passo)
- `utente`: le persone che usano l'applicazione. Nome utente unico nel sito, password, nome visibile, email facoltativa, `admin` sì/no, stato (`attivo`, `sospeso`), ultimo accesso, versione del token.
- `invito`: hash del token monouso, nome ed email facoltativa, chi l'ha creato, scadenza (7 giorni), usato il, revocato il. Lo stesso meccanismo serve per rimettere la password a chi l'ha persa (invito di tipo `password`, legato a un utente).
- `serata`: in più `proprietario_id` (utente), `slug` (unico, per l'indirizzo pubblico), `archiviata`, `aggiornata`.
- `account` resta per squadre e proiettore. Il vincolo di unicità del nome utente passa da tutto il sito a dentro la serata (`UNIQUE (serata_id, username)`); togliere un vincolo non tocca i dati.
- `tentativo_login` prende anche la serata, così i blocchi per troppi tentativi valgono dentro la serata.
- Le righe `account` con ruolo `regia` diventano utenti (vedi Passaggio dalla 1.x) e restano nel database, disattivate, per sicurezza.

## Sessioni
- Due tipi nello stesso cookie firmato: **utente** (amministrazione e regia) e **partecipante** (squadra o proiettore, valida per una serata sola). Il campo del tipo distingue le due tabelle.
- I cookie di squadre e proiettore di oggi restano validi: hanno già il formato del partecipante.
- I cookie della regia di oggi smettono di valere dopo il passaggio: la regia rientra una volta con le sue credenziali.

## Su quale serata lavora la regia
- Il client manda l'intestazione `x-serata` con l'id della serata aperta; il server controlla che appartenga all'utente (o risponde 404) e la passa ai gestori al posto di `u.serata_id`. Così il router e i gestori cambiano poco e due schede possono stare su due serate diverse.
- I file (`/api/file/<chiave>`) non possono portare intestazioni dentro un `<img>`: la serata la dice la chiave stessa (`s<id>-`), e il server controlla che sia dell'utente.
- Il proiettore aperto dalla regia segue la stessa regola.

## Marchio dell'applicazione
- Le pagine fuori da una serata (le tue serate, accesso della regia, amministrazione, inviti, primo avvio) hanno il marchio **Il Movente**, "Gialli da tavola"; dal dettaglio della serata in poi comanda il tema della serata, e anche `/s/<slug>` è nel tema.
- Scelto con la skill Impeccable il 1 novembre 2026: collana gialla da edicola su una parete di locandine, a tema scuro, titoli in Limelight e testi in Source Sans 3. Contratto in `.impeccable/surfaces/src-app-regia-serate-ts.md`, abbozzi in `.impeccable/mocks/decision/`.
- Nel codice è `MARCHIO` in `src/app/temi/catalogo.ts`: usa le stesse variabili dei temi ma non si sceglie per una serata.

## Superfici nuove
- **`/admin`** (solo amministrazione): elenco degli account regia con stato, numero di serate e ultimo accesso; crea un invito (nome, email facoltativa) e copia il link; revoca e rigenera; sospendi e riattiva; link per rimettere la password. Nessun contenuto delle serate: le API dell'amministrazione restituiscono solo conteggi e date.
- **`/invito/<token>`**: chi apre il link sceglie nome utente e password, che l'amministrazione non vede mai.
- **`/regia/accedi`**: accesso unico della regia, con l'aspetto neutro dell'applicazione.
- **`/regia`**: le mie serate. Crea, apri, duplica, archivia, riattiva, elimina (con conferma scritta). Sezione "Archiviate". Dentro una serata (`/regia/s/<id>/...`) ritrova la regia di oggi.
- **`/s/<slug>`**: pagina di accesso di squadre e proiettore, nel tema della serata. Dopo l'accesso si va a `/squadra` o `/schermo` come oggi. Il QR per tavolo arriva nella 2.1.
- `GET /api/s/<slug>` pubblico: solo titolo e tema della serata, e se è aperta.

## Regole delle serate
- **Duplica**: copia caso, fasi, personaggi, prove con le regole (tranne quelle riservate a una squadra, come nell'esportazione), cartelle, scene, tema, frasi delle nuvolette, sfondo, e gli allegati (copiati su Blobs con chiavi nuove). Non copia squadre, accessi, prove aperte, accuse, registro.
- **Archivia**: esce dall'elenco principale, si apre in sola lettura, gli accessi di squadre e proiettore non funzionano. Si riattiva o si duplica.
- **Elimina**: solo scrivendo il titolo esatto della serata; cancella anche gli allegati su Blobs.
- **Slug**: proposto dal titolo, unico, modificabile dalla regia.

## Passaggio dalla 1.x
- La migrazione crea un utente **regia, non amministratore**, dall'account regia esistente (stesso nome utente e stessa password): è l'account dell'organizzatrice. Lo rende proprietario della serata di Halloween 2026 e dà alla serata uno slug dal titolo.
- `SETUP_CODE` crea solo il primo amministratore, quando non ce n'è nessuno: è l'account di Teo, separato, che non vede il contenuto di nessuna serata (decisione del 1 novembre 2026, al posto di quanto scritto in ROADMAP.md).
- `/accesso` senza slug resta valido per la serata di Halloween finché serve: accetta squadre e proiettore di quella serata e manda la regia a `/regia/accedi`.

## Passi, uno per commit
1. **Schema e sessioni**. Fatto: tabelle `utente` e `invito`, colonne nuove di `serata`, vincolo per serata su `account`, migrazione dell'account regia; sessioni dei due tipi; `x-serata` e controllo del proprietario in tutte le API della regia e nei file. La regia di oggi funziona sulla serata scelta.
2. **Le mie serate**. Fatto: elenco, crea, duplica (con allegati), archivia, riattiva, elimina, slug.
3. **Amministrazione e inviti**. Fatto: primo amministratore con `SETUP_CODE`, `/admin`, inviti, sospensione, password dimenticata.
4. **Accesso per serata**: `/s/<slug>` a tema, accessi di squadre e proiettore dentro la serata, serate archiviate chiuse, compatibilità di `/accesso`.
5. **Documenti**: README (pubblicare e primo avvio), CHANGELOG 2.0.0, STORIA, CLAUDE.md, PRODUCT.md, ROADMAP.

## Test
- Migrazione da un database 1.1 in uso: l'account regia diventa utente con la stessa password, è proprietario della serata, la serata ha uno slug, squadre e proiettore entrano come prima, nessun dato perso.
- Isolamento: una regia non legge, non modifica e non vede i file di una serata non sua (404 su ogni API, anche con `x-serata` di un'altra serata).
- L'amministrazione non riceve contenuti delle serate da nessuna API.
- Inviti: monouso, scadenza, revoca, token salvato solo come hash.
- Stesso nome utente di squadra in due serate diverse; blocco tentativi dentro la serata.
- Duplica copia tutto il caso e gli allegati, e niente delle squadre; archiviata chiude gli accessi dei partecipanti.
