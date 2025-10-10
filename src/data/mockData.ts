import { Event, Bookmaker, Sport } from "@/types/odds";

export const sports: Sport[] = [
  { id: "soccer", name: "Futebol", icon: "⚽", active: true },
  { id: "basketball", name: "Basquete", icon: "🏀", active: true },
  { id: "tennis", name: "Tênis", icon: "🎾", active: true },
  { id: "football", name: "Futebol Americano", icon: "🏈", active: true },
];

export const bookmakers: Bookmaker[] = [
  { id: "bet365", name: "Bet365", country: "UK" },
  { id: "betano", name: "Betano", country: "BR" },
  { id: "rivalo", name: "Rivalo", country: "BR" },
  { id: "superbet", name: "Superbet", country: "BR" },
  { id: "novibet", name: "Novibet", country: "BR" },
  { id: "stake", name: "Stake", country: "International" },
  { id: "pinnacle", name: "Pinnacle", country: "International" },
  { id: "1xbet", name: "1xBet", country: "International" },
];

export const mockEvents: Event[] = [
  {
    id: "1",
    sport: "soccer",
    league: "Brasileirão Série A",
    homeTeam: "Flamengo",
    awayTeam: "Palmeiras",
    date: "2025-10-15",
    time: "20:00",
    odds: [
      { bookmaker: "Bet365", home: 2.10, draw: 3.20, away: 3.50 },
      { bookmaker: "Betano", home: 2.05, draw: 3.25, away: 3.45 },
      { bookmaker: "Rivalo", home: 2.08, draw: 3.15, away: 3.60 },
      { bookmaker: "Superbet", home: 2.12, draw: 3.18, away: 3.48 },
    ],
  },
  {
    id: "2",
    sport: "soccer",
    league: "Brasileirão Série A",
    homeTeam: "Corinthians",
    awayTeam: "Santos",
    date: "2025-10-16",
    time: "18:30",
    odds: [
      { bookmaker: "Bet365", home: 1.85, draw: 3.40, away: 4.20 },
      { bookmaker: "Betano", home: 1.90, draw: 3.35, away: 4.10 },
      { bookmaker: "Rivalo", home: 1.88, draw: 3.42, away: 4.15 },
      { bookmaker: "Novibet", home: 1.87, draw: 3.38, away: 4.25 },
    ],
  },
  {
    id: "3",
    sport: "soccer",
    league: "Brasileirão Série A",
    homeTeam: "São Paulo",
    awayTeam: "Atlético-MG",
    date: "2025-10-17",
    time: "19:00",
    odds: [
      { bookmaker: "Bet365", home: 2.30, draw: 3.10, away: 3.20 },
      { bookmaker: "Betano", home: 2.25, draw: 3.15, away: 3.25 },
      { bookmaker: "Stake", home: 2.35, draw: 3.05, away: 3.15 },
      { bookmaker: "Superbet", home: 2.28, draw: 3.12, away: 3.22 },
    ],
  },
  {
    id: "4",
    sport: "basketball",
    league: "NBA",
    homeTeam: "Lakers",
    awayTeam: "Warriors",
    date: "2025-10-18",
    time: "22:00",
    odds: [
      { bookmaker: "Bet365", home: 1.95, away: 1.95 },
      { bookmaker: "Pinnacle", home: 1.98, away: 1.92 },
      { bookmaker: "Stake", home: 1.96, away: 1.94 },
      { bookmaker: "1xBet", home: 1.93, away: 1.97 },
    ],
  },
  {
    id: "5",
    sport: "soccer",
    league: "UEFA Champions League",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    date: "2025-10-19",
    time: "16:00",
    odds: [
      { bookmaker: "Bet365", home: 2.40, draw: 3.30, away: 2.90 },
      { bookmaker: "Betano", home: 2.35, draw: 3.35, away: 2.95 },
      { bookmaker: "Pinnacle", home: 2.45, draw: 3.25, away: 2.85 },
      { bookmaker: "Stake", home: 2.38, draw: 3.32, away: 2.92 },
    ],
  },
  {
    id: "6",
    sport: "football",
    league: "NFL",
    homeTeam: "Kansas City Chiefs",
    awayTeam: "San Francisco 49ers",
    date: "2025-10-20",
    time: "21:30",
    odds: [
      { bookmaker: "Bet365", home: 1.75, away: 2.15 },
      { bookmaker: "Pinnacle", home: 1.78, away: 2.12 },
      { bookmaker: "Stake", home: 1.76, away: 2.14 },
      { bookmaker: "1xBet", home: 1.74, away: 2.16 },
    ],
  },
  {
    id: "7",
    sport: "tennis",
    league: "ATP Finals",
    homeTeam: "Novak Djokovic",
    awayTeam: "Carlos Alcaraz",
    date: "2025-10-21",
    time: "15:00",
    odds: [
      { bookmaker: "Bet365", home: 1.65, away: 2.30 },
      { bookmaker: "Pinnacle", home: 1.68, away: 2.27 },
      { bookmaker: "Betano", home: 1.66, away: 2.29 },
      { bookmaker: "Stake", home: 1.67, away: 2.28 },
    ],
  },
];

// Função para calcular se há oportunidade de arbitragem
export const calculateArbitrage = (odds: { home: number; draw?: number; away: number }[]) => {
  if (odds.length < 2) return null;

  const bestHome = Math.max(...odds.map(o => o.home));
  const bestAway = Math.max(...odds.map(o => o.away));
  const bestDraw = odds[0].draw ? Math.max(...odds.map(o => o.draw || 0)) : 0;

  let inverseSum: number;
  if (bestDraw > 0) {
    inverseSum = (1 / bestHome) + (1 / bestDraw) + (1 / bestAway);
  } else {
    inverseSum = (1 / bestHome) + (1 / bestAway);
  }

  if (inverseSum < 1) {
    const profit = ((1 / inverseSum) - 1) * 100;
    return profit;
  }

  return null;
};
