# Verso la 2.0: più regie, più serate, accessi separati

Proposta di architettura concordata il 1 novembre 2026. Realizzata nella 2.0 sul ramo `develop` (piani di dettaglio in docs/PIANO-1.1.md e docs/PIANO-2.0.md); le differenze rispetto a questa proposta sono segnate sotto.

## Stato (2 novembre 2026, 2.3)
- **Fatto nella 2.0**: temi della serata (Halloween classico, Noir anni '40), nuvolette dalla regia, marchio Il Movente per le pagine fuori dalle serate, amministrazione con inviti, più serate per regia, accesso per serata a tema, accesso della regia.
- **Differenze dalla proposta**: l'account regia della 1.0 è diventato una regia normale (non amministratore); l'accesso della regia non ha un aspetto neutro ma il marchio Il Movente.
- **Fatto poi**: 2.1 (Vittoriano, Delitto in viaggio, Gatsby, Natale; invitati, sorteggio con vincoli, biglietti con QR; tempi delle nuvolette), 2.2 (caso completo con allegati; aggiornamenti in circa un secondo con il controllo della versione).
- **Pubblicate il 2 novembre 2026** la 2.0, 2.1, 2.2 e 2.3 insieme (`main` = `develop`). Prima del passaggio il sito ha copiato le tabelle della 1.x nello schema `copia_prima_della_2_0`. Restano da fare: l'amministrazione da `/avvio` e il primo rientro dell'organizzatrice da `/regia/accedi`.
- **2.3 fatta** (vedi docs/PIANO-2.3.md): controllo del caso, personaggi agli invitati, resoconto, aiuti, prova generale, suoni d'ambiente, tempo reale con Ably (attivo quando c'è `ABLY_API_KEY`).
- **Prossimo**: la 3.0. I controlli automatici su GitHub ci sono (`.github/workflows/controlli.yml`: tipi, test e build a ogni push su main e develop). Il manuale della regia su Claude Docs è aggiornato alla 2.2.

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
1. **1.1, Temi**: fatto, uscito dentro la 2.0 (due temi; gli altri seguono).
2. **2.0, Più regie e più serate**: fatto.
3. **2.1, Invitati e squadre**: invitati, sorteggio squadre con vincoli, QR per tavolo, frequenza e durata delle nuvolette (le frasi dalla regia sono già nella 2.0).
4. **2.2, Caso completo in un file**, allegati compresi.
5. **Poi**: aggiornamenti in tempo reale, controlli automatici su GitHub, manuale della regia aggiornato.

## Decisioni prese (1 novembre 2026)
- **Co-regia sulla stessa serata: più avanti.** Nella 2.0 ogni serata ha una sola regia, la proprietaria. La tabella `serata_regia` si aggiunge quando servirà.
- **Account regia: li crea l'amministrazione, con un link di invito.** Dalla dashboard l'amministrazione inserisce nome e email (facoltativa) e ottiene un link monouso che scade dopo 7 giorni. Chi lo apre sceglie da sé nome utente e password, che l'amministrazione non vede mai. Il link si può revocare e rigenerare. Niente registrazione libera.
- **Serata archiviata: resta.** Esce dall'elenco principale (sezione "Archiviate"), si può consultare in sola lettura, duplicare per una nuova serata e riattivare. Gli accessi di squadre e proiettore di una serata archiviata sono disattivati. Si cancella solo con una conferma esplicita.
