# Progresso de Correções — sports-paulinho

Iniciado em: 2026-05-15

---

## Fase 1 — Correções Rápidas

| ID    | Descrição                              | Status        | Data       |
|-------|----------------------------------------|---------------|------------|
| F1-01 | Filtro de aba por esporte (LiveOdds)   | ✅ Concluído  | 2026-05-15 |
| F1-02 | Aviso explícito para mock data         | ✅ Concluído  | 2026-05-15 |
| F1-03 | Stake real ao salvar arbitragem        | ✅ Concluído  | 2026-05-15 |
| F1-04 | Header `remainingRequests` correto     | ✅ Concluído  | 2026-05-15 |
| F1-05 | Remover `useOddsPolling` (código morto)| ✅ Concluído  | 2026-05-15 |

## Fase 2 — Arquitetura

| ID    | Descrição                              | Status        | Data       |
|-------|----------------------------------------|---------------|------------|
| F2-01 | AuthContext + useProtectedRoute        | ⬜ Pendente   | —          |
| F2-02 | Lock global no useDataInitializer      | ⬜ Pendente   | —          |

## Fase 3 — Segurança e Performance

| ID    | Descrição                              | Status        | Data       |
|-------|----------------------------------------|---------------|------------|
| F3-01 | JWT nas Edge Functions                 | ⬜ Pendente   | —          |
| F3-02 | Realtime com update incremental        | ⬜ Pendente   | —          |

---

## Log de Mudanças

### 2026-05-15

**F1-01** — Filtro de aba por esporte (LiveOdds)

- `src/pages/LiveOdds.tsx`: adicionado `TAB_SPORT` map fora do componente; removido argumento de esporte do `useRealTimeOdds()`; adicionado filtro `event.sport !== targetSport` no `filteredEvents`; `activeTab` adicionado às deps do useMemo; `tabToMockSport` inline removido e unificado no `TAB_SPORT`; corrigido `ufc: 'football'` → `ufc: 'mma'`
- `src/hooks/useRealTimeOdds.ts`: adicionados `tennis_atp_singles`, `tennis_wta_singles` e `esports_lol_worlds` ao mapa de normalização

**F1-02** — Aviso explícito para mock data

- `src/pages/Index.tsx`: derivado `isShowingMock`; adicionado Alert amarelo antes do grid de eventos
- `src/pages/Arbitrage.tsx`: derivado `isShowingMock`; adicionado Alert de atenção na seção de oportunidades com aviso sobre decisão financeira

**F1-03** — Stake real ao salvar arbitragem

- `src/components/ArbitrageCalculator.tsx`: adicionadas props `stake` e `onStakeChange` para expor o valor ao pai
- `src/pages/Arbitrage.tsx`: criado `calculatorStake` state; passado para o componente; `total_stake` agora usa `parseFloat(calculatorStake)`

**F1-04** — Header `remainingRequests` correto

- `supabase/functions/fetch-odds/index.ts`: movida leitura de `x-requests-remaining` para dentro do `oddsPromises.map`, lendo da `response` da API; resultado agregado via `find` nos resultados

**F1-05** — Remover `useOddsPolling` (código morto)

- `src/hooks/useOddsPolling.ts`: arquivo removido — não era importado em nenhuma página

---

## Próxima Sessão

Iniciar pela **Fase 2**, na ordem:

1. **F2-02** — Lock global no `useDataInitializer` (impede scraper duplicado ao navegar entre páginas)
2. **F2-01** — `AuthContext` + `useProtectedRoute` (eliminar auth manual duplicada em 6 páginas)

Depois seguir para Fase 3 (F3-01 JWT, F3-02 Realtime incremental).

---

## 2026-05-29 — Execução do plano de correções (branch `fix/roadmap-correcoes`)

Plano completo em `docs/plano-correcoes-2026-05-29.md`. Fases A–E concluídas e verificadas
localmente (`tsc` limpo, 24 testes passando, `vite build` OK). Fase F (deploy) pendente — exige login no Supabase.

### Concluído

