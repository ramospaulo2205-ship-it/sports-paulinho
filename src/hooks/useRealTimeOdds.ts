import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/types/odds';

interface EventRow {
  id: string;
  event_key: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  status: string | null;
}

interface LatestOddRow {
  id: string | null;
  event_id: string | null;
  bookmaker: string | null;
  bookmaker_url: string | null;
  home_odd: number | null;
  draw_odd: number | null;
  away_odd: number | null;
  scraped_at: string | null;
}

interface OddInsertRow {
  event_id: string | null;
  bookmaker: string;
  bookmaker_url: string | null;
  home_odd: number;
  draw_odd: number | null;
  away_odd: number;
  scraped_at: string | null;
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
    'tennis_atp_singles': 'tennis',
    'tennis_wta_singles': 'tennis',
    'esports_lol_worlds': 'esports',
  };
  return map[value] ?? value;
}

function toEvent(row: EventRow, odds: LatestOddRow[]): Event {
  const commenceDate = new Date(row.commence_time);
  return {
    id: row.id,
    sport: normalizeSportId(row.sport),
    league: row.league,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    date: commenceDate.toISOString().split('T')[0],
    time: commenceDate.toTimeString().slice(0, 5),
    commenceTime: row.commence_time,
    odds: odds.map((o) => ({
      bookmaker: o.bookmaker ?? '',
      home: Number(o.home_odd),
      draw: o.draw_odd != null ? Number(o.draw_odd) : undefined,
      away: Number(o.away_odd),
      url: o.bookmaker_url || undefined,
      timestamp: o.scraped_at ?? undefined,
    })),
  };
}

export function useRealTimeOdds(sport?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchLatestOdds = useCallback(async () => {
    try {
      setError(null);

      // 1) Eventos futuros
      let query = supabase
        .from('events')
        .select('*')
        .gte('commence_time', new Date().toISOString())
        .eq('status', 'upcoming')
        .order('commence_time', { ascending: true });

      if (sport && sport !== 'all' && sport !== 'Todos') {
        query = query.eq('sport', sport);
      }

      const { data: eventsData, error: eventsError } = await query;
      if (eventsError) {
        console.error('[useRealTimeOdds] Events error:', eventsError);
        setError(eventsError.message);
        return;
      }
      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        return;
      }

      // 2) Apenas a última odd por (evento, bookmaker), já reduzida no banco
      const ids = eventsData.map((e) => e.id);
      const { data: oddsData, error: oddsError } = await supabase
        .from('latest_odds')
        .select('*')
        .in('event_id', ids);
      if (oddsError) {
        console.error('[useRealTimeOdds] Odds error:', oddsError);
        setError(oddsError.message);
        return;
      }

      const byEvent = new Map<string, LatestOddRow[]>();
      (oddsData ?? []).forEach((o) => {
        if (!o.event_id) return;
        const arr = byEvent.get(o.event_id) ?? [];
        arr.push(o);
        byEvent.set(o.event_id, arr);
      });

      setEvents(eventsData.map((e) => toEvent(e as EventRow, byEvent.get(e.id) ?? [])));
      setLastUpdate(new Date());
    } catch (e) {
      console.error('[useRealTimeOdds] Error:', e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchLatestOdds();

    const channel = supabase
      .channel('odds_updates')
      // Update incremental: aplica só a odd inserida ao evento correspondente
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'odds' },
        (payload) => {
          const row = payload.new as OddInsertRow;
          setEvents((prev) =>
            prev.map((ev) => {
              if (ev.id !== row.event_id) return ev;
              const odds = ev.odds.filter((o) => o.bookmaker !== row.bookmaker);
              odds.push({
                bookmaker: row.bookmaker,
                home: Number(row.home_odd),
                draw: row.draw_odd != null ? Number(row.draw_odd) : undefined,
                away: Number(row.away_odd),
                url: row.bookmaker_url || undefined,
                timestamp: row.scraped_at ?? undefined,
              });
              return { ...ev, odds };
            }),
          );
          setLastUpdate(new Date());
        },
      )
      // Eventos novos/removidos/status alterado: refetch leve
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchLatestOdds();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLatestOdds]);

  return {
    events,
    loading,
    error,
    lastUpdate,
    refetch: fetchLatestOdds,
  };
}
