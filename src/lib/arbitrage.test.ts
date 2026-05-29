import { describe, it, expect } from "vitest";
import { calculateArbitrage, computeStakes } from "@/lib/arbitrage";

describe("calculateArbitrage", () => {
  it("retorna null com menos de 2 casas", () => {
    expect(calculateArbitrage([{ home: 2.0, away: 1.9 }])).toBeNull();
  });

  it("retorna null sem arbitragem (2-way típico)", () => {
    expect(
      calculateArbitrage([
        { home: 1.95, away: 1.95 },
        { home: 1.9, away: 2.0 },
      ]),
    ).toBeNull();
  });

  it("retorna null sem arbitragem (3-way típico)", () => {
    expect(
      calculateArbitrage([
        { home: 2.1, draw: 3.2, away: 3.5 },
        { home: 2.05, draw: 3.25, away: 3.45 },
      ]),
    ).toBeNull();
  });

  it("detecta arbitragem 2-way (~5%)", () => {
    const r = calculateArbitrage([
      { home: 2.1, away: 1.85 },
      { home: 1.85, away: 2.1 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(5.0, 0);
  });

  it("detecta arbitragem 3-way", () => {
    const r = calculateArbitrage([
      { home: 3.2, draw: 3.2, away: 2.0 },
      { home: 2.0, draw: 3.2, away: 3.2 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0);
  });

  it("usa as melhores odds de cada casa", () => {
    const r = calculateArbitrage([
      { home: 1.5, away: 2.5 },
      { home: 2.5, away: 1.5 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0);
  });

  it("ignora empate quando nenhuma casa oferece odd de empate", () => {
    expect(
      calculateArbitrage([
        { home: 1.9, away: 1.9 },
        { home: 1.92, away: 1.88 },
      ]),
    ).toBeNull();
  });
});

describe("computeStakes", () => {
  it("rateia 2-way igualando retornos dentro de R$1000", () => {
    const r = computeStakes(1000, { home: 2.1, away: 2.1 });
    expect(r.hasArbitrage).toBe(true);
    expect(r.stakes.home).toBeCloseTo(500, 2);
    expect(r.stakes.away).toBeCloseTo(500, 2);
    expect(r.stakes.home * 2.1).toBeCloseTo(r.totalReturn, 2);
    expect(r.totalReturn).toBeGreaterThan(1000);
    expect(r.profit).toBeCloseTo(r.totalReturn - 1000, 2);
  });

  it("rateia 3-way igualando retornos por perna", () => {
    const r = computeStakes(1000, { home: 3.2, draw: 3.2, away: 3.2 });
    const ret = r.stakes.home * 3.2;
    expect(r.stakes.draw! * 3.2).toBeCloseTo(ret, 2);
    expect(r.stakes.away * 3.2).toBeCloseTo(ret, 2);
    expect(r.stakes.home + r.stakes.draw! + r.stakes.away).toBeCloseTo(1000, 2);
  });

  it("stakes zerados quando não há arbitragem", () => {
    const r = computeStakes(1000, { home: 1.9, away: 1.9 });
    expect(r.hasArbitrage).toBe(false);
    expect(r.stakes.home).toBe(0);
    expect(r.stakes.away).toBe(0);
  });

  it("stakes zerados quando total <= 0", () => {
    const r = computeStakes(0, { home: 2.1, away: 2.1 });
    expect(r.hasArbitrage).toBe(false);
  });
});
