import { NetlifyDB } from "@netlify/database-dev";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { apriDb, Db, migra } from "../base.ts";
import { rispostaFile } from "../file.ts";
import { combacia } from "../regia.ts";
import { gestisci } from "../router.ts";

process.env.SESSION_SECRET = "segreto-di-prova-lungo-almeno-trentadue-caratteri";
process.env.SETUP_CODE = "codice-avvio";

let pg: NetlifyDB;
let db: Db;

beforeAll(async () => {
  pg = new NetlifyDB();
  const cs = await pg.start();
  db = apriDb(cs);
  await migra(db);
  await migra(db);
}, 60_000);
afterAll(async () => {
  await db.fine?.();
  await pg.stop();
});

async function chiama(metodo: string, path: string, body?: unknown, cookie?: string) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const res = await gestisci(new Request(`https://cena.test${path}`, { method: metodo, headers, body: body === undefined ? undefined : JSON.stringify(body) }), db);
  const set = res.headers.get("set-cookie");
  return { stato: res.status, dati: (await res.json()) as any, cookie: set ? set.split(";")[0] : undefined };
}

const ids: Record<string, number> = {};
let regia = "";
let corvi = "";
let gufi = "";
let schermo = "";
let credCorvi = { username: "", password: "" };

describe("primo avvio e accesso", () => {
  test("serve il codice di primo avvio e funziona una sola volta", async () => {
    expect((await chiama("GET", "/api/avvio")).dati.configurato).toBe(false);
    const no = await chiama("POST", "/api/avvio", { codice: "sbagliato", username: "regia", password: "una-password-lunga" });
    expect(no.stato).toBe(403);
    const corta = await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "regia", password: "corta" });
    expect(corta.stato).toBe(400);
    const ok = await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "Regia", password: "una-password-lunga", titolo: "La notte di Villa Corvina" });
    expect(ok.stato).toBe(201);
    regia = ok.cookie!;
    const di_nuovo = await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "altro", password: "una-password-lunga" });
    expect(di_nuovo.stato).toBe(409);
    expect((await chiama("GET", "/api/io", undefined, regia)).dati).toMatchObject({ ruolo: "regia", username: "regia" });
  });

  test("senza sessione la regia è chiusa", async () => {
    expect((await chiama("GET", "/api/regia")).stato).toBe(401);
    expect((await chiama("GET", "/api/regia", undefined, "cena_sessione=falso.falso")).stato).toBe(401);
  });
});

