import { NetlifyDB } from "@netlify/database-dev";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { apriDb, Db, migra, tempoReale } from "../base.ts";
import { controlla, DatiCaso } from "../controllo.ts";
import { gestisci } from "../router.ts";

process.env.SESSION_SECRET = "segreto-di-prova-lungo-almeno-trentadue-caratteri";
process.env.SETUP_CODE = "codice-avvio";
process.env.CENA_ARCHIVIO_MEMORIA = "1";

let pg: NetlifyDB;
let db: Db;
let regia = "";
let sid = 0;
const ids: Record<string, number> = {};
const cookie: Record<string, string> = {};

async function chiama(metodo: string, path: string, body?: unknown, c?: string, extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { ...extra };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (c) headers.cookie = c;
  if (c && c === regia) headers["x-serata"] = String(sid);
  const res = await gestisci(new Request(`https://cena.test${path}`, { method: metodo, headers, body: body === undefined ? undefined : JSON.stringify(body) }), db);
  const set = res.headers.get("set-cookie");
  return { stato: res.status, dati: (await res.json()) as any, cookie: set ? set.split(";")[0] : undefined };
}

beforeAll(async () => {
  pg = new NetlifyDB();
  db = apriDb(await pg.start());
  await migra(db);
  const ad = await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "teo", password: "password-amministrazione" });
  const inv = await chiama("POST", "/api/admin/inviti", { nome: "Regia" }, ad.cookie);
  regia = (await chiama("POST", `/api/invito/${inv.dati.token}`, { username: "regia", password: "una-password-lunga" })).cookie!;
  await chiama("POST", "/api/regia/serate", { titolo: "Villa Corvina" }, regia);
  sid = (await chiama("GET", "/api/regia/serate", undefined, regia)).dati.serate[0].id;
  await chiama("PUT", "/api/regia/caso", { titolo: "Villa Corvina", colpevole: "La governante", movente: "Eredità", arma: "Veleno" }, regia);
  await chiama("PUT", "/api/regia/fasi", { fasi: [{ nome: "Prologo" }, { nome: "Il buio" }] }, regia);
  for (const nome of ["Corvi", "Gufi"]) {
    const s = await chiama("POST", "/api/regia/squadre", { nome }, regia);
    ids[nome] = s.dati.id;
    cookie[nome] = (await chiama("POST", "/api/accesso", { username: s.dati.username, password: s.dati.password })).cookie!;
  }
  const p1 = await chiama("POST", "/api/regia/prove", { numero: 1, titolo: "Lettera", testo: "Cara...", regole: [{ tipo: "fase", fase_numero: 1, gruppo: 1 }] }, regia);
  const p2 = await chiama("POST", "/api/regia/prove", { numero: 2, titolo: "Chiave", testo: "Una chiave", regole: [{ tipo: "pin", pin: "1234", gruppo: 1 }] }, regia);
  ids.p1 = p1.dati.id;
  ids.p2 = p2.dati.id;
}, 60_000);
afterAll(async () => {
  await db.fine?.();
  await pg.stop();
});

