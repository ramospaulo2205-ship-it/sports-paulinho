import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OddsCard from "@/components/OddsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mockEvents, sports, calculateArbitrage } from "@/data/mockData";
import { Search, TrendingUp, RefreshCw } from "lucide-react";
import { useRealTimeOdds } from "@/hooks/useRealTimeOdds";
import { Skeleton } from "@/components/ui/skeleton";
import { useDataInitializer } from "@/hooks/useDataInitializer";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { events: realEvents, loading } = useRealTimeOdds();
  const { isInitializing, hasData, refetch } = useDataInitializer();

  const now = new Date();
  
  // Usar eventos reais se disponíveis, senão usar mock
  const sourceEvents = realEvents.length > 0 ? realEvents : mockEvents;
  
  const filteredEvents = useMemo(() => {
    return sourceEvents
      .filter((event) => {
        // Filtrar apenas eventos futuros
        const eventDate = event.commenceTime 
          ? new Date(event.commenceTime)
          : new Date(`${event.date}T${event.time}`);
        if (isNaN(eventDate.getTime()) || eventDate < now) return false;

        const matchesSport = selectedSport === "all" || event.sport === selectedSport;
        const matchesSearch = 
          event.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.league.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSport && matchesSearch;
      })
      .sort((a, b) => {
        const dateA = a.commenceTime ? new Date(a.commenceTime) : new Date(`${a.date}T${a.time}`);
        const dateB = b.commenceTime ? new Date(b.commenceTime) : new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [sourceEvents, selectedSport, searchQuery, now]);

  const getEventArbitrage = (event: typeof mockEvents[0]) => {
    const allOdds = event.odds.map(o => ({
      home: o.home,
      draw: o.draw,
      away: o.away
    }));
    return calculateArbitrage(allOdds);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-gradient-arbitrage px-4 py-2 rounded-full mb-6">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
              <span className="text-sm font-medium text-accent-foreground">
                Encontre as Melhores Odds em Tempo Real
              </span>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Odds Analyzer
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Compare odds de apostas esportivas das principais casas brasileiras e identifique oportunidades de arbitragem automaticamente.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0"
                onClick={() => navigate("/compare")}
              >
                Comparar Odds
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-primary/50 hover:bg-primary/10"
                onClick={() => navigate("/arbitrage")}
              >
                Ver Arbitragem
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {/* Data Status Alert */}
          {hasData === false && !isInitializing && (
            <Alert className="mb-6 border-primary/50 bg-primary/5">
              <AlertDescription className="flex items-center justify-between">
                <span className="text-foreground">
                  Nenhum dado encontrado. Clique em "Atualizar Dados" para carregar os eventos.
                </span>
                <Button 
                  onClick={refetch}
                  size="sm"
                  className="bg-gradient-primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Dados
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isInitializing && (
            <Alert className="mb-6 border-accent/50 bg-accent/5">
              <AlertDescription className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 animate-spin text-accent" />
                <span className="text-foreground">Carregando dados das casas de apostas...</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-8">
            <div className="relative max-w-xl mx-auto mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar times ou competições..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                variant={selectedSport === "all" ? "default" : "outline"}
                onClick={() => setSelectedSport("all")}
                className={selectedSport === "all" ? "bg-gradient-primary border-0" : "border-border"}
              >
                Todos
              </Button>
              {sports.map((sport) => (
                <Button
                  key={sport.id}
                  variant={selectedSport === sport.id ? "default" : "outline"}
                  onClick={() => setSelectedSport(sport.id)}
                  className={selectedSport === sport.id ? "bg-gradient-primary border-0" : "border-border"}
                >
                  {sport.icon} {sport.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <OddsCard
                  key={event.id}
                  event={event}
                  hasArbitrage={getEventArbitrage(event) !== null}
                  onClick={() => navigate(`/evento/${event.id}`)}
                />
              ))}
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum evento encontrado</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in">
              <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                8+
              </div>
              <p className="text-muted-foreground">Casas de Apostas</p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="text-4xl font-bold bg-gradient-arbitrage bg-clip-text text-transparent mb-2">
                {realEvents.length > 0 ? realEvents.length : mockEvents.length}+
              </div>
              <p className="text-muted-foreground">Eventos Disponíveis</p>
            </div>
            <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                {sports.length}
              </div>
              <p className="text-muted-foreground">Esportes</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
