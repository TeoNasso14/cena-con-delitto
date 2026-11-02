import { NetlifyDB } from "@netlify/database-dev";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { apriDb, Db, migra } from "../base.ts";
import { controlla, DatiCaso } from "../controllo.ts";
import { genera, segnapostoRimasti } from "../modelli/genera.ts";
import { MODELLI } from "../modelli/index.ts";
import { TEMI } from "../regia.ts";
import { gestisci } from "../router.ts";

process.env.SESSION_SECRET = "segreto-di-prova-lungo-almeno-trentadue-caratteri";
process.env.SETUP_CODE = "codice-avvio";
process.env.CENA_ARCHIVIO_MEMORIA = "1";

/** Un generatore di numeri casuali ripetibile. */
function dado(seme: number) {
  let x = seme;
  return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
}

type Caso = ReturnType<typeof genera>["caso"];
const testi = (c: Caso) => JSON.stringify(c);

/**
 * Una partita simulata: la squadra conosce solo i codici scritti nelle prove già aperte.
 * Avvia le fasi una alla volta; alla fine ogni prova deve essere aperta. Restituisce le prove mai aperte.
 */
function giocaSoloConICodiciTrovati(c: Caso, soloCodici: boolean) {
  const prove = c.prove ?? [];
  const aperte = new Set<number>();
  for (let fase = 1; fase <= (c.fasi ?? []).length; fase++) {
    for (let cambiato = true; cambiato;) {
      cambiato = false;
      const noti = prove.filter((p) => aperte.has(Number(p["numero"]))).map((p) => String(p["testo"])).join(" ");
      for (const p of prove) {
        const n = Number(p["numero"]);
        if (aperte.has(n)) continue;
        const gruppi = new Map<number, NonNullable<typeof p.regole>>();
        for (const r of p.regole ?? []) gruppi.set(r.gruppo ?? 1, [...(gruppi.get(r.gruppo ?? 1) ?? []), r]);
        const ok = [...gruppi.values()].some((g) => {
          // Senza le aperture di riserva: una fase conta solo se il modo non ha alternative con un codice.
          if (soloCodici && g.every((r) => r.tipo === "fase") && (p.regole ?? []).some((r) => r.tipo === "pin")) return false;
          return g.every((r) => (r.tipo === "fase" ? Number(r.fase_numero) <= fase : r.tipo === "prova" ? aperte.has(Number(r.prova_richiesta)) : noti.includes(String(r.pin))));
        });
        if (ok) { aperte.add(n); cambiato = true; }
      }
    }
  }
  return prove.filter((p) => !aperte.has(Number(p["numero"]))).map((p) => p["titolo"]);
}

/** Il caso generato come lo legge il controllo del caso. */
function perControllo(c: Caso, invitati: DatiCaso["invitati"] = []): DatiCaso {
  const idDi = (n: unknown) => Number(n);
  return {
    serata: { colpevole: String(c.serata?.colpevole), movente: String(c.serata?.movente), arma: String(c.serata?.arma) },
    fasi: (c.fasi ?? []).map((_, i) => i + 1),
    prove: (c.prove ?? []).map((p) => ({
      id: idDi(p["numero"]), numero: idDi(p["numero"]), tipo: String(p["tipo"]), testo: String(p["testo"]), allegato_key: null,
      regole: (p.regole ?? []).map((r) => ({ tipo: r.tipo as "pin", pin: r.pin ?? null, prova_richiesta_id: r.prova_richiesta ?? null, fase_numero: r.fase_numero ?? null, squadra_id: null, gruppo: r.gruppo ?? 1 })),
    })),
    squadre: [{ id: 1, nome: "Corvi" }],
    schermi: 1,
    personaggi: (c.personaggi ?? []).map((p, i) => ({ id: i + 1, nome: String(p["nome"]), ruolo: String(p["ruolo"]) })),
    scene: (c.scene ?? []).map((s) => ({ tipo: String(s["tipo"]), titolo: String(s["titolo"]), allegato_key: null, fase_numero: (s["fase_numero"] as number | null) ?? null, avvio_automatico: s["avvio_automatico"] === true })),
    invitati,
  };
}

