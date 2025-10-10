import { Card } from "@/components/ui/card";
import { Event } from "@/types/odds";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OddsCardProps {
  event: Event;
  onClick?: () => void;
  hasArbitrage?: boolean;
}

const OddsCard = ({ event, onClick, hasArbitrage }: OddsCardProps) => {
  const getBestOdds = () => {
    const bestHome = Math.max(...event.odds.map(o => o.home));
    const bestAway = Math.max(...event.odds.map(o => o.away));
    const bestDraw = event.odds[0].draw 
      ? Math.max(...event.odds.map(o => o.draw || 0))
      : null;

    return { bestHome, bestAway, bestDraw };
  };

  const { bestHome, bestAway, bestDraw } = getBestOdds();

  return (
    <Card
      className="p-6 bg-gradient-card hover:bg-gradient-to-br hover:from-card hover:to-muted/20 transition-all duration-300 cursor-pointer border-border hover:border-primary/50 group animate-fade-in"
      onClick={onClick}
    >
      {hasArbitrage && (
        <Badge className="mb-3 bg-gradient-arbitrage text-accent-foreground border-0">
          🎯 Oportunidade de Arbitragem
        </Badge>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{event.league}</p>
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {event.homeTeam} <span className="text-muted-foreground">vs</span> {event.awayTeam}
          </h3>
        </div>
      </div>

      <div className="flex gap-2 items-center text-sm text-muted-foreground mb-4">
        <Calendar className="h-4 w-4" />
        <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
        <Clock className="h-4 w-4 ml-2" />
        <span>{event.time}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Casa</p>
          <p className="text-xl font-bold text-primary">{bestHome.toFixed(2)}</p>
        </div>
        {bestDraw && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Empate</p>
            <p className="text-xl font-bold text-primary">{bestDraw.toFixed(2)}</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Fora</p>
          <p className="text-xl font-bold text-primary">{bestAway.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {event.odds.length} casas de apostas
        </p>
      </div>
    </Card>
  );
};

export default OddsCard;
