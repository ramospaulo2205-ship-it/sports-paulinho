export interface OddsTriple {
  home: number;
  draw?: number;
  away: number;
}

/**
 * % de lucro garantido usando a melhor odd de cada resultado entre as casas.
 * Retorna null quando não há oportunidade de arbitragem.
 */
export function calculateArbitrage(odds: OddsTriple[]): number | null {
  if (odds.length < 2) return null;

  const bestHome = Math.max(...odds.map((o) => o.home));
  const bestAway = Math.max(...odds.map((o) => o.away));
  const hasDraw = odds.some((o) => o.draw !== undefined && o.draw > 0);
  const bestDraw = hasDraw ? Math.max(...odds.map((o) => o.draw ?? 0)) : 0;

  const inverseSum =
    hasDraw && bestDraw > 0
      ? 1 / bestHome + 1 / bestDraw + 1 / bestAway
      : 1 / bestHome + 1 / bestAway;

  if (inverseSum < 1) return (1 / inverseSum - 1) * 100;
  return null;
}

export interface StakeBreakdown {
  hasArbitrage: boolean;
  stakes: { home: number; draw?: number; away: number };
  totalReturn: number;
  profit: number; // em R$
  profitPct: number;
}

/**
 * Rateia `total` entre os resultados igualando o retorno de cada perna.
 * Usa as melhores odds (`best`) já selecionadas por resultado.
 */
export function computeStakes(total: number, best: OddsTriple): StakeBreakdown {
  const hasDraw = best.draw !== undefined && best.draw > 0;
  const legs: Array<["home" | "draw" | "away", number]> = [
    ["home", best.home],
    ...(hasDraw ? ([["draw", best.draw as number]] as Array<["draw", number]>) : []),
    ["away", best.away],
  ];
  const inverseSum = legs.reduce((s, [, odd]) => s + 1 / odd, 0);

  if (total <= 0 || legs.some(([, o]) => o <= 0) || inverseSum >= 1) {
    return {
      hasArbitrage: false,
      stakes: { home: 0, away: 0, ...(hasDraw ? { draw: 0 } : {}) },
      totalReturn: 0,
      profit: 0,
      profitPct: 0,
    };
  }

  const stakes: { home: number; draw?: number; away: number } = { home: 0, away: 0 };
  for (const [name, odd] of legs) {
    stakes[name] = (total * (1 / odd)) / inverseSum;
  }
  const totalReturn = stakes.home * best.home; // igual em todas as pernas
  const profit = totalReturn - total;
  return { hasArbitrage: true, stakes, totalReturn, profit, profitPct: (profit / total) * 100 };
}
