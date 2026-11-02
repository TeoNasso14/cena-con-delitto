import { utente } from "./accesso.ts";
import { ablyBase, autorizzazioneAbly, canaleSerata, chiaveAbly, Db, json, tempoReale } from "./base.ts";

/**
 * Il token per ascoltare in tempo reale il canale della propria serata, e nient'altro (capacità "subscribe" su un canale).
 * Senza ABLY_API_KEY, o se Ably non risponde, i browser restano sul controllo della versione di sempre.
 */
export async function token(req: Request, db: Db) {
  const u = await utente(req, db, ["squadra", "schermo", "regia"]);
  const k = chiaveAbly();
  if (!k) return json({ attivo: false });
  const nomeChiave = k.slice(0, k.indexOf(":"));
  const canale = canaleSerata(u.serata_id);
  try {
    const r = await tempoReale.rete(`${ablyBase}/keys/${encodeURIComponent(nomeChiave)}/requestToken`, {
      method: "POST",
      headers: { authorization: autorizzazioneAbly(k), "content-type": "application/json" },
      body: JSON.stringify({ keyName: nomeChiave, timestamp: Date.now(), ttl: 60 * 60 * 1000, capability: JSON.stringify({ [canale]: ["subscribe"] }) }),
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error(`Ably ha risposto ${r.status}`);
    const t = (await r.json()) as { token?: string; expires?: number };
    if (!t.token) throw new Error("Ably non ha dato un token");
    const url = `${ablyBase}/sse?v=1.2&channels=${encodeURIComponent(canale)}&accessToken=${encodeURIComponent(t.token)}`;
    return json({ attivo: true, url, scade: t.expires ?? null });
  } catch (e) {
    console.warn("Token del tempo reale non disponibile", e);
    return json({ attivo: false });
  }
}
