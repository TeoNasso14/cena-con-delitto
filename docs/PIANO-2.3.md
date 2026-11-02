# Piano della 2.3: preparare, giocare, ricordare

Avviato il 2 novembre 2026 su `develop`, dopo la 2.2.0 non ancora pubblicata: le due versioni escono insieme. Tutto additivo, in una sola migrazione (`20261102100000_versione_2_3`).

## 1. Controllo del caso
- `GET /api/regia/controllo`: elenco di errori e avvisi, calcolato da una funzione pura (`server/controllo.ts`) provata nei test.
- Errori: prove che per una squadra non si aprono mai (catene circolari, fasi inesistenti, due codici nello stesso modo), colpevole mancante (la rivelazione non parte).
- Avvisi: prove che consegna solo la regia, prove foto/audio/video senza file, prove vuote, movente o arma mancanti, colpevole che non è tra i personaggi, scene senza file o con una fase inesistente, più scene automatiche nella stessa fase, nessuna scena di rivelazione, nessuna squadra o nessun proiettore, un personaggio dato a più invitati.
- Regia: in Strumenti, e in diretta un riassunto finché la serata è in preparazione.

## 2. Personaggi agli invitati (facoltativo)
- `invitato.personaggio_id`: in Invitati ogni persona può interpretare un personaggio. Si può giocare anche senza: i personaggi restano terze persone.
- `personaggio.copione`: cosa sa solo chi lo interpreta. Non arriva mai ai telefoni delle squadre.
- Stampa "Schede per chi interpreta": una scheda per invitato con il suo personaggio, la scheda pubblica e il copione.
- Telefoni: nei personaggi compare "interpretato da". Biglietti: accanto al nome, il personaggio.

## 3. Resoconto della serata
- `GET /api/regia/resoconto`: per squadra prove aperte e come, codici sbagliati, aiuti e penalità, tempi, accusa e punteggio netto; per prova chi l'ha aperta e quando.
- Pagina della regia "Resoconto", da mostrare o stampare. Dopo la rivelazione i telefoni vedono la classifica.

## 4. Aiuti a richiesta
- Tabella `aiuto` (squadra, prova facoltativa, domanda, stato in attesa, dato o rifiutato, risposta, penalità).
- La squadra chiede dal telefono, una richiesta alla volta e al massimo `serata.aiuti_max` (3); la regia risponde in diretta con una penalità facoltativa, che si toglie dal punteggio dell'accusa.
- Spenti di serie (`serata.aiuti_attivi`): la regia li accende in Strumenti o in diretta.

## 5. Prova generale
- Una squadra nascosta (`squadra.prova`), fuori da elenchi, proiettore, sorteggio, biglietti, accuse e resoconto.
- La regia apre "Prova generale" e vede in un'altra scheda il telefono di una squadra: la sessione viaggia nell'intestazione `x-anteprima` (per scheda, in sessionStorage), così il cookie della regia resta com'è. Nessuna password delle squadre cambia.
- I codici funzionano anche a serata non iniziata, solo per la prova generale. "Ricomincia" cancella i progressi della prova generale e nient'altro.

## 6. Suoni d'ambiente
- Sul proiettore, generati nel browser (Web Audio, nessun file e nessuna licenza): vento (Halloween), pioggia (Noir), orologio e pioggia lontana (Vittoriano), treno (Viaggio), fruscio di disco (Gatsby), camino (Natale).
- `serata.ambiente_attivo` (spento di serie) e `serata.ambiente_volume`. Si abbassa da solo durante le scene con audio o video. Se il browser blocca l'audio, il proiettore mostra "Tocca per il suono".

## 7. Tempo reale
- Servizio: Ably (piano gratuito: 6 milioni di messaggi al mese, 200 connessioni insieme). Chiave in `ABLY_API_KEY`, solo nelle variabili d'ambiente di Netlify.
- Il server pubblica solo il numero di versione della serata, mai contenuti; i browser ascoltano con EventSource (nessuna libreria) su un canale per serata, con un token che permette solo di ascoltare quel canale.
- Senza chiave, o se la connessione cade, resta il controllo della versione di oggi. Con la connessione aperta il controllo rallenta a ogni 10 secondi, come rete di sicurezza.

## Test
- Migrazione da un database 2.2 in uso.
- Controllo: catene circolari, fasi inesistenti, regole riservate a una squadra, avvisi.
- Personaggi: il copione non arriva ai telefoni; un personaggio di un'altra serata è rifiutato.
- Aiuti: spenti, una alla volta, massimo, risposta e penalità nel punteggio.
- Prova generale: invisibile a elenchi e proiettore, codici a serata ferma, l'intestazione vale solo per la prova generale, ricomincia.
- Resoconto e tempo reale (con un servizio finto).
