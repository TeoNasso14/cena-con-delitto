# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular 21 (standalone components, signals, zoneless) per il frontend. Backend su Netlify: Functions in TypeScript, Postgres esterno (Neon) con SQL scritto a mano e migrazioni applicate a runtime, Netlify Blobs per gli allegati. Un solo progetto Netlify.

## Users

- **Squadre di giocatori**: 2-4 squadre, 10-20 persone in tutto, a una cena con delitto in un locale o ristorante, con il tema scelto per la serata. Indagano dal proprio telefono, seduti a tavola, tra una portata e l'altra: leggono il caso, sbloccano prove con PIN, consegnano un'accusa.
- **Organizzatore (regia)**: ha scritto il caso e la sera fa sia la regia sul sito sia la conduzione in sala davanti al proiettore. Una persona sola, con le mani spesso occupate a parlare. Dalla 2.0 ci possono essere più regie, ognuna con le sue serate, invitate dall'amministrazione; le serate si preparano a casa, da computer o tablet.
- **Amministrazione** (Teo): crea gli account regia con un invito, li sospende, rimette le password. Vede account e numeri, mai il contenuto delle serate.
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

- Ruoli: amministrazione (account creato con il codice di primo avvio), regia (account da invito, più serate per account), squadra e proiettore (account creati dalla regia dentro una serata).
- Vincolo anti-spoiler: lo sviluppatore (Teo) gioca e non deve vedere trama, soluzione o PIN. Il codice contiene solo un caso dimostrativo finto.
- I PIN si verificano sul server, con limite di tentativi.
- Il sistema deve reggere più meccaniche di sblocco combinabili ed estendibili.
- Da decidere: data della serata, calcolo del vincitore, aiuti per le squadre bloccate, account Netlify finale.

## Brand Commitments

- Marchio dell'applicazione: Il Movente, "Gialli da tavola" (collana di gialli su una parete di locandine, scuro). Veste le pagine fuori da una serata.
- Tema della serata, scelto dalla regia: Halloween classico (predefinito, la prima serata) e Noir anni '40; altri in preparazione.
- Direzione visiva del tema Halloween, scelta da Teo: Halloween classico della categoria (gotico, nero e arancio), eseguito alla lettera e senza ironia. Livello di finitura di riferimento: siti di escape room e giochi dal vivo, videogiochi horror investigativi (schede indizi alla Resident Evil, Phasmophobia, Return of the Obra Dinn), locandine dei film horror classici, pagine Halloween dei parchi a tema (Gardaland Magic Halloween, Halloween Horror Nights).
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