describe("la regia prepara la serata", () => {
  test("caso, fasi, squadre, proiettore", async () => {
    expect((await chiama("PUT", "/api/regia/caso", {
      titolo: "La notte di Villa Corvina", premessa: "Il conte non è sceso a cena.",
      colpevole: "La governante", movente: "L'eredità", arma: "Veleno nel porto",
    }, regia)).stato).toBe(200);
    expect((await chiama("PUT", "/api/regia/fasi", { fasi: [{ nome: "Prologo" }, { nome: "Le confessioni", durata_minuti: 15 }, { nome: "Il buio" }] }, regia)).stato).toBe(200);

    const c = await chiama("POST", "/api/regia/squadre", { nome: "Corvi", colore: "#ff7a1a" }, regia);
    expect(c.stato).toBe(201);
    expect(c.dati.username).toBe("corvi");
    expect(c.dati.password).toMatch(/^[a-z]+-[a-z]+-\d{2}$/);
    credCorvi = { username: c.dati.username, password: c.dati.password };
    ids.corvi = c.dati.id;
    const g = await chiama("POST", "/api/regia/squadre", { nome: "Gufi", colore: "#7b4bc9" }, regia);
    ids.gufi = g.dati.id;
    expect((await chiama("POST", "/api/regia/squadre", { nome: "corvi" }, regia)).stato).toBe(409);

    corvi = (await chiama("POST", "/api/accesso", credCorvi)).cookie!;
    gufi = (await chiama("POST", "/api/accesso", { username: g.dati.username, password: g.dati.password })).cookie!;
    const sc = await chiama("POST", "/api/regia/schermi", {}, regia);
    schermo = (await chiama("POST", "/api/accesso", { username: sc.dati.username, password: sc.dati.password })).cookie!;
    expect(corvi && gufi && schermo).toBeTruthy();
  });

  test("prove con regole diverse", async () => {
    const crea = async (numero: number, titolo: string, regole: unknown[]) => {
      const r = await chiama("POST", "/api/regia/prove", { numero, titolo, testo: `Testo di ${titolo}`, in_elenco: true, regole }, regia);
      expect(r.stato, JSON.stringify(r.dati)).toBe(201);
      ids[`p${numero}`] = r.dati.id;
    };
    await crea(1, "Lettera bruciacchiata", [{ tipo: "fase", fase_numero: 1 }]);
    await crea(2, "La chiave della cantina", [{ tipo: "pin", pin: "1031" }]);
    await crea(3, "Il registro della cantina", [{ tipo: "prova", prova_richiesta_id: ids.p2 }, { tipo: "pin", pin: "6613" }]);
    await crea(4, "La bottiglia vuota", [{ tipo: "prova", prova_richiesta_id: ids.p3 }]);
    await crea(5, "Il diario del medico", [{ tipo: "fase", fase_numero: 2 }]);
    await crea(6, "Segreto di squadra", [
      { tipo: "pin", pin: "aaa1", squadra_id: ids.corvi, gruppo: 1 },
      { tipo: "pin", pin: "bbb2", squadra_id: ids.gufi, gruppo: 2 },
    ]);
    await crea(7, "Solo per i Gufi", [{ tipo: "pin", pin: "xyz9", squadra_id: ids.gufi }, { tipo: "prova", prova_richiesta_id: ids.p1 }]);
    await crea(8, "La consegna la regia", []);
    const doppio = await chiama("POST", "/api/regia/prove", { numero: 9, titolo: "Doppione", regole: [{ tipo: "pin", pin: "1031" }] }, regia);
    expect(doppio.stato).toBe(409);
  });

  test("scene", async () => {
    const a = await chiama("POST", "/api/regia/scene", { tipo: "narrazione", titolo: "Mezzanotte in biblioteca", ordine: 1, fase_numero: 1, avvio_automatico: true }, regia);
    ids.scenaUno = a.dati.id;
    await chiama("POST", "/api/regia/scene", { tipo: "avanzamento", titolo: "Chi è più vicino alla verità", ordine: 2 }, regia);
    await chiama("POST", "/api/regia/scene", { tipo: "rivelazione", titolo: "La verità", ordine: 3 }, regia);
  });
});