describe("controllo del caso", () => {
  const base = (): DatiCaso => ({
    serata: { colpevole: "La governante", movente: "Eredità", arma: "Veleno" },
    fasi: [1, 2],
    prove: [],
    squadre: [{ id: 10, nome: "Corvi" }, { id: 11, nome: "Gufi" }],
    schermi: 1,
    personaggi: [{ id: 1, nome: "La governante" }],
    scene: [{ tipo: "rivelazione", titolo: "", allegato_key: null, fase_numero: null, avvio_automatico: false }],
    invitati: [],
  });
  const r = (o: Partial<{ tipo: "pin" | "prova" | "fase"; pin: string; prova_richiesta_id: number; fase_numero: number; squadra_id: number; gruppo: number }>) =>
    ({ tipo: "pin" as const, pin: null, prova_richiesta_id: null, fase_numero: null, squadra_id: null, gruppo: 1, ...o });
  const prova = (id: number, regole: ReturnType<typeof r>[]) => ({ id, numero: id, tipo: "documento", testo: "x", allegato_key: null, regole });

  test("un caso sano non ha errori", () => {
    const d = base();
    d.prove = [prova(1, [r({ tipo: "fase", fase_numero: 1 })]), prova(2, [r({ tipo: "prova", prova_richiesta_id: 1 }), r({ pin: "ABC" })])];
    expect(controlla(d)).toEqual([]);
  });

  test("catene circolari, fasi inesistenti, due codici insieme", () => {
    const d = base();
    d.prove = [
      prova(1, [r({ tipo: "prova", prova_richiesta_id: 2 })]),
      prova(2, [r({ tipo: "prova", prova_richiesta_id: 1 })]),
      prova(3, [r({ tipo: "fase", fase_numero: 7 })]),
      prova(4, [r({ pin: "A" }), r({ pin: "B" })]),
    ];
    const errori = controlla(d).filter((p) => p.livello === "errore").map((p) => p.testo);
    expect(errori.some((t) => t.startsWith("La prova 1 non si apre mai: aspetta la prova 2"))).toBe(true);
    expect(errori.some((t) => t.startsWith("La prova 2 non si apre mai"))).toBe(true);
    expect(errori).toContain("La prova 3 aspetta la fase 7, che non esiste.");
    expect(errori).toContain("La prova 4 chiede due codici diversi insieme.");
    // una prova impossibile in sé non si ripete come "non si apre mai"
    expect(errori.filter((t) => t.startsWith("La prova 3"))).toHaveLength(1);
  });

  test("una regola riservata a una squadra lascia fuori le altre", () => {
    const d = base();
    d.prove = [prova(1, [r({ pin: "X", squadra_id: 10 })])];
    expect(controlla(d).find((p) => p.livello === "errore")?.testo).toBe("La prova 1 non si apre mai per Gufi. La regia può solo consegnarla a mano.");
  });

  test("avvisi: soluzione, file, scene, accessi, personaggi", () => {
    const d = base();
    d.serata = { colpevole: "Il maggiordomo", movente: "", arma: "" };
    d.prove = [{ ...prova(1, []), tipo: "foto" }];
    d.scene = [
      { tipo: "immagine", titolo: "Mappa", allegato_key: null, fase_numero: 3, avvio_automatico: false },
      { tipo: "narrazione", titolo: "A", allegato_key: null, fase_numero: 1, avvio_automatico: true },
      { tipo: "narrazione", titolo: "B", allegato_key: null, fase_numero: 1, avvio_automatico: true },
    ];
    d.schermi = 0;
    d.invitati = [{ nome: "Ludo", personaggio_id: 1 }, { nome: "Sara", personaggio_id: 1 }];
    const testi = controlla(d).map((p) => `${p.livello}: ${p.testo}`);
    expect(testi).toEqual(expect.arrayContaining([
      "avviso: Manca il movente nella soluzione: nessuna squadra prenderà il punto del movente.",
      "avviso: Il colpevole della soluzione non corrisponde a nessun personaggio: controlla che il nome sia scritto come nei personaggi.",
      "avviso: La prova 1 non ha regole: la può consegnare solo la regia, a mano.",
      "avviso: La prova 1 è di tipo foto ma non ha un file.",
      "avviso: Non c'è una scena di rivelazione: quando riveli la soluzione il proiettore non la mostra.",
      'avviso: La scena "Mappa" non ha un file.',
      'avviso: La scena "Mappa" è legata alla fase 3, che non esiste.',
      "avviso: La fase 1 ha 2 scene che partono da sole: va in onda solo la prima.",
      "avviso: Non c'è un accesso per il proiettore.",
      "avviso: La governante è interpretato da più persone: Ludo, Sara.",
    ]));
    expect(controlla({ ...d, serata: { colpevole: "", movente: "x", arma: "x" } })[0]).toMatchObject({ livello: "errore", dove: "caso" });
  });

  test("dall'API, sulla serata vera", async () => {
    const r = await chiama("GET", "/api/regia/controllo", undefined, regia);
    expect(r.stato).toBe(200);
    expect(r.dati.problemi.filter((p: any) => p.livello === "errore")).toEqual([]);
    expect(r.dati.problemi.map((p: any) => p.testo)).toContain("Non c'è un accesso per il proiettore.");
    expect((await chiama("GET", "/api/regia/controllo", undefined, cookie.Corvi)).stato).toBe(403);
  });
});

