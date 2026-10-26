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
];