describe("la serata", () => {
  test("prima dell'inizio i sigilli sono fermi e la squadra non vede nulla", async () => {
    const s = await chiama("GET", "/api/squadra/stato", undefined, corvi);
    expect(s.stato).toBe(200);
    expect(s.dati.prove.every((p: any) => !p.aperta && p.titolo === undefined)).toBe(true);
    expect(s.dati.prove.find((p: any) => p.numero === 2).motivo).toBe("Serve un codice");
    expect(s.dati.prove.find((p: any) => p.numero === 4).motivo).toBe("Si apre dopo la prova 3");
    expect((await chiama("POST", "/api/squadra/codice", { codice: "1031" }, corvi)).stato).toBe(409);
    expect((await chiama("GET", "/api/regia", undefined, corvi)).stato).toBe(403);
  });

  test("la fase 1 apre le prove di fase e manda in onda la sua scena", async () => {
    expect((await chiama("POST", "/api/regia/fase", { numero: 1 }, regia)).stato).toBe(200);
    const s = await chiama("GET", "/api/squadra/stato", undefined, corvi);
    expect(s.dati.serata.stato).toBe("in_corso");
    expect(s.dati.prove.find((p: any) => p.numero === 1)).toMatchObject({ aperta: true, titolo: "Lettera bruciacchiata", via: "fase" });
    const sc = await chiama("GET", "/api/schermo/stato", undefined, schermo);
    expect(sc.dati.scena).toMatchObject({ tipo: "narrazione", titolo: "Mezzanotte in biblioteca" });
    expect(sc.dati.fase.nome).toBe("Prologo");
  });

  test("codici: in ordine sbagliato, poi la catena", async () => {
    expect((await chiama("POST", "/api/squadra/codice", { codice: "6613" }, corvi)).dati.esito).toBe("non_ancora");
    const due = await chiama("POST", "/api/squadra/codice", { codice: " 10 31 " }, corvi);
    expect(due.dati).toEqual({ esito: "aperta", prove: [ids.p2] });
    expect((await chiama("POST", "/api/squadra/codice", { codice: "1031" }, corvi)).dati.esito).toBe("gia_aperta");
    const tre = await chiama("POST", "/api/squadra/codice", { codice: "6613" }, corvi);
    expect(tre.dati).toEqual({ esito: "aperta", prove: [ids.p3] });
    const s = await chiama("GET", "/api/squadra/stato", undefined, corvi);
    expect(s.dati.prove.find((p: any) => p.numero === 4)).toMatchObject({ aperta: true, via: "catena" });
    const g = await chiama("GET", "/api/squadra/stato", undefined, gufi);
    expect(g.dati.prove.find((p: any) => p.numero === 2).aperta).toBe(false);
  });

  test("codici riservati a una squadra", async () => {
    expect((await chiama("POST", "/api/squadra/codice", { codice: "AAA1" }, corvi)).dati.esito).toBe("aperta");
    expect((await chiama("POST", "/api/squadra/codice", { codice: "bbb2" }, corvi)).dati.esito).toBe("sbagliato");
    expect((await chiama("POST", "/api/squadra/codice", { codice: "bbb2" }, gufi)).dati.esito).toBe("aperta");
    const s = await chiama("GET", "/api/squadra/stato", undefined, corvi);
    expect(s.dati.prove.find((p: any) => p.numero === 7).aperta).toBe(false);
    expect((await chiama("POST", "/api/squadra/codice", { codice: "xyz9" }, gufi)).dati.esito).toBe("aperta");
  });

  test("troppi codici sbagliati bloccano la squadra per due minuti", async () => {
    for (let i = 0; i < 4; i++) {
      const r = await chiama("POST", "/api/squadra/codice", { codice: `000${i}` }, gufi);
      expect(r.dati.esito).toBe("sbagliato");
    }
    const quinto = await chiama("POST", "/api/squadra/codice", { codice: "0009" }, gufi);
    expect(quinto.dati.esito).toBe("bloccato");
    expect(quinto.dati.secondi).toBeGreaterThan(100);
    const anche_giusto = await chiama("POST", "/api/squadra/codice", { codice: "1031" }, gufi);
    expect(anche_giusto.dati.esito).toBe("bloccato");
  });

  test("consegna dalla regia, annunci, fase 2", async () => {
    expect((await chiama("POST", "/api/regia/consegna", { prova_id: ids.p8, squadra_id: ids.gufi }, regia)).stato).toBe(200);
    await chiama("POST", "/api/regia/annunci", { testo: "Il maggiordomo accetta domande." }, regia);
    await chiama("POST", "/api/regia/annunci", { testo: "Solo per voi.", squadra_id: ids.gufi }, regia);
    await chiama("POST", "/api/regia/fase", { numero: 2 }, regia);
    const g = await chiama("GET", "/api/squadra/stato", undefined, gufi);
    expect(g.dati.prove.find((p: any) => p.numero === 8)).toMatchObject({ aperta: true, via: "regia" });
    expect(g.dati.prove.find((p: any) => p.numero === 5).aperta).toBe(true);
    expect(g.dati.annunci.map((a: any) => a.testo)).toEqual(["Solo per voi.", "Il maggiordomo accetta domande."]);
    const c = await chiama("GET", "/api/squadra/stato", undefined, corvi);
    expect(c.dati.annunci).toHaveLength(1);
    expect(c.dati.fase).toMatchObject({ numero: 2, nome: "Le confessioni", totale: 3 });
  });

  test("proiettore: scena successiva e avanzamento", async () => {
    await chiama("POST", "/api/regia/onda/successiva", {}, regia);
    const sc = await chiama("GET", "/api/schermo/stato", undefined, schermo);
    expect(sc.dati.scena.tipo).toBe("avanzamento");
    expect(sc.dati.scena.totaleProve).toBe(8);
    expect(sc.dati.scena.squadre[0].aperte).toBeGreaterThan(0);
    expect((await chiama("GET", "/api/schermo/stato", undefined, corvi)).stato).toBe(403);
  });

  test("nuova password: la vecchia sessione si chiude", async () => {
    const t = await chiama("GET", "/api/regia", undefined, regia);
    const acc = t.dati.squadre.find((s: any) => s.nome === "Corvi").account_id;
    const r = await chiama("POST", `/api/regia/account/${acc}/password`, {}, regia);
    expect(r.stato).toBe(200);
    expect((await chiama("GET", "/api/squadra/stato", undefined, corvi)).stato).toBe(401);
    expect((await chiama("POST", "/api/accesso", credCorvi)).stato).toBe(401);
    corvi = (await chiama("POST", "/api/accesso", { username: credCorvi.username, password: r.dati.password })).cookie!;
    expect((await chiama("GET", "/api/squadra/stato", undefined, corvi)).stato).toBe(200);
  });

  test("accuse, rivelazione e punteggi", async () => {
    expect((await chiama("POST", "/api/squadra/accusa", { colpevole: "la governante", movente: "l'eredita", arma: "il veleno" }, corvi)).stato).toBe(201);
    expect((await chiama("POST", "/api/squadra/accusa", { colpevole: "x", movente: "y", arma: "z" }, corvi)).stato).toBe(409);
    await chiama("POST", "/api/squadra/accusa", { colpevole: "Il maggiordomo", movente: "Gelosia", arma: "Pugnale" }, gufi);
    expect((await chiama("POST", "/api/regia/rivela", {}, regia)).stato).toBe(200);
    const t = await chiama("GET", "/api/regia", undefined, regia);
    const pt = Object.fromEntries(t.dati.accuse.map((a: any) => [a.squadra, a.punteggio]));
    expect(pt).toEqual({ Corvi: 3, Gufi: 0 });
    const sc = await chiama("GET", "/api/schermo/stato", undefined, schermo);
    expect(sc.dati.scena).toMatchObject({ tipo: "rivelazione", rivelata: true });
    expect(sc.dati.scena.vincitori.map((v: any) => v.nome)).toEqual(["Corvi"]);
  });

  test("esporta e reimporta il caso, poi azzera", async () => {
    const e = await chiama("GET", "/api/regia/esporta", undefined, regia);
    expect(e.dati.prove).toHaveLength(8);
    expect(e.dati.prove[2].regole).toEqual([
      { tipo: "prova", pin: null, prova_richiesta: 2, fase_numero: null, gruppo: 1 },
      { tipo: "pin", pin: "6613", prova_richiesta: null, fase_numero: null, gruppo: 1 },
    ]);
    expect((await chiama("POST", "/api/regia/azzera", { conferma: "no" }, regia)).stato).toBe(400);
    expect((await chiama("POST", "/api/regia/azzera", { conferma: "AZZERA" }, regia)).stato).toBe(200);
    expect((await chiama("POST", "/api/regia/importa", { conferma: "SOSTITUISCI", caso: e.dati }, regia)).stato).toBe(200);
    const s = await chiama("GET", "/api/squadra/stato", undefined, corvi);
    expect(s.dati.prove).toHaveLength(8);
    expect(s.dati.prove.find((p: any) => p.numero === 7).motivo).toBe("La consegna la regia");
    expect(s.dati.prove.every((p: any) => !p.aperta)).toBe(true);
    expect(s.dati.serata.stato).toBe("bozza");
  });

  test("blocco dell'accesso dopo troppe password sbagliate", async () => {
    for (let i = 0; i < 8; i++) await chiama("POST", "/api/accesso", { username: "gufi", password: "sbagliata" });
    expect((await chiama("POST", "/api/accesso", { username: "gufi", password: "sbagliata" })).stato).toBe(429);
  });
});

