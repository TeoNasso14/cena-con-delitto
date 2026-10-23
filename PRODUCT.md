# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular 21 (standalone components, signals, zoneless) per il frontend. Backend su Netlify: Functions in TypeScript, Netlify Database (Postgres) con Drizzle, Netlify Blobs per gli allegati delle prove. Un solo progetto Netlify.

## Users

- **Squadre di giocatori**: 2-4 squadre, 10-20 persone in tutto, a una cena con delitto a tema Halloween in un locale o ristorante. Indagano dal proprio telefono, seduti a tavola, tra una portata e l'altra: leggono il caso, sbloccano prove con PIN, consegnano un'accusa.
- **Organizzatore**: ha scritto il caso (oggi in un PPT) e la sera fa sia la regia sul sito sia la conduzione in sala davanti al proiettore. Una persona sola, con le mani spesso occupate a parlare.
- **Sala intera**: guarda il proiettore, che porta la narrazione principale e scandisce le fasi.

## Product Purpose

Trasformare il PPT del delitto in un gioco dal vivo: il proiettore racconta, i telefoni indagano, la regia governa tempi e sblocchi. Successo: la serata scorre senza che l'organizzatore debba spiegare il sito, nessuna squadra resta bloccata a lungo senza che la regia se ne accorga, la rivelazione finale arriva sul proiettore davanti a tutti.

## Positioning

Non è un sito di contenuti ma uno strumento di scena: tre superfici sincronizzate (proiettore, telefoni, regia) che rispondono a un unico motore di sblocco. Il contenuto del caso vive solo nel database e lo inserisce l'organizzatore.

## Operating Context

- Locale o ristorante: luce bassa, rumore, Wi-Fi del locale non garantito, telefoni personali dei giocatori.
- Il proiettore è collegato a un computer del locale o dell'organizzatore e resta a tutto schermo per tutta la sera.
- L'organizzatore guida la regia da tablet o portatile mentre parla in sala: i comandi della regia devono funzionare a colpo d'occhio e con un tocco.
- Prove trovate nella stanza (PIN su bigliettini e oggetti), rivelate da attori, a catena, o rilasciate a tempo dalla regia.

## Capabilities and Constraints

- Ruoli: squadra (codice squadra), proiettore (codice schermo), regia (password dell'organizzatore), sviluppatore.
- Vincolo anti-spoiler: lo sviluppatore (Teo) gioca e non deve vedere trama, soluzione o PIN. Il codice contiene solo un caso dimostrativo finto.
- I PIN si verificano sul server, con limite di tentativi.
- Il sistema deve reggere più meccaniche di sblocco combinabili ed estendibili.
- Da decidere: data della serata, calcolo del vincitore, aiuti per le squadre bloccate, account Netlify finale.

## Brand Commitments

- Tema dichiarato: Halloween.
- Direzione visiva scelta da Teo: Halloween classico della categoria (gotico, nero e arancio), eseguito alla lettera e senza ironia. Livello di finitura di riferimento: siti di escape room e giochi dal vivo, videogiochi horror investigativi (schede indizi alla Resident Evil, Phasmophobia, Return of the Obra Dinn), locandine dei film horror classici, pagine Halloween dei parchi a tema (Gardaland Magic Halloween, Halloween Horror Nights).
- Lingua: italiano.
- Regole di scrittura e stile fissate da Teo per i suoi siti: niente etichette sopra i titoli, niente gradienti, niente ombre su elementi fermi, niente emoji, titoli entro due righe, al massimo due caratteri tipografici, niente trattini lunghi nei testi.

## Evidence on Hand

- Un PPT del caso, in mano all'organizzatore e volutamente non letto. Nessuna immagine, nome o testo reale del caso è disponibile: ogni contenuto nelle bozze è segnaposto o caso dimostrativo, e non va inventato come se fosse il caso vero.

## Product Principles

1. Il proiettore porta la storia; il telefono porta l'indagine. Nessuno dei due ripete l'altro.
2. La regia deve poter agire in un tocco mentre l'organizzatore sta parlando.
3. Il browser di una squadra non riceve mai ciò che non ha sbloccato.
4. Ogni meccanica di sblocco è una regola, non un caso speciale nel codice.
5. Leggibile al buio, al tavolo, con il rumore del locale.

## Accessibility & Inclusion

Contrasto alto per la penombra del locale; testi del proiettore leggibili dal fondo della sala; rispetto di "riduci movimento"; obiettivi di tocco di almeno 44 px.
