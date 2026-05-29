# Roadmap de Melhorias — sports-paulinho

Levantamento feito em 2026-05-15. 9 problemas identificados, organizados em 3 fases por impacto × esforço.

---

## Fase 1 — Correções Rápidas (P0 + quick wins)
> Bugs que afetam o usuário agora. Cada item < 15 linhas de mudança.

| ID | Problema | Arquivo(s) | Esforço |
|----|----------|------------|---------|
| F1-01 | Filtro de aba por esporte quebrado — só futebol funciona | `src/pages/LiveOdds.tsx:40` | ~5 min |
| F1-02 | Mock data silenciosa — usuário não sabe que vê dados fictícios | `src/pages/Index.tsx:25`, `src/pages/Arbitrage.tsx:97` | ~10 min |
| F1-03 | `total_stake` hardcoded em 1000 ao salvar arbitragem | `src/pages/Arbitrage.tsx:75` | ~5 min |
| F1-04 | `remainingRequests` sempre null — lê header errado | `supabase/functions/fetch-odds/index.ts:71` | ~5 min |
| F1-05 | Deletar `useOddsPolling` — código morto | `src/hooks/useOddsPolling.ts` | ~2 min |

---

## Fase 2 — Arquitetura (P1)
> Dívida que cresce a cada página nova. Requer mais contexto e cuidado.

| ID | Problema | Arquivo(s) | Esforço |
|----|----------|------------|---------|
| F2-01 | Auth duplicada em 6 páginas — criar `AuthContext` + `useProtectedRoute` | `src/pages/*.tsx` (6 arquivos) | ~1h |
| F2-02 | `useDataInitializer` sem lock global — scraper dispara múltiplas vezes | `src/hooks/useDataInitializer.ts` | ~20 min |

---

## Fase 3 — Segurança e Performance (P2)
> Itens que não quebram fluxo hoje mas são riscos reais.

| ID | Problema | Arquivo(s) | Esforço |
|----|----------|------------|---------|
| F3-01 | Edge Functions sem JWT — qualquer um pode chamar o scraper | `supabase/config.toml`, `supabase/functions/*/index.ts` | ~30 min |
| F3-02 | Realtime dispara refetch completo — update incremental com payload | `src/hooks/useRealTimeOdds.ts:57-83` | ~45 min |

---

## Ordem de execução sugerida

```
Fase 1 (toda) → F2-02 → F2-01 → F3-01 → F3-02
```

Fase 1 primeiro porque os quick wins desbloqueiam clareza sobre o que realmente está em uso antes de refatorar a arquitetura.

---

## Critérios de conclusão por fase

**Fase 1 concluída quando:**
- Trocar de aba no LiveOdds filtra corretamente por esporte
- Banco vazio exibe aviso explícito, não dados mock
- Histórico de arbitragem salva a stake real
- `useOddsPolling` removido do repositório

**Fase 2 concluída quando:**
- Nenhuma página importa `supabase.auth.getSession` diretamente
- `useDataInitializer` tem flag global que impede chamadas duplicadas

**Fase 3 concluída quando:**
- Edge Functions exigem token válido ou IP allowlist
- Realtime atualiza apenas o evento/odd modificado, sem refetch total