describe("cartelle delle prove", () => {
  test("creare, spostare, eliminare senza perdere prove", async () => {
    const prima = (await chiama("GET", "/api/regia", undefined, regia)).dati.prove.length;
    const a = await chiama("POST", "/api/regia/cartelle", { nome: "Cantina" }, regia);
    expect(a.stato).toBe(201);
    expect((await chiama("POST", "/api/regia/cartelle", { nome: "cantina" }, regia)).stato).toBe(409);
    const b = await chiama("POST", "/api/regia/cartelle", { nome: "Biblioteca" }, regia);
    let t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    const [p1, p2, p3] = t.prove;
    expect((await chiama("POST", "/api/regia/prove/sposta", { prove: [p1.id, p2.id], cartella_id: a.dati.id }, regia)).stato).toBe(200);
    // modificare una prova mantiene la sua cartella
    const r = await chiama("PUT", `/api/regia/prove/${p3.id}`, { ...p3, cartella_id: b.dati.id, regole: p3.regole }, regia);
    expect(r.stato, JSON.stringify(r.dati)).toBe(200);
    t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(t.cartelle.map((c: any) => c.nome)).toEqual(["Cantina", "Biblioteca"]);
    expect(t.prove.filter((p: any) => p.cartella_id === a.dati.id)).toHaveLength(2);
    // rinomina ed esporta/importa le cartelle
    await chiama("PUT", `/api/regia/cartelle/${b.dati.id}`, { nome: "La biblioteca" }, regia);
    const e = (await chiama("GET", "/api/regia/esporta", undefined, regia)).dati;
    expect(e.cartelle).toEqual(["Cantina", "La biblioteca"]);
    expect(e.prove.find((p: any) => p.numero === p3.numero).cartella).toBe("La biblioteca");
    // eliminare una cartella non elimina le sue prove
    const del = await chiama("DELETE", `/api/regia/cartelle/${a.dati.id}`, undefined, regia);
    expect(del.dati.prove_spostate).toBe(2);
    t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(t.prove).toHaveLength(prima);
    expect(t.prove.find((p: any) => p.id === p1.id).cartella_id).toBeNull();
    expect((await chiama("POST", "/api/regia/importa", { conferma: "SOSTITUISCI", caso: e }, regia)).stato).toBe(200);
    t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(t.cartelle.map((c: any) => c.nome)).toEqual(["Cantina", "La biblioteca"]);
    expect(t.prove.filter((p: any) => p.cartella_id !== null)).toHaveLength(3);
    // le squadre non vedono le cartelle
    expect((await chiama("POST", "/api/regia/cartelle", { nome: "x" }, corvi)).stato).toBe(403);
  });

  test("le squadre vedono solo le cartelle visibili e i titoli scelti dalla regia", async () => {
    let t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    const [cA, cB] = t.cartelle;
    const sq = async () => (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati;
    let s = await sq();
    expect(s.cartelle).toEqual([]);
    expect(s.prove.every((p: any) => p.cartella === null)).toBe(true);
    expect(s.prove.filter((p: any) => !p.aperta).every((p: any) => p.titolo === undefined)).toBe(true);
    expect(JSON.stringify(s)).not.toContain(cA.nome);

    expect((await chiama("PUT", `/api/regia/cartelle/${cA.id}`, { visibile: true }, regia)).stato).toBe(200);
    const sigillata = t.prove.find((p: any) => p.cartella_id === cA.id);
    expect((await chiama("POST", "/api/regia/prove/visibilita", { prove: [sigillata.id], prima: "titolo" }, regia)).stato).toBe(200);
    s = await sq();
    expect(s.cartelle).toEqual([{ id: cA.id, nome: cA.nome }]);
    expect(JSON.stringify(s)).not.toContain(cB.nome);
    const vista = s.prove.find((p: any) => p.id === sigillata.id);
    expect(vista.cartella).toBe(cA.id);
    expect(vista.aperta).toBe(false);
    expect(vista.titolo).toBe(sigillata.titolo);
    expect(vista.testo).toBeUndefined();
    // le prove di cartelle nascoste arrivano senza cartella
    const nascosta = t.prove.find((p: any) => p.cartella_id === cB.id);
    expect(s.prove.find((p: any) => p.id === nascosta.id).cartella).toBeNull();

    // rinominare non tocca la visibilità; l'esportazione la conserva
    await chiama("PUT", `/api/regia/cartelle/${cA.id}`, { nome: "Cantina buia" }, regia);
    t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(t.cartelle.find((c: any) => c.id === cA.id)).toMatchObject({ nome: "Cantina buia", visibile: true });
    const e = (await chiama("GET", "/api/regia/esporta", undefined, regia)).dati;
    expect(e.cartelle_visibili).toEqual(["Cantina buia"]);
    expect(e.prove.find((p: any) => p.numero === sigillata.numero).titolo_visibile).toBe(true);
    await chiama("POST", "/api/regia/importa", { conferma: "SOSTITUISCI", caso: e }, regia);
    t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(t.cartelle.find((c: any) => c.nome === "Cantina buia").visibile).toBe(true);
    expect(t.prove.find((p: any) => p.numero === sigillata.numero).titolo_visibile).toBe(true);
    expect((await chiama("POST", "/api/regia/prove/visibilita", { prove: [1], prima: "titolo" }, corvi)).stato).toBe(403);
  });

  test("le prove fuori elenco compaiono solo quando la squadra le apre", async () => {
    await chiama("POST", "/api/regia/fase", { numero: 1 }, regia);
    // senza indicazioni una prova nuova parte nascosta
    const nuova = await chiama("POST", "/api/regia/prove", {
      numero: 77, titolo: "Il biglietto nascosto", tipo: "documento", testo: "segreto",
      regole: [{ tipo: "pin", pin: "4747", gruppo: 1 }],
    }, regia);
    expect(nuova.stato, JSON.stringify(nuova.dati)).toBe(201);
    const sq = async () => (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati;
    let s = await sq();
    expect(s.prove.find((p: any) => p.id === nuova.dati.id)).toBeUndefined();
    expect(JSON.stringify(s)).not.toContain("biglietto");
    // in blocco: si nasconde e si rimostra
    let t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(t.prove.find((p: any) => p.id === nuova.dati.id).in_elenco).toBe(false);
    const altra = t.prove.find((p: any) => p.numero === 6);
    await chiama("POST", "/api/regia/prove/visibilita", { prove: [altra.id], prima: "nascosta" }, regia);
    expect((await sq()).prove.find((p: any) => p.id === altra.id)).toBeUndefined();
    await chiama("POST", "/api/regia/prove/visibilita", { prove: [altra.id], prima: "sigillo" }, regia);
    expect((await sq()).prove.find((p: any) => p.id === altra.id)).toMatchObject({ aperta: false });
    expect((await chiama("POST", "/api/regia/prove/visibilita", { prove: [altra.id], prima: "boh" }, regia)).stato).toBe(400);
    // aperta col codice, compare
    expect((await chiama("POST", "/api/squadra/codice", { codice: "4747" }, corvi)).dati.esito).toBe("aperta");
    s = await sq();
    expect(s.prove.find((p: any) => p.id === nuova.dati.id)).toMatchObject({ aperta: true, titolo: "Il biglietto nascosto" });
    // si conserva nell'esportazione
    const e = (await chiama("GET", "/api/regia/esporta", undefined, regia)).dati;
    expect(e.prove.find((p: any) => p.numero === 77).in_elenco).toBe(false);
  });

  test("l'aggiornamento dello schema conserva i dati di un database già in uso", async () => {
    const { MIGRAZIONI } = await import("../migrazioni.ts");
    const altro = new NetlifyDB();
    const cs = await altro.start();
    const d2 = apriDb(cs);
    await d2.q(MIGRAZIONI[0].sql);
    await d2.q("CREATE TABLE migrazione (nome TEXT PRIMARY KEY, applicata TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    await d2.q("INSERT INTO migrazione (nome) VALUES ($1)", [MIGRAZIONI[0].nome]);
    const s = await d2.uno<{ id: number }>("INSERT INTO serata (titolo) VALUES ('Vecchia') RETURNING id");
    await d2.q("INSERT INTO prova (serata_id, numero, titolo) VALUES ($1, 1, 'Prova vecchia'), ($1, 2, 'Altra')", [s!.id]);
    await migra(d2);
    // le prove nuove partono nascoste alle squadre
    await d2.q("INSERT INTO prova (serata_id, numero, titolo) VALUES ($1, 3, 'Nuova')", [s!.id]);
    expect((await d2.uno<{ in_elenco: boolean }>("SELECT in_elenco FROM prova WHERE numero = 3"))!.in_elenco).toBe(false);
    await d2.q("DELETE FROM prova WHERE numero = 3");
    const righe = await d2.q("SELECT titolo, cartella_id, in_elenco, titolo_visibile FROM prova ORDER BY numero");
    expect(righe).toEqual([
      { titolo: "Prova vecchia", cartella_id: null, in_elenco: false, titolo_visibile: false },
      { titolo: "Altra", cartella_id: null, in_elenco: false, titolo_visibile: false },
    ]);
    await d2.fine?.();
    await altro.stop();
  }, 60_000);
});

test("la soluzione si può nascondere di nuovo", async () => {
  expect((await chiama("POST", "/api/regia/nascondi-soluzione", undefined, corvi)).stato).toBe(403);
  const prima = (await chiama("GET", "/api/regia", undefined, regia)).dati.serata;
  if (!prima.rivelata) await chiama("POST", "/api/regia/rivela", undefined, regia);
  expect((await chiama("POST", "/api/regia/nascondi-soluzione", undefined, regia)).stato).toBe(200);
  const s = (await chiama("GET", "/api/regia", undefined, regia)).dati.serata;
  expect(s.rivelata).toBe(false);
  const sc = (await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati.scena;
  expect(sc.soluzione).toBeUndefined();
});

test("i file si servono anche a pezzi, come serve a Safari per audio e video", async () => {
  const dati = new Uint8Array(1000).map((_, i) => i % 256).buffer;
  const tutto = rispostaFile(dati, "audio/mpeg", null);
  expect(tutto.status).toBe(200);
  expect(tutto.headers.get("accept-ranges")).toBe("bytes");
  const primi = rispostaFile(dati, "audio/mpeg", "bytes=0-1");
  expect(primi.status).toBe(206);
  expect(primi.headers.get("content-range")).toBe("bytes 0-1/1000");
  expect(new Uint8Array(await primi.arrayBuffer())).toEqual(new Uint8Array([0, 1]));
  const resto = rispostaFile(dati, "audio/mpeg", "bytes=990-");
  expect(resto.headers.get("content-range")).toBe("bytes 990-999/1000");
  expect((await resto.arrayBuffer()).byteLength).toBe(10);
  const coda = rispostaFile(dati, "audio/mpeg", "bytes=-5");
  expect(coda.headers.get("content-range")).toBe("bytes 995-999/1000");
  expect(rispostaFile(dati, "audio/mpeg", "bytes=2000-").status).toBe(416);
});

test("confronto delle risposte", () => {
  expect(combacia("la Governante!", "Governante")).toBe(true);
  expect(combacia("Il maggiordomo", "La governante")).toBe(false);
  expect(combacia("", "x")).toBe(false);
});
