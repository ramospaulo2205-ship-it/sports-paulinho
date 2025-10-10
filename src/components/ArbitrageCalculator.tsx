import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

const ArbitrageCalculator = () => {
  const [stake, setStake] = useState<string>("1000");
  const [odd1, setOdd1] = useState<string>("2.10");
  const [odd2, setOdd2] = useState<string>("3.60");

  const calculateArbitrage = () => {
    const totalStake = parseFloat(stake) || 0;
    const o1 = parseFloat(odd1) || 0;
    const o2 = parseFloat(odd2) || 0;

    if (o1 <= 0 || o2 <= 0 || totalStake <= 0) {
      return { profit: 0, stake1: 0, stake2: 0, hasArbitrage: false };
    }

    const inverseSum = (1 / o1) + (1 / o2);
    
    if (inverseSum >= 1) {
      return { profit: 0, stake1: 0, stake2: 0, hasArbitrage: false };
    }

    const stake1 = totalStake / (1 + (o1 / o2));
    const stake2 = totalStake - stake1;
    const return1 = stake1 * o1;
    const profit = return1 - totalStake;
    const profitPercentage = (profit / totalStake) * 100;

    return {
      profit: profitPercentage,
      stake1,
      stake2,
      hasArbitrage: true,
      totalReturn: return1
    };
  };

  const result = calculateArbitrage();

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
            onChange={(e) => setStake(e.target.value)}
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
              <span className="font-bold text-accent-foreground">R$ {result.stake1.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-accent-foreground/80">Aposta 2:</span>
              <span className="font-bold text-accent-foreground">R$ {result.stake2.toFixed(2)}</span>
            </div>
            <div className="border-t border-accent-foreground/20 pt-2 mt-2">
              <div className="flex justify-between text-base">
                <span className="text-accent-foreground/80">Lucro:</span>
                <span className="font-bold text-accent-foreground">
                  R$ {(result.totalReturn! - parseFloat(stake)).toFixed(2)} ({result.profit.toFixed(2)}%)
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
