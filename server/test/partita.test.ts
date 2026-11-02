import { NetlifyDB } from "@netlify/database-dev";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { apriDb, Db, hashPassword, migra } from "../base.ts";
import { rispostaFile } from "../file.ts";
import { combacia } from "../regia.ts";
import { distribuisci } from "../invitati.ts";
import { gestisci } from "../router.ts";

process.env.SESSION_SECRET = "segreto-di-prova-lungo-almeno-trentadue-caratteri";
process.env.SETUP_CODE = "codice-avvio";
process.env.CENA_ARCHIVIO_MEMORIA = "1";

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

/** La regia lavora sulla serata scelta: le sue chiamate portano x-serata (vedi utente() in accesso.ts). */
let serataRegia = 0;

async function chiama(metodo: string, path: string, body?: unknown, cookie?: string, serata?: number) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const sid = serata ?? (cookie && cookie === regia ? serataRegia : 0);
  if (sid) headers["x-serata"] = String(sid);
  const res = await gestisci(new Request(`https://cena.test${path}`, { method: metodo, headers, body: body === undefined ? undefined : JSON.stringify(body) }), db);
  const set = res.headers.get("set-cookie");
  return { stato: res.status, dati: (await res.json()) as any, cookie: set ? set.split(";")[0] : undefined };
}

const ids: Record<string, number> = {};
let regia = "";
let admin = "";
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
    // il primo avvio crea l'amministrazione, che non gestisce serate
    const ok = await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "Teo", password: "password-amministrazione", nome: "Teo" });
    expect(ok.stato).toBe(201);
    admin = ok.cookie!;
    const di_nuovo = await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "altro", password: "una-password-lunga" });
    expect(di_nuovo.stato).toBe(409);
    expect((await chiama("GET", "/api/io", undefined, admin)).dati).toMatchObject({ ruolo: "regia", username: "teo", admin: true });
    expect((await chiama("GET", "/api/avvio")).dati.configurato).toBe(true);
    expect((await chiama("POST", "/api/regia/serate", { titolo: "Di Teo" }, admin)).stato).toBe(403);

    // la regia nasce da un invito: sceglie lei nome utente e password
    const inv = await chiama("POST", "/api/admin/inviti", { nome: "Organizzatrice", email: "org@esempio.it" }, admin);
    expect(inv.stato).toBe(201);
    expect((await chiama("GET", `/api/invito/${inv.dati.token}`)).dati).toEqual({ tipo: "regia", nome: "Organizzatrice", username: null });
    const entra = await chiama("POST", `/api/invito/${inv.dati.token}`, { username: "Regia", password: "una-password-lunga" });
    expect(entra.dati).toEqual({ ruolo: "regia", admin: false });
    regia = entra.cookie!;
    expect((await chiama("POST", `/api/invito/${inv.dati.token}`, { username: "altra", password: "una-password-lunga" })).stato).toBe(410);
    expect((await chiama("GET", "/api/io", undefined, regia)).dati).toMatchObject({ ruolo: "regia", username: "regia", admin: false });
    expect((await chiama("POST", "/api/accesso", { username: "regia", password: "una-password-lunga" })).dati).toEqual({ ruolo: "regia", admin: false });
    expect((await chiama("GET", "/api/regia/serate", undefined, regia)).dati.serate).toEqual([]);
    expect((await chiama("POST", "/api/regia/serate", { titolo: "La notte di Villa Corvina" }, regia)).stato).toBe(201);
    const serate = (await chiama("GET", "/api/regia/serate", undefined, regia)).dati.serate;
    expect(serate).toMatchObject([{ titolo: "La notte di Villa Corvina", slug: "la-notte-di-villa-corvina", archiviata: false }]);
    // senza serata scelta la regia non può lavorare
    expect((await chiama("GET", "/api/regia", undefined, regia)).stato).toBe(400);
    serataRegia = serate[0].id;
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
    // la serata già in uso prende il tema predefinito
    expect(await d2.q("SELECT titolo, tema FROM serata")).toEqual([{ titolo: "Vecchia", tema: "halloween" }]);
    // e si tiene le frasi delle nuvolette che prima erano scritte nel codice
    const frasi = await d2.q<{ testo: string }>("SELECT testo FROM sussurro WHERE serata_id = $1 ORDER BY ordine", [s!.id]);
    expect(frasi).toHaveLength(115);
    expect(frasi[0].testo).toBe("Qualcuno vi sta guardando.");
    expect(frasi.some((f) => f.testo.includes("l'accusa"))).toBe(true);
    expect((await d2.uno<{ sussurri_attivi: boolean }>("SELECT sussurri_attivi FROM serata"))!.sussurri_attivi).toBe(true);
    await d2.fine?.();
    await altro.stop();
  }, 60_000);
});

