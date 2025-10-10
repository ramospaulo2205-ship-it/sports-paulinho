import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { bookmakers } from "@/data/mockData";
import { Building2, MapPin, Star } from "lucide-react";

const Bookmakers = () => {
  const brazilianBookmakers = bookmakers.filter(b => b.country === "BR");
  const internationalBookmakers = bookmakers.filter(b => b.country !== "BR");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-primary px-4 py-2 rounded-full mb-4">
            <Building2 className="h-5 w-5 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">
              {bookmakers.length} Casas de Apostas
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Casas de Apostas</h1>
          <p className="text-muted-foreground text-lg">
            Compare as melhores casas de apostas disponíveis no mercado brasileiro e internacional.
          </p>
        </div>

        {/* Brazilian Bookmakers */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">🇧🇷 Casas Brasileiras</h2>
            <Badge className="bg-secondary text-secondary-foreground">
              {brazilianBookmakers.length} casas
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {brazilianBookmakers.map((bookmaker, index) => (
              <Card
                key={bookmaker.id}
                className="p-6 bg-gradient-card hover:bg-gradient-to-br hover:from-card hover:to-secondary/10 transition-all duration-300 border-border hover:border-secondary/50 group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-primary p-3 rounded-lg group-hover:animate-glow transition-all">
                    <Building2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <Badge className="bg-secondary/20 text-secondary border-0">
                    <Star className="h-3 w-3 mr-1 fill-secondary" />
                    BR
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {bookmaker.name}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Brasil</span>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">Odds Competitivas</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* International Bookmakers */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">🌍 Casas Internacionais</h2>
            <Badge className="bg-primary/20 text-primary border-0">
              {internationalBookmakers.length} casas
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {internationalBookmakers.map((bookmaker, index) => (
              <Card
                key={bookmaker.id}
                className="p-6 bg-gradient-card hover:bg-gradient-to-br hover:from-card hover:to-primary/10 transition-all duration-300 border-border hover:border-primary/50 group animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-gradient-primary p-3 rounded-lg group-hover:animate-glow transition-all">
                    <Building2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <Badge className="bg-primary/20 text-primary border-0">
                    {bookmaker.country === "UK" ? "🇬🇧" : "🌐"}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  {bookmaker.name}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{bookmaker.country}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">Internacional</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <Card className="mt-12 p-6 bg-muted/30 border-border">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Sobre as Casas de Apostas
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="mb-2">
                <strong className="text-foreground">Casas Brasileiras:</strong> Especializadas no mercado brasileiro, 
                com suporte em português e métodos de pagamento locais como PIX.
              </p>
            </div>
            <div>
              <p>
                <strong className="text-foreground">Casas Internacionais:</strong> Oferecem ampla cobertura de eventos 
                globais e odds competitivas em mercados internacionais.
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-primary/10 rounded-lg">
            <p className="text-xs text-muted-foreground">
              ⚠️ <strong>Aviso:</strong> Este sistema compara odds para fins informativos. 
              Certifique-se de que as casas de apostas estão licenciadas e regulamentadas em sua região.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Bookmakers;
