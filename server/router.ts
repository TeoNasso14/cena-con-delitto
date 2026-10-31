import * as A from "./accesso.ts";
import { apriDb, Db, Errore, json, migra } from "./base.ts";
import * as F from "./file.ts";
import * as R from "./regia.ts";
import * as S from "./squadra.ts";
import { statoSchermo } from "./schermo.ts";

type Gestore = (req: Request, db: Db, p: Record<string, string>) => Promise<Response> | Response;
const n = (v: string) => Number.parseInt(v, 10);

const rotte: Array<[string, RegExp, Gestore]> = [
  ["GET", /^\/api\/avvio$/, (_r, db) => A.statoAvvio(db)],
  ["POST", /^\/api\/avvio$/, (r, db) => A.primoAvvio(r, db)],
  ["POST", /^\/api\/accesso$/, (r, db) => A.accedi(r, db)],
  ["POST", /^\/api\/uscita$/, () => A.esci()],
  ["GET", /^\/api\/io$/, (r, db) => A.io(r, db)],

  ["GET", /^\/api\/squadra\/stato$/, (r, db) => S.stato(r, db)],
  ["POST", /^\/api\/squadra\/codice$/, (r, db) => S.pin(r, db)],
  ["PUT", /^\/api\/squadra\/taccuino$/, (r, db) => S.taccuino(r, db)],
  ["POST", /^\/api\/squadra\/accusa$/, (r, db) => S.accusa(r, db)],

  ["GET", /^\/api\/schermo\/stato$/, (r, db) => statoSchermo(r, db)],
  ["GET", /^\/api\/file\/(?<key>[A-Za-z0-9_-]+)$/, (r, db, p) => F.servi(r, db, p.key)],

  ["GET", /^\/api\/regia$/, (r, db) => R.tutto(r, db)],
  ["PUT", /^\/api\/regia\/password$/, (r, db) => A.cambiaPasswordRegia(r, db)],
  ["PUT", /^\/api\/regia\/caso$/, (r, db) => R.salvaSerata(r, db)],
  ["PUT", /^\/api\/regia\/fasi$/, (r, db) => R.salvaFasi(r, db)],
  ["POST", /^\/api\/regia\/squadre$/, (r, db) => R.creaSquadra(r, db)],
  ["PUT", /^\/api\/regia\/squadre\/(?<id>\d+)$/, (r, db, p) => R.modificaSquadra(r, db, n(p.id))],
  ["DELETE", /^\/api\/regia\/squadre\/(?<id>\d+)$/, (r, db, p) => R.eliminaSquadra(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/account\/(?<id>\d+)\/password$/, (r, db, p) => R.nuovaPassword(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/schermi$/, (r, db) => R.creaSchermo(r, db)],
  ["DELETE", /^\/api\/regia\/schermi\/(?<id>\d+)$/, (r, db, p) => R.eliminaSchermo(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/personaggi$/, (r, db) => R.creaPersonaggio(r, db)],
  ["PUT", /^\/api\/regia\/personaggi\/(?<id>\d+)$/, (r, db, p) => R.modificaPersonaggio(r, db, n(p.id))],
  ["DELETE", /^\/api\/regia\/personaggi\/(?<id>\d+)$/, (r, db, p) => R.eliminaPersonaggio(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/prove$/, (r, db) => R.creaProva(r, db)],
  ["PUT", /^\/api\/regia\/prove\/(?<id>\d+)$/, (r, db, p) => R.modificaProva(r, db, n(p.id))],
  ["DELETE", /^\/api\/regia\/prove\/(?<id>\d+)$/, (r, db, p) => R.eliminaProva(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/cartelle$/, (r, db) => R.creaCartella(r, db)],
  ["PUT", /^\/api\/regia\/cartelle\/(?<id>\d+)$/, (r, db, p) => R.modificaCartella(r, db, n(p.id))],
  ["DELETE", /^\/api\/regia\/cartelle\/(?<id>\d+)$/, (r, db, p) => R.eliminaCartella(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/prove\/sposta$/, (r, db) => R.spostaProve(r, db)],
  ["POST", /^\/api\/regia\/prove\/visibilita$/, (r, db) => R.visibilitaProve(r, db)],
  ["POST", /^\/api\/regia\/scene$/, (r, db) => R.creaScena(r, db)],
  ["PUT", /^\/api\/regia\/scene\/(?<id>\d+)$/, (r, db, p) => R.modificaScena(r, db, n(p.id))],
  ["DELETE", /^\/api\/regia\/scene\/(?<id>\d+)$/, (r, db, p) => R.eliminaScena(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/onda$/, (r, db) => R.onda(r, db)],
  ["POST", /^\/api\/regia\/onda\/successiva$/, (r, db) => R.ondaSuccessiva(r, db)],
  ["POST", /^\/api\/regia\/schermo-nero$/, (r, db) => R.schermoNero(r, db)],
  ["POST", /^\/api\/regia\/stato$/, (r, db) => R.statoSerata(r, db)],
  ["POST", /^\/api\/regia\/fase$/, (r, db) => R.avviaFase(r, db)],
  ["POST", /^\/api\/regia\/consegna$/, (r, db) => R.consegna(r, db)],
  ["POST", /^\/api\/regia\/annunci$/, (r, db) => R.annuncio(r, db)],
  ["PUT", /^\/api\/regia\/accuse\/(?<id>\d+)$/, (r, db, p) => R.punteggio(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/rivela$/, (r, db) => R.rivela(r, db)],
  ["PUT", /^\/api\/regia\/sfondo$/, (r, db) => R.sfondo(r, db)],
  ["POST", /^\/api\/regia\/nascondi-soluzione$/, (r, db) => R.nascondiSoluzione(r, db)],
  ["POST", /^\/api\/regia\/azzera$/, (r, db) => R.azzera(r, db)],
  ["GET", /^\/api\/regia\/esporta$/, (r, db) => R.esporta(r, db)],
  ["POST", /^\/api\/regia\/importa$/, (r, db) => R.importa(r, db)],
  ["POST", /^\/api\/regia\/allegati$/, (r, db) => F.carica(r, db)],
];

const pronti = new WeakSet<Db>();

export async function gestisci(req: Request, dbDato?: Db): Promise<Response> {
  let db: Db;
  try {
    db = dbDato ?? apriDb();
    if (!pronti.has(db)) {
      await migra(db);
      pronti.add(db);
    }
  } catch (e) {
    if (e instanceof Errore) return json({ errore: e.message, codice: e.codice }, e.stato);
    console.error(e);
    return json({ errore: "Il database non risponde. Riprova tra poco.", codice: "database" }, 503);
  }
  const path = new URL(req.url).pathname.replace(/\/+$/, "");
  let metodoSbagliato = false;
  for (const [metodo, re, g] of rotte) {
    const m = re.exec(path);
    if (!m) continue;
    if (metodo !== req.method) {
      metodoSbagliato = true;
      continue;
    }
    try {
      return await g(req, db, (m.groups ?? {}) as Record<string, string>);
    } catch (e) {
      if (e instanceof Errore) return json({ errore: e.message, codice: e.codice }, e.stato);
      console.error(e);
      return json({ errore: "Qualcosa è andato storto sul server. Riprova tra poco.", codice: "interno" }, 500);
    }
  }
  return json({ errore: metodoSbagliato ? "Metodo non permesso." : "Indirizzo sconosciuto." }, metodoSbagliato ? 405 : 404);
}
