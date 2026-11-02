/**
 * Schema del database, applicato dal sito stesso alla prima richiesta.
 * Per cambiare lo schema aggiungi una voce in fondo, non modificare quelle già applicate.
 */
export const MIGRAZIONI: Array<{ nome: string; sql: string }> = [
  {
    nome: "20261023120000_schema_iniziale",
    sql: String.raw`
-- Cena con delitto: schema iniziale.
-- Una serata contiene tutto il resto. Il contenuto del caso lo inserisce la regia.

CREATE TABLE serata (
  id            SERIAL PRIMARY KEY,
  titolo        TEXT NOT NULL DEFAULT 'Cena con delitto',
  premessa      TEXT NOT NULL DEFAULT '',
  stato         TEXT NOT NULL DEFAULT 'bozza' CHECK (stato IN ('bozza', 'in_corso', 'in_pausa', 'chiusa')),
  fase_corrente INTEGER NOT NULL DEFAULT 0,
  scena_in_onda INTEGER,
  schermo_nero  BOOLEAN NOT NULL DEFAULT FALSE,
  colpevole     TEXT NOT NULL DEFAULT '',
  movente       TEXT NOT NULL DEFAULT '',
  arma          TEXT NOT NULL DEFAULT '',
  rivelata      BOOLEAN NOT NULL DEFAULT FALSE,
  versione      BIGINT NOT NULL DEFAULT 1,
  creata        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fase (
  id           SERIAL PRIMARY KEY,
  serata_id    INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  numero       INTEGER NOT NULL,
  nome         TEXT NOT NULL,
  durata_minuti INTEGER,
  avviata_alle TIMESTAMPTZ,
  UNIQUE (serata_id, numero)
);

CREATE TABLE squadra (
  id        SERIAL PRIMARY KEY,
  serata_id INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  colore    TEXT NOT NULL DEFAULT '#ff7a1a',
  taccuino  TEXT NOT NULL DEFAULT '',
  creata    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (serata_id, nome)
);

-- Un account per utenza: la regia, ogni squadra, ogni schermo del proiettore.
CREATE TABLE account (
  id             SERIAL PRIMARY KEY,
  serata_id      INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  ruolo          TEXT NOT NULL CHECK (ruolo IN ('regia', 'squadra', 'schermo')),
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  squadra_id     INTEGER REFERENCES squadra(id) ON DELETE CASCADE,
  versione_token INTEGER NOT NULL DEFAULT 1,
  creato         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_accesso TIMESTAMPTZ,
  CHECK ((ruolo = 'squadra') = (squadra_id IS NOT NULL))
);

CREATE TABLE tentativo_login (
  id       SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  esito    BOOLEAN NOT NULL,
  ora      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX tentativo_login_username_ora ON tentativo_login (username, ora);

CREATE TABLE personaggio (
  id          SERIAL PRIMARY KEY,
  serata_id   INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  ruolo       TEXT NOT NULL DEFAULT '',
  scheda      TEXT NOT NULL DEFAULT '',
  note_regia  TEXT NOT NULL DEFAULT '',
  foto_key    TEXT,
  ordine      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE prova (
  id            SERIAL PRIMARY KEY,
  serata_id     INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  numero        INTEGER NOT NULL,
  titolo        TEXT NOT NULL,
  tipo          TEXT NOT NULL DEFAULT 'documento' CHECK (tipo IN ('documento', 'oggetto', 'testimonianza', 'foto', 'audio', 'video')),
  testo         TEXT NOT NULL DEFAULT '',
  allegato_key  TEXT,
  allegato_tipo TEXT,
  nota_sigillo  TEXT NOT NULL DEFAULT '',
  UNIQUE (serata_id, numero)
);

-- Regole di sblocco. Le regole con lo stesso gruppo vanno rispettate tutte;
-- gruppi diversi sono alternative. squadra_id NULL vale per tutte le squadre.
CREATE TABLE regola_sblocco (
  id                 SERIAL PRIMARY KEY,
  prova_id           INTEGER NOT NULL REFERENCES prova(id) ON DELETE CASCADE,
  tipo               TEXT NOT NULL CHECK (tipo IN ('pin', 'prova', 'fase')),
  pin                TEXT,
  prova_richiesta_id INTEGER REFERENCES prova(id) ON DELETE CASCADE,
  fase_numero        INTEGER,
  squadra_id         INTEGER REFERENCES squadra(id) ON DELETE CASCADE,
  gruppo             INTEGER NOT NULL DEFAULT 1,
  CHECK (
    (tipo = 'pin'   AND pin IS NOT NULL) OR
    (tipo = 'prova' AND prova_richiesta_id IS NOT NULL) OR
    (tipo = 'fase'  AND fase_numero IS NOT NULL)
  )
);
CREATE INDEX regola_sblocco_prova ON regola_sblocco (prova_id);

CREATE TABLE sblocco (
  squadra_id INTEGER NOT NULL REFERENCES squadra(id) ON DELETE CASCADE,
  prova_id   INTEGER NOT NULL REFERENCES prova(id) ON DELETE CASCADE,
  via        TEXT NOT NULL CHECK (via IN ('pin', 'catena', 'fase', 'regia')),
  ora        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (squadra_id, prova_id)
);

CREATE TABLE tentativo_pin (
  id         SERIAL PRIMARY KEY,
  squadra_id INTEGER NOT NULL REFERENCES squadra(id) ON DELETE CASCADE,
  codice     TEXT NOT NULL,
  esito      BOOLEAN NOT NULL,
  ora        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX tentativo_pin_squadra_ora ON tentativo_pin (squadra_id, ora);

CREATE TABLE scena (
  id            SERIAL PRIMARY KEY,
  serata_id     INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  ordine        INTEGER NOT NULL DEFAULT 0,
  tipo          TEXT NOT NULL CHECK (tipo IN ('narrazione', 'immagine', 'video', 'audio', 'conto', 'avanzamento', 'annuncio', 'rivelazione', 'attesa')),
  titolo        TEXT NOT NULL DEFAULT '',
  testo         TEXT NOT NULL DEFAULT '',
  allegato_key  TEXT,
  allegato_tipo TEXT,
  fase_numero   INTEGER,
  avvio_automatico BOOLEAN NOT NULL DEFAULT FALSE,
  in_onda_dal   TIMESTAMPTZ
);

CREATE TABLE annuncio (
  id         SERIAL PRIMARY KEY,
  serata_id  INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  squadra_id INTEGER REFERENCES squadra(id) ON DELETE CASCADE,
  testo      TEXT NOT NULL,
  ora        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE accusa (
  squadra_id     INTEGER PRIMARY KEY REFERENCES squadra(id) ON DELETE CASCADE,
  colpevole      TEXT NOT NULL,
  movente        TEXT NOT NULL,
  arma           TEXT NOT NULL,
  spiegazione    TEXT NOT NULL DEFAULT '',
  consegnata_alle TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  punteggio      INTEGER
);

CREATE TABLE evento (
  id         SERIAL PRIMARY KEY,
  serata_id  INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  squadra_id INTEGER REFERENCES squadra(id) ON DELETE SET NULL,
  tipo       TEXT NOT NULL,
  testo      TEXT NOT NULL,
  ora        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX evento_serata_ora ON evento (serata_id, ora DESC);
`,
  },
  {
    nome: "20261026160000_cartelle_prove",
    sql: String.raw`
CREATE TABLE IF NOT EXISTS cartella (
  id        SERIAL PRIMARY KEY,
  serata_id INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  nome      TEXT NOT NULL,
  ordine    INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE prova ADD COLUMN IF NOT EXISTS cartella_id INTEGER REFERENCES cartella(id) ON DELETE SET NULL;
`,
  },
  {
    nome: "20261027150000_visibilita_squadre",
    sql: String.raw`
ALTER TABLE cartella ADD COLUMN IF NOT EXISTS visibile BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE prova ADD COLUMN IF NOT EXISTS titolo_visibile BOOLEAN NOT NULL DEFAULT FALSE;
`,
  },
  {
    // Le prove esistenti restano nell'elenco delle squadre, come prima.
    nome: "20261027160000_prove_in_elenco",
    sql: String.raw`
ALTER TABLE prova ADD COLUMN IF NOT EXISTS in_elenco BOOLEAN NOT NULL DEFAULT TRUE;
`,
  },
  {
    // Scelta della regia: da qui in poi le prove sigillate sono nascoste alle squadre, salvo scelta diversa.
    // Le prove già aperte da una squadra restano comunque visibili a quella squadra.
    nome: "20261027170000_prove_nascoste_di_default",
    sql: String.raw`
ALTER TABLE prova ALTER COLUMN in_elenco SET DEFAULT FALSE;
UPDATE prova SET in_elenco = FALSE, titolo_visibile = FALSE;
`,
  },
  {
    // Prove con codice consegnate dalla regia: la squadra le vede, sigillate e con il titolo, finché non digita il codice.
    nome: "20261028133000_prove_mostrate",
    sql: String.raw`
CREATE TABLE IF NOT EXISTS prova_mostrata (
  squadra_id INTEGER NOT NULL REFERENCES squadra(id) ON DELETE CASCADE,
  prova_id   INTEGER NOT NULL REFERENCES prova(id) ON DELETE CASCADE,
  ora        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (squadra_id, prova_id)
);
`,
  },
  {
    // Foto di sfondo del proiettore (ad esempio la foto di gruppo), mostrata trasparente dietro le scene.
    nome: "20261031121000_sfondo_proiettore",
    sql: String.raw`
ALTER TABLE serata ADD COLUMN IF NOT EXISTS sfondo_key TEXT;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS sfondo_opacita REAL NOT NULL DEFAULT 0.25;
`,
  },
  {
    // Tema della serata: colori, caratteri e decorazioni di telefoni, proiettore e regia. Halloween classico resta il predefinito.
    nome: "20261101130000_tema_serata",
    sql: String.raw`
ALTER TABLE serata ADD COLUMN IF NOT EXISTS tema TEXT NOT NULL DEFAULT 'halloween';
`,
  },
  {
    // Nuvolette decise dalla regia: le frasi stanno nella serata, non più nel codice. Una serata senza frasi usa quelle del suo tema.
    nome: "20261101150000_sussurri",
    sql: String.raw`
CREATE TABLE IF NOT EXISTS sussurro (
  id        SERIAL PRIMARY KEY,
  serata_id INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  testo     TEXT NOT NULL,
  ordine    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sussurro_serata ON sussurro (serata_id, ordine);
ALTER TABLE serata ADD COLUMN IF NOT EXISTS sussurri_attivi BOOLEAN NOT NULL DEFAULT TRUE;

-- Le frasi che fino alla 1.0 erano scritte nel codice passano alle serate già esistenti.
INSERT INTO sussurro (serata_id, testo, ordine)
SELECT s.id, f.testo, f.ordine FROM serata s CROSS JOIN (VALUES
  ('Qualcuno vi sta guardando.', 0),
  ('Non voltatevi.', 1),
  ('Hai sentito anche tu?', 2),
  ('La candela ha tremato.', 3),
  ('Contate i commensali. Siete ancora tutti?', 4),
  ('Le ombre si allungano.', 5),
  ('Chi ha spento la luce?', 6),
  ('Qualcosa gratta sotto il tavolo.', 7),
  ('Il gufo ha smesso di cantare.', 8),
  ('Mezzanotte si avvicina.', 9),
  ('Il ritratto ha cambiato espressione.', 10),
  ('Un passo, poi silenzio.', 11),
  ('Dietro la porta, un respiro.', 12),
  ('Il vento conosce il tuo nome.', 13),
  ('Non era il gatto.', 14),
  ('Fa più freddo di prima, vero?', 15),
  ('Ali, il fantasma ti ha chiesto l''amicizia. Poi ti ha bloccato.', 16),
  ('Ali, anche il vampiro ha detto: no, grazie.', 17),
  ('Ali, se sparisci stasera, nessuno se ne accorge.', 18),
  ('Mela, anche le streghe avvelenate ti scartano.', 19),
  ('Mela, Biancaneve ti ha morso e ha sputato.', 20),
  ('Mela, marcia dentro, come da tradizione.', 21),
  ('Ludo, il maggiordomo ha detto che sei la più sospetta. E la più antipatica.', 22),
  ('Ludo, sotto la tovaglia c''è qualcosa. Più simpatico di te.', 23),
  ('Ludo, la casa stregata ha chiesto di cambiare ospite.', 24),
  ('Sasso, hai la sensibilità del tuo nome.', 25),
  ('Sasso, la cripta ti ha tenuto un posto. Ti ci vedono bene.', 26),
  ('Sasso, anche le lapidi hanno più conversazione.', 27),
  ('Losco: il nome dice già tutto. Anche la faccia.', 28),
  ('Losco, l''assassino ti ha copiato lo sguardo.', 29),
  ('Losco, la polizia ti ha già in rubrica.', 30),
  ('Tenca, il lago ti rivuole indietro. Noi no.', 31),
  ('Tenca, anche i pesci ti trovano noioso.', 32),
  ('Tenca, abbocchi a qualsiasi indizio, come da nome.', 33),
  ('Teo, hai fatto il sito perché a giocare saresti stato inutile.', 34),
  ('Teo, il sito l''ha fatto Claude. Tu hai detto bravo.', 35),
  ('Teo, chi ha fatto questo sito non dorme da giorni. Si vede.', 36),
  ('Giulia, il ritratto ti fissa. Si sta chiedendo chi ti ha invitata.', 37),
  ('Giulia, i fantasmi ti passano attraverso per non salutarti.', 38),
  ('Giulia, la strega ti ha offerto un passaggio. Di sola andata.', 39),
  ('Andre, la mano fredda sulla spalla era solo per spingerti fuori.', 40),
  ('Andre, sei l''unico che lo zombie non insegue. Troppo lento anche per lui.', 41),
  ('Andre, il testamento ti nomina solo per lasciarti le bollette.', 42),
  ('Bianca, sei così pallida che i fantasmi ti chiedono il segreto.', 43),
  ('Bianca, il vampiro ti ha guardata e ha scelto il pomodoro.', 44),
  ('Bianca, ti hanno scambiata per la tovaglia.', 45),
  ('Chiara, la candela si spegne quando passi tu. Anche la conversazione.', 46),
  ('Chiara, di chiaro c''è solo che non hai capito niente.', 47),
  ('Chiara, la tua ombra ha chiesto il trasferimento.', 48),
  ('Gabri, il corvo ha imparato il tuo nome. Lo usa come insulto.', 49),
  ('Gabri, anche il gatto nero si gira dall''altra parte.', 50),
  ('Gabri, la zucca intagliata ha un''espressione più sveglia.', 51),
  ('Gio, ti ho visto ieri notte. Peccato.', 52),
  ('Gio, il fantasma ha chiesto di cambiare tavolo.', 53),
  ('Gio, il buio ti dona. Restaci.', 54),
  ('Sara, il tuo riflesso è rimasto indietro: si vergognava.', 55),
  ('Sara, lo specchio si è incrinato. Colpa tua.', 56),
  ('Sara, la strega ti ha guardata e ha posato la scopa: inutile.', 57),
  ('Pietro, anche i fantasmi fingono di non conoscerti.', 58),
  ('Pietro, il vampiro ti ha assaggiato e ha chiesto il conto.', 59),
  ('Pietro, sei il primo sospettato. Di tutto. Da sempre.', 60),
  ('Pietro, la zucca ha più capelli di te. E idee.', 61),
  ('Pietro, gli zombie cercano cervelli: con te sono a posto.', 62),
  ('Pietro, la strega ti ha guardato e ha chiuso il calderone.', 63),
  ('Pietro, il corvo ride di te. Ha ragione.', 64),
  ('Pietro, stasera muori tu. Di vergogna, come al solito.', 65),
  ('Pietro, spegnete le candele: basta la sua testa a fare luce.', 66),
  ('Pietro, la casa era tranquilla prima che entrassi.', 67),
  ('Pietro, il cimitero ha rifiutato la tua prenotazione: troppo noioso.', 68),
  ('Pietro, i fantasmi si specchiano sulla tua testa per sistemarsi il lenzuolo.', 69),
  ('Pietro, l''assassino ha un alibi. Tu neanche una scusa.', 70),
  ('Pietro, il teschio sullo scaffale ti ha scambiato per un cugino.', 71),
  ('Ali, la tua squadra ha votato: sei tu la vittima sacrificale.', 72),
  ('Ali, il lupo mannaro ti ha annusato e ha preferito la luna.', 73),
  ('Mela, il verme dentro di te ha chiesto un affitto più basso.', 74),
  ('Mela, la strega ti ha messa nel cesto degli scarti.', 75),
  ('Ludo, il fantasma del castello ti ha chiesto di abbassare la voce.', 76),
  ('Ludo, l''unico mistero stasera è perché sei qui.', 77),
  ('Sasso, rotoli verso la soluzione. Molto lentamente.', 78),
  ('Sasso, la gargoyle ti ha scambiato per un parente.', 79),
  ('Losco, se muore qualcuno, la regia guarda te.', 80),
  ('Losco, perfino l''ombra ti tiene d''occhio.', 81),
  ('Tenca, l''acqua stagnante ha più movimento di te.', 82),
  ('Tenca, hai la memoria di un pesce e si vede dall''accusa.', 83),
  ('Teo, architetto di cosa? Hai spostato due pulsanti.', 84),
  ('Teo, il fantasma dice che il tuo codice infesta Netlify.', 85),
  ('Giulia, la bambola maledetta ti ha chiesto di smettere di fissarla.', 86),
  ('Giulia, anche il buio si annoia con te.', 87),
  ('Andre, il becchino ti ha preso le misure. Per scrupolo.', 88),
  ('Andre, sei l''indizio falso della serata.', 89),
  ('Bianca, la mummia ha più colorito.', 90),
  ('Bianca, il lenzuolo del fantasma ti sta largo.', 91),
  ('Chiara, la sfera di cristallo si è appannata appena ti ha vista.', 92),
  ('Chiara, i pipistrelli ci vedono meglio di te al buio. E alla luce.', 93),
  ('Gabri, il cappello della strega ti starebbe bene. Copre.', 94),
  ('Gabri, i ragni hanno tessuto la tela sulla tua ultima idea.', 95),
  ('Gio, sei il tipo di invitato che il cadavere avrebbe evitato.', 96),
  ('Gio, il pozzo nel giardino ha più profondità di te.', 97),
  ('Sara, il gatto nero ti ha dato sfortuna. Anzi no, eri già così.', 98),
  ('Sara, la scopa della strega ha chiesto di non volare con te.', 99),
  ('Pietro, la luna piena si è vista riflessa. Sulla tua testa.', 100),
  ('Pietro, i pipistrelli usano la tua testa come pista d''atterraggio.', 101),
  ('Pietro, il lupo mannaro ti invidia: almeno lui i peli li ha.', 102),
  ('Pietro, l''esorcista ha provato. Il demone era più simpatico.', 103),
  ('Pietro, la bara è pronta. Hanno scelto la più economica.', 104),
  ('Pietro, sei la prova che i morti viventi esistono.', 105),
  ('La regia vi osserva. E ride.', 106),
  ('Uno di voi non tornerà a casa. Speriamo Pietro.', 107),
  ('Il cadavere era più vivace di questa squadra.', 108),
  ('Qualcuno ha già sbagliato l''accusa. Si vede dalla faccia.', 109),
  ('Sara, il fantasma ti ha vista e si è nascosto lui.', 110),
  ('Sara, la strega ti ha offerto una mela. Per toglierti di mezzo.', 111),
  ('Sara, anche il vampiro preferisce digiunare.', 112),
  ('Sara, il cimitero ha più vita della tua squadra.', 113),
  ('Sara, sei arrivata tardi pure al tuo funerale.', 114)
) AS f(testo, ordine)
WHERE NOT EXISTS (SELECT 1 FROM sussurro x WHERE x.serata_id = s.id);
`,
  },
  {
    // Copia di sicurezza prima della 2.0: tutte le tabelle, così com'erano, nello schema copia_prima_della_2_0.
    // Sta prima della 2.0 di proposito: sul sito vero gira subito prima del passaggio. Non tocca le tabelle in uso;
    // sui database già passati alla 2.0 copia lo stato di quel momento, e non serve a nulla di più.
    nome: "20261101175900_copia_prima_della_2_0",
    sql: String.raw`
CREATE SCHEMA IF NOT EXISTS copia_prima_della_2_0;
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS copia_prima_della_2_0.%I AS TABLE public.%I', t.table_name, t.table_name);
  END LOOP;
END $$;
`,
  },
  {
    // 2.0: più regie e più serate. Le persone (amministrazione e regia) stanno in utente; squadre e proiettore restano in account,
    // con il nome utente unico dentro la serata. L'account regia della 1.x diventa un utente regia proprietario della sua serata
    // e resta in account, disattivato. L'amministratore nasce dopo, con SETUP_CODE.
    nome: "20261101180000_utenti_e_serate",
    sql: String.raw`
CREATE TABLE IF NOT EXISTS utente (
  id             SERIAL PRIMARY KEY,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  nome           TEXT NOT NULL DEFAULT '',
  email          TEXT,
  admin          BOOLEAN NOT NULL DEFAULT FALSE,
  stato          TEXT NOT NULL DEFAULT 'attivo' CHECK (stato IN ('attivo', 'sospeso')),
  versione_token INTEGER NOT NULL DEFAULT 1,
  creato         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_accesso TIMESTAMPTZ
);

-- Link monouso: invito a diventare regia, o nuova password per un utente che l'ha persa. Del token si salva solo l'hash.
CREATE TABLE IF NOT EXISTS invito (
  id          SERIAL PRIMARY KEY,
  token_hash  TEXT NOT NULL UNIQUE,
  tipo        TEXT NOT NULL DEFAULT 'regia' CHECK (tipo IN ('regia', 'password')),
  nome        TEXT NOT NULL DEFAULT '',
  email       TEXT,
  utente_id   INTEGER REFERENCES utente(id) ON DELETE CASCADE,
  creato_da   INTEGER REFERENCES utente(id) ON DELETE SET NULL,
  creato      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scade       TIMESTAMPTZ NOT NULL,
  usato       TIMESTAMPTZ,
  revocato    TIMESTAMPTZ
);

ALTER TABLE serata ADD COLUMN IF NOT EXISTS proprietario_id INTEGER REFERENCES utente(id) ON DELETE SET NULL;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS archiviata BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS aggiornata TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE UNIQUE INDEX IF NOT EXISTS serata_slug ON serata (slug);

ALTER TABLE account ADD COLUMN IF NOT EXISTS attivo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE account DROP CONSTRAINT IF EXISTS account_username_key;
CREATE UNIQUE INDEX IF NOT EXISTS account_serata_username ON account (serata_id, username);
ALTER TABLE tentativo_login ADD COLUMN IF NOT EXISTS serata_id INTEGER;

-- L'account regia della 1.x diventa un utente con lo stesso nome e la stessa password (la sessione aperta va rifatta).
INSERT INTO utente (username, password_hash, creato, ultimo_accesso)
SELECT username, password_hash, creato, ultimo_accesso FROM account WHERE ruolo = 'regia'
ON CONFLICT (username) DO NOTHING;
UPDATE serata s SET proprietario_id = u.id
FROM account a JOIN utente u ON u.username = a.username
WHERE a.ruolo = 'regia' AND a.serata_id = s.id AND s.proprietario_id IS NULL;
UPDATE account SET attivo = FALSE WHERE ruolo = 'regia';

-- Indirizzo pubblico dal titolo, senza accenti; a parità di titolo si aggiunge l'id.
UPDATE serata SET slug = x.slug FROM (
  SELECT id, base || CASE WHEN ROW_NUMBER() OVER (PARTITION BY base ORDER BY id) > 1 THEN '-' || id ELSE '' END AS slug
  FROM (
    SELECT id, COALESCE(NULLIF(LEFT(TRIM(BOTH '-' FROM REGEXP_REPLACE(
      LOWER(TRANSLATE(titolo, 'àáâäèéêëìíîïòóôöùúûüçÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÇ', 'aaaaeeeeiiiioooouuuucaaaaeeeeiiiioooouuuuc')),
      '[^a-z0-9]+', '-', 'g')), 40), ''), 'serata') AS base
    FROM serata WHERE slug IS NULL
  ) b
) x WHERE serata.id = x.id;
`,
  },
  {
    // 2.1: invitati della serata con i vincoli per il sorteggio delle squadre, e tempi delle nuvolette decisi dalla regia.
    nome: "20261101210000_invitati_e_tempi_nuvolette",
    sql: String.raw`
CREATE TABLE IF NOT EXISTS invitato (
  id         SERIAL PRIMARY KEY,
  serata_id  INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  squadra_id INTEGER REFERENCES squadra(id) ON DELETE SET NULL,
  ordine     INTEGER NOT NULL DEFAULT 0,
  creato     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS invitato_serata ON invitato (serata_id, ordine);

-- Due invitati da tenere in squadre diverse o nella stessa squadra.
CREATE TABLE IF NOT EXISTS vincolo (
  id        SERIAL PRIMARY KEY,
  serata_id INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  a         INTEGER NOT NULL REFERENCES invitato(id) ON DELETE CASCADE,
  b         INTEGER NOT NULL REFERENCES invitato(id) ON DELETE CASCADE,
  tipo      TEXT NOT NULL CHECK (tipo IN ('divisi', 'insieme')),
  UNIQUE (a, b)
);

ALTER TABLE serata ADD COLUMN IF NOT EXISTS sussurri_attesa_min INTEGER NOT NULL DEFAULT 20;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS sussurri_attesa_max INTEGER NOT NULL DEFAULT 45;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS sussurri_durata INTEGER NOT NULL DEFAULT 10;
`,
  },
  {
    // 2.3: prova generale, personaggi interpretati dagli invitati, aiuti a richiesta, suoni d'ambiente del proiettore.
    nome: "20261102100000_versione_2_3",
    sql: String.raw`
-- La squadra della prova generale: nascosta a elenchi, proiettore, sorteggio, biglietti e resoconto.
ALTER TABLE squadra ADD COLUMN IF NOT EXISTS prova BOOLEAN NOT NULL DEFAULT FALSE;

-- Chi interpreta un personaggio (facoltativo) e cosa sa solo lui.
ALTER TABLE invitato ADD COLUMN IF NOT EXISTS personaggio_id INTEGER REFERENCES personaggio(id) ON DELETE SET NULL;
ALTER TABLE personaggio ADD COLUMN IF NOT EXISTS copione TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS aiuto (
  id         SERIAL PRIMARY KEY,
  serata_id  INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  squadra_id INTEGER NOT NULL REFERENCES squadra(id) ON DELETE CASCADE,
  prova_id   INTEGER REFERENCES prova(id) ON DELETE SET NULL,
  domanda    TEXT NOT NULL DEFAULT '',
  stato      TEXT NOT NULL DEFAULT 'attesa' CHECK (stato IN ('attesa', 'dato', 'rifiutato')),
  risposta   TEXT NOT NULL DEFAULT '',
  penalita   INTEGER NOT NULL DEFAULT 0,
  chiesto    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  risposto   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS aiuto_serata ON aiuto (serata_id, chiesto);

ALTER TABLE serata ADD COLUMN IF NOT EXISTS aiuti_attivi BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS aiuti_max INTEGER NOT NULL DEFAULT 3;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS ambiente_attivo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS ambiente_volume INTEGER NOT NULL DEFAULT 50;
`,
  },
  {
    // 3.0: registro dell'amministrazione e grandezza degli allegati (Netlify Blobs non la dice senza scaricare il file).
    nome: "20261102160000_amministrazione_3_0",
    sql: String.raw`
CREATE TABLE IF NOT EXISTS registro_admin (
  id        SERIAL PRIMARY KEY,
  autore_id INTEGER REFERENCES utente(id) ON DELETE SET NULL,
  autore    TEXT NOT NULL DEFAULT '',
  azione    TEXT NOT NULL,
  bersaglio TEXT NOT NULL DEFAULT '',
  ora       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS registro_admin_ora ON registro_admin (ora DESC);

-- Senza vincolo verso serata: un file rimasto senza serata si conta lo stesso, con serata_id NULL.
CREATE TABLE IF NOT EXISTS allegato (
  chiave    TEXT PRIMARY KEY,
  serata_id INTEGER,
  byte      BIGINT NOT NULL,
  tipo      TEXT NOT NULL DEFAULT '',
  creato    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS allegato_serata ON allegato (serata_id);
`,
  },
  {
    // 3.0: inviti agli ospiti (link personale, conferma di presenza) e votazioni con premi.
    nome: "20261102180000_inviti_e_premi",
    sql: String.raw`
ALTER TABLE serata ADD COLUMN IF NOT EXISTS cena_quando TIMESTAMPTZ;
ALTER TABLE serata ADD COLUMN IF NOT EXISTS cena_dove TEXT NOT NULL DEFAULT '';
ALTER TABLE serata ADD COLUMN IF NOT EXISTS dress_code TEXT NOT NULL DEFAULT '';
ALTER TABLE serata ADD COLUMN IF NOT EXISTS nota_invito TEXT NOT NULL DEFAULT '';

-- Il link personale dell'ospite: apre solo la sua pagina d'invito, non la serata.
ALTER TABLE invitato ADD COLUMN IF NOT EXISTS token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS invitato_token ON invitato (token);
ALTER TABLE invitato ADD COLUMN IF NOT EXISTS presenza TEXT CHECK (presenza IN ('si', 'no', 'forse'));
ALTER TABLE invitato ADD COLUMN IF NOT EXISTS nota_ospite TEXT NOT NULL DEFAULT '';
ALTER TABLE invitato ADD COLUMN IF NOT EXISTS risposto TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS premio (
  id         SERIAL PRIMARY KEY,
  serata_id  INTEGER NOT NULL REFERENCES serata(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  candidati  TEXT NOT NULL CHECK (candidati IN ('invitati', 'personaggi', 'squadre')),
  stato      TEXT NOT NULL DEFAULT 'preparato' CHECK (stato IN ('preparato', 'aperto', 'chiuso', 'rivelato')),
  ordine     INTEGER NOT NULL DEFAULT 0,
  rivelato   TIMESTAMPTZ
);
-- Un voto per telefono e per premio: il telefono si riconosce da un identificativo casuale del browser.
CREATE TABLE IF NOT EXISTS voto (
  premio_id   INTEGER NOT NULL REFERENCES premio(id) ON DELETE CASCADE,
  dispositivo TEXT NOT NULL,
  squadra_id  INTEGER NOT NULL REFERENCES squadra(id) ON DELETE CASCADE,
  candidato   INTEGER NOT NULL,
  ora         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (premio_id, dispositivo)
);

-- Scena nuova del proiettore: i premi rivelati.
ALTER TABLE scena DROP CONSTRAINT IF EXISTS scena_tipo_check;
ALTER TABLE scena ADD CONSTRAINT scena_tipo_check CHECK (tipo IN ('narrazione', 'immagine', 'video', 'audio', 'conto', 'avanzamento', 'annuncio', 'rivelazione', 'attesa', 'premi'));
`,
  },
];
