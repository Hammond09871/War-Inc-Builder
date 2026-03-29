import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Swords, Heart, Wand2, Zap, Crosshair, Lock, ExternalLink } from "lucide-react";
import { RARITY_COLORS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

const ROWS = 7;
const COLS = 7;
const ROW_LABELS = ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7"];

function isCellLocked(row: number, col: number): boolean {
  if (row === 6) return col < 2 || col > 4;
  return false;
}

const classIcons: Record<string, any> = {
  Warrior: Swords,
  Marksman: Crosshair,
  Mage: Wand2,
  Support: Heart,
  Tank: Shield,
  Assassin: Zap,
};

export default function SharedLineup() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: [`/api/shared/${code}`],
    enabled: !!code,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F1118" }}>
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: "#D4A843", borderTopColor: "transparent" }} />
          <p className="text-sm text-muted-foreground">Loading shared lineup...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0F1118" }}>
        <Card className="border-border/50 max-w-sm" style={{ background: "#161924" }}>
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-lg font-bold text-destructive">Lineup Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The share code <span className="font-mono text-foreground">{code}</span> is invalid or has been deleted.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.hash = "#/auth"}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lineup = data;
  let grid: any[][] = [];
  try {
    grid = JSON.parse(lineup.heroSelections);
  } catch {
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  // Pad grid to 7x7
  while (grid.length < ROWS) grid.push(Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++) {
    while ((grid[r]?.length || 0) < COLS) {
      if (!grid[r]) grid[r] = [];
      grid[r].push(null);
    }
  }

  const placedHeroes = grid.flat().filter(Boolean);
  const totalElixir = placedHeroes.reduce((s: number, h: any) => s + (h?.elixir || 0), 0);

  // Build hero lookup from populated heroes array
  const heroMap: Record<number, any> = {};
  if (lineup.heroes) {
    for (const h of lineup.heroes) {
      heroMap[h.id] = h;
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0F1118" }}>
      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-lg font-bold" style={{ color: "#D4A843" }}>War Inc Rising</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Shared Lineup</p>
        </div>

        {/* Lineup Info */}
        <Card className="border-border/50" style={{ background: "#161924" }}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">{lineup.name}</h2>
              <Badge variant="outline" className="text-[10px] font-mono">{lineup.shareCode}</Badge>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>{lineup.mode}</span>
              {lineup.formation && <span>· {lineup.formation}</span>}
              <span>· {placedHeroes.length} heroes</span>
              <span>· {totalElixir} elixir</span>
            </div>
          </CardContent>
        </Card>

        {/* Grid */}
        <div className="battlefield-grid rounded-lg p-4">
          <span className="text-[10px] text-primary/60 uppercase tracking-wider font-semibold mb-3 block">Battlefield</span>
          <div className="space-y-1.5">
            {grid.map((row: any[], rowIdx: number) => (
              <div key={rowIdx} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{ROW_LABELS[rowIdx]}</span>
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {row.map((cell: any, colIdx: number) => {
                    const locked = isCellLocked(rowIdx, colIdx);
                    return (
                      <div
                        key={colIdx}
                        className={`grid-cell aspect-square rounded-md flex flex-col items-center justify-center p-0.5 min-h-[44px] ${
                          cell ? "occupied" : ""
                        } ${locked ? "opacity-30" : ""}`}
                      >
                        {locked ? (
                          <Lock className="w-3 h-3 text-muted-foreground/30" />
                        ) : cell ? (
                          <>
                            <span className="text-[8px] font-semibold truncate w-full text-center leading-tight"
                              style={{ color: RARITY_COLORS[cell.rarity] || "#95A5A6" }}>
                              {cell.heroName?.split(" ").map((w: string) => w[0]).join("")}
                            </span>
                            <span className="text-[7px] text-muted-foreground truncate w-full text-center">
                              {(cell.heroName || "").length > 7 ? cell.heroName.substring(0, 7) + "…" : cell.heroName}
                            </span>
                            <span className="text-[7px] text-primary/70">L{cell.level}</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/20">·</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero List */}
        {placedHeroes.length > 0 && (
          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Heroes in Lineup</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {placedHeroes.map((h: any, i: number) => {
                  const IconComp = classIcons[h.heroClass] || Swords;
                  return (
                    <div key={i} className="flex items-center gap-1.5 p-1.5 rounded border border-border/30" style={{ background: "#1E2233" }}>
                      <IconComp className="w-3 h-3 shrink-0" style={{ color: RARITY_COLORS[h.rarity] || "#95A5A6" }} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium truncate" style={{ color: RARITY_COLORS[h.rarity] || "#95A5A6" }}>{h.heroName}</p>
                        <p className="text-[8px] text-muted-foreground">L{h.level} · {h.heroClass} · {h.elixir}⚡</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3">
          {user ? (
            <Button size="sm" className="text-xs gap-1.5" onClick={() => window.location.hash = "#/builder"}>
              <ExternalLink className="w-3.5 h-3.5" /> Open in Builder
            </Button>
          ) : (
            <Button size="sm" className="text-xs gap-1.5" onClick={() => window.location.hash = "#/auth"}>
              Sign in to Import
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-border/20">
          <p className="text-[10px] text-muted-foreground">© 2026 War Inc Rising Lineup Builder</p>
        </div>
      </div>
    </div>
  );
}
