# Verso la 2.0: più regie, più serate, accessi separati

Proposta di architettura concordata il 1 novembre 2026, da rifinire prima di scrivere codice.

## Tre livelli di utenti
1. **Amministrazione** (Teo): una dashboard `/admin` per creare, sospendere e riattivare gli account regia, e vedere quante serate ha ciascuno. Non vede il contenuto delle serate.
2. **Regia** (chi organizza, invitata dall'amministrazione): un accesso unico, `/regia/accedi`, con l'aspetto neutro dell'applicazione. Dopo l'accesso vede **le sue serate**: crea, duplica da una precedente o da un file, archivia, apre quella su cui lavorare. Dentro una serata ritrova la regia di oggi.
3. **Partecipanti** (squadre e proiettore): ogni serata ha un suo indirizzo, per esempio `/s/villa-corvina`, con una pagina di accesso **nel tema della serata**. Si entra con le credenziali della squadra o con il QR stampato sul biglietto del tavolo.

## Modello dati (tutto additivo)
- `utente`: account delle persone che usano l'applicazione, con ruolo `admin` o `regia`, nome utente globale, password, stato (invitato, attivo, sospeso).
- `invito`: token monouso (salvato come hash), scadenza, chi l'ha creato, quando è stato usato.
- `serata`: in più `proprietario_id`, `slug` (indirizzo pubblico, unico), `tema`, `archiviata`.
- `serata_regia` (più avanti): co-regia, cioè più persone sulla stessa serata.
- `account` resta per squadre e proiettore, ma legato alla serata: il nome utente è unico **dentro la serata**, non in tutto il sito.
- Sessioni con due tipi: sessione di **regia** (utente, può aprire solo le sue serate) e sessione di **partecipante** (valida solo per una serata).

## Passaggio dalla 1.0
- L'account regia esistente diventa un `utente` regia (non amministratore), proprietario della serata di Halloween 2026: è dell'organizzatrice. L'amministratore è Teo, con un account separato creato con `SETUP_CODE` (decisione del 1 novembre 2026).
- `SETUP_CODE` crea solo il primo amministratore; gli altri account regia nascono dagli inviti della dashboard.
- Gli indirizzi attuali (`/regia`, `/squadra`, `/schermo`) restano validi per la serata di Halloween finché serve.

## Temi
Il tema è una proprietà della serata e cambia: colori, caratteri, decorazione del proiettore, figure e frasi delle nuvolette, tono dei testi, pagina di accesso dei partecipanti. Halloween classico è il predefinito. Altri da preparare: Noir anni '40, Vittoriano alla Sherlock, Delitto in viaggio, Anni '20 Gatsby, Natale con delitto.

## Ordine proposto
1. **1.1, Temi**: servono anche per la pagina di accesso a tema.
2. **2.0, Più regie e più serate**: dashboard admin, accesso regia unico, elenco serate, indirizzo e accesso per serata.
3. **2.1, Invitati e nuvolette dalla regia**: invitati, sorteggio squadre con vincoli, QR per tavolo, frasi delle nuvolette e frequenza decise dalla regia (via i nomi scritti nel codice).
4. **2.2, Caso completo in un file**, allegati compresi.
5. **Poi**: aggiornamenti in tempo reale, controlli automatici su GitHub, manuale della regia aggiornato.

## Decisioni prese (1 novembre 2026)
- **Co-regia sulla stessa serata: più avanti.** Nella 2.0 ogni serata ha una sola regia, la proprietaria. La tabella `serata_regia` si aggiunge quando servirà.
- **Account regia: li crea l'amministrazione, con un link di invito.** Dalla dashboard l'amministrazione inserisce nome e email (facoltativa) e ottiene un link monouso che scade dopo 7 giorni. Chi lo apre sceglie da sé nome utente e password, che l'amministrazione non vede mai. Il link si può revocare e rigenerare. Niente registrazione libera.
- **Serata archiviata: resta.** Esce dall'elenco principale (sezione "Archiviate"), si può consultare in sola lettura, duplicare per una nuova serata e riattivare. Gli accessi di squadre e proiettore di una serata archiviata sono disattivati. Si cancella solo con una conferma esplicita.
