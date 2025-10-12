import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/types/odds';
import { useToast } from '@/hooks/use-toast';

const POLLING_INTERVAL = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000;

interface OddsData {
  events: Event[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  remainingRequests: number | null;
}

export const useOddsPolling = (sports: string[]) => {
  const [data, setData] = useState<OddsData>({
    events: [],
    loading: true,
    error: null,
    lastUpdate: null,
    remainingRequests: null,
  });
  
  const { toast } = useToast();
  const retryCount = useRef(0);
  const backoffDelay = useRef(INITIAL_BACKOFF);
  const pollingTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchOdds = useCallback(async () => {
    try {
      console.log('Fetching odds for sports:', sports);
      
      const { data: responseData, error } = await supabase.functions.invoke('fetch-odds', {
        body: { sports, markets: ['h2h'] }
      });

      if (error) throw error;

      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch odds');
      }

      // Transform API data to our Event format
      const allEvents: Event[] = [];
      
      responseData.data.forEach((sportData: any) => {
        if (sportData.events && Array.isArray(sportData.events)) {
          sportData.events.forEach((apiEvent: any) => {
            const event: Event = {
              id: apiEvent.id,
              sport: getSportDisplayName(sportData.sport),
              sportKey: sportData.sport,
              league: apiEvent.sport_title,
              homeTeam: apiEvent.home_team,
              awayTeam: apiEvent.away_team,
              date: new Date(apiEvent.commence_time).toLocaleDateString('pt-BR'),
              time: new Date(apiEvent.commence_time).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              commenceTime: apiEvent.commence_time,
              odds: transformBookmakerOdds(apiEvent.bookmakers, data.events.find(e => e.id === apiEvent.id)),
            };
            allEvents.push(event);
          });
        }
      });

      // Sort by commence time
      allEvents.sort((a, b) => 
        new Date(a.commenceTime || 0).getTime() - new Date(b.commenceTime || 0).getTime()
      );

      setData({
        events: allEvents,
        loading: false,
        error: null,
        lastUpdate: new Date(),
        remainingRequests: responseData.remainingRequests,
      });

      // Reset retry count on success
      retryCount.current = 0;
      backoffDelay.current = INITIAL_BACKOFF;

    } catch (error: any) {
      console.error('Error fetching odds:', error);
      
      if (error.message.includes('Rate limit')) {
        toast({
          variant: 'destructive',
          title: 'Limite de requisições atingido',
          description: 'Aguarde alguns minutos antes de tentar novamente.',
        });
        
        // Increase backoff exponentially
        backoffDelay.current = Math.min(backoffDelay.current * 2, 60000);
        retryCount.current++;
      } else if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        backoffDelay.current = Math.min(backoffDelay.current * 2, 10000);
        
        setTimeout(() => fetchOdds(), backoffDelay.current);
      } else {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Erro ao buscar odds',
        }));
      }
    }
  }, [sports, toast, data.events]);

  useEffect(() => {
    fetchOdds();

    // Set up polling
    pollingTimer.current = setInterval(() => {
      fetchOdds();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingTimer.current) {
        clearInterval(pollingTimer.current);
      }
    };
  }, [fetchOdds]);

  return { ...data, refetch: fetchOdds };
};

// Helper functions
function getSportDisplayName(sportKey: string): string {
  const sportMap: Record<string, string> = {
    'soccer_brazil_campeonato': 'Futebol',
    'basketball_nba': 'Basquete',
    'tennis_atp_singles': 'Tênis',
    'esports_lol_worlds': 'E-Sports',
    'mma_mixed_martial_arts': 'UFC/MMA',
  };
  return sportMap[sportKey] || 'Outros';
}

function transformBookmakerOdds(bookmakers: any[], previousEvent?: Event): any[] {
  if (!bookmakers || bookmakers.length === 0) return [];

  return bookmakers.map(bookmaker => {
    const h2hMarket = bookmaker.markets.find((m: any) => m.key === 'h2h');
    if (!h2hMarket) return null;

    const outcomes = h2hMarket.outcomes;
    const homeOdd = outcomes.find((o: any) => o.name === bookmaker.home_team)?.price || 0;
    const awayOdd = outcomes.find((o: any) => o.name === bookmaker.away_team)?.price || 0;
    const drawOdd = outcomes.find((o: any) => o.name === 'Draw')?.price;

    // Find previous odds for comparison
    const previousOdds = previousEvent?.odds.find(o => o.bookmaker === bookmaker.title);

    return {
      bookmaker: bookmaker.title,
      home: homeOdd,
      away: awayOdd,
      draw: drawOdd,
      timestamp: new Date().toISOString(),
      previous: previousOdds ? {
        home: previousOdds.home,
        away: previousOdds.away,
        draw: previousOdds.draw,
      } : undefined,
    };
  }).filter(Boolean);
}
