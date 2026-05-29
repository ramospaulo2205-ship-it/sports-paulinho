# Plano de Correções — sports-paulinho (2026-05-29)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar as 7 correções priorizadas da análise de 2026-05-29 — fechar Edge Functions, agendar scraping com retenção, tornar o Realtime incremental, centralizar auth, corrigir `event_key`, remover código morto e endurecer tipos.

**Architecture:** Front React/Vite/TS + shadcn. Back Supabase (Postgres + Auth + Realtime + Edge Functions Deno). Fonte: The Odds API. O scraper passa a rodar **só via pg_cron** validando um header secreto (`x-cron-secret`); o cliente nunca mais invoca o scraper, só lê do banco através de uma view `latest_odds`. Auth centralizada num `AuthContext` + `ProtectedRoute`.

**Tech Stack:** TypeScript, React 18, react-router-dom 6, @supabase/supabase-js 2, Vitest, Deno (Edge Functions), Postgres (pg_cron, pg_net).

**Decisões do dono (2026-05-29):**
1. Segurança EF = **secret de cron + sem chamada no client**.
2. Agendamento = **pg_cron na migration**.
3. Deploy = **aplicar no Supabase live** — porém só após resolver o ref divergente (`linked=flltoxywqffocnlbottb` × `config/.env=utxylkasnnamxdgbatau`). Todo o trabalho de código/migration é feito e validado localmente antes; o deploy é a última fase, interativa.

---

## File Structure

**Criar:**
- `src/contexts/AuthContext.tsx` — `AuthProvider` + hook `useAuth()` (única fonte de sessão).
- `src/components/ProtectedRoute.tsx` — wrapper de rota que exige sessão.
- `src/lib/arbitrage.ts` — funções puras: `calculateArbitrage` (movida de mockData) + `computeStakes` (rateio por resultado).
- `src/lib/arbitrage.test.ts` — testes das funções puras (move + amplia os de `__tests__/arbitrage.test.ts`).
- `supabase/migrations/20260529120000_latest_odds_view.sql` — view `latest_odds` + índice.
- `supabase/migrations/20260529120100_odds_retention_and_cron.sql` — função de retenção + agendamentos pg_cron (scrape + cleanup).

**Modificar:**
- `src/App.tsx` — envolver com `AuthProvider`; rotas privadas via `ProtectedRoute`.
- `src/pages/{Arbitrage,Compare,EventDetail,LiveOdds,Profile,Bookmakers}.tsx` — remover auth manual; usar `useAuth`.
- `src/hooks/useFavorites.ts` — usar `useAuth` em vez de `getSession`.
- `src/hooks/useDataInitializer.ts` — remover invocação do scraper; só reporta `hasData`; `refetch` re-consulta o banco.
- `src/hooks/useRealTimeOdds.ts` — ler de `latest_odds`; update incremental do payload.
- `src/hooks/useEventDetails.ts` — ler odds via `latest_odds` (consistência).
- `src/pages/Arbitrage.tsx` — `saveArbitrage` grava stakes por resultado (usa `computeStakes`).
- `src/components/ArbitrageCalculator.tsx` — reusar `computeStakes`/`calculateArbitrage` de `lib`.
- `supabase/functions/scrape-bookmakers/index.ts` — checar `x-cron-secret`; `event_key` com data; inserts em lote; regiões = `eu`.
- `supabase/config.toml` — remover bloco `fetch-odds`; manter `scrape-bookmakers` com `verify_jwt = false` (validação por secret interna).
- `README.md` — substituir boilerplate Lovable por doc real.
- `PROGRESS.md` — registrar execução.

**Remover:**
- `supabase/functions/fetch-odds/` — código morto (nunca invocado, não persiste).
- `src/__tests__/arbitrage.test.ts` — substituído por `src/lib/arbitrage.test.ts`.
- `.env` do rastreamento git (`git rm --cached`).

**Ordem de execução (dependências):**
```
Fase A (lib pura, TDD) → Fase B (auth) → Fase C (hooks/data) → Fase D (backend code + migrations)
→ Fase E (git hygiene) → Fase F (deploy live, interativa)
```

---

## Fase A — Arbitragem como lib pura (TDD)

