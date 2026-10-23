# Cena con delitto

Sito per una cena con delitto a tema Halloween, in tre superfici sincronizzate:

- **Telefono di squadra** (`/squadra`): prove trovate e sigillate, codici, personaggi, taccuino condiviso, accusa.
- **Proiettore** (`/schermo`): la narrazione della serata, le fasi, il conto alla rovescia, le squadre a confronto, la rivelazione.
- **Regia** (`/regia`): il caso, le fasi, i personaggi, le prove con le loro regole di sblocco, le scene, le squadre con i loro accessi, la diretta.

Ogni utenza entra con la sua login. La regia nasce al primo avvio; squadre e proiettore li crea la regia, che vede le password una volta sola e può rigenerarle.

Il contenuto del caso vive solo nel database e lo inserisce la regia: nel codice c'è soltanto un caso dimostrativo finto (`esempi/caso-dimostrativo.json`).

## Come si apre una prova

Ogni prova ha zero o più "modi" per aprirsi. Un modo è un insieme di condizioni da rispettare tutte insieme:

- **codice**: la squadra lo digita (cifre sul tastierino, lettere a mano);
- **dopo una prova**: si apre a catena quando la squadra ha aperto un'altra prova;
- **da una fase**: si apre per tutti quando la regia avvia quella fase.

Modi diversi sono alternative, e ognuno può valere per tutte le squadre o per una sola. La regia può sempre consegnare una prova a mano. I codici si verificano sul server: 5 errori in 5 minuti fermano la squadra per 2 minuti.

## Stack

- Angular 21 (standalone, signals, zoneless) in `src/`
- Netlify Functions in `netlify/functions/api.mts`, logica in `server/`
- Netlify Database (Postgres), schema in `netlify/database/migrations/`
- Netlify Blobs per foto, audio, video e PDF caricati dalla regia

## Pubblicare su Netlify

1. Collega il repository a un sito Netlify (build e cartella sono in `netlify.toml`).
2. Imposta le variabili d'ambiente, con ambito che includa le Functions:
   - `SESSION_SECRET`: una stringa casuale di almeno 32 caratteri (`openssl rand -base64 48`).
   - `SETUP_CODE`: il codice per creare la regia al primo avvio.
3. Pubblica. Netlify crea il database e applica le migrazioni.
4. Apri il sito, vai su "Crea l'account regia" e usa il `SETUP_CODE`.
5. Se la regia la gestisce un'altra persona: consegnale l'accesso e falle cambiare nome utente e password da Regia, Strumenti. Da quel momento il vecchio accesso non vale più.

Netlify Database richiede un piano a crediti.

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

- Carica il caso (a mano o da Regia, Strumenti, "Carica un caso da file").
- Crea le squadre e l'accesso del proiettore, stampa le credenziali per i tavoli.
- Fai una prova generale, poi Regia, Strumenti, "Azzera la serata".
