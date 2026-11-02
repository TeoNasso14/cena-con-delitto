# Piano della 2.1: invitati, squadre, biglietti

Avviato il 1 novembre 2026 su `develop`, dopo la 2.0.0. Tutto additivo.

## Invitati
- Tabella `invitato` (serata, nome, squadra facoltativa, ordine). La regia li aggiunge uno alla volta o incolla una lista, una persona per riga.
- Tabella `vincolo` (serata, due invitati, tipo `divisi` o `insieme`): "questi due in squadre diverse", "questi due nella stessa squadra".
- Nuova pagina in regia, "Invitati", con elenco, vincoli e sorteggio. In "Squadre e accessi" ogni squadra mostra i suoi componenti.

## Sorteggio
- Distribuisce gli invitati sulle squadre già create (almeno due), con squadre di dimensione il più possibile uguale, rispettando tutti i vincoli. Se i vincoli sono impossibili lo dice e non cambia nulla.
- Si può rifare quante volte si vuole; dopo, ogni invitato si sposta a mano con un menu.

## Biglietti per tavolo
- Pagina da stampare, un biglietto per squadra: nome della squadra, componenti, indirizzo della serata, nome utente e password, e un QR che fa entrare direttamente.
- Le password sono salvate solo come impronta, quindi preparare i biglietti genera password nuove per tutte le squadre: la pagina lo chiede prima, e le sessioni aperte delle squadre si chiudono.
- Il QR porta a `/s/<slug>#entra=<nome utente>:<password>`: la parte dopo `#` non arriva mai al server né ai suoi registri; la pagina d'accesso la legge, entra e la toglie dall'indirizzo.
- QR generato nel browser con la libreria `qrcode-generator` (MIT, nessuna dipendenza).

## Nuvolette
- `serata.sussurri_attesa` (secondi tra una nuvoletta e l'altra, intervallo minimo e massimo) e `serata.sussurri_durata`. La regia li cambia in Strumenti, Nuvolette; i valori di oggi restano il predefinito (20-45 s, 10 s).

## Test
- Migrazione da un database 2.0 in uso.
- Invitati e vincoli: isolamento tra serate, vincoli tra invitati della stessa serata.
- Sorteggio: tutti assegnati, squadre bilanciate (differenza massima 1), vincoli rispettati su molte estrazioni, vincoli impossibili rifiutati.
- Biglietti: password nuove, sessioni vecchie chiuse, la squadra entra con le credenziali stampate.
- Nuvolette: valori validati e restituiti a squadre e proiettore.