### Task A1: Extrair `calculateArbitrage` + criar `computeStakes`

**Files:**
- Create: `src/lib/arbitrage.ts`
- Create: `src/lib/arbitrage.test.ts`
- Modify: `src/data/mockData.ts` (re-exporta de lib p/ não quebrar imports)
- Delete: `src/__tests__/arbitrage.test.ts`

- [ ] **Step 1: Escrever o teste que falha (`computeStakes`)**

```ts
// src/lib/arbitrage.test.ts
import { describe, it, expect } from "vitest";
import { calculateArbitrage, computeStakes } from "@/lib/arbitrage";

describe("calculateArbitrage", () => {
  it("retorna null com menos de 2 casas", () => {
    expect(calculateArbitrage([{ home: 2.0, away: 1.9 }])).toBeNull();
  });
  it("retorna null sem arbitragem (3-way típico)", () => {
    expect(calculateArbitrage([
      { home: 2.10, draw: 3.20, away: 3.50 },
      { home: 2.05, draw: 3.25, away: 3.45 },
    ])).toBeNull();
  });
  it("detecta arbitragem 2-way (~5%)", () => {
    const r = calculateArbitrage([
      { home: 2.10, away: 1.85 },
      { home: 1.85, away: 2.10 },
    ]);
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(5.0, 0);
  });
});

describe("computeStakes", () => {
  it("rateia 2-way igualando retornos dentro de R$1000", () => {
    const r = computeStakes(1000, { home: 2.10, away: 2.10 });
    expect(r.stakes.home).toBeCloseTo(500, 2);
    expect(r.stakes.away).toBeCloseTo(500, 2);
    // retorno por perna igual e > total
    expect(r.stakes.home * 2.10).toBeCloseTo(r.totalReturn, 2);
    expect(r.totalReturn).toBeGreaterThan(1000);
    expect(r.profit).toBeCloseTo(r.totalReturn - 1000, 2);
  });
  it("rateia 3-way igualando retornos", () => {
    const r = computeStakes(1000, { home: 3.20, draw: 3.20, away: 3.20 });
    const ret = r.stakes.home * 3.20;
    expect(r.stakes.draw! * 3.20).toBeCloseTo(ret, 2);
    expect(r.stakes.away * 3.20).toBeCloseTo(ret, 2);
    expect(r.stakes.home + r.stakes.draw! + r.stakes.away).toBeCloseTo(1000, 2);
  });
  it("stakes zerados quando não há arbitragem", () => {
    const r = computeStakes(1000, { home: 1.90, away: 1.90 });
    expect(r.hasArbitrage).toBe(false);
    expect(r.stakes.home).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/arbitrage.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/arbitrage"`.

- [ ] **Step 3: Implementar `src/lib/arbitrage.ts`**

```ts
// src/lib/arbitrage.ts
export interface OddsTriple { home: number; draw?: number; away: number }

/** % de lucro garantido usando a melhor odd de cada resultado entre as casas; null se não há arbitragem. */
export function calculateArbitrage(odds: OddsTriple[]): number | null {
  if (odds.length < 2) return null;
  const bestHome = Math.max(...odds.map((o) => o.home));
  const bestAway = Math.max(...odds.map((o) => o.away));
  const hasDraw = odds.some((o) => o.draw !== undefined && o.draw > 0);
  const bestDraw = hasDraw ? Math.max(...odds.map((o) => o.draw ?? 0)) : 0;

  const inverseSum =
    hasDraw && bestDraw > 0
      ? 1 / bestHome + 1 / bestDraw + 1 / bestAway
      : 1 / bestHome + 1 / bestAway;

  if (inverseSum < 1) return (1 / inverseSum - 1) * 100;
  return null;
}

export interface StakeBreakdown {
  hasArbitrage: boolean;
  stakes: { home: number; draw?: number; away: number };
  totalReturn: number;
  profit: number; // em R$
  profitPct: number;
}

/** Rateia `total` entre os resultados igualando o retorno de cada perna. */
export function computeStakes(total: number, best: OddsTriple): StakeBreakdown {
  const legs: Array<["home" | "draw" | "away", number]> = [
    ["home", best.home],
    ...(best.draw && best.draw > 0 ? ([["draw", best.draw]] as Array<["draw", number]>) : []),
    ["away", best.away],
  ];
  const inverseSum = legs.reduce((s, [, odd]) => s + 1 / odd, 0);

  if (total <= 0 || legs.some(([, o]) => o <= 0) || inverseSum >= 1) {
    return { hasArbitrage: false, stakes: { home: 0, away: 0 }, totalReturn: 0, profit: 0, profitPct: 0 };
  }

  const stakes: { home: number; draw?: number; away: number } = { home: 0, away: 0 };
  for (const [name, odd] of legs) {
    stakes[name] = total * (1 / odd) / inverseSum;
  }
  const totalReturn = stakes.home * best.home; // igual em todas as pernas
  const profit = totalReturn - total;
  return { hasArbitrage: true, stakes, totalReturn, profit, profitPct: (profit / total) * 100 };
}
```

