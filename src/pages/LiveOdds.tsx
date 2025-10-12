import { useState } from "react";
import Navbar from "@/components/Navbar";
import OddsCard from "@/components/OddsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useOddsPolling } from "@/hooks/useOddsPolling";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SPORTS = {
  futebol: ['soccer_brazil_campeonato'],
  basquete: ['basketball_nba'],
  tenis: ['tennis_atp_singles'],
  esports: ['esports_lol_worlds'],
};

const LiveOdds = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof SPORTS>('futebol');
  const { events, loading, error, lastUpdate, remainingRequests, refetch } = useOddsPolling(SPORTS[activeTab]);
  const { isFavorite, toggleFavorite, loading: favoritesLoading } = useFavorites();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Odds ao Vivo</h1>
            <p className="text-muted-foreground">
              Atualizado a cada 30 segundos
              {lastUpdate && (
                <span className="ml-2">
                  • Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {remainingRequests !== null && (
              <Badge variant="outline">
                {remainingRequests} requisições restantes
              </Badge>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as keyof typeof SPORTS)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="futebol">Futebol</TabsTrigger>
            <TabsTrigger value="basquete">Basquete</TabsTrigger>
            <TabsTrigger value="tenis">Tênis</TabsTrigger>
            <TabsTrigger value="esports">E-Sports</TabsTrigger>
          </TabsList>

          {Object.keys(SPORTS).map((sport) => (
            <TabsContent key={sport} value={sport} className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum evento disponível no momento
                  </p>
                </div>
              ) : (
                events.map((event) => (
                  <OddsCard
                    key={event.id}
                    event={event}
                    isFavorite={isFavorite(event.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default LiveOdds;
