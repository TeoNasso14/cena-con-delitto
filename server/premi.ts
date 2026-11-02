import { utente } from "./accesso.ts";
import { corpo, Db, Errore, intero, json, testo, tocca } from "./base.ts";

/* ---------- Votazioni e premi: la regia li prepara e li apre, ogni telefono vota, il proiettore rivela ---------- */

type Candidati = "invitati" | "personaggi" | "squadre";
interface Premio { id: number; nome: string; candidati: Candidati; stato: "preparato" | "aperto" | "chiuso" | "rivelato"; ordine: number; rivelato: Date | null }

const regia = (req: Request, db: Db) => utente(req, db, ["regia"]);

/** Chi si può votare in una serata, per tipo. Le squadre senza la prova generale. */
export async function candidatiDi(db: Db, sid: number, tipo: Candidati) {
  if (tipo === "invitati") return db.q<{ id: number; nome: string; colore: string | null }>("SELECT id, nome, NULL AS colore FROM invitato WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  if (tipo === "personaggi") return db.q<{ id: number; nome: string; colore: string | null }>("SELECT id, nome, NULL AS colore FROM personaggio WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  return db.q<{ id: number; nome: string; colore: string | null }>("SELECT id, nome, colore FROM squadra WHERE serata_id = $1 AND NOT prova ORDER BY id", [sid]);
}

/** I voti di un premio per candidato, senza quelli della prova generale. */
async function conteggi(db: Db, premioId: number) {
  const r = await db.q<{ candidato: number; n: number }>(
    `SELECT v.candidato, COUNT(*)::int AS n FROM voto v JOIN squadra q ON q.id = v.squadra_id
     WHERE v.premio_id = $1 AND NOT q.prova GROUP BY v.candidato`,
    [premioId],
  );
  return new Map(r.map((x) => [x.candidato, x.n]));
}

/** Ogni premio con i candidati e i voti: per la regia. */
export async function premiDellaRegia(db: Db, sid: number) {
  const premi = await db.q<Premio>("SELECT id, nome, candidati, stato, ordine, rivelato FROM premio WHERE serata_id = $1 ORDER BY ordine, id", [sid]);
  const out = [];
  for (const p of premi) {
    const voti = await conteggi(db, p.id);
    const candidati = (await candidatiDi(db, sid, p.candidati)).map((c) => ({ ...c, voti: voti.get(c.id) ?? 0 }));
    out.push({ ...p, candidati, votanti: [...voti.values()].reduce((a, b) => a + b, 0) });
  }
  return out;
}

/** I premi rivelati, con chi ha vinto (a pari voti vincono tutti): per il proiettore. */
export async function premiRivelati(db: Db, sid: number) {
  const premi = (await premiDellaRegia(db, sid)).filter((p) => p.stato === "rivelato");
  return premi.map((p) => {
    const max = Math.max(0, ...p.candidati.map((c) => c.voti));
    return { nome: p.nome, voti: max, vincitori: max ? p.candidati.filter((c) => c.voti === max).map((c) => ({ nome: c.nome, colore: c.colore })) : [] };
  });
}

/** I premi aperti al voto, per il telefono: candidati e il voto di questo telefono, nessun conteggio. */
export async function premiPerTelefono(db: Db, sid: number, dispositivo: string | null) {
  const premi = await db.q<Premio>("SELECT id, nome, candidati, stato, ordine, rivelato FROM premio WHERE serata_id = $1 AND stato = 'aperto' ORDER BY ordine, id", [sid]);
  const out = [];
  for (const p of premi) {
    const mio = dispositivo ? await db.uno<{ candidato: number }>("SELECT candidato FROM voto WHERE premio_id = $1 AND dispositivo = $2", [p.id, dispositivo]) : null;
    out.push({ id: p.id, nome: p.nome, candidati: (await candidatiDi(db, sid, p.candidati)).map(({ id, nome, colore }) => ({ id, nome, colore })), mio: mio?.candidato ?? null });
  }
  return out;
}

export const dispositivoDa = (req: Request) => {
  const d = req.headers.get("x-dispositivo");
  return d && /^[A-Za-z0-9_-]{12,64}$/.test(d) ? d : null;
};

export async function crea(req: Request, db: Db) {
  const u = await regia(req, db);
  const b = await corpo<{ nome?: string; candidati?: string }>(req);
  if (!["invitati", "personaggi", "squadre"].includes(String(b.candidati))) throw new Errore(400, "Si vota tra invitati, personaggi o squadre.");
  const o = await db.uno<{ n: number }>("SELECT COALESCE(MAX(ordine), 0)::int + 1 AS n FROM premio WHERE serata_id = $1", [u.serata_id]);
  const r = await db.uno<{ id: number }>("INSERT INTO premio (serata_id, nome, candidati, ordine) VALUES ($1, $2, $3, $4) RETURNING id", [
    u.serata_id, testo(b.nome, "nome del premio", { max: 80 }), b.candidati, o!.n,
  ]);
  await tocca(db, u.serata_id);
  return json({ id: r!.id }, 201);
}

/** Rinomina un premio o ne cambia lo stato: preparato, aperto (si vota), chiuso, rivelato (va sul proiettore). */
export async function modifica(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  const p = await db.uno<Premio>("SELECT * FROM premio WHERE id = $1 AND serata_id = $2", [id, u.serata_id]);
  if (!p) throw new Errore(404, "Premio non trovato.");
  const b = await corpo<{ nome?: string; stato?: string }>(req);
  if (b.nome !== undefined) await db.q("UPDATE premio SET nome = $1 WHERE id = $2", [testo(b.nome, "nome del premio", { max: 80 }), id]);
  if (b.stato !== undefined) {
    if (!["preparato", "aperto", "chiuso", "rivelato"].includes(b.stato)) throw new Errore(400, "Stato non valido.");
    await db.q("UPDATE premio SET stato = $1, rivelato = CASE WHEN $1 = 'rivelato' THEN NOW() ELSE NULL END WHERE id = $2", [b.stato, id]);
    const fatto = { preparato: "rimesso in preparazione", aperto: "aperto al voto", chiuso: "chiuso", rivelato: "rivelato" }[b.stato as Premio["stato"]];
    await db.q("INSERT INTO evento (serata_id, tipo, testo) VALUES ($1, 'premio', $2)", [u.serata_id, `Premio "${p.nome}" ${fatto}`]);
    if (b.stato === "rivelato") {
      // Se c'è una scena dei premi, il proiettore ci va da solo.
      const sc = await db.uno<{ id: number }>("SELECT id FROM scena WHERE serata_id = $1 AND tipo = 'premi' ORDER BY ordine, id LIMIT 1", [u.serata_id]);
      if (sc) {
        await db.q("UPDATE scena SET in_onda_dal = NOW() WHERE id = $1", [sc.id]);
        await db.q("UPDATE serata SET scena_in_onda = $1, schermo_nero = FALSE WHERE id = $2", [sc.id, u.serata_id]);
      }
    }
  }
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

export async function elimina(req: Request, db: Db, id: number) {
  const u = await regia(req, db);
  const r = await db.q("DELETE FROM premio WHERE id = $1 AND serata_id = $2 RETURNING id", [id, u.serata_id]);
  if (!r.length) throw new Errore(404, "Premio non trovato.");
  await tocca(db, u.serata_id);
  return json({ ok: true });
}

/** Un telefono vota (o cambia voto) finché il premio è aperto. */
export async function vota(req: Request, db: Db) {
  const u = await utente(req, db, ["squadra"]);
  const dispositivo = dispositivoDa(req);
  if (!dispositivo) throw new Errore(400, "Questo telefono non si riconosce: ricarica la pagina e riprova.");
  const b = await corpo<{ premio_id?: number; candidato?: number }>(req);
  const p = await db.uno<Premio>("SELECT * FROM premio WHERE id = $1 AND serata_id = $2", [intero(b.premio_id, "premio"), u.serata_id]);
  if (!p) throw new Errore(404, "Premio non trovato.");
  if (p.stato !== "aperto") throw new Errore(409, "Il voto per questo premio è chiuso.", "voto_chiuso");
  const c = intero(b.candidato, "candidato");
  if (!(await candidatiDi(db, u.serata_id, p.candidati)).some((x) => x.id === c)) throw new Errore(404, "Candidato non trovato.");
  await db.q(
    `INSERT INTO voto (premio_id, dispositivo, squadra_id, candidato) VALUES ($1, $2, $3, $4)
     ON CONFLICT (premio_id, dispositivo) DO UPDATE SET candidato = EXCLUDED.candidato, squadra_id = EXCLUDED.squadra_id, ora = NOW()`,
    [p.id, dispositivo, u.squadra_id, c],
  );
  await tocca(db, u.serata_id);
  return json({ ok: true });
}
