import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface OddVariationProps {
  current: number;
  previous?: number;
  className?: string;
}

const OddVariation = ({ current, previous, className = "" }: OddVariationProps) => {
  if (!previous || current === previous) {
    return (
      <div className={`flex items-center gap-1 text-muted-foreground ${className}`}>
        <Minus className="h-3 w-3" />
      </div>
    );
  }

  const isIncrease = current > previous;
  const diff = Math.abs(current - previous).toFixed(2);

  return (
    <div className={`flex items-center gap-1 ${isIncrease ? 'text-green-500' : 'text-red-500'} ${className}`}>
      {isIncrease ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span className="text-xs font-medium">{diff}</span>
    </div>
  );
};

export default OddVariation;
