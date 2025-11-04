-- Corrigir security definer view
DROP VIEW IF EXISTS public.scraper_health;

CREATE OR REPLACE VIEW public.scraper_health
WITH (security_invoker = true)
AS
SELECT 
  bookmaker,
  COUNT(*) as total_odds,
  MAX(scraped_at) as last_scrape,
  EXTRACT(EPOCH FROM (NOW() - MAX(scraped_at))) as seconds_since_last_scrape
FROM public.odds
WHERE scraped_at > NOW() - INTERVAL '10 minutes'
GROUP BY bookmaker;