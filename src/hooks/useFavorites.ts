import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FAVORITES = 50;

export const useFavorites = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setFavorites(new Set());
      setLoading(false);
      return;
    }
    loadFavorites(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('event_id')
        .eq('user_id', userId);

      if (error) throw error;

      setFavorites(new Set(data.map(f => f.event_id)));
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = useCallback(async (eventId: string) => {
    try {
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Login necessário',
          description: 'Faça login para salvar favoritos.',
        });
        return;
      }

      const isFavorite = favorites.has(eventId);

      if (!isFavorite && favorites.size >= MAX_FAVORITES) {
        toast({
          variant: 'destructive',
          title: 'Limite atingido',
          description: `Você pode ter no máximo ${MAX_FAVORITES} favoritos.`,
        });
        return;
      }

      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });

        toast({
          title: 'Removido dos favoritos',
        });
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            event_id: eventId,
          });

        if (error) throw error;

        setFavorites(prev => new Set([...prev, eventId]));

        toast({
          title: 'Adicionado aos favoritos',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar favorito',
        description: error instanceof Error ? error.message : String(error),
      });
    }
  }, [favorites, toast, user]);

  return {
    favorites,
    loading,
    isFavorite: (eventId: string) => favorites.has(eventId),
    toggleFavorite,
  };
};
