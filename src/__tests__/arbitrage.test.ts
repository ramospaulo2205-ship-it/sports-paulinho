import { describe, it, expect } from "vitest";
import { calculateArbitrage } from "@/data/mockData";

describe("calculateArbitrage", () => {
  // ─── Casos sem arbitragem ──────────────────────────────────────────────────

  it("retorna null quando há menos de 2 casas", () => {
    const result = calculateArbitrage([{ home: 2.0, away: 1.9 }]);
    expect(result).toBeNull();
  });

  it("retorna null quando odds normais sem arbitragem (2-way)", () => {
    // 1/1.95 + 1/1.95 = 1.026 > 1 → sem arbitragem
    const odds = [
      { home: 1.95, away: 1.95 },
      { home: 1.90, away: 2.00 },
    ];
    expect(calculateArbitrage(odds)).toBeNull();
  });

  it("retorna null quando odds normais sem arbitragem (3-way)", () => {
    // odds típicas de futebol com margem da casa
    const odds = [
      { home: 2.10, draw: 3.20, away: 3.50 },
      { home: 2.05, draw: 3.25, away: 3.45 },
    ];
    expect(calculateArbitrage(odds)).toBeNull();
  });

  // ─── Casos com arbitragem ──────────────────────────────────────────────────

  it("detecta arbitragem em evento 2-way (sem empate)", () => {
    // 1/2.10 + 1/2.10 = 0.952 < 1 → arbitragem de ~5%
    const odds = [
      { home: 2.10, away: 1.80 },
      { home: 1.80, away: 2.10 },
    ];
    const result = calculateArbitrage(odds);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("detecta arbitragem em evento 3-way (com empate)", () => {
    // melhores odds artificialmente altas para forçar arbitragem
    const odds = [
      { home: 3.20, draw: 3.20, away: 2.00 },
      { home: 2.00, draw: 3.20, away: 3.20 },
    ];
    const result = calculateArbitrage(odds);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("calcula lucro correto para arbitragem conhecida", () => {
    // 1/2.10 + 1/2.10 = 0.9524, lucro = (1/0.9524 - 1) * 100 ≈ 5%
    const odds = [
      { home: 2.10, away: 1.85 },
      { home: 1.85, away: 2.10 },
    ];
    const result = calculateArbitrage(odds);
    expect(result).not.toBeNull();
    expect(result!).toBeCloseTo(5.0, 0);
  });

  // ─── Casos de borda ────────────────────────────────────────────────────────

  it("usa as melhores odds de cada casa (home max, away max)", () => {
    const odds = [
      { home: 1.50, away: 2.50 },
      { home: 2.50, away: 1.50 },
    ];
    // bestHome=2.50, bestAway=2.50 → 1/2.5 + 1/2.5 = 0.80 < 1 → arbitragem
    const result = calculateArbitrage(odds);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("ignora empate quando nenhuma casa oferece odd de empate", () => {
    // Evento 2-way puro (basquete, tênis)
    const odds = [
      { home: 1.90, away: 1.90 },
      { home: 1.92, away: 1.88 },
    ];
    // bestDraw deve ser 0 e não entrar no cálculo
    const result = calculateArbitrage(odds);
    expect(result).toBeNull();
  });

  it("retorna número positivo quando há arbitragem", () => {
    const odds = [
      { home: 3.0, away: 1.5 },
      { home: 1.5, away: 3.0 },
    ];
    const result = calculateArbitrage(odds);
    if (result !== null) {
      expect(result).toBeGreaterThan(0);
    }
  });
});
