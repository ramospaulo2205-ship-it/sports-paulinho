import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockEvents, bookmakers } from "@/data/mockData";
import { Calendar, Clock, TrendingUp, ExternalLink, RefreshCw } from "lucide-react";
import { useRealTimeOdds } from "@/hooks/useRealTimeOdds";
import { useDataInitializer } from "@/hooks/useDataInitializer";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Compare = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const eventId = searchParams.get("event");
  const { events, loading } = useRealTimeOdds();
  const { isInitializing, hasData, refetch: refetchData } = useDataInitializer();
  
  // Redirect to new route format if accessed via old query param
  useEffect(() => {
    if (eventId) {
      navigate(`/evento/${eventId}`, { replace: true });
    }
  }, [eventId, navigate]);
  
  const allEvents = events.length > 0 ? events : mockEvents;
  const [selectedEvent, setSelectedEvent] = useState(allEvents[0]);
  
  useEffect(() => {
    if (allEvents.length > 0 && !selectedEvent) {
      setSelectedEvent(allEvents[0]);
    }
  }, [allEvents, selectedEvent]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Você precisa fazer login para acessar esta página.",
        });
        navigate("/login");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (!selectedEvent) return null;

  const getBestOddByOutcome = (outcome: 'home' | 'draw' | 'away') => {
    if (outcome === 'draw' && !selectedEvent.odds[0].draw) return 0;
    
    return Math.max(...selectedEvent.odds.map(o => {
      if (outcome === 'home') return o.home;
      if (outcome === 'away') return o.away;
      return o.draw || 0;
    }));
  };

  const bestHome = getBestOddByOutcome('home');
  const bestAway = getBestOddByOutcome('away');
  const bestDraw = selectedEvent.odds[0].draw ? getBestOddByOutcome('draw') : null;

  const getBookmakerUrl = (bookmakerName: string) => {
    const overrides: Record<string, string> = {
      'Bet365': 'https://www.bet365.bet.br/#/HO/',
      'Pinnacle': 'https://www.pinnacle.com/pt/',
      'Stake': 'https://stake.com/pt/sports',
      '1xBet': 'https://1xbet.com/pt/',
    };
    if (overrides[bookmakerName]) return overrides[bookmakerName];
    const bookmaker = bookmakers.find(b => b.name === bookmakerName);
    return bookmaker?.url || "";
  };
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Data Status Alert */}
        {hasData === false && !isInitializing && (
          <Alert className="mb-6 border-primary/50 bg-primary/5">
            <AlertDescription className="flex items-center justify-between">
              <span className="text-foreground">
                Nenhum dado encontrado. Clique em "Atualizar Dados" para carregar os eventos.
              </span>
              <Button 
                onClick={refetchData}
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

        <div className="mb-8 animate-fade-in">
          <Badge className="mb-3 bg-gradient-primary text-primary-foreground border-0">
            {selectedEvent.league}
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            {selectedEvent.homeTeam} <span className="text-muted-foreground">vs</span> {selectedEvent.awayTeam}
          </h1>
          <div className="flex gap-4 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(selectedEvent.date).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{selectedEvent.time}</span>
            </div>
          </div>
        </div>

        {/* Best Odds Summary */}
        <Card className="p-6 mb-8 bg-gradient-card border-primary/30 animate-scale-in">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Melhores Odds</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{selectedEvent.homeTeam}</p>
              <p className="text-3xl font-bold text-primary">{bestHome.toFixed(2)}</p>
            </div>
            {bestDraw && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Empate</p>
                <p className="text-3xl font-bold text-primary">{bestDraw.toFixed(2)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">{selectedEvent.awayTeam}</p>
              <p className="text-3xl font-bold text-primary">{bestAway.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Detailed Comparison Table */}
        <Card className="p-6 bg-gradient-card border-border animate-fade-in">
          <h2 className="text-xl font-bold mb-6">Comparação Detalhada</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">
                    Casa de Apostas
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {selectedEvent.homeTeam}
                  </th>
                  {selectedEvent.odds[0].draw && (
                    <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                      Empate
                    </th>
                  )}
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                    {selectedEvent.awayTeam}
                  </th>
                  <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedEvent.odds.map((odd, index) => (
                  <tr 
                    key={index}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium">{odd.bookmaker}</td>
                    <td className="text-center py-4 px-4">
                      <span className={`text-lg font-bold ${odd.home === bestHome ? 'text-secondary' : ''}`}>
                        {odd.home.toFixed(2)}
                      </span>
                    </td>
                    {odd.draw && (
                      <td className="text-center py-4 px-4">
                        <span className={`text-lg font-bold ${odd.draw === bestDraw ? 'text-secondary' : ''}`}>
                          {odd.draw.toFixed(2)}
                        </span>
                      </td>
                    )}
                    <td className="text-center py-4 px-4">
                      <span className={`text-lg font-bold ${odd.away === bestAway ? 'text-secondary' : ''}`}>
                        {odd.away.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      {(odd.url || getBookmakerUrl(odd.bookmaker)) ? (
                        <Button
                          size="sm"
                          className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0"
                          asChild
                        >
                          <a href={odd.url || getBookmakerUrl(odd.bookmaker)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Apostar
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">Link indisponível</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Event Selection */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Outros Eventos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allEvents.filter(e => e.id !== selectedEvent.id).slice(0, 3).map((event) => (
              <Card
                key={event.id}
                className="p-4 bg-gradient-card hover:bg-muted/20 cursor-pointer transition-all border-border hover:border-primary/50"
                onClick={() => navigate(`/evento/${event.id}`)}
              >
                <p className="text-xs text-muted-foreground mb-1">{event.league}</p>
                <p className="font-semibold text-sm">
                  {event.homeTeam} <span className="text-muted-foreground">vs</span> {event.awayTeam}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
