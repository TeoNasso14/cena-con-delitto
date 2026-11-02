# Il Movente

Sito per cene con delitto, in tre superfici sincronizzate per ogni serata:

- **Telefono di squadra** (`/squadra`): prove trovate e sigillate, codici, personaggi, taccuino condiviso, accusa.
- **Proiettore** (`/schermo`): la narrazione della serata, le fasi, il conto alla rovescia, le squadre a confronto, la rivelazione.
- **Regia** (`/regia/s/<id>`): il caso, le fasi, i personaggi, le prove con le loro regole di sblocco, le scene, le squadre con i loro accessi, la diretta.

Ogni serata ha un tema (Halloween classico, Noir anni '40, Vittoriano alla Sherlock, Delitto in viaggio, Anni '20 Gatsby, Natale con delitto) che veste telefoni, proiettore e regia di quella serata. Le pagine fuori da una serata (accesso della regia, elenco delle serate, amministrazione, inviti) hanno il marchio dell'applicazione, Il Movente.

Il contenuto dei casi vive solo nel database e lo inserisce la regia: nel codice c'è soltanto un caso dimostrativo finto (`esempi/caso-dimostrativo.json`).

## Chi entra e da dove

| Chi | Da dove | Come nasce l'account |
|---|---|---|
| Amministrazione | `/regia/accedi`, poi `/admin` | Con `SETUP_CODE`, una volta sola. Vede account e numeri, mai il contenuto delle serate. |
| Regia | `/regia/accedi`, poi `/regia` (le sue serate) | Con un link d'invito dell'amministrazione: sceglie da sé nome utente e password. |
| Squadre e proiettore | `/s/<indirizzo-della-serata>` | Li crea la regia nella serata, che vede le password una volta sola e può rigenerarle. |

- Una regia può avere più serate: le crea, le duplica (caso e allegati compresi, senza squadre), le archivia e le riattiva, cambia il loro indirizzo, le elimina scrivendo il titolo.
- Una serata archiviata si consulta in sola lettura e chiude gli accessi di squadre e proiettore.
- Inviti e link per una password nuova valgono una volta e scadono dopo 7 giorni. Un account sospeso perde subito le sessioni aperte.
- `/accesso` resta valido per la serata più vecchia, quella di Halloween 2026.

## Come si apre una prova

Ogni prova ha zero o più "modi" per aprirsi. Un modo è un insieme di condizioni da rispettare tutte insieme:

- **codice**: la squadra lo digita (cifre sul tastierino, lettere a mano);
- **dopo una prova**: si apre a catena quando la squadra ha aperto un'altra prova;
- **da una fase**: si apre per tutti quando la regia avvia quella fase.

Modi diversi sono alternative, e ognuno può valere per tutte le squadre o per una sola. La regia può sempre consegnare una prova a mano. I codici si verificano sul server: 5 errori in 5 minuti fermano la squadra per 2 minuti.

## Invitati, squadre e biglietti

- In Regia, Invitati: elenco degli invitati (anche incollato, uno per riga), vincoli "divisa da" e "insieme a", sorteggio bilanciato delle squadre, spostamenti a mano.
- Biglietti per i tavoli: un foglio da stampare per squadra con componenti, credenziali e un QR che fa entrare direttamente. Prepararli rinnova le password delle squadre.

## Caso in un file

Strumenti, "Scarica il caso": un file con tutto il caso, allegati compresi, da tenere o da caricare in un'altra serata ("Carica un caso da file"). Squadre, accessi e invitati restano fuori.

## Temi e nuvolette

- Il tema si sceglie in Regia, Strumenti: cambia colori, caratteri, disegno nel disco del proiettore, atmosfera (la pioggia del Noir), figure e frasi pronte delle nuvolette. Catalogo in `src/app/temi/catalogo.ts`, regole visive in `DESIGN.md`.
- Le frasi delle nuvolette, ogni quanto compaiono e quanto restano visibili le decide la regia per ogni serata (Strumenti, Nuvolette), e si possono spegnere. Una serata senza frasi proprie usa quelle pronte del suo tema.

## Stack

- Angular 21 (standalone, signals, zoneless) in `src/`
- Netlify Functions in `netlify/functions/api.mts`, logica in `server/`
- Postgres esterno (oggi Neon, piano gratuito), indirizzo in `CENA_DB_URL`; lo schema è in `server/migrazioni.ts` e il sito lo applica da solo alla prima richiesta
- Netlify Blobs per foto, audio, video e PDF caricati dalla regia

## Pubblicare su Netlify

1. Collega il repository a un sito Netlify (build e cartella sono in `netlify.toml`).
2. Imposta le variabili d'ambiente (sul piano gratuito: non segrete, ambito "all"):
   - `SESSION_SECRET`: una stringa casuale di almeno 32 caratteri (`openssl rand -base64 48`).
   - `SETUP_CODE`: il codice per creare l'amministrazione al primo avvio.
   - `CENA_DB_URL`: l'indirizzo di un database Postgres (per esempio Neon gratuito, con `sslmode=require`).
   - `CENA_DB_MAX`: connessioni per istanza, 3 va bene.
3. Pubblica. Alla prima richiesta il sito crea o aggiorna le tabelle.
4. Apri `/avvio` e crea l'amministrazione con il `SETUP_CODE`.
5. Da `/admin` crea un invito per ogni regia e mandale il link.

## Passare dalla 1.0 alla 2.0

Il passaggio è automatico alla prima richiesta e non tocca i dati. Cosa cambia per chi usa il sito:

- **Organizzatrice**: il suo account regia diventa un account regia della 2.0, con lo stesso nome utente e la stessa password, proprietario della serata di Halloween 2026. Deve rientrare una volta, da `/regia/accedi`.
- **Amministrazione**: non esiste ancora. Si crea da `/avvio` con il `SETUP_CODE`, con un nome utente diverso da quello dell'organizzatrice.
- **Squadre e proiettore**: restano collegati. L'indirizzo della serata, da dare ai tavoli, è in Regia, Squadre e accessi; `/accesso` continua a funzionare.

## In locale

```bash
npm install --legacy-peer-deps
npm run build      # compila il frontend
npm run locale     # database di prova, API e sito su http://localhost:8888 (codice di primo avvio: prova)
npm test           # una partita completa contro il database di prova
npm run verifica   # controllo dei tipi del server
```

In locale gli allegati restano in memoria e si perdono al riavvio.

## Prima della serata

- Crea la serata dall'elenco (o duplicane una), scegli il tema in Strumenti, carica il caso (a mano o da Strumenti, "Carica un caso da file").
- Crea le squadre e l'accesso del proiettore, inserisci gli invitati e sorteggia le squadre, stampa i biglietti per i tavoli.
- Fai una prova generale, poi Regia, Strumenti, "Azzera la serata".