| Item | Descrição | Arquivos |
|------|-----------|----------|
| A | Arbitragem extraída p/ lib pura + `computeStakes` (rateio por resultado), com testes | `src/lib/arbitrage.ts`, `src/lib/arbitrage.test.ts`, `src/data/mockData.ts` |
| B | `AuthContext` + `ProtectedRoute`; auth manual removida de 6 páginas + `useFavorites` | `src/contexts/AuthContext.tsx`, `src/components/ProtectedRoute.tsx`, `src/App.tsx`, `src/pages/{Arbitrage,Compare,EventDetail,LiveOdds,Profile,Bookmakers}.tsx`, `src/hooks/useFavorites.ts` |
| C | `useDataInitializer` não raspa mais (scraper é cron-only); hooks leem view `latest_odds`; Realtime incremental; `saveArbitrage` grava stake por resultado; tipos endurecidos | `src/hooks/{useDataInitializer,useRealTimeOdds,useEventDetails}.ts`, `src/components/ArbitrageCalculator.tsx`, `src/pages/Arbitrage.tsx`, `src/integrations/supabase/types.ts` |
| D | `scrape-bookmakers`: header `x-cron-secret`, `event_key` com data, `regions=eu`, inserts em lote; `fetch-odds` removido; migrations de view + retenção + cron de limpeza | `supabase/functions/scrape-bookmakers/index.ts`, `supabase/config.toml`, `supabase/migrations/20260529120000_latest_odds_view.sql`, `supabase/migrations/20260529120100_odds_retention_and_cron.sql` |
| E | `.env` removido do rastreamento git (mantido no disco) | `.env` |

### Decisões
- **Ref correto = `utxylkasnnamxdgbatau`** (confirmado pelo anon key do app). O `linked-project.json` (`flltoxywqffocnlbottb`) estava obsoleto — relinkar antes do deploy.
- Scraper passou a ser **cron-only**: o cliente não o invoca mais (eliminou a corrida do F2-02 por construção). Botão "Atualizar Dados" virou "Recarregar" (só reconsulta o banco).
- Reten­ção da `odds` = 2 dias. Scrape agendado a cada 15 min (configurar no deploy, fora do git para não vazar o secret).

### Fase F — passos do deploy (rodar manualmente)
```bash
cd apps/sports-paulinho
supabase login                              # fluxo de browser
supabase link --project-ref utxylkasnnamxdgbatau
supabase secrets set CRON_SECRET=<gerado> ODDS_API_KEY=<sua-chave-the-odds-api>
supabase db push                            # aplica latest_odds + retenção + cron de limpeza
supabase functions deploy scrape-bookmakers
supabase functions delete fetch-odds        # remove a função morta remota
# Regerar tipos (opcional, já antecipados em types.ts):
# supabase gen types typescript --linked > src/integrations/supabase/types.ts
```
Depois, no SQL editor do Supabase, agendar o scrape (substituindo o secret real):
```sql
SELECT cron.schedule('scrape-odds', '*/15 * * * *', $$
  SELECT net.http_post(
    url := 'https://utxylkasnnamxdgbatau.functions.supabase.co/scrape-bookmakers',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
    body := '{}'::jsonb);
$$);
```
Smoke test:
```bash
# 401 sem o header:
curl -i -X POST https://utxylkasnnamxdgbatau.functions.supabase.co/scrape-bookmakers
# 200 com o header:
curl -i -X POST -H "x-cron-secret: <CRON_SECRET>" https://utxylkasnnamxdgbatau.functions.supabase.co/scrape-bookmakers
```

---

## 2026-05-29 — Fase F EXECUTADA (deploy concluído)

**Descoberta importante:** o ref `utxylkasnnamxdgbatau` (do `.env`/`config` antigos) **não existe mais** na conta. O backend de produção real é **`flltoxywqffocnlbottb`** (São Paulo, criado 27/abr) — tinha `events`/`odds` com dados scraped, mas **sem** as tabelas da 1ª migration (`profiles`/`favorites`/`arbitrage_history`), que estavam quebradas em prod.

Passos efetivos:
1. `flltoxywqffocnlbottb` estava **pausado** → despausado no dashboard.
2. Remoto sem histórico de migration → `migration repair --status applied 20251104203035 20251104203121` (schema já existia).
3. `db push --include-all` aplicou **3 migrations**: `20251011…` (cria as tabelas de auth que faltavam — conserta prod), `latest_odds`, retenção+cron de limpeza.
4. `secrets set CRON_SECRET=…` e (depois) `ODDS_API_KEY=…`.
5. `functions deploy scrape-bookmakers` (v5). `fetch-odds` não existia no remoto (nada a deletar).
6. Cron de limpeza criado pela migration (jobid 1); cron `scrape-odds` `*/15` agendado via SQL no dashboard (jobid 2).
7. Smoke test do gate: sem header→401, secret errado→401, secret correto→200.
8. Scrape manual real: **56 eventos / 524 odds**. Banco: `events`=61, `odds`=549, `latest_odds`=549.
9. `.env` e `config.toml` corrigidos para `flltoxywqffocnlbottb`.

**Pendência operacional (atenção a custo):** o cron `*/15` × 14 esportes ≈ **40k req/mês** na The Odds API — estoura o plano free (500/mês). Reduzir frequência/esportes conforme o plano contratado. Ajustar via `cron.unschedule('scrape-odds')` + novo `cron.schedule(...)`.