describe("personaggi agli invitati", () => {
  test("chi interpreta chi, il copione resta fuori dai telefoni", async () => {
    const p = await chiama("POST", "/api/regia/personaggi", { nome: "La governante", scheda: "Serve da trent'anni.", copione: "Hai versato tu il veleno." }, regia);
    expect(p.stato).toBe(201);
    ids.governante = p.dati.id;
    await chiama("POST", "/api/regia/invitati", { nomi: ["Ludo", "Sara"] }, regia);
    const inv = (await chiama("GET", "/api/regia", undefined, regia)).dati.invitati;
    ids.ludo = inv[0].id;
    expect((await chiama("PUT", `/api/regia/invitati/${ids.ludo}`, { personaggio_id: ids.governante, squadra_id: ids.Corvi }, regia)).stato).toBe(200);
    expect((await chiama("PUT", `/api/regia/invitati/${ids.ludo}`, { personaggio_id: 99999 }, regia)).stato).toBe(404);

    const tel = await chiama("GET", "/api/squadra/stato", undefined, cookie.Gufi);
    expect(tel.dati.personaggi[0]).toMatchObject({ nome: "La governante", interpretatoDa: ["Ludo"] });
    expect(JSON.stringify(tel.dati)).not.toContain("veleno");

    // modificare il personaggio senza mandare il copione non lo cancella
    await chiama("PUT", `/api/regia/personaggi/${ids.governante}`, { nome: "La governante", scheda: "Serve da trent'anni." }, regia);
    const regiaVede = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(regiaVede.personaggi[0].copione).toBe("Hai versato tu il veleno.");
    expect(regiaVede.invitati[0].personaggio_id).toBe(ids.governante);

    // biglietti: accanto al nome, il personaggio
    const b = await chiama("POST", "/api/regia/biglietti", { conferma: true }, regia);
    expect(b.dati.biglietti.find((x: any) => x.squadra === "Corvi").componenti).toEqual(["Ludo, nel ruolo di La governante"]);
    // i biglietti cambiano le password: si rientra con quelle nuove
    for (const x of b.dati.biglietti) cookie[x.squadra] = (await chiama("POST", "/api/accesso", { username: x.username, password: x.password })).cookie!;

    // l'esportazione porta il copione
    expect((await chiama("GET", "/api/regia/esporta", undefined, regia)).dati.personaggi[0].copione).toBe("Hai versato tu il veleno.");
  });
});