- [ ] **Step 4: Re-exportar de mockData e apagar teste antigo**

Em `src/data/mockData.ts`, trocar a definição local de `calculateArbitrage` por:
```ts
export { calculateArbitrage } from "@/lib/arbitrage";
```
Apagar `src/__tests__/arbitrage.test.ts` (coberto por `src/lib/arbitrage.test.ts`).

- [ ] **Step 5: Rodar toda a suíte**

Run: `npx vitest run`
Expected: PASS (mockData.test.ts e utils.test.ts continuam passando; arbitrage cobertos pela nova suíte).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

---

## Fase B — Auth centralizada

### Task B1: `AuthContext`

**Files:**
- Create: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Implementar provider + hook**

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Typecheck** — `npx tsc --noEmit` → sem erros.

### Task B2: `ProtectedRoute`

**Files:**
- Create: `src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Implementar**

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }
  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Typecheck** → sem erros.

### Task B3: Ligar no `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Envolver árvore com `AuthProvider` e proteger rotas**

Adicionar imports:
```tsx
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
```
Envolver `<BrowserRouter>...</BrowserRouter>` com `<AuthProvider>`. Definir como protegidas as rotas que hoje fazem checagem manual: `/arbitrage`, `/compare`, `/bookmakers`, `/profile`, `/live-odds`, `/evento/:eventId`. Exemplo:
```tsx
<Route path="/arbitrage" element={<ProtectedRoute><Arbitrage /></ProtectedRoute>} />
```
Manter `/` (Index) e `/auth` públicas. (Index usa dados públicos.)

- [ ] **Step 2: Typecheck** → sem erros.

### Task B4: Remover auth manual das páginas

**Files:**
- Modify: `src/pages/Arbitrage.tsx`, `src/pages/Compare.tsx`, `src/pages/EventDetail.tsx`, `src/pages/LiveOdds.tsx`, `src/pages/Profile.tsx`, `src/pages/Bookmakers.tsx`

- [ ] **Step 1: Em cada página, remover o bloco `useEffect`+`getSession`+`onAuthStateChange`+`navigate("/auth")`**

