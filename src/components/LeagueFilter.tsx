import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, Calendar } from "lucide-react";
import { Event } from "@/types/odds";

interface LeagueFilterProps {
  events: Event[];
  selectedLeagues: string[];
  onLeaguesChange: (leagues: string[]) => void;
  selectedDateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

const LeagueFilter = ({
  events,
  selectedLeagues,
  onLeaguesChange,
  selectedDateRange,
  onDateRangeChange,
}: LeagueFilterProps) => {
  const [open, setOpen] = useState(false);

  // Group leagues by sport
  const leaguesBySport = events.reduce((acc, event) => {
    if (!acc[event.sport]) {
      acc[event.sport] = new Set<string>();
    }
    acc[event.sport].add(event.league);
    return acc;
  }, {} as Record<string, Set<string>>);

  const handleToggleLeague = (league: string) => {
    if (selectedLeagues.includes(league)) {
      onLeaguesChange(selectedLeagues.filter((l) => l !== league));
    } else {
      onLeaguesChange([...selectedLeagues, league]);
    }
  };

  const handleToggleSport = (sport: string) => {
    const sportLeagues = Array.from(leaguesBySport[sport]);
    const allSelected = sportLeagues.every((league) =>
      selectedLeagues.includes(league)
    );

    if (allSelected) {
      onLeaguesChange(
        selectedLeagues.filter((l) => !sportLeagues.includes(l))
      );
    } else {
      const newLeagues = [...new Set([...selectedLeagues, ...sportLeagues])];
      onLeaguesChange(newLeagues);
    }
  };

  const handleSelectDateRange = (days: number) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    onDateRangeChange({ start, end });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros
          {selectedLeagues.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedLeagues.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription>
            Filtre por ligas e período de tempo
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-6">
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Hoje", days: 0 },
                  { label: "3 dias", days: 3 },
                  { label: "7 dias", days: 7 },
                  { label: "10 dias", days: 10 },
                ].map((option) => (
                  <Button
                    key={option.days}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectDateRange(option.days)}
                    className="justify-start"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* League Filters by Sport */}
            {Object.entries(leaguesBySport).map(([sport, leagues]) => {
              const sportLeagues = Array.from(leagues);
              const allSelected = sportLeagues.every((league) =>
                selectedLeagues.includes(league)
              );

              return (
                <div key={sport}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{sport}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleSport(sport)}
                    >
                      {allSelected ? "Desmarcar" : "Selecionar"} todas
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {sportLeagues.map((league) => (
                      <div
                        key={league}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleToggleLeague(league)}
                      >
                        <Checkbox
                          id={league}
                          checked={selectedLeagues.includes(league)}
                          onCheckedChange={() => handleToggleLeague(league)}
                        />
                        <label
                          htmlFor={league}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {league}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onLeaguesChange([]);
              onDateRangeChange({
                start: new Date(),
                end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              });
            }}
          >
            Limpar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LeagueFilter;