describe("prova generale", () => {
  let token = "";
  const anteprima = () => ({ "x-anteprima": token });

  test("la regia apre una squadra nascosta senza toccare le password", async () => {
    const r = await chiama("POST", "/api/regia/prova-generale", {}, regia);
    expect(r.stato).toBe(200);
    token = r.dati.token;
    // la scheda della prova generale porta il token nell'intestazione, anche accanto al cookie della regia
    const io = await chiama("GET", "/api/io", undefined, regia, anteprima());
    expect(io.dati).toMatchObject({ ruolo: "squadra", squadra: { nome: "Prova generale", prova: true } });
    // e la regia, senza intestazione, resta la regia
    expect((await chiama("GET", "/api/io", undefined, regia)).dati.ruolo).toBe("regia");
    // una seconda apertura usa la stessa squadra
    await chiama("POST", "/api/regia/prova-generale", {}, regia);
    expect((await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM squadra WHERE serata_id = $1 AND prova", [sid]))!.n).toBe(1);
  });

  test("codici anche a serata ferma, solo per la prova generale", async () => {
    expect((await chiama("POST", "/api/squadra/codice", { codice: "1234" }, cookie.Corvi)).stato).toBe(409);
    const ok = await chiama("POST", "/api/squadra/codice", { codice: "1234" }, undefined, anteprima());
    expect(ok.dati.esito).toBe("aperta");
  });

  test("invisibile a regia, proiettore, sorteggio e biglietti", async () => {
    const t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    expect(t.squadre.map((s: any) => s.nome)).toEqual(["Corvi", "Gufi"]);
    expect((await chiama("GET", "/api/regia/serate", undefined, regia)).dati.serate[0].squadre).toBe(2);
    const b = await chiama("POST", "/api/regia/biglietti", { conferma: true }, regia);
    expect(b.dati.biglietti.map((x: any) => x.squadra)).toEqual(["Corvi", "Gufi"]);
    for (const x of b.dati.biglietti) cookie[x.squadra] = (await chiama("POST", "/api/accesso", { username: x.username, password: x.password })).cookie!;
    // la prova generale resta aperta: i biglietti non le cambiano la sessione
    expect((await chiama("GET", "/api/squadra/stato", undefined, undefined, anteprima())).stato).toBe(200);
    await chiama("POST", "/api/regia/sorteggio", {}, regia);
    const prova = await db.uno<{ id: number }>("SELECT id FROM squadra WHERE serata_id = $1 AND prova", [sid]);
    expect((await db.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM invitato WHERE squadra_id = $1", [prova!.id]))!.n).toBe(0);
    expect((await chiama("PUT", `/api/regia/invitati/${ids.ludo}`, { squadra_id: prova!.id }, regia)).stato).toBe(404);
  });

  test("l'intestazione vale solo per la prova generale", async () => {
    // il cookie di una squadra vera, messo nell'intestazione, non apre nulla
    const vero = cookie.Corvi.split("=").slice(1).join("=");
    expect((await chiama("GET", "/api/squadra/stato", undefined, undefined, { "x-anteprima": vero })).stato).toBe(401);
    expect((await chiama("GET", "/api/squadra/stato", undefined, undefined, { "x-anteprima": "falso.falso" })).stato).toBe(401);
  });

  test("ricomincia cancella solo i progressi della prova generale", async () => {
    await chiama("POST", "/api/regia/stato", { stato: "in_corso" }, regia);
    expect((await chiama("POST", "/api/squadra/codice", { codice: "1234" }, cookie.Gufi)).dati.esito).toBe("aperta");
    expect((await chiama("POST", "/api/regia/prova-generale/ricomincia", {}, regia)).stato).toBe(200);
    const prova = (await chiama("GET", "/api/squadra/stato", undefined, undefined, anteprima())).dati;
    expect(prova.prove.filter((p: any) => p.aperta)).toEqual([]);
    const gufi = (await chiama("GET", "/api/squadra/stato", undefined, cookie.Gufi)).dati;
    expect(gufi.prove.filter((p: any) => p.aperta).map((p: any) => p.numero)).toEqual([2]);
  });
});

describe("aiuti a richiesta", () => {
  test("spenti, uno alla volta, al massimo, con penalità", async () => {
    expect((await chiama("POST", "/api/squadra/aiuto", { domanda: "Dove cerchiamo?" }, cookie.Corvi)).dati.codice).toBe("aiuti_chiusi");
    await chiama("PUT", "/api/regia/aiuti", { attivi: true, max: 2 }, regia);
    // la prova 1 si apre con la fase 1: prima la squadra non la vede e non può chiedere aiuto su quella
    expect((await chiama("POST", "/api/squadra/aiuto", { prova_id: ids.p1 }, cookie.Corvi)).stato).toBe(404);
    await chiama("POST", "/api/regia/fase", { numero: 1 }, regia);
    expect((await chiama("POST", "/api/squadra/aiuto", { domanda: "Dove cerchiamo?", prova_id: ids.p1 }, cookie.Corvi)).stato).toBe(201);
    expect((await chiama("POST", "/api/squadra/aiuto", { domanda: "E poi?" }, cookie.Corvi)).dati.codice).toBe("aiuto_in_attesa");
    const t = (await chiama("GET", "/api/regia", undefined, regia)).dati;
    const a = t.aiuti[0];
    expect(a).toMatchObject({ squadra: "Corvi", prova: 1, domanda: "Dove cerchiamo?", stato: "attesa" });
    expect((await chiama("PUT", `/api/regia/aiuti/${a.id}`, { risposta: "In cucina.", penalita: 11 }, regia)).stato).toBe(400);
    expect((await chiama("PUT", `/api/regia/aiuti/${a.id}`, { risposta: "In cucina.", penalita: 1 }, regia)).stato).toBe(200);

    const tel = (await chiama("GET", "/api/squadra/stato", undefined, cookie.Corvi)).dati.aiuti;
    expect(tel).toMatchObject({ attivi: true, max: 2, usati: 1, richieste: [{ prova: 1, stato: "dato", risposta: "In cucina.", penalita: 1 }] });
    // un aiuto rifiutato non si conta
    await chiama("POST", "/api/squadra/aiuto", { domanda: "Ancora?" }, cookie.Corvi);
    const secondo = (await chiama("GET", "/api/regia", undefined, regia)).dati.aiuti[0];
    await chiama("PUT", `/api/regia/aiuti/${secondo.id}`, { rifiuta: true }, regia);
    expect((await chiama("POST", "/api/squadra/aiuto", { domanda: "Ultimo" }, cookie.Corvi)).stato).toBe(201);
    const terzo = (await chiama("GET", "/api/regia", undefined, regia)).dati.aiuti[0];
    await chiama("PUT", `/api/regia/aiuti/${terzo.id}`, { risposta: "Nel camino.", penalita: 0 }, regia);
    expect((await chiama("POST", "/api/squadra/aiuto", { domanda: "Basta?" }, cookie.Corvi)).dati.codice).toBe("aiuti_finiti");
    // una squadra non chiede aiuto su una prova che non vede
    const nascosta = await chiama("POST", "/api/regia/prove", { numero: 3, titolo: "Segreta", in_elenco: false, regole: [{ tipo: "pin", pin: "9999", gruppo: 1 }] }, regia);
    expect((await chiama("POST", "/api/squadra/aiuto", { prova_id: nascosta.dati.id }, cookie.Gufi)).stato).toBe(404);
  });
});

describe("resoconto e classifica", () => {
  test("punteggio netto con le penalità, prova generale esclusa", async () => {
    for (const n of ["Corvi", "Gufi"]) await chiama("POST", "/api/squadra/accusa", { colpevole: "La governante", movente: "Eredità", arma: "Veleno" }, cookie[n]);
    expect((await chiama("GET", "/api/squadra/stato", undefined, cookie.Corvi)).dati.classifica).toBeNull();
    await chiama("POST", "/api/regia/rivela", {}, regia);
    const r = (await chiama("GET", "/api/regia/resoconto", undefined, regia)).dati;
    expect(r.squadre.map((s: any) => [s.nome, s.punteggio, s.penalita, s.netto])).toEqual([["Gufi", 4, 0, 4], ["Corvi", 4, 1, 3]]);
    expect(r.squadre[0]).toMatchObject({ aperte: 2, pin: 1, fase: 1 });
    expect(r.inizio).not.toBeNull();
    expect(r.fine).not.toBeNull();
    expect(r.prove.find((p: any) => p.numero === 2).aperture.map((a: any) => a.squadra)).toEqual(["Gufi"]);
    const cl = (await chiama("GET", "/api/squadra/stato", undefined, cookie.Corvi)).dati.classifica;
    expect(cl).toEqual([{ nome: "Gufi", colore: expect.any(String), aperte: 2, netto: 4 }, { nome: "Corvi", colore: expect.any(String), aperte: 1, netto: 3 }]);
    // proiettore: vince chi ha il punteggio netto più alto
    const sc = await chiama("POST", "/api/regia/schermi", {}, regia);
    const schermo = (await chiama("POST", "/api/accesso", { username: sc.dati.username, password: sc.dati.password })).cookie!;
    await chiama("POST", "/api/regia/scene", { tipo: "rivelazione", titolo: "Fine" }, regia);
    await chiama("POST", "/api/regia/rivela", {}, regia);
    expect((await chiama("GET", "/api/schermo/stato", undefined, schermo)).dati.scena.vincitori.map((v: any) => v.nome)).toEqual(["Gufi", "Corvi"]);
  });
});

describe("suoni d'ambiente", () => {
  test("la regia li accende e il proiettore li riceve", async () => {
    expect((await chiama("PUT", "/api/regia/ambiente", { volume: 101 }, regia)).stato).toBe(400);
    await chiama("PUT", "/api/regia/ambiente", { attivo: true, volume: 30 }, regia);
    expect((await chiama("GET", "/api/schermo/stato", undefined, regia)).dati.ambiente).toEqual({ attivo: true, volume: 30 });
  });
});

describe("tempo reale", () => {
  test("senza chiave resta spento", async () => {
    delete process.env.ABLY_API_KEY;
    expect((await chiama("GET", "/api/tempo-reale", undefined, cookie.Corvi)).dati).toEqual({ attivo: false });
  });

  test("con la chiave: token per un solo canale, e ogni cambio pubblica la versione", async () => {
    process.env.ABLY_API_KEY = "app1.chiave1:segreto";
    const viste: Array<{ url: string; body: any; auth: string }> = [];
    const prima = tempoReale.rete;
    tempoReale.rete = async (url, init) => {
      viste.push({ url, body: JSON.parse(String(init.body)), auth: String((init.headers as Record<string, string>).authorization) });
      return new Response(JSON.stringify(url.includes("requestToken") ? { token: "tok-123", expires: 1 } : {}), { status: 201 });
    };
    try {
      const r = (await chiama("GET", "/api/tempo-reale", undefined, cookie.Corvi)).dati;
      expect(r.attivo).toBe(true);
      expect(r.url).toBe(`https://main.realtime.ably.net/sse?v=1.2&channels=movente-serata-${sid}&accessToken=tok-123`);
      const richiesta = viste[0];
      expect(richiesta.url).toBe("https://main.realtime.ably.net/keys/app1.chiave1/requestToken");
      expect(richiesta.auth).toBe(`Basic ${Buffer.from("app1.chiave1:segreto").toString("base64")}`);
      expect(JSON.parse(richiesta.body.capability)).toEqual({ [`movente-serata-${sid}`]: ["subscribe"] });

      await chiama("PUT", "/api/regia/ambiente", { volume: 40 }, regia);
      const pubblicata = viste.find((v) => v.url.endsWith(`/channels/movente-serata-${sid}/messages`));
      const versione = (await chiama("GET", "/api/versione", undefined, cookie.Corvi)).dati.versione;
      expect(pubblicata?.body).toEqual({ name: "versione", data: versione });

      // se Ably non risponde, la regia lavora lo stesso e il token dice "spento"
      tempoReale.rete = async () => { throw new Error("rete giù"); };
      expect((await chiama("PUT", "/api/regia/ambiente", { volume: 41 }, regia)).stato).toBe(200);
      expect((await chiama("GET", "/api/tempo-reale", undefined, cookie.Corvi)).dati).toEqual({ attivo: false });
    } finally {
      tempoReale.rete = prima;
      delete process.env.ABLY_API_KEY;
    }
  });
});

test("l'aggiornamento alla 2.3 conserva i dati di un database 2.2 in uso", async () => {
  const { MIGRAZIONI } = await import("../migrazioni.ts");
  const altro = new NetlifyDB();
  const d2 = apriDb(await altro.start());
  const fino = MIGRAZIONI.findIndex((m) => m.nome === "20261102100000_versione_2_3");
  await d2.q("CREATE TABLE migrazione (nome TEXT PRIMARY KEY, applicata TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  for (const m of MIGRAZIONI.slice(0, fino)) {
    await d2.q(m.sql);
    await d2.q("INSERT INTO migrazione (nome) VALUES ($1)", [m.nome]);
  }
  const s = await d2.uno<{ id: number }>("INSERT INTO serata (titolo, slug) VALUES ('Halloween', 'halloween') RETURNING id");
  const sq = await d2.uno<{ id: number }>("INSERT INTO squadra (serata_id, nome) VALUES ($1, 'Gufi') RETURNING id", [s!.id]);
  const pe = await d2.uno<{ id: number }>("INSERT INTO personaggio (serata_id, nome, scheda) VALUES ($1, 'Il conte', 'Morto') RETURNING id", [s!.id]);
  await d2.q("INSERT INTO invitato (serata_id, nome, squadra_id) VALUES ($1, 'Ludo', $2)", [s!.id, sq!.id]);
  await migra(d2);
  expect(await d2.uno("SELECT prova FROM squadra WHERE id = $1", [sq!.id])).toEqual({ prova: false });
  expect(await d2.uno("SELECT scheda, copione FROM personaggio WHERE id = $1", [pe!.id])).toEqual({ scheda: "Morto", copione: "" });
  expect(await d2.uno("SELECT nome, squadra_id, personaggio_id FROM invitato")).toEqual({ nome: "Ludo", squadra_id: sq!.id, personaggio_id: null });
  expect(await d2.uno("SELECT aiuti_attivi, aiuti_max, ambiente_attivo, ambiente_volume FROM serata WHERE id = $1", [s!.id]))
    .toEqual({ aiuti_attivi: false, aiuti_max: 3, ambiente_attivo: false, ambiente_volume: 50 });
  await d2.fine?.();
  await altro.stop();
}, 60_000);
