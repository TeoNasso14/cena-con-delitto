# Cena con delitto

Sito per cene con delitto: telefoni delle squadre, proiettore, regia. Leggi README.md (uso e pubblicazione), CHANGELOG.md (cosa c'è), docs/STORIA.md (decisioni e richieste fin qui), PRODUCT.md e DESIGN.md (scopo e linguaggio visivo).

## Regole che valgono sempre
- **Teo gioca.** Non mostrargli mai trama, soluzione, codici, titoli o contenuti delle prove, testi delle scene o note di regia del caso caricato sul sito vero. Se devi controllare dati reali, leggi solo conteggi, tipi e sì/no.
- **Mai segreti nel repository**: `CENA_DB_URL`, `SESSION_SECRET`, `SETUP_CODE` stanno solo nelle variabili d'ambiente di Netlify.
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
- `src/app/` Angular 21: standalone, signals, zoneless, OnPush. `squadra/`, `schermo/`, `regia/`, `pagine/accesso.ts`. Guardia di rotta `soloPer(...ruoli)` in `sessione.ts`.
- `server/` logica delle API, servita da una sola Netlify Function (`netlify/functions/api.mts`, percorso `/api/*`), router in `server/router.ts`.
  - `motore.ts`: regole di apertura delle prove (gruppi in AND, gruppi diversi in OR, propagazione a catena, consegna della regia, prove mostrate).
  - `migrazioni.ts`: schema, applicato a runtime con lock consultivo.
  - `file.ts`: allegati su Netlify Blobs, serviti con Range e solo a chi può vederli.
- Database: Postgres esterno (Neon). In locale e nei test: `@netlify/database-dev`.
- Aggiornamenti: polling (proiettore 2 s, telefoni e regia 4 s) sul campo `serata.versione`, aumentato da `tocca()`.

## Pubblicare
Netlify, sito `cena-con-delitto` (id `00a1ac5d-8403-4f32-bc71-2e3bbdd49fd1`). Build e cartella in `netlify.toml`. Piano gratuito: le variabili d'ambiente vanno salvate non segrete e con ambito "all".

## Prossimi rilasci
Vedi docs/ROADMAP.md: temi (1.1), poi più regie con dashboard di amministrazione, accesso regia unico, più serate per regia e accesso dei partecipanti separato e a tema per ogni serata (2.0), poi invitati, QR e nuvolette gestite dalla regia (2.1), caso completo con allegati (2.2).
