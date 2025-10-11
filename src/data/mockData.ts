import { Event, Bookmaker, Sport } from "@/types/odds";

export const sports: Sport[] = [
  { id: "soccer", name: "Futebol", icon: "⚽", active: true },
  { id: "basketball", name: "Basquete", icon: "🏀", active: true },
  { id: "tennis", name: "Tênis", icon: "🎾", active: true },
  { id: "football", name: "Futebol Americano", icon: "🏈", active: true },
];

export const bookmakers: Bookmaker[] = [
  { id: "betano", name: "Betano", country: "BR", url: "https://www.betano.bet.br/" },
  { id: "bet365", name: "Bet365", country: "BR", url: "https://www.bet365.bet.br/" },
  { id: "rivalo", name: "Rivalo", country: "BR", url: "https://www.rivalo.bet.br/" },
  { id: "superbet", name: "Superbet", country: "BR", url: "https://www.superbet.bet.br/" },
  { id: "novibet", name: "Novibet", country: "BR", url: "https://www.novibet.bet.br/" },
  { id: "pixbet", name: "Pixbet", country: "BR", url: "https://www.pixbet.bet.br/" },
  { id: "sportingbet", name: "Sportingbet", country: "BR", url: "https://www.sportingbet.bet.br/" },
  { id: "betfair", name: "Betfair", country: "BR", url: "https://www.betfair.bet.br/" },
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
      { bookmaker: "Pixbet", home: 2.07, draw: 3.22, away: 3.55 },
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
      { bookmaker: "Betano", home: 1.66, away: 2.29 },
      { bookmaker: "Pixbet", home: 1.67, away: 2.28 },
      { bookmaker: "Sportingbet", home: 1.68, away: 2.27 },
    ],
  },
  {
    id: "8",
    sport: "soccer",
    league: "Copa Libertadores da América",
    homeTeam: "Fluminense",
    awayTeam: "Boca Juniors",
    date: "2025-10-22",
    time: "21:30",
    odds: [
      { bookmaker: "Betano", home: 2.15, draw: 3.10, away: 3.40 },
      { bookmaker: "Bet365", home: 2.20, draw: 3.05, away: 3.35 },
      { bookmaker: "Superbet", home: 2.18, draw: 3.08, away: 3.38 },
      { bookmaker: "Pixbet", home: 2.12, draw: 3.12, away: 3.45 },
    ],
  },
  {
    id: "9",
    sport: "soccer",
    league: "Copa Libertadores da América",
    homeTeam: "River Plate",
    awayTeam: "Palmeiras",
    date: "2025-10-23",
    time: "21:30",
    odds: [
      { bookmaker: "Bet365", home: 2.05, draw: 3.20, away: 3.60 },
      { bookmaker: "Betano", home: 2.08, draw: 3.15, away: 3.55 },
      { bookmaker: "Rivalo", home: 2.10, draw: 3.18, away: 3.50 },
      { bookmaker: "Novibet", home: 2.06, draw: 3.22, away: 3.58 },
    ],
  },
  {
    id: "10",
    sport: "soccer",
    league: "UEFA Champions League",
    homeTeam: "Manchester City",
    awayTeam: "Bayern Munich",
    date: "2025-10-24",
    time: "17:00",
    odds: [
      { bookmaker: "Bet365", home: 2.25, draw: 3.40, away: 3.10 },
      { bookmaker: "Betano", home: 2.28, draw: 3.35, away: 3.05 },
      { bookmaker: "Sportingbet", home: 2.22, draw: 3.45, away: 3.15 },
      { bookmaker: "Betfair", home: 2.30, draw: 3.38, away: 3.08 },
    ],
  },
  {
    id: "11",
    sport: "soccer",
    league: "UEFA Champions League",
    homeTeam: "PSG",
    awayTeam: "Inter Milan",
    date: "2025-10-24",
    time: "17:00",
    odds: [
      { bookmaker: "Betano", home: 1.95, draw: 3.50, away: 3.80 },
      { bookmaker: "Bet365", home: 1.98, draw: 3.45, away: 3.75 },
      { bookmaker: "Pixbet", home: 1.92, draw: 3.55, away: 3.85 },
      { bookmaker: "Superbet", home: 1.96, draw: 3.48, away: 3.78 },
    ],
  },
  {
    id: "12",
    sport: "soccer",
    league: "Brasileirão Série A",
    homeTeam: "Grêmio",
    awayTeam: "Internacional",
    date: "2025-10-25",
    time: "16:00",
    odds: [
      { bookmaker: "Bet365", home: 2.40, draw: 3.20, away: 2.90 },
      { bookmaker: "Betano", home: 2.35, draw: 3.25, away: 2.95 },
      { bookmaker: "Rivalo", home: 2.42, draw: 3.18, away: 2.88 },
      { bookmaker: "Pixbet", home: 2.38, draw: 3.22, away: 2.92 },
    ],
  },
  {
    id: "13",
    sport: "soccer",
    league: "Brasileirão Série A",
    homeTeam: "Botafogo",
    awayTeam: "Vasco",
    date: "2025-10-25",
    time: "19:00",
    odds: [
      { bookmaker: "Betano", home: 1.75, draw: 3.60, away: 4.50 },
      { bookmaker: "Bet365", home: 1.78, draw: 3.55, away: 4.45 },
      { bookmaker: "Superbet", home: 1.72, draw: 3.65, away: 4.55 },
      { bookmaker: "Novibet", home: 1.76, draw: 3.58, away: 4.48 },
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
