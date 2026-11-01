import { describe, expect, test } from "vitest";
import { COLORI, MARCHIO, TEMI as CATALOGO, frasiDaMostrare, temaDa, variabili } from "../../src/app/temi/catalogo.ts";
import { TEMI } from "../regia.ts";

/** Contrasto WCAG tra due colori #rrggbb. */
function contrasto(a: string, b: string) {
  const luce = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [luce(a), luce(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

test("il catalogo dei temi e il server conoscono gli stessi temi", () => {
  expect(CATALOGO.map((t) => t.id)).toEqual(TEMI);
  expect(new Set(TEMI).size).toBe(TEMI.length);
  expect(temaDa("sconosciuto").id).toBe("halloween");
});

test("le nuvolette usano le frasi della serata, altrimenti quelle del tema", () => {
  expect(frasiDaMostrare("halloween", { attivi: true, frasi: ["Mia"] })).toEqual(["Mia"]);
  expect(frasiDaMostrare("halloween", { attivi: true, frasi: [] })).toBe(temaDa("halloween").frasi);
  expect(frasiDaMostrare("halloween", { attivi: false, frasi: ["Mia"] })).toEqual([]);
  expect(frasiDaMostrare("halloween", undefined)).toEqual([]);
});

test("il marchio non è un tema da scegliere per una serata", () => {
  expect(TEMI).not.toContain(MARCHIO.id);
  expect(temaDa(MARCHIO.id).id).toBe("halloween");
});

describe.each([...CATALOGO, MARCHIO].map((t) => [t.nome, t] as const))("%s", (_nome, t) => {
  test("ha tutti i colori e due caratteri", () => {
    for (const c of COLORI) expect(t.colori[c], c).toMatch(/^#[0-9a-f]{6}$/);
    expect(Object.keys(variabili(t))).toHaveLength(COLORI.length + 2);
    expect(t.titoli).not.toBe(t.corpo);
  });

  test.skipIf(t === MARCHIO)("ha sei figure diverse per le nuvolette", () => {
    expect(t.figure).toHaveLength(6);
    expect(new Set(t.figure).size).toBe(6);
  });

  test.skipIf(t === MARCHIO)("ha frasi pronte per le nuvolette, brevi", () => {
    expect(t.frasi.length).toBeGreaterThanOrEqual(12);
    for (const f of t.frasi) expect(f.length, f).toBeLessThanOrEqual(120);
    expect(new Set(t.frasi).size).toBe(t.frasi.length);
  });

  test("si legge: testo su ogni fondo, sull'accento e sulla carta", () => {
    const c = t.colori;
    for (const fondo of [c.fondo, c["fondo-2"], c["fondo-3"]]) {
      expect(contrasto(c["testo-1"], fondo)).toBeGreaterThanOrEqual(7);
      expect(contrasto(c["testo-2"], fondo)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrasto(c["su-accento"], c.accento)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(c["su-accento"], c["accento-chiaro"])).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(c["su-disco"], c.disco)).toBeGreaterThanOrEqual(4.5);
    expect(contrasto(c.inchiostro, c.carta)).toBeGreaterThanOrEqual(7);
    expect(contrasto(c.allarme, c.fondo)).toBeGreaterThanOrEqual(4.5);
  });
});
