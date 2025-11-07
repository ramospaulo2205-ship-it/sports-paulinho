import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDataInitializer() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    checkAndInitialize();
  }, []);

  async function checkAndInitialize() {
    try {
      // Verificar se há eventos no banco
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('[DataInitializer] Error checking events:', error);
        return;
      }

      const isEmpty = count === 0;
      setHasData(!isEmpty);

      // Se estiver vazio, inicializar automaticamente
      if (isEmpty) {
        console.log('[DataInitializer] Database is empty, initializing...');
        await initializeData();
      }
    } catch (error) {
      console.error('[DataInitializer] Error:', error);
    }
  }

  async function initializeData() {
    if (isInitializing) return;

    setIsInitializing(true);
    toast.info('Carregando dados das casas de apostas...', {
      description: 'Isso pode levar alguns segundos.'
    });

    try {
      // Chamar o scraper de bookmakers
      const { data, error } = await supabase.functions.invoke('scrape-bookmakers', {
        body: {}
      });

      if (error) {
        console.error('[DataInitializer] Scraper error:', error);
        toast.error('Erro ao carregar dados', {
          description: 'Não foi possível buscar os dados das casas de apostas.'
        });
        return;
      }

      if (data?.success) {
        console.log('[DataInitializer] Data initialized successfully:', data);
        toast.success('Dados carregados com sucesso!', {
          description: `${data.eventsProcessed || 0} eventos importados.`
        });
        setHasData(true);
      } else {
        toast.warning('Dados carregados parcialmente', {
          description: 'Alguns dados podem não estar disponíveis.'
        });
      }
    } catch (error: any) {
      console.error('[DataInitializer] Initialize error:', error);
      toast.error('Erro ao inicializar dados', {
        description: error.message
      });
    } finally {
      setIsInitializing(false);
    }
  }

  return {
    isInitializing,
    hasData,
    refetch: initializeData
  };
}
