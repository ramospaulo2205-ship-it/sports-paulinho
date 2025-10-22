import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Event } from "@/types/odds";
import { Clock, Star } from "lucide-react";
import OddVariation from "./OddVariation";

interface OddsCardProps {
  event: Event;
  isFavorite?: boolean;
  onToggleFavorite?: (eventId: string) => void;
  onClick?: () => void;
  hasArbitrage?: boolean;
}

const OddsCard = ({ event, isFavorite = false, onToggleFavorite, onClick, hasArbitrage }: OddsCardProps) => {
  return (
    <Card 
      className="p-4 bg-gradient-card border-border hover:shadow-lg transition-all animate-fade-in cursor-pointer"
      onClick={onClick}
    >
      {hasArbitrage && (
        <Badge className="mb-3 bg-gradient-arbitrage text-accent-foreground border-0">
          🎯 Oportunidade de Arbitragem
        </Badge>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {event.sport}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {event.league}
            </Badge>
          </div>
          
          <h3 className="text-lg font-bold mb-1">
            {event.homeTeam} <span className="text-muted-foreground">vs</span> {event.awayTeam}
          </h3>
          
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{event.date} - {event.time}</span>
          </div>
        </div>
        
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(event.id);
            }}
            className="h-8 w-8"
          >
            <Star 
              className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : ''}`} 
            />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {event.odds.slice(0, 3).map((odd, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors cursor-pointer">
              <p className="text-xs text-muted-foreground mb-1">{odd.bookmaker}</p>
              <div className="flex items-center justify-center gap-1">
                <p className="font-bold text-sm">{odd.home.toFixed(2)}</p>
                <OddVariation 
                  current={odd.home} 
                  previous={odd.previous?.home}
                  timestamp={odd.timestamp}
                />
              </div>
            </div>
            
            {odd.draw && (
              <div className="text-center p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors cursor-pointer">
                <p className="text-xs text-muted-foreground mb-1">Empate</p>
                <div className="flex items-center justify-center gap-1">
                  <p className="font-bold text-sm">{odd.draw.toFixed(2)}</p>
                  <OddVariation 
                    current={odd.draw} 
                    previous={odd.previous?.draw}
                    timestamp={odd.timestamp}
                  />
                </div>
              </div>
            )}
            
            <div className="text-center p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors cursor-pointer">
              <p className="text-xs text-muted-foreground mb-1">{event.awayTeam}</p>
              <div className="flex items-center justify-center gap-1">
                <p className="font-bold text-sm">{odd.away.toFixed(2)}</p>
                <OddVariation 
                  current={odd.away} 
                  previous={odd.previous?.away}
                  timestamp={odd.timestamp}
                />
              </div>
            </div>
          </div>
        ))}
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
