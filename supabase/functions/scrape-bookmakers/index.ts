import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedEvent {
  eventKey: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  odds: Array<{
    bookmaker: string;
    home: number;
    draw?: number;
    away: number;
    url?: string;
  }>;
}

// Scrapers simulados - Em produção, usar Cheerio/Puppeteer
async function scrapeBet365(): Promise<ScrapedEvent[]> {
  console.log('[Bet365] Starting scrape...');
  
  // Simular dados reais (substituir por scraping real)
  return [
    {
      eventKey: 'bet365_soccer_flamengo_palmeiras',
      sport: 'Futebol',
      league: 'Brasileirão Série A',
      homeTeam: 'Flamengo',
      awayTeam: 'Palmeiras',
      commenceTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      odds: [{
        bookmaker: 'Bet365',
        home: 2.10,
        draw: 3.20,
        away: 3.50,
        url: 'https://www.bet365.com.br/'
      }]
    },
    {
      eventKey: 'bet365_soccer_corinthians_spfc',
      sport: 'Futebol',
      league: 'Brasileirão Série A',
      homeTeam: 'Corinthians',
      awayTeam: 'São Paulo',
      commenceTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      odds: [{
        bookmaker: 'Bet365',
        home: 2.35,
        draw: 3.10,
        away: 3.00,
        url: 'https://www.bet365.com.br/'
      }]
    }
  ];
}

async function scrapeBetano(): Promise<ScrapedEvent[]> {
  console.log('[Betano] Starting scrape...');
  
  return [
    {
      eventKey: 'betano_soccer_flamengo_palmeiras',
      sport: 'Futebol',
      league: 'Brasileirão Série A',
      homeTeam: 'Flamengo',
      awayTeam: 'Palmeiras',
      commenceTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      odds: [{
        bookmaker: 'Betano',
        home: 2.15,
        draw: 3.15,
        away: 3.40,
        url: 'https://www.betano.com.br/'
      }]
    }
  ];
}

async function scrapeRivalo(): Promise<ScrapedEvent[]> {
  console.log('[Rivalo] Starting scrape...');
  
  return [
    {
      eventKey: 'rivalo_soccer_flamengo_palmeiras',
      sport: 'Futebol',
      league: 'Brasileirão Série A',
      homeTeam: 'Flamengo',
      awayTeam: 'Palmeiras',
      commenceTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      odds: [{
        bookmaker: 'Rivalo',
        home: 2.08,
        draw: 3.25,
        away: 3.55,
        url: 'https://www.rivalo.com.br/'
      }]
    }
  ];
}

async function scrapePixbet(): Promise<ScrapedEvent[]> {
  console.log('[Pixbet] Starting scrape...');
  
  return [
    {
      eventKey: 'pixbet_soccer_corinthians_spfc',
      sport: 'Futebol',
      league: 'Brasileirão Série A',
      homeTeam: 'Corinthians',
      awayTeam: 'São Paulo',
      commenceTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      odds: [{
        bookmaker: 'Pixbet',
        home: 2.40,
        draw: 3.05,
        away: 2.95,
        url: 'https://www.pixbet.com.br/'
      }]
    }
  ];
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
    console.log('[Scraper] Starting scraping cycle at', new Date().toISOString());
    
    // Executar scrapers em paralelo
    const results = await Promise.allSettled([
      scrapeBet365(),
      scrapeBetano(),
      scrapeRivalo(),
      scrapePixbet(),
    ]);

    // Consolidar dados
    const allEvents: ScrapedEvent[] = results
      .filter((r): r is PromiseFulfilledResult<ScrapedEvent[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    console.log(`[Scraper] Collected ${allEvents.length} events from scrapers`);

    // Agrupar eventos por chave única
    const eventsMap = new Map<string, ScrapedEvent>();
    
    for (const event of allEvents) {
      const uniqueKey = `${event.sport}_${event.league}_${event.homeTeam}_${event.awayTeam}`;
      
      if (!eventsMap.has(uniqueKey)) {
        eventsMap.set(uniqueKey, {
          eventKey: uniqueKey,
          sport: event.sport,
          league: event.league,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          commenceTime: event.commenceTime,
          odds: []
        });
      }
      
      const consolidatedEvent = eventsMap.get(uniqueKey)!;
      consolidatedEvent.odds.push(...event.odds);
    }

    const consolidatedEvents = Array.from(eventsMap.values());
    console.log(`[Scraper] Consolidated into ${consolidatedEvents.length} unique events`);

    // Salvar no banco
    let eventsProcessed = 0;
    let oddsProcessed = 0;

    for (const event of consolidatedEvents) {
      // Upsert evento
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .upsert({
          event_key: event.eventKey,
          sport: event.sport,
          league: event.league,
          home_team: event.homeTeam,
          away_team: event.awayTeam,
          commence_time: event.commenceTime,
          status: 'upcoming'
        }, { onConflict: 'event_key' })
        .select()
        .single();

      if (eventError) {
        console.error('[DB] Event upsert error:', eventError);
        continue;
      }

      eventsProcessed++;

      // Insert odds (novo registro a cada scraping)
      for (const odd of event.odds) {
        const { error: oddError } = await supabase.from('odds').insert({
          event_id: eventData.id,
          bookmaker: odd.bookmaker,
          bookmaker_url: odd.url,
          home_odd: odd.home,
          draw_odd: odd.draw,
          away_odd: odd.away,
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
