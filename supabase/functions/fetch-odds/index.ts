import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY');
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OddsRequest {
  sports?: string[];
  markets?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sports = ['soccer_brazil_campeonato', 'basketball_nba', 'tennis_atp_singles', 'esports_lol_worlds', 'mma_mixed_martial_arts'], markets = ['h2h'] } = await req.json() as OddsRequest;

    console.log(`Fetching odds for sports: ${sports.join(', ')}`);

    // Fetch odds for all requested sports in parallel
    const fetchTimestamp = new Date().toISOString();
    console.log(`[${fetchTimestamp}] Starting odds fetch for sports:`, sports.join(', '));
    
    const oddsPromises = sports.map(async (sport) => {
      // Valid regions: us, uk, eu, au (NOT br)
      const url = `${ODDS_API_BASE}/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us,uk,eu,au&markets=${markets.join(',')}&oddsFormat=decimal`;
      
      console.log(`[${sport}] Fetching from API...`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${sport}] API Error:`, response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        return { sport, events: [], error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const apiTimestamp = response.headers.get('date') || new Date().toISOString();
      console.log(`[${sport}] Received ${data.length} events at ${apiTimestamp}`);
      
      // Log sample event data for debugging
      if (data.length > 0) {
        const sampleEvent = data[0];
        console.log(`[${sport}] Sample event:`, {
          id: sampleEvent.id,
          commence_time: sampleEvent.commence_time,
          bookmakers_count: sampleEvent.bookmakers?.length || 0
        });
      }
      
      return { sport, events: data };
    });

    const results = await Promise.all(oddsPromises);
    const responseTimestamp = new Date().toISOString();
    
    // Check rate limit from headers
    const remainingRequests = results[0]?.events?.length > 0 ? 
      req.headers.get('x-requests-remaining') : null;
    
    const totalEvents = results.reduce((sum, r) => sum + (r.events?.length || 0), 0);
    console.log(`[${responseTimestamp}] Returning ${totalEvents} total events. Requests remaining: ${remainingRequests}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        remainingRequests,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in fetch-odds function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: error.message.includes('Rate limit') ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
