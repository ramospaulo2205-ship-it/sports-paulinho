import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Event, Odds } from '@/types/odds';

interface DatabaseEvent {
  id: string;
  event_key: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  status: string;
  odds: Array<{
    id: string;
    bookmaker: string;
    bookmaker_url: string | null;
    home_odd: number;
    draw_odd: number | null;
    away_odd: number;
    scraped_at: string;
  }>;
}

function normalizeSportId(value: string): string {
  const map: Record<string, string> = {
    // Portuguese display names (old DB values)
    'Futebol': 'soccer',
    'Basquete': 'basketball',
    'Tênis': 'tennis',
    'Futebol Americano': 'football',
    'Hockey': 'icehockey',
    'MMA/UFC': 'mma',
    // Raw API sport keys (fallback)
    'soccer_brazil_campeonato': 'soccer',
    'soccer_uefa_champs_league': 'soccer',
    'soccer_epl': 'soccer',
    'basketball_nba': 'basketball',
    'americanfootball_nfl': 'football',
    'icehockey_nhl': 'icehockey',
    'tennis_atp_aus_open_singles': 'tennis',
    'mma_mixed_martial_arts': 'mma',
  };
  return map[value] ?? value;
}

export function useRealTimeOdds(sport?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchLatestOdds();

    // Subscription para updates em tempo real
    const channel = supabase
      .channel('odds_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'odds',
        },
        (payload) => {
          console.log('[Realtime] Odds updated:', payload);
          fetchLatestOdds();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        (payload) => {
          console.log('[Realtime] Events updated:', payload);
          fetchLatestOdds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sport]);

  async function fetchLatestOdds() {
    try {
      setError(null);
      
      // Buscar eventos futuros
      let query = supabase
        .from('events')
        .select(`
          *,
          odds:odds(*)
        `)
        .gte('commence_time', new Date().toISOString())
        .eq('status', 'upcoming')
        .order('commence_time', { ascending: true });

      if (sport && sport !== 'all' && sport !== 'Todos') {
        query = query.eq('sport', sport);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('[useRealTimeOdds] Fetch error:', fetchError);
        setError(fetchError.message);
        return;
      }

      if (!data) {
        setEvents([]);
        return;
      }

      // Transformar para formato do frontend
      const transformedEvents: Event[] = (data as DatabaseEvent[]).map((event) => {
        // Agrupar odds mais recentes por bookmaker
        const latestOddsByBookmaker = event.odds.reduce((acc: Record<string, any>, odd: any) => {
          if (!acc[odd.bookmaker] || new Date(odd.scraped_at) > new Date(acc[odd.bookmaker].scraped_at)) {
            acc[odd.bookmaker] = odd;
          }
          return acc;
        }, {});

        const commenceDate = new Date(event.commence_time);

        return {
          id: event.id,
          sport: normalizeSportId(event.sport),
          league: event.league,
          homeTeam: event.home_team,
          awayTeam: event.away_team,
          date: commenceDate.toISOString().split('T')[0],
          time: commenceDate.toTimeString().slice(0, 5),
          commenceTime: event.commence_time,
          odds: Object.values(latestOddsByBookmaker).map((odd: any) => ({
            bookmaker: odd.bookmaker,
            home: Number(odd.home_odd),
            draw: odd.draw_odd ? Number(odd.draw_odd) : undefined,
            away: Number(odd.away_odd),
            url: odd.bookmaker_url || undefined,
            timestamp: odd.scraped_at,
          })),
        };
      });

      setEvents(transformedEvents);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('[useRealTimeOdds] Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return { 
    events, 
    loading, 
    error,
    lastUpdate,
    refetch: fetchLatestOdds 
  };
}
