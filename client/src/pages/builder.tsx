import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const ELIXIR_OPTIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 50);
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Wand2, X, Zap, Shield, Swords, Heart, Wand2 as Wand2Icon, Info, Trash2, Lock, Crosshair, Copy, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PaywallDialog } from "@/components/PaywallDialog";
import { GAME_MODES, FORMATIONS, FORMATION_INFO, HUNTING_BOSSES, CLAN_HUNT_BOSSES, RARITY_COLORS, getHeroPower, PLAYSTYLES, PLAYSTYLE_INFO, BUILD_TYPES, BUILD_TYPE_INFO } from "@/lib/constants";
import type { Hero, RosterWithHero, Lineup } from "@shared/schema";

type PlacedHero = {
  rosterId: number;
  heroId: number;
  heroName: string;
  level: number;
  placement: string;
  heroClass: string;
  elixir: number;
  rarity: string;
  row: number; // 0-6 (Row 1 through Row 7)
  col: number; // 0-6
};

const ROWS = 7;
const COLS = 7;
const ROW_LABELS = ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7"];

// Row 7 (index 6) is COMPLETELY locked — unlocks at Commander Level 999
function isCellLocked(row: number, col: number): boolean {
  if (row === 6) return true;
  return false;
}

const classIcons: Record<string, any> = {
  Warrior: Swords,
  Marksman: Crosshair,
  Mage: Wand2Icon,
  Support: Heart,
  Tank: Shield,
  Assassin: Zap,
};