describe("i modelli pronti", () => {
  for (const m of MODELLI) {
    test(`${m.nome}: ogni colpevole, grandezza, fasi e difficoltà dà un caso che funziona`, () => {
      const colpevoli = m.sospetti.filter((s) => s.colpevole).map((s) => s.chiave);
      expect(colpevoli.length).toBeGreaterThanOrEqual(4);
      expect(m.minimo).toBe(4);
      expect(m.sospetti).toHaveLength(8);
      for (const tema of [undefined, ...m.temi]) for (const colpevole of colpevoli) for (const sospetti of [4, 5, 6, 7, 8]) for (const fasi of [3, 4]) for (const difficolta of [1, 2, 3] as const) {
        const nome = `${tema} ${colpevole} ${sospetti} ${fasi} ${difficolta}`;
        const g = genera(m, { tema, colpevole, sospetti, fasi, difficolta }, dado(sospetti * 31 + difficolta));
        expect(g.colpevole, nome).toBe(colpevole);
        expect(segnapostoRimasti(testi(g.caso)), nome).toEqual([]);
        expect(testi(g.caso), nome).not.toContain("[[");
        expect(g.caso.personaggi, nome).toHaveLength(sospetti);
        expect(g.caso.fasi, nome).toHaveLength(fasi);
        expect(new Set(g.caso.personaggi!.map((p) => p["nome"])).size, nome).toBe(sospetti);
        // Il controllo del caso non trova niente.
        expect(controlla(perControllo(g.caso)), nome).toEqual([]);
        // Si può giocare tutta con i soli codici trovati nelle prove.
        expect(giocaSoloConICodiciTrovati(g.caso, true), nome).toEqual([]);
        // I codici sono tutti diversi, di quattro cifre.
        const codici = Object.values(g.codici);
        expect(new Set(codici).size, nome).toBe(codici.length);
        for (const c of codici) expect(c, nome).toMatch(/^\d{4}$/);
        // Una sola scena automatica per fase.
        const auto = g.caso.scene!.filter((s) => s["avvio_automatico"]).map((s) => s["fase_numero"]);
        expect(new Set(auto).size, nome).toBe(auto.length);
      }
    });

    test(`${m.nome}: la difficoltà cambia davvero la serata, e la sorte cambia il colpevole`, () => {
      const quante = (difficolta: 1 | 2 | 3) => genera(m, { difficolta, colpevole: "s1" }, dado(1)).caso.prove!.length;
      expect(quante(1)).toBeLessThan(quante(2));
      expect(quante(2)).toBeLessThan(quante(3));
      const facile = genera(m, { difficolta: 1, colpevole: "s1" }, dado(1)).caso.prove!;
      const difficile = genera(m, { difficolta: 3, colpevole: "s1" }, dado(1)).caso.prove!;
      expect(facile.some((p) => p["nota_sigillo"])).toBe(true);
      expect(difficile.some((p) => p["nota_sigillo"])).toBe(false);
      const estratti = new Set(Array.from({ length: 60 }, () => genera(m, { colpevole: "sorte" }).colpevole));
      expect(estratti.size).toBeGreaterThanOrEqual(3);
    });

    test(`${m.nome}: nomi e luogo della regia entrano in tutti i testi, il colpevole resta segreto nelle prove aperte all'inizio`, () => {
      const g = genera(m, { luogo: "Zelda", vittima: "il barone Rampante", anno: "Il 1999", nomi: { s1: "Ermenegilda" }, colpevole: "s2" }, dado(5));
      expect(String(g.caso.serata?.premessa)).toContain("Il barone Rampante");
      expect(String(g.caso.serata?.titolo)).toContain("Zelda");
      expect(testi(g.caso)).toContain("Ermenegilda");
      const iniziali = g.caso.prove!.filter((p) => p.regole?.some((r) => r.fase_numero === 1)).map((p) => String(p["testo"])).join(" ");
      expect(iniziali).not.toContain(String(g.caso.serata?.colpevole));
      expect(iniziali).not.toContain(String(g.caso.serata?.arma));
    });
  }

  test("un colpevole fuori gioco si rifiuta", () => {
    expect(() => genera(MODELLI[0], { colpevole: "s7" })).toThrow();
  });
});

