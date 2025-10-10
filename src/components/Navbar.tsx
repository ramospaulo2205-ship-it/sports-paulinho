import { Link, useLocation } from "react-router-dom";
import { TrendingUp } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const links = [
    { path: "/", label: "Início" },
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

          <div className="flex gap-6">
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
