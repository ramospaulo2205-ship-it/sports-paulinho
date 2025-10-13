export interface Bookmaker {
  id: string;
  name: string;
  logo?: string;
  country: string;
  url: string;
}

export interface Odds {
  bookmaker: string;
  home: number;
  draw?: number;
  away: number;
  timestamp?: string;
  url?: string;
  previous?: {
    home: number;
    draw?: number;
    away: number;
  };
}

export interface Event {
  id: string;
  sport: string;
  sportKey?: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  odds: Odds[];
  commenceTime?: string;
  isFavorite?: boolean;
}

export interface ArbitrageOpportunity {
  event: Event;
  profit: number;
  stakes: {
    bookmaker: string;
    outcome: string;
    odd: number;
    stake: number;
  }[];
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}