describe("le API dei modelli", () => {
  let pg: NetlifyDB;
  let db: Db;
  let admin = "";
  let anna = "";
  let bruno = "";

  async function chiama(metodo: string, path: string, body?: unknown, cookie?: string, serata?: number, extra: Record<string, string> = {}) {
    const headers: Record<string, string> = { ...extra };
    const binario = body instanceof Uint8Array;
    if (body !== undefined && !binario) headers["content-type"] = "application/json";
    if (cookie) headers.cookie = cookie;
    if (serata) headers["x-serata"] = String(serata);
    const res = await gestisci(new Request(`https://cena.test${path}`, { method: metodo, headers, body: body === undefined ? undefined : binario ? ((body as Uint8Array).buffer as ArrayBuffer) : JSON.stringify(body) }), db);
    const set = res.headers.get("set-cookie");
    return { stato: res.status, dati: (await res.json().catch(() => null)) as any, cookie: set ? set.split(";")[0] : undefined };
  }

  beforeAll(async () => {
    pg = new NetlifyDB();
    db = apriDb(await pg.start());
    await migra(db);
    admin = (await chiama("POST", "/api/avvio", { codice: "codice-avvio", username: "teo", password: "password-amministrazione" })).cookie!;
    for (const nome of ["anna", "bruno"]) {
      const inv = await chiama("POST", "/api/admin/inviti", { nome }, admin);
      const c = (await chiama("POST", `/api/invito/${inv.dati.token}`, { username: nome, password: "una-password-lunga" })).cookie!;
      if (nome === "anna") anna = c; else bruno = c;
    }
  }, 60_000);
  afterAll(async () => {
    await db.fine?.();
    await pg.stop();
  });

  test("l'elenco mostra i modelli senza prove né soluzioni; l'amministrazione non entra", async () => {
    const r = await chiama("GET", "/api/regia/modelli", undefined, anna);
    expect(r.dati.modelli.map((m: any) => m.id)).toEqual(["villa", "viaggio", "maschere"]);
    const t = JSON.stringify(r.dati);
    for (const v of ["prove", "movente", "copione", "arma"]) expect(t).not.toContain(`"${v}"`);
    expect((await chiama("GET", "/api/regia/modelli", undefined, admin)).stato).toBe(403);
    expect((await chiama("POST", "/api/regia/serate/da-modello", { modello: "villa" }, admin)).stato).toBe(403);
  });

  test("una serata nuova da un modello è una serata normale, pronta da controllare", async () => {
    expect((await chiama("POST", "/api/regia/serate/da-modello", { modello: "nessuno" }, anna)).stato).toBe(404);
    expect((await chiama("POST", "/api/regia/serate/da-modello", { modello: "villa", scelte: { difficolta: 9 } }, anna)).stato).toBe(400);
    expect((await chiama("POST", "/api/regia/serate/da-modello", { modello: "villa", scelte: { colpevole: "s8" } }, anna)).stato).toBe(400);
    const c = await chiama("POST", "/api/regia/serate/da-modello", { modello: "villa", scelte: { tema: "noir", luogo: "Ardenza", sospetti: 6, fasi: 3, difficolta: 3, minuti: 25, colpevole: "sorte", nomi: { s1: "Ermes" } } }, anna);
    expect(c.stato).toBe(201);
    // la risposta non dice chi è il colpevole
    expect(Object.keys(c.dati).sort()).toEqual(["id", "slug"]);
    const t = (await chiama("GET", "/api/regia", undefined, anna, c.dati.id)).dati;
    expect(t.serata).toMatchObject({ titolo: "Il testamento di villa Ardenza", tema: "noir", stato: "bozza" });
    expect(t.personaggi).toHaveLength(6);
    expect(t.personaggi[0].nome).toBe("Ermes");
    expect(t.fasi.map((f: any) => f.durata_minuti)).toEqual([25, 25, 25]);
    expect(t.prove.length).toBeGreaterThan(5);
    const problemi = (await chiama("GET", "/api/regia/controllo", undefined, anna, c.dati.id)).dati.problemi;
    expect(problemi.filter((p: any) => p.livello === "errore")).toEqual([]);
    // si gioca davvero: una squadra apre la prova della fase 1
    const sq = await chiama("POST", "/api/regia/squadre", { nome: "Corvi" }, anna, c.dati.id);
    const corvi = (await chiama("POST", "/api/accesso", { username: sq.dati.username, password: sq.dati.password, slug: c.dati.slug })).cookie!;
    await chiama("POST", "/api/regia/fase", { numero: 1 }, anna, c.dati.id);
    const tel = (await chiama("GET", "/api/squadra/stato", undefined, corvi)).dati;
    expect(tel.prove.filter((p: any) => p.aperta)).toHaveLength(2);
    expect(JSON.stringify(tel.personaggi)).not.toContain("copione");
  });

  test("salva come modello: segnaposto, codici nuovi, allegati che sopravvivono alla serata", async () => {
    const s = (await chiama("POST", "/api/regia/serate", { titolo: "La cena di Villa Rosa" }, anna)).dati.id;
    await chiama("PUT", "/api/regia/caso", { titolo: "La cena di Villa Rosa", premessa: "A Villa Rosa è morta Olga Neri.", colpevole: "Il cuoco", movente: "Soldi", arma: "Veleno" }, anna, s);
    await chiama("PUT", "/api/regia/fasi", { fasi: [{ nome: "Inizio", durata_minuti: 10 }] }, anna, s);
    // senza il colpevole tra i personaggi non si può
    expect((await chiama("POST", "/api/regia/modelli", { nome: "Rosa" }, anna, s)).dati.codice).toBe("colpevole_sconosciuto");
    await chiama("POST", "/api/regia/personaggi", { nome: "Dario Rossi", ruolo: "Il cuoco", scheda: "Dario Rossi cucina.", copione: "Sei Dario Rossi: hai ucciso." }, anna, s);
    await chiama("POST", "/api/regia/personaggi", { nome: "Dario", ruolo: "Il garzone", scheda: "Aiuta Dario Rossi." }, anna, s);
    const f = await chiama("POST", "/api/regia/allegati", new Uint8Array(500).fill(9), anna, s, { "content-type": "image/png" });
    const p1 = await chiama("POST", "/api/regia/prove", { numero: 1, titolo: "Il biglietto", testo: "Dario Rossi ha scritto: 7788. A Villa Rosa nessuno lo sa.", tipo: "foto", allegato_key: f.dati.key, allegato_tipo: "image/png", in_elenco: true, regole: [{ tipo: "fase", fase_numero: 1, gruppo: 1 }] }, anna, s);
    expect(p1.stato).toBe(201);
    await chiama("POST", "/api/regia/prove", { numero: 2, titolo: "La cassaforte", testo: "Dentro: i soldi.", nota_sigillo: "Chiedi a Dario Rossi", regole: [{ tipo: "pin", pin: "7788", gruppo: 1 }, { tipo: "prova", prova_richiesta_id: p1.dati.id, gruppo: 1 }] }, anna, s);

    const sv = await chiama("POST", "/api/regia/modelli", { nome: "La mia villa", descrizione: "Quella di maggio", luogo: "Villa Rosa", vittima: "Olga Neri" }, anna, s);
    expect(sv.stato).toBe(201);
    const scheda = (await chiama("GET", "/api/regia/modelli", undefined, anna)).dati.modelli.find((m: any) => m.id === sv.dati.id);
    expect(scheda).toMatchObject({ nome: "La mia villa", privato: true, sospetti: [{ chiave: "s1", ruolo: "Il cuoco", colpevole: true }, { chiave: "s2", ruolo: "Il garzone", colpevole: false }] });
    expect(scheda.segnaposto.luogo).toMatchObject({ usato: true, proposte: { "*": ["Villa Rosa"] } });
    expect(scheda.segnaposto.anno.usato).toBe(false);
    // di un'altra regia non si vede e non si usa
    expect((await chiama("GET", "/api/regia/modelli", undefined, bruno)).dati.modelli.map((m: any) => m.id)).toEqual(["villa", "viaggio", "maschere"]);
    expect((await chiama("POST", "/api/regia/serate/da-modello", { modello: sv.dati.id }, bruno)).stato).toBe(404);
    // l'amministrazione vede solo il numero
    const utenti = (await chiama("GET", "/api/admin", undefined, admin)).dati;
    expect(utenti.utenti.find((u: any) => u.username === "anna").modelli).toBe(1);
    expect(JSON.stringify(utenti)).not.toContain("La mia villa");

    // la serata di partenza sparisce, il modello resta con il suo allegato
    expect((await chiama("POST", `/api/regia/serate/${s}/elimina`, { conferma: "La cena di Villa Rosa" }, anna)).stato).toBe(200);
    const n = await chiama("POST", "/api/regia/serate/da-modello", { modello: sv.dati.id, scelte: { luogo: "Casa Blu", vittima: "Ugo Bassi", nomi: { s1: "Nino Sole" }, titolo: "Sera blu" } }, anna);
    expect(n.stato).toBe(201);
    const t = (await chiama("GET", "/api/regia", undefined, anna, n.dati.id)).dati;
    expect(t.serata).toMatchObject({ titolo: "Sera blu", premessa: "A Casa Blu è morta Ugo Bassi.", colpevole: "Nino Sole", movente: "Soldi", arma: "Veleno" });
    expect(t.personaggi.map((p: any) => [p.nome, p.ruolo, p.copione])).toEqual([["Nino Sole", "Il cuoco", "Sei Nino Sole: hai ucciso."], ["Dario", "Il garzone", ""]]);
    expect(t.personaggi[1].scheda).toBe("Aiuta Nino Sole.");
    const [a, b] = t.prove;
    const nuovo = b.regole.find((r: any) => r.tipo === "pin").pin;
    expect(nuovo).toMatch(/^\d{4}$/);
    expect(a.testo).toBe(`Nino Sole ha scritto: ${nuovo}. A Casa Blu nessuno lo sa.`);
    expect(b.nota_sigillo).toBe("Chiedi a Nino Sole");
    expect(b.regole.find((r: any) => r.tipo === "prova").prova_richiesta_id).toBe(a.id);
    expect(a.allegato_key).toMatch(new RegExp(`^s${n.dati.id}-`));
    expect(a.in_elenco).toBe(true);
    const file = await gestisci(new Request(`https://cena.test/api/file/${a.allegato_key}`, { headers: { cookie: anna } }), db);
    expect(file.status).toBe(200);
    expect((await file.arrayBuffer()).byteLength).toBe(500);
  });

  test("i modelli passano con le serate; un account con modelli non si elimina", async () => {
    const v = (await chiama("GET", "/api/admin", undefined, admin)).dati.utenti;
    const [a, b] = ["anna", "bruno"].map((n) => v.find((u: any) => u.username === n).id);
    expect((await chiama("POST", `/api/admin/utenti/${a}/elimina`, { conferma: "anna" }, admin)).dati.codice).toBe("ha_serate");
    await chiama("POST", `/api/admin/utenti/${a}/trasferisci`, { a: b }, admin);
    expect((await chiama("GET", "/api/regia/modelli", undefined, bruno)).dati.modelli.some((m: any) => m.privato)).toBe(true);
    expect((await chiama("POST", `/api/admin/utenti/${a}/elimina`, { conferma: "anna" }, admin)).stato).toBe(200);
    // eliminando un modello spariscono i suoi allegati
    const m = (await chiama("GET", "/api/regia/modelli", undefined, bruno)).dati.modelli.find((x: any) => x.privato);
    const prima = (await chiama("GET", "/api/admin", undefined, admin)).dati.sito.allegati.file;
    expect((await chiama("DELETE", `/api/regia/modelli/${m.id.slice(1)}`, undefined, anna)).stato).toBe(401);
    expect((await chiama("DELETE", `/api/regia/modelli/${m.id.slice(1)}`, undefined, bruno)).stato).toBe(200);
    expect((await chiama("GET", "/api/admin", undefined, admin)).dati.sito.allegati.file).toBe(prima - 1);
  });

  test("l'aggiornamento conserva un database in uso", async () => {
    const { MIGRAZIONI } = await import("../migrazioni.ts");
    const altro = new NetlifyDB();
    const d2 = apriDb(await altro.start());
    const fino = MIGRAZIONI.findIndex((m) => m.nome === "20261102200000_modelli");
    await d2.q("CREATE TABLE migrazione (nome TEXT PRIMARY KEY, applicata TIMESTAMPTZ NOT NULL DEFAULT NOW())");
    for (const m of MIGRAZIONI.slice(0, fino)) {
      await d2.q(m.sql);
      await d2.q("INSERT INTO migrazione (nome) VALUES ($1)", [m.nome]);
    }
    const u = await d2.uno<{ id: number }>("INSERT INTO utente (username, password_hash) VALUES ('org', 'x') RETURNING id");
    await d2.q("INSERT INTO serata (titolo, slug, proprietario_id) VALUES ('Halloween', 'halloween', $1)", [u!.id]);
    await migra(d2);
    expect((await d2.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM serata"))!.n).toBe(1);
    expect((await d2.uno<{ n: number }>("SELECT COUNT(*)::int AS n FROM modello"))!.n).toBe(0);
    await d2.fine?.();
    await altro.stop();
  }, 60_000);
});

test("i temi consigliati dei modelli sono temi del catalogo", () => {
  for (const m of MODELLI) for (const t of m.temi) expect(TEMI).toContain(t);
});

test("un nome all'inizio di frase prende la maiuscola", () => {
  const g = genera(MODELLI[0], { vittima: "il conte Rossi", anno: "Il 1932", colpevole: "s1" }, dado(3));
  expect(String(g.caso.serata?.premessa)).toContain("Il 1932. Il conte Rossi ha riunito");
  expect(String(g.caso.scene?.find((s) => s["tipo"] === "rivelazione")?.["titolo"])).toBe("Chi ha ucciso il conte Rossi?");
});
