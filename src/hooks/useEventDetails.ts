import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/types/odds';

interface LatestOddRow {
  bookmaker: string | null;
  bookmaker_url: string | null;
  home_odd: number | null;
  draw_odd: number | null;
  away_odd: number | null;
  scraped_at: string | null;
}

export function useEventDetails(eventId?: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    fetchEvent();

    // Realtime updates for this event
    const channel = supabase
      .channel(`odds_event_${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'odds', filter: `event_id=eq.${eventId}` },
        () => fetchEvent()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        () => fetchEvent()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function fetchEvent() {
    try {
      setError(null);

      const { data, error: qErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId!)
        .maybeSingle();

      if (qErr) throw qErr;
      if (!data) {
        setEvent(null);
        return;
      }

      const { data: oddsData, error: oddsErr } = await supabase
        .from('latest_odds')
        .select('*')
        .eq('event_id', eventId!);
      if (oddsErr) throw oddsErr;

      const commenceDate = new Date(data.commence_time);

      const transformed: Event = {
        id: data.id,
        sport: data.sport,
        league: data.league,
        homeTeam: data.home_team,
        awayTeam: data.away_team,
        date: commenceDate.toISOString().split('T')[0],
        time: commenceDate.toTimeString().slice(0, 5),
        commenceTime: data.commence_time,
        odds: ((oddsData ?? []) as LatestOddRow[]).map((odd) => ({
          bookmaker: odd.bookmaker ?? '',
          home: Number(odd.home_odd),
          draw: odd.draw_odd != null ? Number(odd.draw_odd) : undefined,
          away: Number(odd.away_odd),
          url: odd.bookmaker_url || undefined,
          timestamp: odd.scraped_at ?? undefined,
        })),
      };

      setEvent(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return { event, loading, error, refetch: fetchEvent };
}
