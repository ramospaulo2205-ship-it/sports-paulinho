import Navbar from "@/components/Navbar";
import ArbitrageCalculator from "@/components/ArbitrageCalculator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockEvents, calculateArbitrage } from "@/data/mockData";
import { TrendingUp, Calculator } from "lucide-react";

const Arbitrage = () => {
  const arbitrageOpportunities = mockEvents
    .map((event) => {
      const allOdds = event.odds.map(o => ({
        home: o.home,
        draw: o.draw,
        away: o.away
      }));
      const profit = calculateArbitrage(allOdds);
      
      if (profit) {
        const bestHome = Math.max(...event.odds.map(o => o.home));
        const bestAway = Math.max(...event.odds.map(o => o.away));
        const bestDraw = event.odds[0].draw 
          ? Math.max(...event.odds.map(o => o.draw || 0))
          : null;

        const homeBookmaker = event.odds.find(o => o.home === bestHome)?.bookmaker || '';
        const awayBookmaker = event.odds.find(o => o.away === bestAway)?.bookmaker || '';
        const drawBookmaker = bestDraw 
          ? event.odds.find(o => o.draw === bestDraw)?.bookmaker || ''
          : null;

        return {
          event,
          profit,
          bestHome,
          bestAway,
          bestDraw,
          homeBookmaker,
          awayBookmaker,
          drawBookmaker
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.profit || 0) - (a?.profit || 0));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-arbitrage px-4 py-2 rounded-full mb-4">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">
              Oportunidades de Lucro Garantido
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Análise de Arbitragem</h1>
          <p className="text-muted-foreground text-lg">
            Encontre oportunidades de arbitragem esportiva onde você pode garantir lucro apostando em todos os resultados possíveis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calculator */}
          <div className="lg:col-span-1">
            <ArbitrageCalculator />
          </div>

          {/* Opportunities List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Oportunidades Encontradas</h2>
              <p className="text-muted-foreground">
                {arbitrageOpportunities.length} oportunidade(s) de arbitragem disponível(is)
              </p>
            </div>

            <div className="space-y-4">
              {arbitrageOpportunities.map((opp, index) => {
                if (!opp) return null;
                
                return (
                  <Card 
                    key={opp.event.id}
                    className="p-6 bg-gradient-card border-secondary/30 hover:border-secondary/50 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Badge className="mb-2 bg-gradient-primary text-primary-foreground border-0">
                          {opp.event.league}
                        </Badge>
                        <h3 className="text-lg font-bold">
                          {opp.event.homeTeam} <span className="text-muted-foreground">vs</span> {opp.event.awayTeam}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(opp.event.date).toLocaleDateString('pt-BR')} às {opp.event.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="bg-gradient-arbitrage px-3 py-1 rounded-full inline-block">
                          <p className="text-xs text-accent-foreground font-medium">Lucro</p>
                          <p className="text-xl font-bold text-accent-foreground">
                            {opp.profit.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">{opp.event.homeTeam}</p>
                        <p className="text-lg font-bold text-secondary">{opp.bestHome.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{opp.homeBookmaker}</p>
                      </div>
                      
                      {opp.bestDraw && opp.drawBookmaker && (
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Empate</p>
                          <p className="text-lg font-bold text-secondary">{opp.bestDraw.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{opp.drawBookmaker}</p>
                        </div>
                      )}
                      
                      <div className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">{opp.event.awayTeam}</p>
                        <p className="text-lg font-bold text-secondary">{opp.bestAway.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{opp.awayBookmaker}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        💡 Aposte em todos os resultados para garantir {opp.profit.toFixed(2)}% de lucro independente do resultado
                      </p>
                    </div>
                  </Card>
                );
              })}

              {arbitrageOpportunities.length === 0 && (
                <Card className="p-12 bg-gradient-card border-border text-center">
                  <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma oportunidade de arbitragem encontrada no momento.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use a calculadora ao lado para simular cenários de arbitragem.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8 p-6 bg-muted/30 border-border">
          <h3 className="font-bold mb-3">ℹ️ O que é Arbitragem Esportiva?</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Arbitragem esportiva é uma estratégia que aproveita diferenças nas odds oferecidas por diferentes casas de apostas. 
            Ao apostar em todos os resultados possíveis com as melhores odds disponíveis, você pode garantir lucro independentemente 
            do resultado do evento.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Exemplo:</strong> Se a Casa A oferece 2.10 para o Time X vencer e a Casa B oferece 3.60 para o Time Y vencer, 
            e a soma dos inversos dessas odds é menor que 1, existe uma oportunidade de arbitragem.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Arbitrage;
