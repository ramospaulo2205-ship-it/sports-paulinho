import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { computeStakes } from "@/lib/arbitrage";

interface Props {
  stake?: string;
  onStakeChange?: (value: string) => void;
}

const ArbitrageCalculator = ({ stake: stakeProp, onStakeChange }: Props = {}) => {
  const [localStake, setLocalStake] = useState<string>(stakeProp ?? "1000");
  const stake = stakeProp ?? localStake;
  const [odd1, setOdd1] = useState<string>("2.10");
  const [odd2, setOdd2] = useState<string>("3.60");

  const handleStakeChange = (value: string) => {
    if (onStakeChange) {
      onStakeChange(value);
    } else {
      setLocalStake(value);
    }
  };

  const result = computeStakes(parseFloat(stake) || 0, {
    home: parseFloat(odd1) || 0,
    away: parseFloat(odd2) || 0,
  });

  return (
    <Card className="p-6 bg-gradient-card border-border">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-gradient-arbitrage p-2 rounded-lg">
          <Calculator className="h-5 w-5 text-accent-foreground" />
        </div>
        <h3 className="text-xl font-bold">Calculadora de Arbitragem</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="stake">Valor Total da Aposta (R$)</Label>
          <Input
            id="stake"
            type="number"
            value={stake}
            onChange={(e) => handleStakeChange(e.target.value)}
            className="mt-1"
            placeholder="1000"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="odd1">Odd 1</Label>
            <Input
              id="odd1"
              type="number"
              step="0.01"
              value={odd1}
              onChange={(e) => setOdd1(e.target.value)}
              className="mt-1"
              placeholder="2.10"
            />
          </div>
          <div>
            <Label htmlFor="odd2">Odd 2</Label>
            <Input
              id="odd2"
              type="number"
              step="0.01"
              value={odd2}
              onChange={(e) => setOdd2(e.target.value)}
              className="mt-1"
              placeholder="3.60"
            />
          </div>
        </div>
      </div>

      {result.hasArbitrage ? (
        <div className="mt-6 p-4 bg-gradient-arbitrage rounded-lg animate-scale-in">
          <p className="text-sm font-medium text-accent-foreground mb-3">✅ Arbitragem Possível!</p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-accent-foreground/80">Aposta 1:</span>
              <span className="font-bold text-accent-foreground">R$ {result.stakes.home.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-accent-foreground/80">Aposta 2:</span>
              <span className="font-bold text-accent-foreground">R$ {result.stakes.away.toFixed(2)}</span>
            </div>
            <div className="border-t border-accent-foreground/20 pt-2 mt-2">
              <div className="flex justify-between text-base">
                <span className="text-accent-foreground/80">Lucro:</span>
                <span className="font-bold text-accent-foreground">
                  R$ {result.profit.toFixed(2)} ({result.profitPct.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            ❌ Sem oportunidade de arbitragem com essas odds
          </p>
        </div>
      )}
    </Card>
  );
};

export default ArbitrageCalculator;
