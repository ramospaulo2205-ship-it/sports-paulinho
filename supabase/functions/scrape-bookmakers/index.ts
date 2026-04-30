import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY');
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

// Esportes para buscar da API (com foco em eventos brasileiros e internacionais populares)
const SPORTS_TO_FETCH = [
  'soccer_brazil_campeonato',      // Brasileirão
  'soccer_uefa_champs_league',     // Champions League
  'soccer_uefa_europa_league',     // Europa League
  'soccer_epl',                    // Premier League
  'soccer_spain_la_liga',          // La Liga
  'soccer_italy_serie_a',          // Serie A
  'soccer_germany_bundesliga',     // Bundesliga
  'soccer_france_ligue_one',       // Ligue 1
  'basketball_nba',                // NBA
  'basketball_euroleague',         // EuroLeague
  'americanfootball_nfl',          // NFL
  'icehockey_nhl',                 // NHL
  'tennis_atp_aus_open_singles',   // Australian Open
  'mma_mixed_martial_arts',        // UFC/MMA
];

interface OddsAPIEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

async function fetchOddsFromAPI(sport: string): Promise<OddsAPIEvent[]> {
  try {
    const url = `${ODDS_API_BASE}/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us,uk,eu,au&markets=h2h&oddsFormat=decimal&dateFormat=iso`;
    
    console.log(`[${sport}] Fetching odds from The Odds API...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error(`[${sport}] Rate limit exceeded`);
        return [];
      }
      console.error(`[${sport}] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    console.log(`[${sport}] Fetched ${data.length} events`);
    
    return data;
  } catch (error: any) {
    console.error(`[${sport}] Error fetching odds:`, error.message);
    return [];
  }
}

function mapSportName(sportKey: string): string {
  const sportMap: Record<string, string> = {
    'soccer_brazil_campeonato': 'soccer',
    'soccer_uefa_champs_league': 'soccer',
    'soccer_uefa_europa_league': 'soccer',
    'soccer_epl': 'soccer',
    'soccer_spain_la_liga': 'soccer',
    'soccer_italy_serie_a': 'soccer',
    'soccer_germany_bundesliga': 'soccer',
    'soccer_france_ligue_one': 'soccer',
    'basketball_nba': 'basketball',
    'basketball_euroleague': 'basketball',
    'americanfootball_nfl': 'football',
    'icehockey_nhl': 'icehockey',
    'tennis_atp_aus_open_singles': 'tennis',
    'mma_mixed_martial_arts': 'mma',
  };

  return sportMap[sportKey] || 'other';
}

function mapLeagueName(sportTitle: string): string {
  return sportTitle;
}

function mapBookmakerName(bookmakerKey: string): string {
  const bookmakerMap: Record<string, string> = {
    'bet365': 'Bet365',
    'betano': 'Betano',
    'betfair': 'Betfair',
    'williamhill': 'William Hill',
    'unibet': 'Unibet',
    'pinnacle': 'Pinnacle',
    'betsson': 'Betsson',
    'bwin': 'Bwin',
    '888sport': '888Sport',
    'marathonbet': 'Marathon Bet',
  };
  
  return bookmakerMap[bookmakerKey] || bookmakerKey.charAt(0).toUpperCase() + bookmakerKey.slice(1);
}

function getBookmakerUrl(bookmakerKey: string): string {
  const urlMap: Record<string, string> = {
    'bet365': 'https://www.bet365.com.br/',
    'betano': 'https://www.betano.com.br/',
    'betfair': 'https://www.betfair.com.br/',
    'pinnacle': 'https://www.pinnacle.com/pt/',
    'betsson': 'https://www.betsson.com/br/',
    'bwin': 'https://www.bwin.com/pt/',
  };
  
  return urlMap[bookmakerKey] || '#';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    console.log('[Scraper] Starting odds fetch at', new Date().toISOString());
    
    // Buscar odds de todos os esportes em paralelo
    const allSportsPromises = SPORTS_TO_FETCH.map(sport => fetchOddsFromAPI(sport));
    const allSportsResults = await Promise.all(allSportsPromises);
    
    // Consolidar todos os eventos
    const allEvents = allSportsResults.flat();
    console.log(`[Scraper] Total events fetched: ${allEvents.length}`);

    if (allEvents.length === 0) {
      console.log('[Scraper] No events found from API');
      return new Response(
        JSON.stringify({ 
          success: true, 
          eventsProcessed: 0,
          oddsProcessed: 0,
          message: 'No events available',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let eventsProcessed = 0;
    let oddsProcessed = 0;

    // Processar cada evento
    for (const apiEvent of allEvents) {
      // Filtrar eventos que começam nos próximos 10 dias
      const eventDate = new Date(apiEvent.commence_time);
      const tenDaysFromNow = new Date();
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
      
      if (eventDate > tenDaysFromNow) {
        continue; // Pular eventos muito distantes
      }

      const eventKey = `${apiEvent.sport_key}_${apiEvent.home_team}_${apiEvent.away_team}`.replace(/\s+/g, '_');
      
      // Upsert evento
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .upsert({
          event_key: eventKey,
          sport: mapSportName(apiEvent.sport_key),
          league: mapLeagueName(apiEvent.sport_title),
          home_team: apiEvent.home_team,
          away_team: apiEvent.away_team,
          commence_time: apiEvent.commence_time,
          status: 'upcoming'
        }, { onConflict: 'event_key' })
        .select()
        .single();

      if (eventError) {
        console.error('[DB] Event upsert error:', eventError);
        continue;
      }

      eventsProcessed++;

      // Processar odds de cada bookmaker
      for (const bookmaker of apiEvent.bookmakers) {
        const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
        
        if (!h2hMarket || !h2hMarket.outcomes || h2hMarket.outcomes.length < 2) {
          continue;
        }

        // Encontrar as odds
        const homeOdds = h2hMarket.outcomes.find(o => o.name === apiEvent.home_team);
        const awayOdds = h2hMarket.outcomes.find(o => o.name === apiEvent.away_team);
        const drawOdds = h2hMarket.outcomes.find(o => o.name === 'Draw');

        if (!homeOdds || !awayOdds) {
          continue;
        }

        // Inserir odds
        const { error: oddError } = await supabase.from('odds').insert({
          event_id: eventData.id,
          bookmaker: mapBookmakerName(bookmaker.key),
          bookmaker_url: getBookmakerUrl(bookmaker.key),
          home_odd: homeOdds.price,
          draw_odd: drawOdds?.price || null,
          away_odd: awayOdds.price,
        });

        if (oddError) {
          console.error('[DB] Odd insert error:', oddError);
        } else {
          oddsProcessed++;
        }
      }
    }

    console.log(`[Scraper] Successfully processed ${eventsProcessed} events and ${oddsProcessed} odds`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventsProcessed,
        oddsProcessed,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Scraper] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