Substituir o estado `const [user, setUser] = useState<any>(null)` por:
```tsx
import { useAuth } from "@/contexts/AuthContext";
// ...
const { user } = useAuth();
```
Remover imports agora órfãos (`useNavigate` se não usado para mais nada, `supabase` se não usado para mais nada na página). **Não** remover lógica não relacionada. Em `Profile.tsx`, manter o uso de `user` para carregar perfil.

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint src/pages`
Expected: sem erros; sem variáveis não usadas.

### Task B5: `useFavorites` via `useAuth`

**Files:**
- Modify: `src/hooks/useFavorites.ts`

- [ ] **Step 1: Trocar `getSession()` por `useAuth()`**

```tsx
import { useAuth } from "@/contexts/AuthContext";
// dentro do hook:
const { user } = useAuth();
```
Em `loadFavorites`/`toggleFavorite`, usar `user` do contexto; reagir a `user?.id` no `useEffect` (recarrega favoritos ao logar/deslogar). Remover `supabase.auth.getSession()` interno.

- [ ] **Step 2: Typecheck** → sem erros.

---

## Fase C — Hooks de dados

### Task C1: `useDataInitializer` deixa de raspar (scraper é cron-only)

**Files:**
- Modify: `src/hooks/useDataInitializer.ts`

- [ ] **Step 1: Reescrever para só reportar estado e re-consultar**

```tsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDataInitializer() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const { count, error } = await supabase
        .from("events").select("*", { count: "exact", head: true });
      if (error) { console.error("[DataInitializer]", error); return; }
      setHasData((count ?? 0) > 0);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  // Compat: o scraper roda via cron. "refetch" apenas reconsulta o banco.
  return { isInitializing: isChecking, hasData, refetch: check };
}
```

Motivo: com o scraper exigindo `x-cron-secret`, o cliente não pode mais invocá-lo (o segredo vazaria). Isso elimina por construção a corrida de scraper duplicado (item 6 do roadmap). A primeira carga vem do pg_cron (ou de uma execução manual via CLI/Dashboard).

- [ ] **Step 2: Ajustar textos de UI que prometiam “Atualizar Dados = raspar”**

Em `src/pages/Arbitrage.tsx` e `src/pages/Index.tsx`, o botão/alerta “Atualizar Dados” passa a chamar `refetch` (reconsulta) — texto: “Recarregar”. Manter o aviso de mock. Sem mudar layout.

- [ ] **Step 3: Typecheck** → sem erros.

### Task C2: View `latest_odds` consumida pelos hooks

**Files:**
- Modify: `src/hooks/useRealTimeOdds.ts`, `src/hooks/useEventDetails.ts`
- (depende da migration da Task D3, mas o código do hook pode ser escrito antes)

- [ ] **Step 1: `useRealTimeOdds` lê de `latest_odds` e aplica update incremental**

Trocar o select aninhado `odds:odds(*)` por join com a view `latest_odds` (1 linha por bookmaker já reduzida no banco). No handler do Realtime, em vez de `fetchLatestOdds()` cheio, aplicar o `payload.new` ao estado local do evento correspondente; só cair para refetch completo em `DELETE` ou evento desconhecido.

```tsx
// seleção
let query = supabase
  .from("events")
  .select(`*, latest_odds:latest_odds(*)`)
  .gte("commence_time", new Date().toISOString())
  .eq("status", "upcoming")
  .order("commence_time", { ascending: true });