function makeEmptyGrid(): (PlacedHero | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

const FREE_LINEUP_LIMIT = 3;

export default function LineupBuilder() {
  const [mode, setMode] = useState("Arena");
  const [formation, setFormation] = useState("Dash");
  const [huntingBoss, setHuntingBoss] = useState<string>("Twin-Dragon");
  const [clanHuntBoss, setClanHuntBoss] = useState<string>("Dragon Knight");
  const [grid, setGrid] = useState<(PlacedHero | null)[][]>(makeEmptyGrid());
  const [selectingCell, setSelectingCell] = useState<{ row: number; col: number } | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [lineupName, setLineupName] = useState("");
  const [formationInfoOpen, setFormationInfoOpen] = useState(false);
  const [elixirLimit, setElixirLimit] = useState(100);
  const [playstyle, setPlaystyle] = useState("Balanced");
  const [buildType, setBuildType] = useState("Mixed");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importCode, setImportCode] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

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
        formation: (mode === "Arena" || mode === "Clan War") ? formation : null,
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
      if (e.message.includes("Free tier limit")) {
        setSaveDialogOpen(false);
        setPaywallOpen(true);
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
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

  const importMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/lineups/import", { shareCode: code.trim().toUpperCase() });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });
      setImportDialogOpen(false);
      setImportCode("");
      toast({ title: "Lineup imported!", description: data.name });
    },
    onError: (e: Error) => {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/optimize", {
        mode,
        formation: (mode === "Arena" || mode === "Clan War") ? formation : undefined,
        huntingBoss: mode === "Hunting" ? huntingBoss : undefined,
        clanHuntBoss: mode === "Clan Hunt" ? clanHuntBoss : undefined,
        elixirBudget: elixirLimit,
        playstyle: playstyle.toLowerCase(),
        buildType: buildType.toLowerCase(),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      const newGrid = makeEmptyGrid();
      // Place by placement: Front→rows 0-1, Mid→rows 2-3, Back→rows 4-5
      const placementRows: Record<string, number[]> = {
        Front: [0, 1],
        Mid: [2, 3],
        Back: [4, 5],
      };
      const colCounters: Record<string, number> = { Front: 0, Mid: 0, Back: 0 };
      const rowCounters: Record<string, number> = { Front: 0, Mid: 0, Back: 0 };

      for (const hero of data.lineup) {
        const pos = hero.placement || "Mid";
        const rows = placementRows[pos] || [2, 3];
        const colIdx = colCounters[pos] % COLS;
        const rowOffset = Math.floor(colCounters[pos] / COLS);
        const rowIdx = rows[Math.min(rowOffset, rows.length - 1)];

        if (rowIdx < ROWS && colIdx < COLS && !isCellLocked(rowIdx, colIdx)) {
          const rosterEntry = roster?.find(r => r.id === hero.rosterId);
          newGrid[rowIdx][colIdx] = {
            rosterId: hero.rosterId,
            heroId: hero.heroId,
            heroName: hero.heroName,
            level: hero.level,
            placement: hero.placement,
            heroClass: hero.class,
            elixir: hero.elixir,
            rarity: rosterEntry?.hero?.rarity || "Common",
            row: rowIdx,
            col: colIdx,
          };
        }
        colCounters[pos]++;
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
  const placedRosterIds = new Set(placedHeroes.map(h => h.rosterId));
  const totalPower = placedHeroes.reduce((s, h) => {
    const rEntry = roster?.find(r => r.id === h.rosterId);
    if (rEntry) return s + getHeroPower(rEntry.hero.stats, rEntry.level);
    return s;
  }, 0);

  // Available heroes (in roster but not placed — by roster ID since duplicates are allowed)
  const availableRoster = roster?.filter(r => !placedRosterIds.has(r.id)) || [];

  const handleCellClick = (row: number, col: number) => {
    if (isCellLocked(row, col)) return;
    const existing = grid[row][col];
    if (existing) {
      const newGrid = grid.map(r => [...r]);
      newGrid[row][col] = null;
      setGrid(newGrid);
      return;
    }
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
      level: rosterEntry.level,
      placement: rosterEntry.hero.placement,
      heroClass: rosterEntry.hero.class,
      elixir: rosterEntry.hero.elixir,
      rarity: rosterEntry.hero.rarity,
      row,
      col,
    };
    setGrid(newGrid);
    setSelectingCell(null);
  };

  const clearGrid = () => setGrid(makeEmptyGrid());

  const loadLineup = (lineup: Lineup) => {
    try {
      const parsed = JSON.parse(lineup.heroSelections);
      // Ensure grid is 7x7, pad if loading old 3-row layout
      const newGrid = makeEmptyGrid();
      for (let r = 0; r < Math.min(parsed.length, ROWS); r++) {
        for (let c = 0; c < Math.min(parsed[r]?.length || 0, COLS); c++) {
          newGrid[r][c] = parsed[r][c];
        }
      }
      setGrid(newGrid);
      setMode(lineup.mode);
      if (lineup.formation) setFormation(lineup.formation);
      toast({ title: `Loaded: ${lineup.name}` });
    } catch {
      toast({ title: "Error loading lineup", variant: "destructive" });
    }
  };

  // Synergy analysis
  const classCount: Record<string, number> = {};
  const attrCount: Record<string, number> = {};
  placedHeroes.forEach(h => {
    classCount[h.heroClass] = (classCount[h.heroClass] || 0) + 1;
  });
  placedHeroes.forEach(h => {
    const rEntry = roster?.find(r => r.id === h.rosterId);
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
            <p className="text-xs text-muted-foreground mt-1">
              Place heroes on the 7×7 battlefield
              {user && !user.isPremium && !user.isAdmin ? (
                <span className="ml-2">
                  · Saves: <span className="font-semibold text-foreground" data-testid="text-save-count">{savedLineups?.length ?? 0}</span>/{FREE_LINEUP_LIMIT + (user.bonusSaves || 0)}
                </span>
              ) : null}
            </p>
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
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setImportDialogOpen(true)}
              data-testid="button-import-lineup"
            >
              <Download className="w-3.5 h-3.5" /> Import
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
        {(mode === "Arena" || mode === "Clan War") && (
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

        {/* Boss Selector (Hunting only) */}
        {mode === "Hunting" && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Boss:</span>
            <div className="flex gap-1.5">
              {Object.keys(HUNTING_BOSSES).map((b) => (
                <Button
                  key={b}
                  variant={huntingBoss === b ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={() => setHuntingBoss(b)}
                  data-testid={`button-boss-${b.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {b}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Boss Selector (Clan Hunt only) */}
        {mode === "Clan Hunt" && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Boss:</span>
            <div className="flex gap-1.5">
              {Object.keys(CLAN_HUNT_BOSSES).map((b) => (
                <Button
                  key={b}
                  variant={clanHuntBoss === b ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7 px-3"
                  onClick={() => setClanHuntBoss(b)}
                  data-testid={`button-clan-hunt-boss-${b.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {b}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Elixir Limit */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Elixir Limit:</span>
          <Select value={String(elixirLimit)} onValueChange={(v) => setElixirLimit(Number(v))}>
            <SelectTrigger className="h-8 w-28 text-xs" style={{ background: "#1E2233" }} data-testid="select-elixir-limit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ELIXIR_OPTIONS.map((v) => (
                <SelectItem key={v} value={String(v)}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Playstyle Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">Playstyle:</span>
          <div className="flex gap-1.5">
            {PLAYSTYLES.map((ps) => (
              <Button
                key={ps}
                variant={playstyle === ps ? "default" : "outline"}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setPlaystyle(ps)}
                data-testid={`button-playstyle-${ps.toLowerCase()}`}
              >
                {ps}
              </Button>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">{PLAYSTYLE_INFO[playstyle]?.description}</span>
        </div>

        {/* Build Type Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">Build Type:</span>
          <div className="flex gap-1.5">
            {BUILD_TYPES.map((bt) => (
              <Button
                key={bt}
                variant={buildType === bt ? "default" : "outline"}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setBuildType(bt)}
                data-testid={`button-buildtype-${bt.toLowerCase()}`}
              >
                {bt}
              </Button>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">{BUILD_TYPE_INFO[buildType]?.description}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
          {/* Battlefield Grid */}
          <div className="space-y-4">
            <div className="battlefield-grid rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-primary/60 uppercase tracking-wider font-semibold">Battlefield</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${totalElixir > elixirLimit ? "text-destructive" : "text-primary"}`} data-testid="text-elixir-count">
                    ⚡ {totalElixir}/{elixirLimit}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {grid.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{ROW_LABELS[rowIdx]}</span>
                    <div className="flex-1 grid grid-cols-7 gap-1">
                      {row.map((cell, colIdx) => {
                        const locked = isCellLocked(rowIdx, colIdx);
                        return (
                          <button
                            key={colIdx}
                            onClick={() => handleCellClick(rowIdx, colIdx)}
                            disabled={locked}
                            className={`grid-cell aspect-square rounded-md flex flex-col items-center justify-center p-0.5 min-h-[44px] ${
                              cell ? "occupied" : ""
                            } ${locked ? "opacity-30 cursor-not-allowed" : ""}`}
                            data-testid={`grid-cell-${rowIdx}-${colIdx}`}
                          >
                            {locked ? (
                              <Lock className="w-3 h-3 text-muted-foreground/30" />
                            ) : cell ? (
                              <>
                                <span className="text-[8px] font-semibold truncate w-full text-center leading-tight"
                                  style={{ color: RARITY_COLORS[cell.rarity] || "#95A5A6" }}>
                                  {cell.heroName.split(" ").map(w => w[0]).join("")}
                                </span>
                                <span className="text-[7px] text-muted-foreground truncate w-full text-center">
                                  {cell.heroName.length > 7 ? cell.heroName.substring(0, 7) + "…" : cell.heroName}
                                </span>
                                <span className="text-[7px] text-primary/70">L{cell.level}</span>
                              </>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/30">+</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Row 7 note */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/20">
                <Lock className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-[9px] text-muted-foreground/50">Row 7 unlocks at Commander Level 999 (only columns 3-5 available)</span>
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
                            {lineup.shareCode && (
                              <span className="ml-1.5 text-primary/70 font-mono">{lineup.shareCode}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {lineup.shareCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(lineup.shareCode!);
                              toast({ title: "Share code copied!", description: lineup.shareCode! });
                            }}
                            data-testid={`button-copy-code-${lineup.id}`}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLineupMutation.mutate(lineup.id);
                          }}
                          data-testid={`button-delete-lineup-${lineup.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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

            {/* Boss Info (Hunting only) */}
            {mode === "Hunting" && (() => {
              const boss = HUNTING_BOSSES[huntingBoss as keyof typeof HUNTING_BOSSES];
              if (!boss) return null;
              return (
                <Card className="border-border/50" style={{ background: "#161924" }}>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="text-xs font-semibold text-primary">{boss.name}</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{boss.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground font-medium">Attribute:</span>
                        <p className="text-foreground">{boss.attribute}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-medium">HP:</span>
                        <p className="text-foreground">{boss.hp}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-green-400 font-medium">Weakness:</span>
                        <p className="text-foreground">{boss.weakness}</p>
                      </div>
                      <div>
                        <span className="text-red-400 font-medium">Resists:</span>
                        <p className="text-foreground">{boss.resistances.join(", ")}</p>
                      </div>
                    </div>
                    <div className="text-[10px] border-t border-border/30 pt-2 mt-1">
                      <span className="text-yellow-400 font-medium">Tips: </span>
                      <span className="text-muted-foreground">{boss.tips}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Boss Info (Clan Hunt only) */}
            {mode === "Clan Hunt" && (() => {
              const boss = CLAN_HUNT_BOSSES[clanHuntBoss as keyof typeof CLAN_HUNT_BOSSES];
              if (!boss) return null;
              return (
                <Card className="border-border/50" style={{ background: "#161924" }}>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="text-xs font-semibold text-primary">{boss.name}</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{boss.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground font-medium">Attribute:</span>
                        <p className="text-foreground">{boss.attribute}</p>
                      </div>
                      <div>
                        <span className="text-green-400 font-medium">Weakness:</span>
                        <p className="text-foreground">{boss.weakness}</p>
                      </div>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-red-400 font-medium">Resists:</span>
                      <span className="text-foreground ml-1">{boss.resistances.join(", ")}</span>
                    </div>
                    <div className="text-[10px] border-t border-border/30 pt-2 mt-1">
                      <span className="text-yellow-400 font-medium">Tips: </span>
                      <span className="text-muted-foreground">{boss.tips}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

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
                  <span className={`text-xs font-semibold ${totalElixir > elixirLimit ? "text-destructive" : ""}`}>
                    {totalElixir}/{elixirLimit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Power</span>
                  <span className="text-xs font-semibold text-primary" data-testid="text-team-power">{totalPower.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Class Balance */}
            <Card className="border-border/50" style={{ background: "#161924" }}>
              <CardContent className="p-3 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Class Balance</h3>
                {Object.entries(classCount).length === 0 ? (
                  <p className="text-[10px] text-muted-foreground">Place heroes to see analysis</p>
                ) : (
                  <div className="space-y-1.5">
                    {[
                      { cls: "Tank", icon: Shield, color: "#3498DB" },
                      { cls: "Warrior", icon: Swords, color: "#E74C3C" },
                      { cls: "Marksman", icon: Crosshair, color: "#F39C12" },
                      { cls: "Mage", icon: Wand2Icon, color: "#9B59B6" },
                      { cls: "Support", icon: Heart, color: "#2ECC71" },
                      { cls: "Assassin", icon: Zap, color: "#E67E22" },
                    ].map(({ cls, icon: Icon, color }) => (
                      classCount[cls] ? (
                        <div key={cls} className="flex items-center gap-2">
                          <Icon className="w-3 h-3" style={{ color }} />
                          <span className="text-[10px] text-muted-foreground flex-1">{cls}</span>
                          <span className="text-[10px] font-semibold">{classCount[cls]}</span>
                        </div>
                      ) : null
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
              Place Hero — {selectingCell ? ROW_LABELS[selectingCell.row] : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
            {rosterLoading ? (
              <Skeleton className="h-32" />
            ) : availableRoster.length > 0 ? (
              availableRoster
                .sort((a, b) => b.level - a.level)
                .map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => placeHero(entry)}
                    className="flex items-center gap-2 p-2 rounded-md border border-border/50 hover:border-primary/20 cursor-pointer transition-all"
                    style={{ background: "rgba(22, 25, 36, 0.8)" }}
                    data-testid={`pick-hero-${entry.id}`}
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
                        {entry.hero.placement} · {entry.hero.class} · L{entry.level} · {entry.hero.elixir}⚡
                      </p>
                    </div>
                  </div>
                ))
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

      {/* Import Lineup Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-sm border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle>Import Shared Lineup</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Enter share code (e.g. WIR-ABC123)"
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="h-9 text-sm font-mono"
              style={{ background: "#1E2233" }}
              data-testid="input-import-code"
            />
            <p className="text-[10px] text-muted-foreground">
              Paste a share code from another player to import their lineup into your saved lineups.
            </p>
            <Button
              className="w-full"
              size="sm"
              onClick={() => importMutation.mutate(importCode)}
              disabled={importMutation.isPending || !importCode.trim()}
              data-testid="button-confirm-import"
            >
              {importMutation.isPending ? "Importing..." : "Import Lineup"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} trigger="save" />
    </AppLayout>
  );
}
