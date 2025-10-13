import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Star, ExternalLink, Share2 } from "lucide-react";
import { useOddsPolling } from "@/hooks/useOddsPolling";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import OddVariation from "@/components/OddVariation";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { mockEvents } from "@/data/mockData";

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const { events, loading } = useOddsPolling([
    'soccer_brazil_campeonato',
    'basketball_nba',
    'tennis_atp_singles',
    'esports_lol_worlds',
    'mma_mixed_martial_arts',
  ]);
  const { isFavorite, toggleFavorite } = useFavorites();

  const eventFromApi = events.find((e) => e.id === eventId);
  const eventFromMock = mockEvents.find((e) => e.id === eventId);
  const event = eventFromApi || eventFromMock;

  console.log("[EventDetail] Resolução de evento", { eventId, foundApi: !!eventFromApi, foundMock: !!eventFromMock });

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

  useEffect(() => {
    if (!loading && !event) {
      toast({
        variant: "destructive",
        title: "Evento não encontrado",
        description: "O evento pode ter sido finalizado ou removido.",
      });
      navigate("/live-odds");
    }
  }, [event, loading, navigate, toast]);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event?.homeTeam} vs ${event?.awayTeam}`,
          text: `Confira as odds para ${event?.homeTeam} vs ${event?.awayTeam}`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Event Info */}
          <Card className="lg:col-span-2 p-6 bg-gradient-card border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">{event.sport}</Badge>
                  <Badge variant="secondary">{event.league}</Badge>
                </div>
                
                <h1 className="text-3xl font-bold mb-2">
                  {event.homeTeam}
                  <span className="text-muted-foreground mx-3">vs</span>
                  {event.awayTeam}
                </h1>
                
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{event.date} - {event.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleFavorite(event.id)}
                >
                  <Star
                    className={`h-4 w-4 ${
                      isFavorite(event.id) ? "fill-yellow-500 text-yellow-500" : ""
                    }`}
                  />
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Odds Table */}
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Todas as Odds</h2>
              
              <div className="space-y-3">
                {event.odds.map((odd, idx) => (
                  <Card key={idx} className="p-4 bg-muted/20 border-border hover:border-primary/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{odd.bookmaker}</h3>
                      {odd.url ? (
                        <Button
                          size="sm"
                          className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 gap-2"
                          asChild
                        >
                          <a
                            href={odd.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Apostar
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Link indisponível
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-background rounded">
                        <p className="text-xs text-muted-foreground mb-1">
                          {event.homeTeam}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-2xl font-bold">{odd.home.toFixed(2)}</p>
                          <OddVariation current={odd.home} previous={odd.previous?.home} />
                        </div>
                      </div>

                      {odd.draw && (
                        <div className="text-center p-3 bg-background rounded">
                          <p className="text-xs text-muted-foreground mb-1">Empate</p>
                          <div className="flex items-center justify-center gap-2">
                            <p className="text-2xl font-bold">{odd.draw.toFixed(2)}</p>
                            <OddVariation current={odd.draw} previous={odd.previous?.draw} />
                          </div>
                        </div>
                      )}

                      <div className="text-center p-3 bg-background rounded">
                        <p className="text-xs text-muted-foreground mb-1">
                          {event.awayTeam}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-2xl font-bold">{odd.away.toFixed(2)}</p>
                          <OddVariation current={odd.away} previous={odd.previous?.away} />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>

          {/* Best Odds Summary */}
          <Card className="p-6 bg-gradient-card border-border h-fit sticky top-24">
            <h2 className="text-xl font-bold mb-4">Melhores Odds</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{event.homeTeam}</p>
                <p className="text-3xl font-bold text-primary">
                  {Math.max(...event.odds.map((o) => o.home)).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {event.odds.find((o) => o.home === Math.max(...event.odds.map((od) => od.home)))?.bookmaker}
                </p>
              </div>

              {event.odds[0].draw && (
                <div className="p-4 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Empate</p>
                  <p className="text-3xl font-bold text-primary">
                    {Math.max(...event.odds.map((o) => o.draw || 0)).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.odds.find((o) => o.draw === Math.max(...event.odds.map((od) => od.draw || 0)))?.bookmaker}
                  </p>
                </div>
              )}

              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">{event.awayTeam}</p>
                <p className="text-3xl font-bold text-primary">
                  {Math.max(...event.odds.map((o) => o.away)).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {event.odds.find((o) => o.away === Math.max(...event.odds.map((od) => od.away)))?.bookmaker}
                </p>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-gradient-primary hover:opacity-90 text-primary-foreground border-0"
              asChild
            >
              <Link to="/arbitrage">Ver oportunidades de arbitragem</Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
