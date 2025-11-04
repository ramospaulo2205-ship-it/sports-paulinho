import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Event } from '@/types/odds';

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
        .select('*, odds:odds(*)')
        .eq('id', eventId!)
        .maybeSingle();

      if (qErr) throw qErr;

      if (!data) {
        setEvent(null);
        return;
      }

      // Reduce to latest odds per bookmaker
      const latestByBookmaker = (data.odds || []).reduce((acc: Record<string, any>, odd: any) => {
        if (!acc[odd.bookmaker] || new Date(odd.scraped_at) > new Date(acc[odd.bookmaker].scraped_at)) {
          acc[odd.bookmaker] = odd;
        }
        return acc;
      }, {});

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
        odds: Object.values(latestByBookmaker).map((odd: any) => ({
          bookmaker: odd.bookmaker,
          home: Number(odd.home_odd),
          draw: odd.draw_odd != null ? Number(odd.draw_odd) : undefined,
          away: Number(odd.away_odd),
          url: odd.bookmaker_url || undefined,
          timestamp: odd.scraped_at,
        })),
      };

      setEvent(transformed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { event, loading, error, refetch: fetchEvent };
}
