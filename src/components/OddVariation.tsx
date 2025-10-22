import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OddVariationProps {
  current: number;
  previous?: number;
  timestamp?: string;
  className?: string;
}

const OddVariation = ({ current, previous, timestamp, className = "" }: OddVariationProps) => {
  if (!previous || current === previous) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${className}`}>
        <Minus className="h-3 w-3" />
      </div>
    );
  }

  const isIncrease = current > previous;
  const diff = Math.abs(current - previous).toFixed(2);
  const percentChange = (((current - previous) / previous) * 100).toFixed(1);
  
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

  const variation = (
    <div className={`flex items-center gap-1 ${isIncrease ? 'text-green-500' : 'text-red-500'} ${className} transition-all duration-300 animate-fade-in`}>
      {isIncrease ? (
        <TrendingUp className="h-3 w-3 animate-pulse" />
      ) : (
        <TrendingDown className="h-3 w-3 animate-pulse" />
      )}
      <span className="text-xs font-medium">{diff}</span>
    </div>
  );

  if (!timestamp) return variation;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {variation}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Variação: {isIncrease ? '+' : ''}{percentChange}%
          </p>
          {formattedTime && (
            <p className="text-xs text-muted-foreground">
              Atualizado: {formattedTime}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default OddVariation;
