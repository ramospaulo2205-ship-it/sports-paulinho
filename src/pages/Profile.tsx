import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut, History, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [arbitrageHistory, setArbitrageHistory] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (profile) {
      setFullName(profile.full_name || "");
    }

    // Get arbitrage history
    const { data: history } = await supabase
      .from("arbitrage_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    
    if (history) {
      setArbitrageHistory(history);
    }

    // Get favorites
    const { data: favs } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    
    if (favs) {
      setFavorites(favs);
    }

    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar perfil",
        description: error.message,
      });
    } else {
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-3 rounded-lg">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Minha Conta</h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile">Perfil</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="p-6 bg-gradient-card border-border animate-scale-in">
                <h2 className="text-xl font-bold mb-4">Informações do Perfil</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome"
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleUpdateProfile}
                    className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0"
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="p-6 bg-gradient-card border-border animate-scale-in">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Histórico de Arbitragem</h2>
                </div>

                {arbitrageHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum histórico de arbitragem ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {arbitrageHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">Evento: {item.event_id}</p>
                            <p className="text-sm text-muted-foreground">
                              Lucro: {item.profit_percentage.toFixed(2)}%
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Valor: R$ {item.total_stake.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="p-6 bg-gradient-card border-border animate-scale-in">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Favoritos</h2>
                </div>

                {favorites.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum favorito salvo ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="p-4 bg-muted/20 rounded-lg border border-border"
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">Evento: {fav.event_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(fav.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