test("una prova nascosta con 'dopo una prova' e codice compare quando l'altra è consegnata, e si apre solo col codice", async () => {
  await chiama("POST", "/api/regia/fase", { numero: 1 }, regia);
  const crea = async (numero: number, regole: unknown[]) => {
    const r = await chiama("POST", "/api/regia/prove", { numero, titolo: `Prova ${numero}`, regole }, regia);
    expect(r.stato, JSON.stringify(r.dati)).toBe(201);
    return r.dati.id as number;
  };
  const a = await crea(90, []);
  const b = await crea(91, [{ tipo: "prova", prova_richiesta_id: a, gruppo: 1 }, { tipo: "pin", pin: "9191", gruppo: 1 }]);
  const c = await crea(92, [{ tipo: "prova", prova_richiesta_id: b, gruppo: 1 }, { tipo: "pin", pin: "9292", gruppo: 1 }]);
  const soloCodice = await crea(93, [{ tipo: "pin", pin: "9393", gruppo: 1 }]);
  const vede = async () => (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati.prove as any[];
  let v = await vede();
  for (const id of [a, b, c, soloCodice]) expect(v.find((p) => p.id === id)).toBeUndefined();
  // il codice della 91 non basta finché la 90 non c'è
  expect((await chiama("POST", "/api/squadra/codice", { codice: "9191" }, corvi)).dati.esito).toBe("non_ancora");
  const cons = await chiama("POST", "/api/regia/consegna", { prova_id: a, squadra_id: ids.corvi }, regia);
  expect(cons.dati).toMatchObject({ aperta: 1, catena: [91, 92] });
  v = await vede();
  expect(v.find((p) => p.id === a)).toMatchObject({ aperta: true });
  // a catena compaiono sigillate e con il titolo
  expect(v.find((p) => p.id === b)).toMatchObject({ aperta: false, conCodice: true, titolo: "Prova 91" });
  expect(v.find((p) => p.id === c)).toMatchObject({ aperta: false, conCodice: true, titolo: "Prova 92" });
  expect(v.find((p) => p.id === soloCodice)).toBeUndefined();
  // ognuna mantiene le sue condizioni: la 92 aspetta la 91
  expect((await chiama("POST", "/api/squadra/codice", { codice: "9292" }, corvi)).dati.esito).toBe("non_ancora");
  expect((await chiama("POST", "/api/squadra/codice", { codice: "9191" }, corvi)).dati).toEqual({ esito: "aperta", prove: [b] });
  v = await vede();
  expect(v.find((p) => p.id === b)).toMatchObject({ aperta: true });
  expect(v.find((p) => p.id === c)).toMatchObject({ aperta: false });
  expect((await chiama("POST", "/api/squadra/codice", { codice: "9292" }, corvi)).dati).toEqual({ esito: "aperta", prove: [c] });
  // l'altra squadra non vede nulla
  const g = (await chiama("GET", "/api/squadra/stato", undefined, gufi)).dati.prove as any[];
  expect(g.find((p) => p.id === b)).toBeUndefined();
});

test("una prova con codice consegnata dalla regia compare con il titolo e si apre solo col codice", async () => {
  await chiama("POST", "/api/regia/fase", { numero: 1 }, regia);
  const r = await chiama("POST", "/api/regia/prove", { numero: 96, titolo: "La lettera del notaio", testo: "segreto", regole: [{ tipo: "pin", pin: "9696", gruppo: 1 }] }, regia);
  const id = r.dati.id;
  const vede = async () => ((await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati.prove as any[]).find((p) => p.id === id);
  expect(await vede()).toBeUndefined();
  const c = await chiama("POST", "/api/regia/consegna", { prova_id: id, squadra_id: ids.corvi }, regia);
  expect(c.dati).toMatchObject({ aperta: 0, mostrata: 1 });
  const v = await vede();
  expect(v).toMatchObject({ aperta: false, titolo: "La lettera del notaio", conCodice: true });
  expect(v.testo).toBeUndefined();
  // a catena anche partendo da una prova con codice
  const dopo = await chiama("POST", "/api/regia/prove", { numero: 97, titolo: "La busta sigillata", testo: "dentro", regole: [{ tipo: "prova", prova_richiesta_id: id, gruppo: 1 }, { tipo: "pin", pin: "9797", gruppo: 1 }] }, regia);
  const senzaCodice = await chiama("POST", "/api/regia/prove", { numero: 98, titolo: "Il timbro", regole: [{ tipo: "prova", prova_richiesta_id: dopo.dati.id, gruppo: 1 }] }, regia);
  const c2 = await chiama("POST", "/api/regia/consegna", { prova_id: id, squadra_id: ids.corvi }, regia);
  expect(c2.dati.catena).toEqual([97, 98]);
  const tutte = (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati.prove as any[];
  expect(tutte.find((p) => p.id === dopo.dati.id)).toMatchObject({ aperta: false, titolo: "La busta sigillata" });
  expect(tutte.find((p) => p.id === dopo.dati.id).testo).toBeUndefined();
  expect(tutte.find((p) => p.id === senzaCodice.dati.id)).toMatchObject({ aperta: false, titolo: "Il timbro" });
  // una seconda consegna non cambia nulla
  expect((await chiama("POST", "/api/regia/consegna", { prova_id: id, squadra_id: ids.corvi }, regia)).dati).toMatchObject({ gia: 1 });
  // l'altra squadra non la vede
  expect(((await chiama("GET", "/api/squadra/stato", undefined, gufi)).dati.prove as any[]).find((p) => p.id === id)).toBeUndefined();
  expect((await chiama("POST", "/api/squadra/codice", { codice: "9696" }, corvi)).dati).toEqual({ esito: "aperta", prove: [id] });
  expect(await vede()).toMatchObject({ aperta: true, testo: "segreto", via: "pin" });
  // la 97 ora chiede solo il suo codice; la 98 senza codice si apre da sola dopo la 97
  expect((await chiama("POST", "/api/squadra/codice", { codice: "9797" }, corvi)).dati.esito).toBe("aperta");
  const fine = (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati.prove as any[];
  expect(fine.find((p) => p.id === senzaCodice.dati.id)).toMatchObject({ aperta: true, via: "catena" });
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

test("la regia mette la foto di sfondo del proiettore", async () => {
  expect((await chiama("PUT", "/api/regia/sfondo", { key: "s1-x" }, corvi)).stato).toBe(403);
  expect((await chiama("PUT", "/api/regia/sfondo", { key: "s999-altra-serata" }, regia)).stato).toBe(400);
  const sid = (await chiama("GET", "/api/regia", undefined, regia)).dati.serata.id;
  expect((await chiama("PUT", "/api/regia/sfondo", { key: `s${sid}-foto`, opacita: 0.4 }, regia)).stato).toBe(200);
  let sc = (await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati;
  expect(sc.sfondo).toEqual({ url: `/api/file/s${sid}-foto`, opacita: expect.closeTo(0.4, 5) });
  await chiama("PUT", "/api/regia/sfondo", { opacita: 5 }, regia);
  sc = (await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati;
  expect(sc.sfondo.opacita).toBeCloseTo(0.8, 5);
  await chiama("PUT", "/api/regia/sfondo", { key: null }, regia);
  expect((await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati.sfondo).toBeNull();
});

test("la regia sceglie il tema della serata", async () => {
  expect((await chiama("PUT", "/api/regia/tema", { tema: "halloween" }, corvi)).stato).toBe(403);
  expect((await chiama("PUT", "/api/regia/tema", { tema: "fantascienza" }, regia)).stato).toBe(400);
  expect((await chiama("PUT", "/api/regia/tema", {}, regia)).stato).toBe(400);
  const prima = (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati;
  expect(prima.tema).toBe("halloween");
  expect((await chiama("PUT", "/api/regia/tema", { tema: "halloween" }, regia)).stato).toBe(200);
  const dopo = (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati;
  expect(Number(dopo.versione)).toBeGreaterThan(Number(prima.versione));
  expect((await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati.tema).toBe("halloween");
  expect((await chiama("GET", "/api/regia", undefined, regia)).dati.serata.tema).toBe("halloween");
  // la pagina di accesso è pubblica: riceve il tema e nient'altro della serata
  const avvio = await chiama("GET", "/api/avvio");
  expect(avvio.dati).toEqual({ configurato: true, tema: "halloween" });
  // il tema viaggia con il caso esportato
  expect((await chiama("GET", "/api/regia/esporta", undefined, regia)).dati.serata.tema).toBe("halloween");
});

test("la regia decide le frasi delle nuvolette e le può spegnere", async () => {
  const leggi = async () => ({
    squadra: (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati,
    schermo: (await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati.sussurri,
    regia: (await chiama("GET", "/api/regia", undefined, regia)).dati.sussurri,
  });
  // una serata nuova non ha frasi proprie: il client userà quelle del tema
  let ora = await leggi();
  expect(ora.squadra.sussurri).toMatchObject({ attivi: true, frasi: [] });
  expect(ora.regia).toEqual([]);

  expect((await chiama("PUT", "/api/regia/sussurri", { frasi: ["Uno"] }, corvi)).stato).toBe(403);
  expect((await chiama("PUT", "/api/regia/sussurri", { frasi: "Uno" }, regia)).stato).toBe(400);
  expect((await chiama("PUT", "/api/regia/sussurri", { frasi: ["x".repeat(201)] }, regia)).stato).toBe(400);
  expect((await chiama("PUT", "/api/regia/sussurri", { attivi: "no" }, regia)).stato).toBe(400);

  const versione = Number(ora.squadra.versione);
  expect((await chiama("PUT", "/api/regia/sussurri", { frasi: ["  Il gatto vi guarda. ", "", "Mezzanotte."] }, regia)).stato).toBe(200);
  ora = await leggi();
  expect(Number(ora.squadra.versione)).toBeGreaterThan(versione);
  expect(ora.regia).toEqual(["Il gatto vi guarda.", "Mezzanotte."]);
  expect(ora.squadra.sussurri).toMatchObject({ attivi: true, frasi: ["Il gatto vi guarda.", "Mezzanotte."] });
  expect(ora.schermo).toEqual(ora.squadra.sussurri);

  // spente: le squadre non ricevono frasi, la regia le ritrova
  await chiama("PUT", "/api/regia/sussurri", { attivi: false }, regia);
  ora = await leggi();
  expect(ora.squadra.sussurri).toMatchObject({ attivi: false, frasi: [] });
  expect(ora.schermo).toMatchObject({ attivi: false, frasi: [] });
  expect(ora.regia).toEqual(["Il gatto vi guarda.", "Mezzanotte."]);

  // riaccese e svuotate: si torna alle frasi del tema
  await chiama("PUT", "/api/regia/sussurri", { attivi: true, frasi: [] }, regia);
  expect((await leggi()).squadra.sussurri).toMatchObject({ attivi: true, frasi: [] });
});

test("amministrazione: account, inviti, sospensione, password dimenticata", async () => {
  expect((await chiama("GET", "/api/admin", undefined, regia)).stato).toBe(403);
  expect((await chiama("GET", "/api/admin")).stato).toBe(401);
  let vista = (await chiama("GET", "/api/admin", undefined, admin)).dati;
  const r = vista.utenti.find((x: any) => x.username === "regia");
  expect(r).toMatchObject({ nome: "Organizzatrice", email: "org@esempio.it", admin: false, stato: "attivo" });
  expect(r.serate).toBeGreaterThan(0);
  // solo account e numeri: nessun campo delle serate
  expect(Object.keys(r).sort()).toEqual(["admin", "creato", "email", "id", "nome", "serate", "stato", "ultimo_accesso", "username"]);
  // l'amministrazione non apre le serate di nessuno
  expect((await chiama("GET", "/api/regia", undefined, admin, serataRegia)).stato).toBe(403);

  // invito: rigenerato il link vecchio non vale, revocato non vale più nessuno, scaduto risponde 410
  const inv = (await chiama("POST", "/api/admin/inviti", { nome: "Paolo Costa" }, admin)).dati;
  expect((await chiama("POST", "/api/admin/inviti", { nome: "X", email: "non-una-email" }, admin)).stato).toBe(400);
  const nuovo = (await chiama("POST", `/api/admin/inviti/${inv.id}/rigenera`, {}, admin)).dati;
  expect((await chiama("GET", `/api/invito/${inv.token}`)).stato).toBe(404);
  expect((await chiama("GET", `/api/invito/${nuovo.token}`)).stato).toBe(200);
  vista = (await chiama("GET", "/api/admin", undefined, admin)).dati;
  expect(vista.inviti.find((i: any) => i.id === inv.id)).toMatchObject({ tipo: "regia", nome: "Paolo Costa", stato: "attesa" });
  expect(JSON.stringify(vista)).not.toContain(nuovo.token);
  await db.q("UPDATE invito SET scade = NOW() - interval '1 day' WHERE id = $1", [inv.id]);
  expect((await chiama("GET", `/api/invito/${nuovo.token}`)).stato).toBe(410);
  expect((await chiama("GET", "/api/admin", undefined, admin)).dati.inviti.find((i: any) => i.id === inv.id).stato).toBe("scaduto");
  await chiama("POST", `/api/admin/inviti/${inv.id}/revoca`, {}, admin);
  expect((await chiama("GET", `/api/invito/${nuovo.token}`)).stato).toBe(404);
  expect((await chiama("GET", "/api/admin", undefined, admin)).dati.inviti.some((i: any) => i.id === inv.id)).toBe(false);
  // nel database c'è solo l'impronta del token
  expect(await db.uno("SELECT id FROM invito WHERE token_hash = $1", [nuovo.token])).toBeUndefined();

  // sospensione: la sessione si chiude e non si rientra; riattivato si rientra
  const marta = await db.uno<{ id: number }>("INSERT INTO utente (username, password_hash) VALUES ('sandro', $1) RETURNING id", [await hashPassword("password-di-marta")]);
  const sessione = (await chiama("POST", "/api/accesso", { username: "sandro", password: "password-di-marta" })).cookie!;
  expect((await chiama("POST", `/api/admin/utenti/${marta!.id}/sospendi`, { sospeso: true }, admin)).stato).toBe(200);
  expect((await chiama("GET", "/api/regia/serate", undefined, sessione)).stato).toBe(401);
  expect((await chiama("POST", "/api/accesso", { username: "sandro", password: "password-di-marta" })).stato).toBe(403);
  await chiama("POST", `/api/admin/utenti/${marta!.id}/sospendi`, { sospeso: false }, admin);
  expect((await chiama("POST", "/api/accesso", { username: "sandro", password: "password-di-marta" })).stato).toBe(200);
  const io = (await chiama("GET", "/api/admin", undefined, admin)).dati.io;
  expect((await chiama("POST", `/api/admin/utenti/${io.id}/sospendi`, { sospeso: true }, admin)).stato).toBe(400);

  // password dimenticata: un link per scegliere la nuova; le sessioni vecchie si chiudono
  const vecchia = (await chiama("POST", "/api/accesso", { username: "sandro", password: "password-di-marta" })).cookie!;
  const lp = (await chiama("POST", `/api/admin/utenti/${marta!.id}/password`, {}, admin)).dati;
  expect((await chiama("GET", `/api/invito/${lp.token}`)).dati).toMatchObject({ tipo: "password", username: "sandro" });
  expect((await chiama("POST", `/api/invito/${lp.token}`, { password: "corta" })).stato).toBe(400);
  expect((await chiama("POST", `/api/invito/${lp.token}`, { password: "nuova-password-di-marta" })).dati).toEqual({ ruolo: "regia", admin: false });
  expect((await chiama("GET", "/api/regia/serate", undefined, vecchia)).stato).toBe(401);
  expect((await chiama("POST", "/api/accesso", { username: "sandro", password: "password-di-marta" })).stato).toBe(401);
  expect((await chiama("POST", "/api/accesso", { username: "sandro", password: "nuova-password-di-marta" })).stato).toBe(200);
});

test("versione della serata per il quasi tempo reale", async () => {
  const v1 = (await chiama("GET", "/api/versione", undefined, corvi)).dati.versione;
  expect((await chiama("GET", "/api/versione", undefined, schermo)).dati.versione).toBe(v1);
  expect((await chiama("GET", "/api/versione", undefined, regia)).dati.versione).toBe(v1);
  expect((await chiama("GET", "/api/versione")).stato).toBe(401);
  await chiama("POST", "/api/regia/annunci", { testo: "Prova di versione" }, regia);
  expect(Number((await chiama("GET", "/api/versione", undefined, corvi)).dati.versione)).toBeGreaterThan(Number(v1));
});

test("tempi delle nuvolette decisi dalla regia", async () => {
  let s = (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati.sussurri;
  expect(s).toMatchObject({ attesa: [20, 45], durata: 10 });
  expect((await chiama("PUT", "/api/regia/sussurri", { attesa_min: 60, attesa_max: 30 }, regia)).stato).toBe(400);
  expect((await chiama("PUT", "/api/regia/sussurri", { durata: 1 }, regia)).stato).toBe(400);
  expect((await chiama("PUT", "/api/regia/sussurri", { attesa_min: 30, attesa_max: 90, durata: 8 }, regia)).stato).toBe(200);
  s = (await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati.sussurri;
  expect(s).toMatchObject({ attesa: [30, 90], durata: 8 });
  expect((await chiama("GET", "/api/regia", undefined, regia)).dati.serata).toMatchObject({ sussurri_attesa_min: 30, sussurri_attesa_max: 90, sussurri_durata: 8 });
});

test("invitati, vincoli, sorteggio e biglietti per tavolo", async () => {
  const nomi = ["Ali", "Mela", "Ludo", "Sasso", "Losco", "Tenca", "Pietro", "Sara", "Giulia"];
  expect((await chiama("POST", "/api/regia/invitati", { nomi: [...nomi.slice(0, 5), "  ", ...nomi.slice(5)] }, regia)).dati).toEqual({ aggiunti: 9 });
  expect((await chiama("POST", "/api/regia/invitati", { nomi: ["X"] }, corvi)).stato).toBe(403);
  let t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
  expect(t.invitati.map((i: any) => i.nome)).toEqual(nomi);
  const id = (n: string) => t.invitati.find((i: any) => i.nome === n).id;
  // vincoli tra invitati della stessa serata
  await chiama("POST", "/api/regia/vincoli", { a: id("Ali"), b: id("Mela"), tipo: "divisi" }, regia);
  await chiama("POST", "/api/regia/vincoli", { a: id("Pietro"), b: id("Sara"), tipo: "insieme" }, regia);
  expect((await chiama("POST", "/api/regia/vincoli", { a: id("Ali"), b: id("Ali"), tipo: "divisi" }, regia)).stato).toBe(400);
  const altra = await db.uno<{ id: number }>("INSERT INTO invitato (serata_id, nome) SELECT id, 'Estraneo' FROM serata WHERE id <> $1 LIMIT 1 RETURNING id", [serataRegia]);
  if (altra) expect((await chiama("POST", "/api/regia/vincoli", { a: id("Ali"), b: altra.id, tipo: "divisi" }, regia)).stato).toBe(404);

  // sorteggio sulle squadre della serata
  const squadre = (await chiama("GET", "/api/regia", undefined, regia)).dati.squadre.map((s: any) => s.id);
  expect(squadre.length).toBeGreaterThanOrEqual(2);
  for (let giro = 0; giro < 5; giro++) {
    expect((await chiama("POST", "/api/regia/sorteggio", {}, regia)).stato).toBe(200);
    t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    const dove = new Map(t.invitati.map((i: any) => [i.nome, i.squadra_id]));
    expect([...dove.values()].every((s) => squadre.includes(s))).toBe(true);
    expect(dove.get("Ali")).not.toBe(dove.get("Mela"));
    expect(dove.get("Pietro")).toBe(dove.get("Sara"));
    const conta = squadre.map((s: number) => [...dove.values()].filter((x) => x === s).length);
    expect(Math.max(...conta) - Math.min(...conta)).toBeLessThanOrEqual(1);
  }
  // spostamento a mano
  await chiama("PUT", `/api/regia/invitati/${id("Giulia")}`, { squadra_id: null }, regia);
  t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
  expect(t.invitati.find((i: any) => i.nome === "Giulia").squadra_id).toBeNull();

  // vincoli impossibili: chi sta insieme a qualcuno da cui deve stare diviso
  await chiama("POST", "/api/regia/vincoli", { a: id("Ali"), b: id("Pietro"), tipo: "insieme" }, regia);
  await chiama("POST", "/api/regia/vincoli", { a: id("Mela"), b: id("Sara"), tipo: "insieme" }, regia);
  await chiama("POST", "/api/regia/vincoli", { a: id("Pietro"), b: id("Mela"), tipo: "insieme" }, regia);
  expect((await chiama("POST", "/api/regia/sorteggio", {}, regia)).stato).toBe(409);

  // biglietti: password nuove per tutte le squadre, sessioni vecchie chiuse
  expect((await chiama("POST", "/api/regia/biglietti", {}, regia)).stato).toBe(400);
  const prima = (await chiama("GET", "/api/squadra/stato", undefined, corvi)).stato;
  expect(prima).toBe(200);
  const b = (await chiama("POST", "/api/regia/biglietti", { conferma: true }, regia)).dati;
  expect(b.slug).toBe("la-notte-di-villa-corvina");
  expect(b.biglietti.length).toBe(squadre.length);
  expect((await chiama("GET", "/api/squadra/stato", undefined, corvi)).stato).toBe(401);
  const primo = b.biglietti[0];
  const entra = await chiama("POST", "/api/accesso", { username: primo.username, password: primo.password, slug: b.slug });
  expect(entra.dati).toEqual({ ruolo: "squadra" });
  corvi = entra.cookie!;
  expect(b.biglietti.flatMap((x: any) => x.componenti).length).toBe(8);
});

test("caso completo in un file: chiavi degli allegati e importazione in un'altra serata", async () => {
  const e = (await chiama("GET", "/api/regia/esporta", undefined, regia)).dati;
  expect(e.formato).toBe("cena-con-delitto/2");
  expect(Array.isArray(e.sussurri)).toBe(true);
  expect(e.serata).toHaveProperty("sfondo_key");
  expect(e.prove[0]).toHaveProperty("allegato_key");
  // una serata nuova, con un suo allegato già ricaricato (come fa il browser della regia)
  const b = (await chiama("POST", "/api/regia/serate", { titolo: "Copia da file" }, regia)).dati;
  const file = await gestisci(new Request("https://cena.test/api/regia/allegati", {
    method: "POST", headers: { cookie: regia, "x-serata": String(b.id), "content-type": "image/png" }, body: new Uint8Array([1, 2, 3]),
  }), db);
  const { key } = (await file.json()) as { key: string };
  const caso = structuredClone(e);
  caso.serata.sfondo_key = key;
  caso.prove[0].allegato_key = `s${serataRegia}-di-un-altra-serata`;
  caso.prove[0].allegato_tipo = "image/png";
  caso.sussurri = ["Una frase dal file."];
  expect((await chiama("POST", "/api/regia/importa", { conferma: "SOSTITUISCI", caso }, regia, b.id)).stato).toBe(200);
  const t = (await chiama("GET", "/api/regia", undefined, regia, b.id)).dati;
  expect(t.serata.sfondo_key).toBe(key);
  expect(t.prove.find((p: any) => p.numero === caso.prove[0].numero).allegato_key).toBeNull();
  expect(t.sussurri).toEqual(["Una frase dal file."]);
  expect(t.serata.tema).toBe(e.serata.tema);
  expect(t.prove.length).toBe(e.prove.length);
  await chiama("POST", `/api/regia/serate/${b.id}/elimina`, { conferma: e.serata.titolo }, regia);
  expect((await chiama("GET", "/api/regia", undefined, regia, b.id)).stato).toBe(404);
});

test("distribuisci: squadre bilanciate e vincoli rispettati, o null se impossibile", () => {
  let seme = 7;
  const caso = () => ((seme = (seme * 9301 + 49297) % 233280) / 233280);
  const persone = Array.from({ length: 14 }, (_, i) => i + 1);
  const vincoli = [{ a: 1, b: 2, tipo: "divisi" as const }, { a: 3, b: 4, tipo: "insieme" as const }, { a: 4, b: 5, tipo: "insieme" as const }, { a: 5, b: 6, tipo: "divisi" as const }];
  for (let i = 0; i < 50; i++) {
    const m = distribuisci(persone, [10, 20, 30], vincoli, caso)!;
    expect(m.get(1)).not.toBe(m.get(2));
    expect(new Set([m.get(3), m.get(4), m.get(5)]).size).toBe(1);
    expect(m.get(5)).not.toBe(m.get(6));
    const conta = [10, 20, 30].map((s) => [...m.values()].filter((x) => x === s).length);
    expect(Math.max(...conta) - Math.min(...conta)).toBeLessThanOrEqual(1);
  }
  expect(distribuisci([1, 2], [10, 20], [{ a: 1, b: 2, tipo: "insieme" }, { a: 2, b: 1, tipo: "divisi" }])).toBeNull();
  // un blocco "insieme" troppo grande per squadre bilanciate
  expect(distribuisci([1, 2, 3, 4], [10, 20], [{ a: 1, b: 2, tipo: "insieme" }, { a: 2, b: 3, tipo: "insieme" }])).toBeNull();
  expect(distribuisci([1, 2, 3], [10], [])).toBeNull();
});

test("confronto delle risposte", () => {
  expect(combacia("la Governante!", "Governante")).toBe(true);
  expect(combacia("Il maggiordomo", "La governante")).toBe(false);
  expect(combacia("", "x")).toBe(false);
});

describe("2.0: più regie e più serate", () => {
  test("il passaggio dalla 1.1 tiene la regia, le squadre e i dati", async () => {
    const { MIGRAZIONI } = await import("../migrazioni.ts");
    const altro = new NetlifyDB();
    const d2 = apriDb(await altro.start());
    // Database fermo alla 1.1: tutte le migrazioni prima della 2.0.
    const fino = MIGRAZIONI.findIndex((m) => m.nome === "20261101180000_utenti_e_serate");
    await d2.q("CREATE TABLE migrazione (nome TEXT PRIMARY KEY, applicata TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    for (const m of MIGRAZIONI.slice(0, fino)) {
      await d2.q(m.sql);
      await d2.q("INSERT INTO migrazione (nome) VALUES ($1)", [m.nome]);
    }
    const s = await d2.uno<{ id: number }>("INSERT INTO serata (titolo, tema) VALUES ('Villa Corvina, Halloween', 'noir') RETURNING id");
    const hash = await hashPassword("password-della-regia");
    await d2.q("INSERT INTO account (serata_id, ruolo, username, password_hash) VALUES ($1, 'regia', 'organizza', $2)", [s!.id, hash]);
    const sq = await d2.uno<{ id: number }>("INSERT INTO squadra (serata_id, nome) VALUES ($1, 'Gufi') RETURNING id", [s!.id]);
    const hashSq = await hashPassword("gufo-notte-12");
    await d2.q("INSERT INTO account (serata_id, ruolo, username, password_hash, squadra_id) VALUES ($1, 'squadra', 'gufi', $2, $3)", [s!.id, hashSq, sq!.id]);
    await d2.q("INSERT INTO prova (serata_id, numero, titolo) VALUES ($1, 1, 'Prova vecchia')", [s!.id]);

    await migra(d2);
    const chiama2 = async (metodo: string, path: string, body?: unknown, cookie?: string, serata?: number) => {
      const headers: Record<string, string> = {};
      if (body !== undefined) headers["content-type"] = "application/json";
      if (cookie) headers.cookie = cookie;
      if (serata) headers["x-serata"] = String(serata);
      const res = await gestisci(new Request(`https://cena.test${path}`, { method: metodo, headers, body: body === undefined ? undefined : JSON.stringify(body) }), d2);
      const set = res.headers.get("set-cookie");
      return { stato: res.status, dati: (await res.json()) as any, cookie: set ? set.split(";")[0] : undefined };
    };

    // l'organizzatrice è un utente regia, non amministratore, proprietario della sua serata
    const u = await d2.uno<{ id: number; admin: boolean; password_hash: string }>("SELECT id, admin, password_hash FROM utente WHERE username = 'organizza'");
    expect(u).toMatchObject({ admin: false, password_hash: hash });
    expect(await d2.uno("SELECT proprietario_id, slug, tema FROM serata WHERE id = $1", [s!.id])).toEqual({ proprietario_id: u!.id, slug: "villa-corvina-halloween", tema: "noir" });
    // 2.1: tempi delle nuvolette di sempre, nessun invitato
    expect(await d2.uno("SELECT sussurri_attesa_min, sussurri_attesa_max, sussurri_durata FROM serata WHERE id = $1", [s!.id])).toEqual({ sussurri_attesa_min: 20, sussurri_attesa_max: 45, sussurri_durata: 10 });
    expect((await d2.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM invitato"))!.n).toBe(0);
    expect((await d2.uno<{ attivo: boolean }>("SELECT attivo FROM account WHERE username = 'organizza'"))!.attivo).toBe(false);
    // entra con le credenziali di sempre e ritrova la sua serata
    const rg = await chiama2("POST", "/api/accesso", { username: "organizza", password: "password-della-regia" });
    expect(rg.dati).toEqual({ ruolo: "regia", admin: false });
    expect((await chiama2("GET", "/api/regia/serate", undefined, rg.cookie)).dati.serate.map((x: any) => x.id)).toEqual([s!.id]);
    expect((await chiama2("GET", "/api/regia", undefined, rg.cookie, s!.id)).dati.prove).toHaveLength(1);
    // la squadra entra da /accesso come prima
    expect((await chiama2("POST", "/api/accesso", { username: "gufi", password: "gufo-notte-12" })).dati).toEqual({ ruolo: "squadra" });
    // nessun amministratore ancora: il primo avvio resta chiuso perché esiste già un utente
    // nessuna amministrazione ancora: SETUP_CODE crea quella di Teo, con un nome diverso dall'organizzatrice
    expect((await chiama2("GET", "/api/avvio")).dati).toEqual({ configurato: false, tema: "noir" });
    expect((await chiama2("POST", "/api/avvio", { codice: "codice-avvio", username: "organizza", password: "password-amministrazione" })).stato).toBe(409);
    const ad = await chiama2("POST", "/api/avvio", { codice: "codice-avvio", username: "teo", password: "password-amministrazione" });
    expect(ad.dati).toEqual({ ruolo: "regia", admin: true });
    // l'amministrazione vede l'account dell'organizzatrice e il numero di serate, non le serate
    const vista = (await chiama2("GET", "/api/admin", undefined, ad.cookie)).dati;
    expect(vista.utenti.find((x: any) => x.username === "organizza")).toMatchObject({ admin: false, stato: "attivo", serate: 1 });
    expect((await chiama2("GET", "/api/regia", undefined, ad.cookie, s!.id)).stato).toBe(403);
    await d2.fine?.();
    await altro.stop();
  }, 60_000);

  test("una regia non vede né tocca le serate di un'altra", async () => {
    const hash = await hashPassword("password-di-marta");
    const m = await db.uno<{ id: number }>("INSERT INTO utente (username, password_hash) VALUES ('marta', $1) RETURNING id", [hash]);
    const sM = await db.uno<{ id: number }>("INSERT INTO serata (titolo, proprietario_id, slug) VALUES ('Delitto sul treno', $1, 'delitto-sul-treno') RETURNING id", [m!.id]);
    const marta = (await chiama("POST", "/api/accesso", { username: "marta", password: "password-di-marta" })).cookie!;

    expect((await chiama("GET", "/api/regia/serate", undefined, marta)).dati.serate.map((x: any) => x.titolo)).toEqual(["Delitto sul treno"]);
    expect((await chiama("GET", "/api/regia", undefined, marta, sM!.id)).stato).toBe(200);
    // la serata della prima regia, per Marta, non esiste
    expect((await chiama("GET", "/api/regia", undefined, marta, serataRegia)).stato).toBe(404);
    expect((await chiama("PUT", "/api/regia/tema", { tema: "noir" }, marta, serataRegia)).stato).toBe(404);
    expect((await chiama("POST", "/api/regia/squadre", { nome: "Intrusi" }, marta, serataRegia)).stato).toBe(404);
    expect((await chiama("GET", `/api/file/s${serataRegia}-qualcosa`, undefined, marta)).stato).toBe(404);
    // e viceversa
    expect((await chiama("GET", "/api/regia", undefined, regia, sM!.id)).stato).toBe(404);

    // stesso nome di squadra in due serate: lo slug sceglie la serata, senza slug vale la serata storica
    const c = await chiama("POST", "/api/regia/squadre", { nome: "Corvi" }, marta, sM!.id);
    expect(c.stato).toBe(201);
    expect(c.dati.username).toBe(credCorvi.username);
    const suo = await chiama("POST", "/api/accesso", { username: c.dati.username, password: c.dati.password, slug: "delitto-sul-treno" });
    expect(suo.dati).toEqual({ ruolo: "squadra" });
    expect((await chiama("GET", "/api/squadra/stato", undefined, suo.cookie)).dati.serata.titolo).toBe("Delitto sul treno");
    expect((await chiama("POST", "/api/accesso", { username: c.dati.username, password: c.dati.password })).stato).toBe(401);

    // la pagina pubblica della serata: titolo e tema, niente del caso
    expect((await chiama("GET", "/api/s/delitto-sul-treno")).dati).toEqual({ titolo: "Delitto sul treno", tema: "halloween", aperta: true });
    expect((await chiama("GET", "/api/s/non-esiste")).stato).toBe(404);
    expect((await chiama("GET", "/api/io", undefined, suo.cookie)).dati).toMatchObject({ ruolo: "squadra", slug: "delitto-sul-treno" });
    // l'accesso della regia non fa entrare le squadre, nemmeno della serata storica
    expect((await chiama("POST", "/api/accesso", { ...credCorvi, regia: true })).stato).toBe(401);
    expect((await chiama("POST", "/api/accesso", { username: "marta", password: "password-di-marta", regia: true })).dati).toEqual({ ruolo: "regia", admin: false });

    // serata archiviata: le squadre non entrano e la sessione aperta si ferma
    await db.q("UPDATE serata SET archiviata = TRUE WHERE id = $1", [sM!.id]);
    expect((await chiama("GET", "/api/s/delitto-sul-treno")).dati.aperta).toBe(false);
    expect((await chiama("POST", "/api/accesso", { username: c.dati.username, password: c.dati.password, slug: "delitto-sul-treno" })).stato).toBe(403);
    expect((await chiama("GET", "/api/squadra/stato", undefined, suo.cookie)).stato).toBe(403);
    await db.q("UPDATE serata SET archiviata = FALSE WHERE id = $1", [sM!.id]);
  });

  test("le mie serate: crea, indirizzo, duplica, archivia, elimina", async () => {
    const statoFile = async (k: string) =>
      (await gestisci(new Request(`https://cena.test/api/file/${k}`, { headers: { cookie: regia } }), db)).status;
    const serate = async () => (await chiama("GET", "/api/regia/serate", undefined, regia)).dati.serate;
    const prima = await serate();

    // crea, e l'indirizzo si può cambiare ma non rubare
    const nuova = await chiama("POST", "/api/regia/serate", { titolo: "Natale al castello" }, regia);
    expect(nuova.stato).toBe(201);
    expect(nuova.dati.slug).toBe("natale-al-castello");
    expect((await chiama("PUT", `/api/regia/serate/${nuova.dati.id}`, { slug: "Delitto sul treno" }, regia)).stato).toBe(409);
    expect((await chiama("PUT", `/api/regia/serate/${nuova.dati.id}`, { slug: "Castello, 24 dicembre!" }, regia)).dati.slug).toBe("castello-24-dicembre");
    expect((await serate()).length).toBe(prima.length + 1);

    // un allegato vero, per vedere che la copia ha i suoi file
    const file = await gestisci(new Request("https://cena.test/api/regia/allegati", {
      method: "POST", headers: { cookie: regia, "x-serata": String(serataRegia), "content-type": "image/png" }, body: new Uint8Array([137, 80, 78, 71, 1, 2, 3]),
    }), db);
    const { key } = (await file.json()) as { key: string };
    await chiama("PUT", "/api/regia/sfondo", { key }, regia);

    // duplica: tutto il caso, niente di ciò che è successo in sala
    const orig = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    const copia = await chiama("POST", `/api/regia/serate/${serataRegia}/duplica`, {}, regia);
    expect(copia.stato).toBe(201);
    expect(copia.dati.slug).toBe("la-notte-di-villa-corvina-copia");
    const dup = (await chiama("GET", "/api/regia", undefined, regia, copia.dati.id)).dati;
    expect(dup.serata).toMatchObject({ titolo: "La notte di Villa Corvina (copia)", tema: orig.serata.tema, colpevole: orig.serata.colpevole, stato: "bozza", rivelata: false });
    expect(dup.fasi.map((f: any) => f.nome)).toEqual(orig.fasi.map((f: any) => f.nome));
    expect(dup.fasi.every((f: any) => f.avviata_alle === null)).toBe(true);
    expect(dup.personaggi.map((p: any) => p.nome)).toEqual(orig.personaggi.map((p: any) => p.nome));
    expect(dup.scene.map((x: any) => x.titolo)).toEqual(orig.scene.map((x: any) => x.titolo));
    expect(dup.cartelle.map((c: any) => [c.nome, c.visibile])).toEqual(orig.cartelle.map((c: any) => [c.nome, c.visibile]));
    expect(dup.prove.map((p: any) => p.titolo)).toEqual(orig.prove.map((p: any) => p.titolo));
    expect(dup.sussurri).toEqual(orig.sussurri);
    expect(dup.squadre).toEqual([]);
    expect(dup.accuse).toEqual([]);
    // le regole riservate a una squadra non passano; le altre puntano alle prove della copia
    const regole = (x: any) => x.prove.flatMap((p: any) => p.regole);
    expect(regole(dup).some((r: any) => r.squadra_id)).toBe(false);
    const idCopia = new Set(dup.prove.map((p: any) => p.id));
    expect(regole(dup).filter((r: any) => r.prova_richiesta_id).every((r: any) => idCopia.has(r.prova_richiesta_id))).toBe(true);
    const gruppiDiSquadra = new Set(orig.prove.flatMap((p: any) => p.regole.filter((r: any) => r.squadra_id).map((r: any) => `${p.id}/${r.gruppo}`)));
    const attese = orig.prove.flatMap((p: any) => p.regole.filter((r: any) => !gruppiDiSquadra.has(`${p.id}/${r.gruppo}`)));
    expect(regole(dup).length).toBe(attese.length);
    // lo sfondo è un file nuovo della copia, leggibile, e quello di prima resta
    expect(dup.serata.sfondo_key).toMatch(new RegExp(`^s${copia.dati.id}-`));
    expect(await statoFile(dup.serata.sfondo_key)).toBe(200);
    expect(await statoFile(key)).toBe(200);

    // archiviata: si legge, non si cambia, e torna attiva
    expect((await chiama("POST", `/api/regia/serate/${copia.dati.id}/archivia`, { archiviata: true }, regia)).stato).toBe(200);
    expect((await chiama("GET", "/api/regia", undefined, regia, copia.dati.id)).stato).toBe(200);
    expect((await chiama("PUT", "/api/regia/tema", { tema: "noir" }, regia, copia.dati.id)).stato).toBe(409);
    expect((await serate()).at(-1).id).toBe(copia.dati.id);
    expect((await chiama("POST", `/api/regia/serate/${copia.dati.id}/archivia`, { archiviata: false }, regia)).stato).toBe(200);
    expect((await chiama("PUT", "/api/regia/tema", { tema: "noir" }, regia, copia.dati.id)).stato).toBe(200);

    // elimina: solo scrivendo il titolo, e se ne vanno anche i file
    expect((await chiama("POST", `/api/regia/serate/${copia.dati.id}/elimina`, { conferma: "sì" }, regia)).stato).toBe(400);
    expect((await chiama("POST", `/api/regia/serate/${copia.dati.id}/elimina`, { conferma: "La notte di Villa Corvina (copia)" }, regia)).stato).toBe(200);
    expect((await chiama("GET", "/api/regia", undefined, regia, copia.dati.id)).stato).toBe(404);
    expect(await statoFile(dup.serata.sfondo_key)).toBe(404);
    expect(await statoFile(key)).toBe(200);
    // un'altra regia non può né duplicare né eliminare
    const marta = (await chiama("POST", "/api/accesso", { username: "marta", password: "password-di-marta" })).cookie!;
    expect((await chiama("POST", `/api/regia/serate/${serataRegia}/duplica`, {}, marta)).stato).toBe(404);
    expect((await chiama("POST", `/api/regia/serate/${serataRegia}/elimina`, { conferma: "La notte di Villa Corvina" }, marta)).stato).toBe(404);
    await chiama("POST", `/api/regia/serate/${nuova.dati.id}/elimina`, { conferma: "Natale al castello" }, regia);
  });
});
