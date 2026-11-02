# Il Movente (cena con delitto)

Sito per cene con delitto: telefoni delle squadre, proiettore, regia, più amministrazione degli account. Il marchio dell'app è Il Movente; ogni serata ha il suo tema. Leggi README.md (uso e pubblicazione), CHANGELOG.md (cosa c'è), docs/STORIA.md (decisioni e richieste fin qui), PRODUCT.md e DESIGN.md (scopo e linguaggio visivo).

## Regole che valgono sempre
- **Teo gioca.** Non mostrargli mai trama, soluzione, codici, titoli o contenuti delle prove, testi delle scene o note di regia dei casi caricati sul sito vero. Se devi controllare dati reali, leggi solo conteggi, tipi e sì/no. Teo è l'amministrazione: il suo account non apre serate e le API di `/api/admin` non devono mai restituire contenuti delle serate.
- **Mai segreti nel repository**: `CENA_DB_URL`, `SESSION_SECRET`, `SETUP_CODE`, `ABLY_API_KEY` stanno solo nelle variabili d'ambiente di Netlify.
- **Non distruggere dati**: ogni cambio di schema è una nuova voce in `server/migrazioni.ts`, additiva, con un test che parte da un database già in uso.
- Interfaccia e testi in italiano. Regole di stile in DESIGN.md: niente etichette sopra i titoli, niente gradienti, niente ombre su elementi fermi, niente emoji, titoli entro due righe, al massimo due caratteri tipografici, niente trattini lunghi.

## Comandi
```bash
npm install --legacy-peer-deps
npm run build      # usa scripts/build.mjs: ng build da solo resta appeso alla fine
npm test           # partita completa contro un Postgres locale (PGlite)
npm run verifica   # tipi del server
npm run locale     # sito + API su http://localhost:8888, codice di primo avvio: prova
```
Per uccidere il server locale: `pkill -f "[s]cripts/locale.ts"` (le parentesi evitano di uccidere la propria shell).

## Architettura
- `src/app/` Angular 21: standalone, signals, zoneless, OnPush.
  - `squadra/`, `schermo/`, `regia/` (elenco delle serate in `regia/serate.ts`, la regia di una serata sotto `/regia/s/<id>`).
  - `pagine/`: accesso (`/accesso` storico, `/s/<slug>` a tema, `/regia/accedi`, `/avvio`), `admin.ts`, `invito.ts`, `testata.ts` del marchio.
  - `temi/`: catalogo dei temi e `MARCHIO`, `applica.ts` (variabili CSS su `<html>`), disegni per tema (`decoro.ts` nel disco del proiettore, `atmosfera.ts`, `figura.ts` delle nuvolette, `copertina.ts` delle serate). Un tema nuovo passa dalla skill Impeccable (vedi docs/PIANO-1.1.md).
  - Guardie di rotta `soloPer(...ruoli)` e `soloAdmin` in `sessione.ts`; l'amministrazione è sempre portata su `/admin`.
- `server/` logica delle API, servita da una sola Netlify Function (`netlify/functions/api.mts`, percorso `/api/*`), router in `server/router.ts`.
  - `motore.ts`: regole di apertura delle prove (gruppi in AND, gruppi diversi in OR, propagazione a catena, consegna della regia, prove mostrate).
  - `migrazioni.ts`: schema, applicato a runtime con lock consultivo.
  - `file.ts`: allegati su Netlify Blobs, serviti con Range e solo a chi può vederli; la serata sta nella chiave (`s<id>-`).
  - `accesso.ts`: sessioni di due tipi (utente: regia e amministrazione, tabella `utente`; partecipante: squadre e proiettore, tabella `account`). `utente()` restituisce sempre chi chiama con la sua `serata_id`: per la regia arriva dall'intestazione `x-serata`, controllata sul proprietario.
  - `serate.ts` (crea, duplica, archivia, elimina), `admin.ts` (inviti, sospensione, password), `invitati.ts` (invitati, vincoli, sorteggio con `distribuisci`, biglietti per tavolo).
- Database: Postgres esterno (Neon). In locale e nei test: `@netlify/database-dev`.
- Aggiornamenti: `seguiVersione` in `src/app/api.ts` chiede `/api/versione` (proiettore ogni 1 s, telefoni e regia ogni 1,5 s) e scarica lo stato completo quando `serata.versione` cambia (la aumenta `tocca()`), o comunque ogni 15 s. Con `ABLY_API_KEY`, `tocca()` pubblica la versione sul canale `movente-serata-<id>` e i browser ascoltano con EventSource (token da `/api/tempo-reale`, solo subscribe); il controllo allora rallenta a 10 s.
- 2.3: `controllo.ts` (controllo del caso, funzione pura `controlla`), `aiuti.ts`, `resoconto.ts`, `prova-generale.ts` (squadra con `prova = TRUE`, esclusa da elenchi, proiettore, sorteggio, biglietti, accuse e resoconto: ogni query nuova sulle squadre deve filtrare `NOT prova`; sessione nell'intestazione `x-anteprima`), `tempo-reale.ts`. Il copione dei personaggi (`personaggio.copione`) non va mai nelle risposte alle squadre.

## Pubblicare
Netlify, sito `cena-con-delitto` (id `00a1ac5d-8403-4f32-bc71-2e3bbdd49fd1`). Build e cartella in `netlify.toml`. Piano gratuito: le variabili d'ambiente vanno salvate non segrete e con ambito "all".

## Prossimi rilasci
Vedi docs/ROADMAP.md. Fatti: 2.0 (marchio, più regie e serate, amministrazione, accesso per serata, temi Halloween e Noir, nuvolette dalla regia), 2.1 (quattro temi nuovi, invitati, sorteggio, biglietti con QR, tempi delle nuvolette), 2.2 (caso completo con allegati, aggiornamenti in circa un secondo), 2.3 (controllo del caso, personaggi agli invitati, resoconto, aiuti, prova generale, suoni d'ambiente, tempo reale con Ably). Controlli automatici su GitHub in `.github/workflows/controlli.yml`. Prossimo: la 3.0. Il manuale della regia è un documento Claude Docs a parte (https://claude.ai/artifact/TswpsxwcrxsG1zqVYsn174), aggiornato alla 2.3.
