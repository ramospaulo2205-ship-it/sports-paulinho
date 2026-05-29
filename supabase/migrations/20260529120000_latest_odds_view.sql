-- View com a última odd por (event_id, bookmaker).
-- Reduz o payload do front: 1 linha por casa em vez de todo o histórico.
CREATE OR REPLACE VIEW public.latest_odds
WITH (security_invoker = true) AS
SELECT DISTINCT ON (event_id, bookmaker)
  id,
  event_id,
  bookmaker,
  bookmaker_url,
  home_odd,
  draw_odd,
  away_odd,
  market_type,
  scraped_at
FROM public.odds
ORDER BY event_id, bookmaker, scraped_at DESC;

-- Acelera o DISTINCT ON acima
CREATE INDEX IF NOT EXISTS idx_odds_event_bookmaker_scraped
  ON public.odds (event_id, bookmaker, scraped_at DESC);
