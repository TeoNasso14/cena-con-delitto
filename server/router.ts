import * as A from "./accesso.ts";
import { apriDb, Db, Errore, json, migra } from "./base.ts";
import * as F from "./file.ts";
import * as R from "./regia.ts";
import * as S from "./squadra.ts";
import * as SE from "./serate.ts";
import * as AD from "./admin.ts";
import * as IN from "./invitati.ts";
import * as AI from "./aiuti.ts";
import * as MO from "./modelli.ts";
import * as OS from "./ospiti.ts";
import * as PR from "./premi.ts";
import * as PG from "./prova-generale.ts";
import { controllo } from "./controllo.ts";
import { resoconto } from "./resoconto.ts";
import { token as tokenTempoReale } from "./tempo-reale.ts";
import { statoSchermo } from "./schermo.ts";

type Gestore = (req: Request, db: Db, p: Record<string, string>) => Promise<Response> | Response;
const n = (v: string) => Number.parseInt(v, 10);

const rotte: Array<[string, RegExp, Gestore]> = [
  ["GET", /^\/api\/avvio$/, (_r, db) => A.statoAvvio(db)],
  ["GET", /^\/api\/s\/(?<slug>[a-z0-9-]{1,80})$/, (_r, db, p) => A.serataPubblica(db, p.slug)],
  ["POST", /^\/api\/avvio$/, (r, db) => A.primoAvvio(r, db)],
  ["POST", /^\/api\/accesso$/, (r, db) => A.accedi(r, db)],
  ["POST", /^\/api\/uscita$/, () => A.esci()],
  ["GET", /^\/api\/io$/, (r, db) => A.io(r, db)],
  ["GET", /^\/api\/versione$/, (r, db) => A.versione(r, db)],
  ["GET", /^\/api\/tempo-reale$/, (r, db) => tokenTempoReale(r, db)],
  ["GET", /^\/api\/admin$/, (r, db) => AD.tutto(r, db)],
  ["POST", /^\/api\/admin\/inviti$/, (r, db) => AD.invita(r, db)],
  ["POST", /^\/api\/admin\/inviti\/(?<id>\d+)\/revoca$/, (r, db, p) => AD.revoca(r, db, n(p.id))],
  ["POST", /^\/api\/admin\/inviti\/(?<id>\d+)\/rigenera$/, (r, db, p) => AD.rigenera(r, db, n(p.id))],
  ["POST", /^\/api\/admin\/utenti\/(?<id>\d+)\/sospendi$/, (r, db, p) => AD.sospendi(r, db, n(p.id))],
  ["POST", /^\/api\/admin\/utenti\/(?<id>\d+)\/password$/, (r, db, p) => AD.linkPassword(r, db, n(p.id))],
  ["POST", /^\/api\/admin\/utenti\/(?<id>\d+)\/elimina$/, (r, db, p) => AD.elimina(r, db, n(p.id))],
  ["POST", /^\/api\/admin\/utenti\/(?<id>\d+)\/trasferisci$/, (r, db, p) => AD.trasferisci(r, db, n(p.id))],
  ["POST", /^\/api\/admin\/allegati\/misura$/, (r, db) => AD.misura(r, db)],
  ["GET", /^\/api\/ospite\/(?<token>[A-Za-z0-9_-]{20,64})$/, (r, db, p) => OS.pagina(r, db, p.token)],
  ["POST", /^\/api\/ospite\/(?<token>[A-Za-z0-9_-]{20,64})$/, (r, db, p) => OS.rispondi(r, db, p.token)],
  ["GET", /^\/api\/invito\/(?<token>[A-Za-z0-9_-]{20,64})$/, (r, db, p) => AD.leggiInvito(r, db, p.token)],
  ["POST", /^\/api\/invito\/(?<token>[A-Za-z0-9_-]{20,64})$/, (r, db, p) => AD.usaInvito(r, db, p.token)],
  ["GET", /^\/api\/regia\/serate$/, (r, db) => A.mieSerate(r, db)],
  ["POST", /^\/api\/regia\/serate$/, (r, db) => SE.crea(r, db)],
  ["PUT", /^\/api\/regia\/serate\/(?<id>\d+)$/, (r, db, p) => SE.modifica(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/serate\/da-modello$/, (r, db) => MO.creaSerata(r, db)],
  ["GET", /^\/api\/regia\/modelli$/, (r, db) => MO.elenco(r, db)],
  ["POST", /^\/api\/regia\/modelli$/, (r, db) => MO.salva(r, db)],
  ["DELETE", /^\/api\/regia\/modelli\/(?<id>\d+)$/, (r, db, p) => MO.elimina(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/serate\/(?<id>\d+)\/duplica$/, (r, db, p) => SE.duplica(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/serate\/(?<id>\d+)\/archivia$/, (r, db, p) => SE.archivia(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/serate\/(?<id>\d+)\/elimina$/, (r, db, p) => SE.elimina(r, db, n(p.id))],

  ["GET", /^\/api\/squadra\/stato$/, (r, db) => S.stato(r, db)],
  ["POST", /^\/api\/squadra\/codice$/, (r, db) => S.pin(r, db)],
  ["PUT", /^\/api\/squadra\/taccuino$/, (r, db) => S.taccuino(r, db)],
  ["POST", /^\/api\/squadra\/accusa$/, (r, db) => S.accusa(r, db)],
  ["POST", /^\/api\/squadra\/aiuto$/, (r, db) => AI.chiedi(r, db)],
  ["POST", /^\/api\/squadra\/voto$/, (r, db) => PR.vota(r, db)],

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
  ["PUT", /^\/api\/regia\/tema$/, (r, db) => R.tema(r, db)],
  ["PUT", /^\/api\/regia\/sussurri$/, (r, db) => R.sussurri(r, db)],
  ["POST", /^\/api\/regia\/invitati$/, (r, db) => IN.aggiungi(r, db)],
  ["PUT", /^\/api\/regia\/invitati\/(?<id>\d+)$/, (r, db, p) => IN.modifica(r, db, n(p.id))],
  ["DELETE", /^\/api\/regia\/invitati\/(?<id>\d+)$/, (r, db, p) => IN.elimina(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/vincoli$/, (r, db) => IN.aggiungiVincolo(r, db)],
  ["DELETE", /^\/api\/regia\/vincoli\/(?<id>\d+)$/, (r, db, p) => IN.eliminaVincolo(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/sorteggio$/, (r, db) => IN.sorteggia(r, db)],
  ["POST", /^\/api\/regia\/biglietti$/, (r, db) => IN.biglietti(r, db)],
  ["PUT", /^\/api\/regia\/invito-ospiti$/, (r, db) => OS.dettagli(r, db)],
  ["POST", /^\/api\/regia\/invitati\/link$/, (r, db) => OS.linkPerTutti(r, db)],
  ["POST", /^\/api\/regia\/invitati\/(?<id>\d+)\/link$/, (r, db, p) => OS.link(r, db, n(p.id))],
  ["POST", /^\/api\/regia\/premi$/, (r, db) => PR.crea(r, db)],
  ["PUT", /^\/api\/regia\/premi\/(?<id>\d+)$/, (r, db, p) => PR.modifica(r, db, n(p.id))],
  ["DELETE", /^\/api\/regia\/premi\/(?<id>\d+)$/, (r, db, p) => PR.elimina(r, db, n(p.id))],
  ["PUT", /^\/api\/regia\/ambiente$/, (r, db) => R.ambiente(r, db)],
  ["PUT", /^\/api\/regia\/aiuti$/, (r, db) => AI.impostazioni(r, db)],
  ["PUT", /^\/api\/regia\/aiuti\/(?<id>\d+)$/, (r, db, p) => AI.rispondi(r, db, n(p.id))],
  ["GET", /^\/api\/regia\/controllo$/, (r, db) => controllo(r, db)],
  ["GET", /^\/api\/regia\/resoconto$/, (r, db) => resoconto(r, db)],
  ["POST", /^\/api\/regia\/prova-generale$/, (r, db) => PG.apri(r, db)],
  ["POST", /^\/api\/regia\/prova-generale\/ricomincia$/, (r, db) => PG.ricomincia(r, db)],
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