```
Mapear `latest_odds` para `Event.odds` (mesma transformação atual, sem o `reduce` de “mais recente”, pois a view já entrega só a última por bookmaker).

Handler incremental:
```tsx
.on("postgres_changes", { event: "INSERT", schema: "public", table: "odds" }, (payload) => {
  const row = payload.new as any;
  setEvents((prev) => prev.map((ev) =>
    ev.id !== row.event_id ? ev : {
      ...ev,
      odds: [
        ...ev.odds.filter((o) => o.bookmaker !== mapBookmakerDisplay(row.bookmaker)),
        { bookmaker: row.bookmaker, home: Number(row.home_odd), draw: row.draw_odd ? Number(row.draw_odd) : undefined, away: Number(row.away_odd), url: row.bookmaker_url ?? undefined, timestamp: row.scraped_at },
      ],
    }
  ));
  setLastUpdate(new Date());
})
```
Manter um subscribe a `events` apenas para `INSERT`/`UPDATE` de status → refetch leve.

- [ ] **Step 2: `useEventDetails` lê de `latest_odds`** (mesma troca de select; remove o `reduce`).

- [ ] **Step 3: Typecheck** → sem erros. (Validação funcional fica para a Fase F, após a view existir.)

### Task C3: `saveArbitrage` grava stakes por resultado

**Files:**
- Modify: `src/pages/Arbitrage.tsx`, `src/components/ArbitrageCalculator.tsx`

- [ ] **Step 1: `ArbitrageCalculator` usa `lib/arbitrage`**

Substituir o cálculo interno por `calculateArbitrage`/`computeStakes` de `@/lib/arbitrage` (DRY). Layout inalterado.

- [ ] **Step 2: `saveArbitrage` usa `computeStakes` para gravar valores**

```tsx
import { computeStakes } from "@/lib/arbitrage";
// ...
const total = parseFloat(calculatorStake) || 1000;
const breakdown = computeStakes(total, { home: opportunity.bestHome, draw: opportunity.bestDraw ?? undefined, away: opportunity.bestAway });
const stakes = [
  { bookmaker: opportunity.homeBookmaker, outcome: opportunity.event.homeTeam, odd: opportunity.bestHome, stake: Number(breakdown.stakes.home.toFixed(2)) },
  ...(opportunity.bestDraw ? [{ bookmaker: opportunity.drawBookmaker, outcome: "Empate", odd: opportunity.bestDraw, stake: Number((breakdown.stakes.draw ?? 0).toFixed(2)) }] : []),
  { bookmaker: opportunity.awayBookmaker, outcome: opportunity.event.awayTeam, odd: opportunity.bestAway, stake: Number(breakdown.stakes.away.toFixed(2)) },
];
// insert: total_stake: total, profit_percentage: opportunity.profit, stakes
```

- [ ] **Step 3: Typecheck + suíte** → `npx tsc --noEmit && npx vitest run` sem erros.

### Task C4: Endurecer tipos nos arquivos tocados

**Files:** os já modificados nas Fases B/C.

- [ ] **Step 1: Remover `any` evitáveis**

Trocar `useState<any>(null)` (removido na Fase B), `acc: Record<string, any>` por tipos das linhas da view, `opportunity: any` por uma interface local `ArbOpportunity`. Não introduzir `any` novos. Escopo: só arquivos já tocados (cirúrgico).

- [ ] **Step 2: Lint** — `npx eslint src` sem novos warnings.

---

## Fase D — Backend (código + migrations, validado local)

### Task D1: Endurecer `scrape-bookmakers`

**Files:**
- Modify: `supabase/functions/scrape-bookmakers/index.ts`

- [ ] **Step 1: Validar `x-cron-secret`**

No início do handler (após o OPTIONS):
```ts
const CRON_SECRET = Deno.env.get("CRON_SECRET");
if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
  return new Response(JSON.stringify({ error: "unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

- [ ] **Step 2: `event_key` com data (evita colisão de returno/rematch)**

```ts
const day = apiEvent.commence_time.slice(0, 10); // YYYY-MM-DD
const eventKey = `${apiEvent.sport_key}_${apiEvent.home_team}_${apiEvent.away_team}_${day}`.replace(/\s+/g, "_");
```

- [ ] **Step 3: Regiões = `eu` (corte de custo da The Odds API)**

Trocar `regions=us,uk,eu,au` por `regions=eu` na URL.

- [ ] **Step 4: Inserts de odds em lote por evento**

Acumular as linhas de odds num array e fazer um único `supabase.from("odds").insert(rows)` por evento, em vez de `await` por bookmaker.

- [ ] **Step 5: Typecheck Deno (opcional local)** — `deno check supabase/functions/scrape-bookmakers/index.ts` se `deno` instalado; senão validar na Fase F no deploy.

### Task D2: Remover `fetch-odds` (código morto)

**Files:**
- Delete: `supabase/functions/fetch-odds/`
- Modify: `supabase/config.toml`

- [ ] **Step 1: Apagar a pasta** `supabase/functions/fetch-odds/`.
- [ ] **Step 2: Remover o bloco `[functions.fetch-odds]`** de `supabase/config.toml`. Manter:
```toml
project_id = "<ref-correto>"

[functions.scrape-bookmakers]
verify_jwt = false
```
(verify_jwt fica false; a autorização é o `x-cron-secret` interno.)

### Task D3: Migration — view `latest_odds`

**Files:**
- Create: `supabase/migrations/20260529120000_latest_odds_view.sql`

- [ ] **Step 1: Escrever a view + índice de apoio**

```sql
-- Última odd por (event_id, bookmaker)
CREATE OR REPLACE VIEW public.latest_odds
WITH (security_invoker = true) AS
SELECT DISTINCT ON (event_id, bookmaker)
  id, event_id, bookmaker, bookmaker_url,
  home_odd, draw_odd, away_odd, market_type, scraped_at
FROM public.odds
ORDER BY event_id, bookmaker, scraped_at DESC;

-- Acelera o DISTINCT ON
CREATE INDEX IF NOT EXISTS idx_odds_event_bookmaker_scraped
  ON public.odds (event_id, bookmaker, scraped_at DESC);
```
(RLS de `odds` é pública para leitura; `security_invoker` propaga a policy.)

### Task D4: Migration — retenção + pg_cron

**Files:**
- Create: `supabase/migrations/20260529120100_odds_retention_and_cron.sql`

- [ ] **Step 1: Extensões, função de limpeza e agendamentos**

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Mantém só odds dos últimos 2 dias (histórico suficiente p/ variação)
CREATE OR REPLACE FUNCTION public.cleanup_old_odds()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.odds WHERE scraped_at < now() - interval '2 days';
$$;

-- Limpeza diária às 04:00 UTC
SELECT cron.schedule('cleanup-old-odds', '0 4 * * *', $$ SELECT public.cleanup_old_odds(); $$);

-- Scrape a cada 15 min chamando a Edge Function com o secret
-- NOTA: <REF> e <CRON_SECRET> preenchidos no deploy (Fase F).
SELECT cron.schedule(
  'scrape-odds', '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<REF>.functions.supabase.co/scrape-bookmakers',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret','<CRON_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);
```
Motivo da retenção: o scraper faz `INSERT` (não upsert) e `scraped_at` é sempre novo → sem limpeza a tabela cresce infinitamente. 2 dias dá histórico p/ `OddVariation` sem inchar.

---

## Fase E — Higiene git

### Task E1: Tirar `.env` do rastreamento

**Files:**
- Modify (index): `.env`

- [ ] **Step 1:** `git rm --cached .env` (arquivo permanece no disco; já está no `.gitignore`).
- [ ] **Step 2:** confirmar `git status` mostra `.env` como deleted-from-index + untracked.

---

## Fase F — Deploy live (interativa)

> Pré-requisito: **resolver o ref**. O anon key do `.env` decodifica para `utxylkasnnamxdgbatau`; o `linked-project.json` aponta `flltoxywqffocnlbottb`. Confirmar com o dono qual é o projeto de produção e ajustar `config.toml` + relink antes de qualquer push.

- [ ] **Step 1:** Confirmar projeto correto; `supabase link --project-ref <REF-CORRETO>`.
- [ ] **Step 2:** Definir secrets: `supabase secrets set CRON_SECRET=<gerado> ODDS_API_KEY=<chave>`.
- [ ] **Step 3:** Preencher `<REF>`/`<CRON_SECRET>` na migration do cron (Task D4) — ou usar `vault`/`current_setting` se preferir não materializar o secret na migration.
- [ ] **Step 4:** `supabase db push` (aplica view + retenção + cron).
- [ ] **Step 5:** `supabase functions deploy scrape-bookmakers`; remover a função `fetch-odds` remota (`supabase functions delete fetch-odds`).
- [ ] **Step 6:** Smoke test: `curl -H "x-cron-secret: <secret>" -X POST .../scrape-bookmakers` → 200 com `eventsProcessed`; `curl` sem header → 401.
- [ ] **Step 7:** Validar front: `npm run dev`, abrir `/live-odds` e `/arbitrage`, confirmar dados reais vindos de `latest_odds` e Realtime incremental.

---

## Verificação por fase

- **A:** `npx vitest run` verde; `calculateArbitrage`/`computeStakes` testados.
- **B:** nenhuma página importa `supabase.auth.getSession`/`onAuthStateChange` (só `AuthContext`); rotas privadas redirecionam deslogado.
- **C:** `useDataInitializer` não invoca scraper; hooks leem `latest_odds`; `saveArbitrage` grava `stake` por resultado.
- **D:** `scrape-bookmakers` retorna 401 sem secret; `event_key` inclui data; `fetch-odds` removido; migrations escritas.
- **E:** `git ls-files .env` vazio.
- **F:** cron rodando; smoke tests ok; front consumindo dados reais.

## Self-review (cobertura do spec)
- Item 1 (EF abertas) → D1+D2+F. Item 2 (.env) → E1. Item 3 (retenção+cron) → D4. Item 4 (realtime incremental+view) → D3+C2. Item 5 (auth dup) → B1–B5. Item 6 (lock initializer) → C1 (dissolvido). Item 7 (event_key) → D1. Item 8 (fetch-odds) → D2. Item 9 (saveArbitrage) → C3. Item 10 (regiões) → D1. Item 12 (any) → C4. README → fase final opcional.
