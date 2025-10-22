import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import OddsCard from "@/components/OddsCard";
import SearchBar, { normalizeText } from "@/components/SearchBar";
import LeagueFilter from "@/components/LeagueFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useOddsPolling } from "@/hooks/useOddsPolling";
import { useFavorites } from "@/hooks/useFavorites";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mockEvents } from "@/data/mockData";


const SPORTS = {
  futebol: ['soccer_brazil_campeonato'],
  basquete: ['basketball_nba'],
  tenis: ['tennis_atp_singles'],
  esports: ['esports_lol_worlds'],
  ufc: ['mma_mixed_martial_arts'],
};

const LiveOdds = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState<keyof typeof SPORTS>('futebol');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  });
  
  const { events, loading, error, lastUpdate, remainingRequests, refetch } = useOddsPolling(SPORTS[activeTab]);
  const { isFavorite, toggleFavorite } = useFavorites();


  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Você precisa fazer login para acessar esta página.",
        });
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Filter events based on search, leagues, and date range
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const normalizedQuery = normalizeText(searchQuery);
        const normalizedHome = normalizeText(event.homeTeam);
        const normalizedAway = normalizeText(event.awayTeam);
        const normalizedLeague = normalizeText(event.league);
        
        const matchesSearch =
          normalizedHome.includes(normalizedQuery) ||
          normalizedAway.includes(normalizedQuery) ||
          normalizedLeague.includes(normalizedQuery);
        
        if (!matchesSearch) return false;
      }

      // League filter
      if (selectedLeagues.length > 0 && !selectedLeagues.includes(event.league)) {
        return false;
      }

      // Date filter
      if (event.commenceTime) {
        const eventDate = new Date(event.commenceTime);
        if (eventDate < dateRange.start || eventDate > dateRange.end) {
          return false;
        }
      }

      return true;
    });
  }, [events, searchQuery, selectedLeagues, dateRange]);


  const tabToMockSport: Record<keyof typeof SPORTS, string> = {
    futebol: 'soccer',
    basquete: 'basketball',
    tenis: 'tennis',
    esports: 'esports',
    ufc: 'football',
  };

  const filteredMockEvents = useMemo(() => {
    const targetSport = tabToMockSport[activeTab];
    const list = mockEvents.filter((e) => !targetSport || e.sport === targetSport);
    if (list.length === 0) return [] as typeof mockEvents;

    return list.filter((event) => {
      if (searchQuery) {
        const normalizedQuery = normalizeText(searchQuery);
        const normalizedHome = normalizeText(event.homeTeam);
        const normalizedAway = normalizeText(event.awayTeam);
        const normalizedLeague = normalizeText(event.league);
        const matchesSearch =
          normalizedHome.includes(normalizedQuery) ||
          normalizedAway.includes(normalizedQuery) ||
          normalizedLeague.includes(normalizedQuery);
        if (!matchesSearch) return false;
      }

      if (selectedLeagues.length > 0 && !selectedLeagues.includes(event.league)) {
        return false;
      }

      return true;
    });
  }, [activeTab, searchQuery, selectedLeagues]);

  useEffect(() => {
    if (!loading && events.length === 0 && filteredMockEvents.length > 0) {
      console.log('[LiveOdds] Usando fallback do mock:', filteredMockEvents.length, 'eventos');
    }
  }, [loading, events.length, filteredMockEvents.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Odds ao Vivo</h1>
                {lastUpdate && Date.now() - lastUpdate.getTime() < 30000 && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs font-semibold rounded-full border border-green-500/30 animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    AO VIVO
                  </span>
                )}
              </div>
              <p className="text-muted-foreground">
                Atualizado a cada 15 segundos
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

          {/* Search and Filters */}
          <div className="flex gap-3">
            <div className="flex-1">
              <SearchBar onSearch={setSearchQuery} />
            </div>
            <LeagueFilter
              events={events}
              selectedLeagues={selectedLeagues}
              onLeaguesChange={setSelectedLeagues}
              selectedDateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as keyof typeof SPORTS)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="futebol">Futebol</TabsTrigger>
            <TabsTrigger value="basquete">Basquete</TabsTrigger>
            <TabsTrigger value="tenis">Tênis</TabsTrigger>
            <TabsTrigger value="esports">E-Sports</TabsTrigger>
            <TabsTrigger value="ufc">UFC/MMA</TabsTrigger>
          </TabsList>

          {Object.keys(SPORTS).map((sport) => (
            <TabsContent key={sport} value={sport} className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
) : filteredEvents.length === 0 ? (
                filteredMockEvents.length > 0 ? (
                  filteredMockEvents.map((event) => (
                    <OddsCard
                      key={event.id}
                      event={event}
                      isFavorite={isFavorite(event.id)}
                      onToggleFavorite={toggleFavorite}
                      onClick={() => navigate(`/evento/${event.id}`)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery || selectedLeagues.length > 0
                        ? "Nenhum evento encontrado com os filtros aplicados"
                        : "Nenhum evento disponível no momento"}
                    </p>
                  </div>
                )
              ) : (
                filteredEvents.map((event) => (
                  <OddsCard
                    key={event.id}
                    event={event}
                    isFavorite={isFavorite(event.id)}
                    onToggleFavorite={toggleFavorite}
                    onClick={() => navigate(`/evento/${event.id}`)}
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
