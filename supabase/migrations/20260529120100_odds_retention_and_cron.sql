-- Extensões para agendamento e chamadas HTTP a partir do Postgres
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Retenção: o scraper faz INSERT (não upsert) e scraped_at é sempre novo,
-- então sem limpeza a tabela odds cresceria sem limite. Mantém 2 dias —
-- suficiente para histórico/variação sem inchar a base.
CREATE OR REPLACE FUNCTION public.cleanup_old_odds()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.odds WHERE scraped_at < now() - interval '2 days';
$$;

-- Limpeza diária às 04:00 UTC (não usa segredos, seguro versionar)
SELECT cron.schedule(
  'cleanup-old-odds',
  '0 4 * * *',
  $$ SELECT public.cleanup_old_odds(); $$
);

-- ---------------------------------------------------------------------------
-- AGENDAMENTO DO SCRAPER (rodar manualmente no deploy — Fase F)
--
-- NÃO versionamos o segredo no git. No deploy, rode o bloco abaixo no SQL
-- editor do Supabase substituindo <REF> e <CRON_SECRET> pelos valores reais
-- (o mesmo CRON_SECRET configurado em `supabase secrets set`):
--
-- SELECT cron.schedule(
--   'scrape-odds',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://<REF>.functions.supabase.co/scrape-bookmakers',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', '<CRON_SECRET>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
--
-- Para remover/reagendar: SELECT cron.unschedule('scrape-odds');
-- ---------------------------------------------------------------------------
