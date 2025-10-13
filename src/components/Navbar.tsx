import { Link, useLocation } from "react-router-dom";
import { TrendingUp, User, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";

const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { path: "/", label: "Início" },
    { path: "/live-odds", label: "Odds ao Vivo" },
    { path: "/compare", label: "Comparar" },
    { path: "/arbitrage", label: "Arbitragem" },
    { path: "/bookmakers", label: "Casas" },
  ];

  return (
    <nav className="bg-card/50 backdrop-blur-lg border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-primary p-2 rounded-lg group-hover:animate-glow transition-all">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Odds Analyzer
            </span>
          </Link>

          <div className="flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.path
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
                {location.pathname === link.path && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary" />
                )}
              </Link>
            ))}

            <div className="ml-2 pl-2 border-l border-border">
              {user ? (
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">Perfil</span>
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90 text-primary-foreground border-0 gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="hidden md:inline">Entrar</span>
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
