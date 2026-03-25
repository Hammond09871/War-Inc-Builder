import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Wand2, X, Zap, Shield, Swords, Heart, Info, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GAME_MODES, FORMATIONS, FORMATION_INFO, RARITY_COLORS, RARITY_POWER_MULTIPLIER } from "@/lib/constants";
import type { Hero, RosterWithHero, Lineup } from "@shared/schema";

type PlacedHero = {
  rosterId: number;
  heroId: number;
  heroName: string;
  mergeLevel: number;
  position: string;
  role: string;
  elixir: number;
  rarity: string;
  row: number; // 0=Front,1=Mid,2=Back
  col: number; // 0-6
};

const ROW_LABELS = ["Front", "Mid", "Back"];
const COLS = 7;

export default function LineupBuilder() {
  const [mode, setMode] = useState("Arena");
  const [formation, setFormation] = useState("Dash");
  const [grid, setGrid] = useState<(PlacedHero | null)[][]>([
    Array(COLS).fill(null),
    Array(COLS).fill(null),
    Array(COLS).fill(null),
  ]);
  const [selectingCell, setSelectingCell] = useState<{ row: number; col: number } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [lineupName, setLineupName] = useState("");
  const [formationInfoOpen, setFormationInfoOpen] = useState(false);
  const { toast } = useToast();

  const { data: roster, isLoading: rosterLoading } = useQuery<RosterWithHero[]>({
    queryKey: ["/api/roster"],
  });

  const { data: savedLineups } = useQuery<Lineup[]>({
    queryKey: ["/api/lineups"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const heroSelections = JSON.stringify(grid);
      const res = await apiRequest("POST", "/api/lineups", {
        name: lineupName || `${mode} Lineup`,
        mode,
        formation: mode === "Arena" ? formation : null,
        heroSelections,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });
      setSaveDialogOpen(false);
      setLineupName("");
      toast({ title: "Lineup saved!" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteLineupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/lineups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });
      toast({ title: "Lineup deleted" });
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/optimize", {
        mode,
        formation: mode === "Arena" ? formation : undefined,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      // Place heroes on grid based on optimization result
      const newGrid: (PlacedHero | null)[][] = [
        Array(COLS).fill(null),
        Array(COLS).fill(null),
        Array(COLS).fill(null),
      ];

      const rowMap: Record<string, number> = { Front: 0, Mid: 1, Back: 2 };
      const colCounters = [0, 0, 0];

      for (const hero of data.lineup) {
        const row = rowMap[hero.position] ?? 1;
        const col = colCounters[row];
        if (col < COLS) {
          const rosterEntry = roster?.find(r => r.heroId === hero.heroId);
          newGrid[row][col] = {
            rosterId: hero.rosterId,
            heroId: hero.heroId,
            heroName: hero.heroName,
            mergeLevel: hero.mergeLevel,
            position: hero.position,
            role: hero.role,
            elixir: hero.elixir,
            rarity: rosterEntry?.hero?.rarity || "Common",
            row,
            col,
          };
          colCounters[row]++;
        }
      }

      setGrid(newGrid);
      toast({ title: "Auto-fill complete", description: `${data.lineup.length} heroes placed` });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Calculate placed heroes
  const placedHeroes = grid.flat().filter(Boolean) as PlacedHero[];
  const totalElixir = placedHeroes.reduce((s, h) => s + h.elixir, 0);
  const placedHeroIds = new Set(placedHeroes.map(h => h.heroId));
  const totalPower = placedHeroes.reduce((s, h) => {
    const mult = RARITY_POWER_MULTIPLIER[h.rarity] || 1;
    return s + (h.mergeLevel * mult * 100);
  }, 0);

  // Available heroes (in roster but not placed)
  const availableRoster = roster?.filter(r => !placedHeroIds.has(r.heroId)) || [];

  const handleCellClick = (row: number, col: number) => {
    const existing = grid[row][col];
    if (existing) {
      // Remove hero
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col] = null;
      setGrid(newGrid);
      return;
    }
    // Open hero picker
    setSelectingCell({ row, col });
  };

  const placeHero = (rosterEntry: RosterWithHero) => {
    if (!selectingCell) return;
    const { row, col } = selectingCell;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = {
      rosterId: rosterEntry.id,
      heroId: rosterEntry.heroId,
      heroName: rosterEntry.hero.name,
      mergeLevel: rosterEntry.mergeLevel,
      position: rosterEntry.hero.position,
      role: rosterEntry.hero.role,
      elixir: rosterEntry.hero.elixir,
      rarity: rosterEntry.hero.rarity,
      row,
      col,
    };
    setGrid(newGrid);
    setSelectingCell(null);
  };

  const clearGrid = () => {
    setGrid([
      Array(COLS).fill(null),
      Array(COLS).fill(null),
      Array(COLS).fill(null),
    ]);
  };

  const loadLineup = (lineup: Lineup) => {
    try {
      const parsed = JSON.parse(lineup.heroSelections);
      setGrid(parsed);
      setMode(lineup.mode);
      if (lineup.formation) setFormation(lineup.formation);
      toast({ title: `Loaded: ${lineup.name}` });
    } catch {
      toast({ title: "Error loading lineup", variant: "destructive" });
    }
  };

  // Synergy analysis
  const roleCount: Record<string, number> = {};
  const attrCount: Record<string, number> = {};
  placedHeroes.forEach(h => {
    roleCount[h.role] = (roleCount[h.role] || 0) + 1;
  });
  // Get attribute info from roster
  placedHeroes.forEach(h => {
    const rEntry = roster?.find(r => r.heroId === h.heroId);
    if (rEntry) {
      const attr = rEntry.hero.attribute;
      attrCount[attr] = (attrCount[attr] || 0) + 1;
    }
  });

  const formInfo = FORMATION_INFO[formation];

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold" data-testid="text-page-title">Lineup Builder</h1>
            <p className="text-xs text-muted-foreground mt-1">Drag and place heroes on the battlefield</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={clearGrid} data-testid="button-clear-grid">
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5"
              onClick={() => optimizeMutation.mutate()}
              disabled={optimizeMutation.isPending || !roster?.length}
              data-testid="button-auto-fill"
            >
              <Wand2 className="w-3.5 h-3.5" /> Auto-Fill
            </Button>
            <Button size="sm" className="text-xs gap-1.5" onClick={() => setSaveDialogOpen(true)}
              disabled={placedHeroes.length === 0}
              data-testid="button-save-lineup"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
          </div>
        </div>

        {/* Game Mode Tabs */}
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="h-9" style={{ background: "#1E2233" }}>
            {GAME_MODES.map((m) => (
              <TabsTrigger key={m} value={m} className="text-xs px-3" data-testid={`tab-mode-${m.toLowerCase().replace(/\s/g, "-")}`}>
                {m}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Formation Selector (Arena only) */}
        {mode === "Arena" && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Formation:</span>
            <div className="flex gap-1.5">
              {FORMATIONS.map((f) => (
                <Button
                  key={f}
                  variant={formation === f ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={() => setFormation(f)}
                  data-testid={`button-formation-${f.toLowerCase()}`}
                >
                  {f}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setFormationInfoOpen(true)} data-testid="button-formation-info">
              <Info className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          {/* Battlefield Grid */}
          <div className="space-y-4">
            <div className="battlefield-grid rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-primary/60 uppercase tracking-wider font-semibold">Battlefield</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${totalElixir > 100 ? "text-destructive" : "text-primary"}`} data-testid="text-elixir-count">
                    ⚡ {totalElixir}/100
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {grid.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{ROW_LABELS[rowIdx]}</span>
                    <div className="flex-1 grid grid-cols-7 gap-1.5">
                      {row.map((cell, colIdx) => (
                        <button
                          key={colIdx}
                          onClick={() => handleCellClick(rowIdx, colIdx)}
                          className={`grid-cell aspect-square rounded-md flex flex-col items-center justify-center p-0.5 min-h-[52px] ${cell ? "occupied" : ""}`}
                          data-testid={`grid-cell-${rowIdx}-${colIdx}`}
                        >
                          {cell ? (
                            <>
                              <span className="text-[9px] font-semibold truncate w-full text-center leading-tight"
                                style={{ color: RARITY_COLORS[cell.rarity] || "#95A5A6" }}>
                                {cell.heroName.split(" ").map(w => w[0]).join("")}
                              </span>
                              <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                                {cell.heroName.length > 8 ? cell.heroName.substring(0, 8) + "…" : cell.heroName}
                              </span>
                              <span className="text-[8px] text-primary/70">M{cell.mergeLevel}</span>
                            </>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30">+</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid legend */}
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/20">
                <span className="text-[9px] text-muted-foreground/50">Click cell to place hero · Click occupied cell to remove</span>
              </div>
            </div>

            {/* Saved Lineups */}
            {savedLineups && savedLineups.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Saved Lineups</h3>
                <div className="space-y-1.5">
                  {savedLineups.map((lineup) => (
                    <div
                      key={lineup.id}
                      className="flex items-center justify-between p-2.5 rounded-md border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                      style={{ background: "#161924" }}
                      data-testid={`saved-lineup-${lineup.id}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => loadLineup(lineup)}>
                        <div>
                          <p className="text-xs font-medium truncate">{lineup.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {lineup.mode}{lineup.formation ? ` · ${lineup.formation}` : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLineupMutation.mutate(lineup.id);
                        }}
                        data-testid={`button-delete-lineup-${lineup.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Formation Info */}
            {mode === "Arena" && formInfo && (
              <Card className="border-border/50" style={{ background: "#161924" }}>
                <CardContent className="p-3 space-y-2">
                  <h3 className="text-xs font-semibold text-primary">{formation} Formation</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{formInfo.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-green-400 font-medium">Strong vs:</span>
                      <p className="text-muted-foreground">{formInfo.strongAgainst}</p>
                    </div>
                    <div>
                      <span className="text-red-400 font-medium">Weak vs:</span>
                      <p className="text-muted-foreground">{formInfo.weakAgainst}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Team Summary */}
            <Card className="border-border/50" style={{ background: "#161924" }}>
              <CardContent className="p-3 space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team Summary</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Heroes</span>
                  <span className="text-xs font-semibold" data-testid="text-hero-count">{placedHeroes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Elixir</span>
                  <span className={`text-xs font-semibold ${totalElixir > 100 ? "text-destructive" : ""}`}>
                    {totalElixir}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Power</span>
                  <span className="text-xs font-semibold text-primary" data-testid="text-team-power">{totalPower.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Role Balance */}
            <Card className="border-border/50" style={{ background: "#161924" }}>
              <CardContent className="p-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role Balance</h3>
                {Object.entries(roleCount).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">Place heroes to see analysis</p>
                ) : (
                  <div className="space-y-1.5">
                    {[
                      { role: "Tank", icon: Shield, color: "#3498DB" },
                      { role: "DPS", icon: Swords, color: "#E74C3C" },
                      { role: "Support", icon: Heart, color: "#2ECC71" },
                      { role: "Control", icon: Wand2, color: "#9B59B6" },
                    ].map(({ role, icon: Icon, color }) => (
                      <div key={role} className="flex items-center gap-2">
                        <Icon className="w-3 h-3" style={{ color }} />
                        <span className="text-[10px] text-muted-foreground flex-1">{role}</span>
                        <span className="text-[10px] font-semibold">{roleCount[role] || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Synergy */}
            {Object.entries(attrCount).length > 0 && (
              <Card className="border-border/50" style={{ background: "#161924" }}>
                <CardContent className="p-3 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attribute Synergies</h3>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(attrCount).map(([attr, count]) => (
                      <Badge key={attr} variant="outline" className="text-[10px] h-5">
                        {attr} ×{count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Hero Picker Dialog */}
      <Dialog open={!!selectingCell} onOpenChange={() => setSelectingCell(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle>
              Place Hero — {selectingCell ? ROW_LABELS[selectingCell.row] : ""} Row
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
            {rosterLoading ? (
              <Skeleton className="h-32" />
            ) : availableRoster.length > 0 ? (
              availableRoster
                .filter(r => {
                  if (!selectingCell) return true;
                  // Suggest matching position heroes first but allow all
                  return true;
                })
                .sort((a, b) => {
                  // Sort: matching position first, then by merge level
                  const rowPos = selectingCell ? ROW_LABELS[selectingCell.row] : "";
                  const aMatch = a.hero.position === rowPos ? 1 : 0;
                  const bMatch = b.hero.position === rowPos ? 1 : 0;
                  if (aMatch !== bMatch) return bMatch - aMatch;
                  return b.mergeLevel - a.mergeLevel;
                })
                .map((entry) => {
                  const matchesRow = selectingCell && entry.hero.position === ROW_LABELS[selectingCell.row];
                  return (
                    <div
                      key={entry.id}
                      onClick={() => placeHero(entry)}
                      className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all ${
                        matchesRow
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/50 hover:border-primary/20"
                      }`}
                      style={{ background: matchesRow ? undefined : "rgba(22, 25, 36, 0.8)" }}
                      data-testid={`pick-hero-${entry.heroId}`}
                    >
                      <div className="w-8 h-8 rounded-md flex items-center justify-center border"
                        style={{ borderColor: `${RARITY_COLORS[entry.hero.rarity]}40`, background: `${RARITY_COLORS[entry.hero.rarity]}15` }}>
                        <span className="text-[10px] font-bold" style={{ color: RARITY_COLORS[entry.hero.rarity] }}>
                          {entry.hero.rarity[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{entry.hero.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.hero.position} · {entry.hero.role} · M{entry.mergeLevel} · {entry.hero.elixir}⚡
                        </p>
                      </div>
                      {matchesRow && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">
                          Match
                        </Badge>
                      )}
                    </div>
                  );
                })
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                {roster?.length ? "All roster heroes are placed" : "Add heroes to your roster first"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle>Save Lineup</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Lineup name..."
              value={lineupName}
              onChange={(e) => setLineupName(e.target.value)}
              className="h-9 text-sm"
              style={{ background: "#1E2233" }}
              data-testid="input-lineup-name"
            />
            <p className="text-xs text-muted-foreground">
              {mode}{mode === "Arena" ? ` · ${formation}` : ""} · {placedHeroes.length} heroes · {totalElixir} elixir
            </p>
            <Button
              className="w-full"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-confirm-save"
            >
              {saveMutation.isPending ? "Saving..." : "Save Lineup"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formation Info Dialog */}
      <Dialog open={formationInfoOpen} onOpenChange={setFormationInfoOpen}>
        <DialogContent className="sm:max-w-md border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle>Formations Guide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {FORMATIONS.map((f) => {
              const info = FORMATION_INFO[f];
              return (
                <div key={f} className="rounded-md p-3 border border-border/50" style={{ background: "#1E2233" }}>
                  <h4 className="text-sm font-semibold text-primary mb-1">{f}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{info.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                    <div>
                      <span className="text-green-400 font-medium">Strong vs: </span>
                      <span className="text-muted-foreground">{info.strongAgainst}</span>
                    </div>
                    <div>
                      <span className="text-red-400 font-medium">Weak vs: </span>
                      <span className="text-muted-foreground">{info.weakAgainst}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 italic">{info.tips}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
