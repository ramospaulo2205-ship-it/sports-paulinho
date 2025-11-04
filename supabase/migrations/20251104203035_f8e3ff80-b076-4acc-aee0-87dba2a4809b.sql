-- Tabela de eventos esportivos
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  commence_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de odds (histórico completo)
CREATE TABLE IF NOT EXISTS public.odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  bookmaker TEXT NOT NULL,
  bookmaker_url TEXT,
  home_odd DECIMAL(10,2) NOT NULL,
  draw_odd DECIMAL(10,2),
  away_odd DECIMAL(10,2) NOT NULL,
  market_type TEXT DEFAULT 'h2h',
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, bookmaker, scraped_at)
);

-- Índices para performance
CREATE INDEX idx_events_commence_time ON public.events(commence_time);
CREATE INDEX idx_events_sport_league ON public.events(sport, league);
CREATE INDEX idx_odds_event_bookmaker ON public.odds(event_id, bookmaker);
CREATE INDEX idx_odds_scraped_at ON public.odds(scraped_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies (dados públicos para leitura)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eventos são públicos para leitura"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Odds são públicas para leitura"
  ON public.odds FOR SELECT
  USING (true);

-- View para monitoramento
CREATE OR REPLACE VIEW public.scraper_health AS
SELECT 
  bookmaker,
  COUNT(*) as total_odds,
  MAX(scraped_at) as last_scrape,
  EXTRACT(EPOCH FROM (NOW() - MAX(scraped_at))) as seconds_since_last_scrape
FROM public.odds
WHERE scraped_at > NOW() - INTERVAL '10 minutes'
GROUP BY bookmaker;

-- Habilitar realtime para updates em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.odds;