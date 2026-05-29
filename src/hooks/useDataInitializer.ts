import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Verifica se há eventos no banco. O scraper roda apenas via pg_cron
 * (autenticado por x-cron-secret), então o cliente NÃO o invoca — isso
 * elimina a corrida de scraper duplicado ao navegar entre páginas.
 * `refetch` apenas reconsulta o banco (não dispara scraping).
 */
export function useDataInitializer() {
  const [hasData, setHasData] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('[DataInitializer] Error checking events:', error);
        return;
      }

      setHasData((count ?? 0) > 0);
    } catch (error) {
      console.error('[DataInitializer] Error:', error);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return {
    isInitializing: isChecking,
    hasData,
    refetch: check,
  };
}
