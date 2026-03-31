import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Zap, Shield, Swords, Heart, Wand2, Info, Crosshair, Lock, Save, Trash2, Clock, Camera, Search, Eye, X, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { PaywallDialog } from "@/components/PaywallDialog";
import { GAME_MODES, FORMATIONS, HUNTING_BOSSES, CLAN_HUNT_BOSSES, RARITY_COLORS, getHeroPower, PLAYSTYLES, PLAYSTYLE_INFO, BUILD_TYPES, BUILD_TYPE_INFO } from "@/lib/constants";
import type { Hero, RosterWithHero, Lineup } from "@shared/schema";

const classIcons: Record<string, any> = { Warrior: Swords, Marksman: Crosshair, Mage: Wand2, Support: Heart, Tank: Shield, Assassin: Zap };

const FREE_GENERATION_LIMIT = 10;
const FREE_SAVE_LIMIT = 3;

export default function Optimizer() {
  const [mode, setMode] = useState("Arena");
  const [enemyFormation, setEnemyFormation] = useState<string>("none");
  const [huntingBoss, setHuntingBoss] = useState<string>("Twin-Dragon");
  const [clanHuntBoss, setClanHuntBoss] = useState<string>("Dragon Knight");
  const [elixirBudget, setElixirBudget] = useState(100);
  const [playstyle, setPlaystyle] = useState("Balanced");
  const [buildType, setBuildType] = useState("Mixed");
  const [result, setResult] = useState<any>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<string>("optimize");
  const [enemyHeroNames, setEnemyHeroNames] = useState<string[]>([]);
  const [scoutScreenshot, setScoutScreenshot] = useState<string | null>(null);
  const [scoutSearch, setScoutSearch] = useState("");
  const [scoutMode, setScoutMode] = useState<"quick" | "screenshot">("quick");
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: roster, isLoading: rosterLoading } = useQuery<RosterWithHero[]>({
    queryKey: ["/api/roster"],
  });

  const { data: heroes } = useQuery<Hero[]>({
    queryKey: ["/api/heroes"],
  });

  const { data: lineups } = useQuery<Lineup[]>({
    queryKey: ["/api/lineups"],
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const body: any = { mode, elixirBudget, playstyle: playstyle.toLowerCase(), buildType: buildType.toLowerCase() };
      if (mode === "Arena" && enemyFormation !== "none") {
        body.enemyFormation = enemyFormation;
      }
      if (mode === "Arena" && enemyHeroNames.length > 0) {
        body.enemyHeroNames = enemyHeroNames;
      }
      if (mode === "Hunting") {
        body.huntingBoss = huntingBoss;
      }
      if (mode === "Clan Hunt") {
        body.clanHuntBoss = clanHuntBoss;
      }
      const res = await apiRequest("POST", "/api/optimize", body);
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      refreshUser();
    },
    onError: (e: Error) => {
      if (e.message.includes("Free tier limit")) {
        setPaywallTrigger("optimize");
        setPaywallOpen(true);
      } else {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    },
  });

  const saveLineupMutation = useMutation({
    mutationFn: async () => {
      const heroSelections = JSON.stringify(result.gridPlacements || []);
      const res = await apiRequest("POST", "/api/lineups", {
        name: `${result.mode} ${result.formation || playstyle} Lineup`,
        mode: result.mode,
        formation: result.formation || null,
        heroSelections,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Lineup saved!" });
      queryClient.invalidateQueries({ queryKey: ["/api/lineups"] });
      refreshUser();
    },
    onError: (e: Error) => {
      if (e.message.includes("Free tier limit")) {
        setPaywallTrigger("save");
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

  const canSave = () => {
    if (!user) return false;
    if (user.isAdmin || user.isPremium) return true;
    const existing = lineups?.length || 0;
    const limit = FREE_SAVE_LIMIT + (user.bonusSaves || 0);
    return existing < limit;
  };

  const modeDescriptions: Record<string, string> = {
    Arena: "PvP battles where formation and counter-picks matter most",
    Hunting: "Boss encounters (Evil Ivy, Twin-Dragon) prioritizing single-target DPS",
    Adventure: "PvE content needing balanced teams with strong front line",
    "Infinite War": "Endurance mode valuing sustainability and healing",
    "Clan War": "Competitive clan battles requiring balanced, versatile teams",
    "Clan Hunt": "Boss damage mode prioritizing single-target DPS",
  };

  // Recent lineups — last 5, sorted by date descending
  const recentLineups = lineups
    ? [...lineups].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5)
    : [];

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold" data-testid="text-page-title">Lineup Optimizer</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Get AI-powered lineup recommendations based on your roster
            </p>
          </div>
          {user && !user.isPremium && !user.isAdmin ? (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Generations: <span className="font-semibold text-foreground" data-testid="text-gen-count">{user.generationsUsed}</span>/{FREE_GENERATION_LIMIT + (user.bonusGenerations || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">Free tier{user.bonusGenerations ? ` (+${user.bonusGenerations} bonus)` : ""}</p>
            </div>
          ) : null}
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game Mode */}
          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Game Mode</h3>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-9 text-sm" style={{ background: "#1E2233" }} data-testid="select-optimize-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAME_MODES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">{modeDescriptions[mode]}</p>
            </CardContent>
          </Card>

          {/* Enemy Setup (Arena) / Boss Selector (Hunting) / Options (other) */}
          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {mode === "Arena" ? "Enemy Formation" : mode === "Hunting" ? "Hunting Boss" : mode === "Clan Hunt" ? "Clan Hunt Boss" : "Options"}
              </h3>
              {mode === "Arena" ? (
                <>
                  <Select value={enemyFormation} onValueChange={setEnemyFormation}>
                    <SelectTrigger className="h-9 text-sm" style={{ background: "#1E2233" }} data-testid="select-enemy-formation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unknown</SelectItem>
                      {FORMATIONS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    Select the enemy's formation for counter-pick analysis
                  </p>
                </>
              ) : mode === "Hunting" ? (
                <>
                  <Select value={huntingBoss} onValueChange={setHuntingBoss}>
                    <SelectTrigger className="h-9 text-sm" style={{ background: "#1E2233" }} data-testid="select-hunting-boss">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(HUNTING_BOSSES).map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => {
                    const boss = HUNTING_BOSSES[huntingBoss as keyof typeof HUNTING_BOSSES];
                    if (!boss) return null;
                    return (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground">{boss.description}</p>
                        <div className="flex gap-3 text-[10px]">
                          <span><span className="text-green-400 font-medium">Weak to:</span> {boss.weakness}</span>
                          <span><span className="text-red-400 font-medium">Resists:</span> {boss.resistances.join(", ")}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 italic">{boss.tips}</p>
                      </div>
                    );
                  })()}
                </>
              ) : mode === "Clan Hunt" ? (
                <>
                  <Select value={clanHuntBoss} onValueChange={setClanHuntBoss}>
                    <SelectTrigger className="h-9 text-sm" style={{ background: "#1E2233" }} data-testid="select-clan-hunt-boss">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CLAN_HUNT_BOSSES).map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => {
                    const boss = CLAN_HUNT_BOSSES[clanHuntBoss as keyof typeof CLAN_HUNT_BOSSES];
                    if (!boss) return null;
                    return (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground">{boss.description}</p>
                        <div className="flex gap-3 text-[10px]">
                          <span><span className="text-green-400 font-medium">Weak to:</span> {boss.weakness}</span>
                          <span><span className="text-red-400 font-medium">Resists:</span> {boss.resistances.join(", ")}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/70 italic">{boss.tips}</p>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Optimization is based on mode-specific priorities. No additional options needed.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Elixir Budget */}
          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Elixir Budget</h3>
              <Select value={String(elixirBudget)} onValueChange={(v) => setElixirBudget(Number(v))}>
                <SelectTrigger className="h-9 text-sm" style={{ background: "#1E2233" }} data-testid="select-elixir-budget">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => (i + 1) * 50).map((v) => (
                    <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Max elixir cost for the optimized lineup</p>
            </CardContent>
          </Card>
        </div>

        {/* Playstyle Selector */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Playstyle:</span>
          <div className="flex items-center gap-2 flex-wrap">
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
          <p className="text-[10px] text-muted-foreground">{PLAYSTYLE_INFO[playstyle]?.description}</p>
        </div>

        {/* Build Type Selector */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Build Type:</span>
          <div className="flex items-center gap-2 flex-wrap">
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
          <p className="text-[10px] text-muted-foreground">{BUILD_TYPE_INFO[buildType]?.description}</p>
        </div>

        {/* Scout Enemy — Arena Only */}
        {mode === "Arena" && heroes && heroes.length > 0 && (
          <Card className="border-border/50" style={{ background: "#161924" }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Scout Enemy Lineup
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant={scoutMode === "quick" ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] h-6 px-2"
                    onClick={() => setScoutMode("quick")}
                  >
                    <Search className="w-3 h-3 mr-1" /> Quick Select
                  </Button>
                  <Button
                    variant={scoutMode === "screenshot" ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] h-6 px-2"
                    onClick={() => setScoutMode("screenshot")}
                  >
                    <Camera className="w-3 h-3 mr-1" /> Screenshot
                  </Button>
                </div>
              </div>

              {scoutMode === "quick" ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search enemy troops..."
                      value={scoutSearch}
                      onChange={(e) => setScoutSearch(e.target.value)}
                      className="h-8 text-xs pl-8"
                      style={{ background: "#1E2233" }}
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-0.5 rounded border border-border/30 p-1.5" style={{ background: "#1E2233" }}>
                    {heroes
                      .filter(h => !scoutSearch || h.name.toLowerCase().includes(scoutSearch.toLowerCase()))
                      .sort((a, b) => {
                        const aSelected = enemyHeroNames.includes(a.name) ? 0 : 1;
                        const bSelected = enemyHeroNames.includes(b.name) ? 0 : 1;
                        if (aSelected !== bSelected) return aSelected - bSelected;
                        return a.name.localeCompare(b.name);
                      })
                      .map(h => (
                        <label
                          key={h.id}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
                        >
                          <Checkbox
                            checked={enemyHeroNames.includes(h.name)}
                            onCheckedChange={(checked) => {
                              if (checked) setEnemyHeroNames(prev => [...prev, h.name]);
                              else setEnemyHeroNames(prev => prev.filter(n => n !== h.name));
                            }}
                          />
                          <span className="text-[10px]" style={{ color: RARITY_COLORS[h.rarity] }}>{h.name}</span>
                          <span className="text-[9px] text-muted-foreground ml-auto">{h.class}</span>
                        </label>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {!scoutScreenshot ? (
                    <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 p-4 cursor-pointer hover:border-primary/40 transition-colors">
                      <Camera className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload opponent screenshot</span>
                      <span className="text-[9px] text-muted-foreground/60">JPG, PNG — helps you identify enemy troops</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setScoutScreenshot(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <img src={scoutScreenshot} alt="Enemy lineup" className="w-full max-h-40 object-contain rounded-md border border-border/30" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-black/60 hover:bg-black/80 rounded-full"
                          onClick={() => setScoutScreenshot(null)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Check the troops you can identify in the screenshot:</p>
                    </div>
                  )}
                  {scoutScreenshot && (
                    <div className="space-y-1">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Filter troops..."
                          value={scoutSearch}
                          onChange={(e) => setScoutSearch(e.target.value)}
                          className="h-8 text-xs pl-8"
                          style={{ background: "#1E2233" }}
                        />
                      </div>
                      <div className="max-h-32 overflow-y-auto space-y-0.5 rounded border border-border/30 p-1.5" style={{ background: "#1E2233" }}>
                        {heroes
                          .filter(h => !scoutSearch || h.name.toLowerCase().includes(scoutSearch.toLowerCase()))
                          .sort((a, b) => {
                            const aSelected = enemyHeroNames.includes(a.name) ? 0 : 1;
                            const bSelected = enemyHeroNames.includes(b.name) ? 0 : 1;
                            if (aSelected !== bSelected) return aSelected - bSelected;
                            return a.name.localeCompare(b.name);
                          })
                          .map(h => (
                            <label
                              key={h.id}
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
                            >
                              <Checkbox
                                checked={enemyHeroNames.includes(h.name)}
                                onCheckedChange={(checked) => {
                                  if (checked) setEnemyHeroNames(prev => [...prev, h.name]);
                                  else setEnemyHeroNames(prev => prev.filter(n => n !== h.name));
                                }}
                              />
                              <span className="text-[10px]" style={{ color: RARITY_COLORS[h.rarity] }}>{h.name}</span>
                              <span className="text-[9px] text-muted-foreground ml-auto">{h.class}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected enemy badges */}
              {enemyHeroNames.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {enemyHeroNames.length} enemy troop{enemyHeroNames.length > 1 ? "s" : ""} identified
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-5 px-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() => { setEnemyHeroNames([]); setScoutScreenshot(null); }}
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {enemyHeroNames.map(name => {
                      const h = heroes.find(hero => hero.name === name);
                      return (
                        <Badge
                          key={name}
                          variant="outline"
                          className="text-[9px] h-5 px-1.5 gap-1 cursor-pointer hover:bg-destructive/20"
                          style={{ borderColor: `${RARITY_COLORS[h?.rarity || "Common"]}40`, color: RARITY_COLORS[h?.rarity || "Common"] }}
                          onClick={() => setEnemyHeroNames(prev => prev.filter(n => n !== name))}
                        >
                          {name}
                          <X className="w-2.5 h-2.5" />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Optimize Button */}
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => optimizeMutation.mutate()}
            disabled={optimizeMutation.isPending || !roster?.length}
            data-testid="button-optimize"
          >
            <Brain className="w-4 h-4" />
            {optimizeMutation.isPending ? "Optimizing..." : "Optimize Lineup"}
          </Button>
          {!roster?.length && (
            <p className="text-xs text-muted-foreground">Add heroes to your roster first</p>
          )}
        </div>

        {/* Recent Lineups */}
        {recentLineups.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Recent Lineups
            </h3>
            <div className="space-y-1.5">
              {recentLineups.map((lineup) => {
                let troopCount = 0;
                let totalPower = 0;
                try {
                  const grid = JSON.parse(lineup.heroSelections);
                  if (Array.isArray(grid)) {
                    troopCount = grid.length;
                    for (const cell of grid) {
                      if (cell && cell.heroId) {
                        const hero = heroes?.find(h => h.id === cell.heroId);
                        if (hero) totalPower += getHeroPower(hero.stats, cell.level || 1);
                      }
                    }
                  }
                } catch {}
                return (
                  <div key={lineup.id} className="flex items-center gap-3 rounded-md px-3 py-2 border border-border/30" style={{ background: "#161924" }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{lineup.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {lineup.mode}{lineup.formation ? ` · ${lineup.formation}` : ""} · {troopCount} troops · {totalPower.toLocaleString()} power
                      </p>
                    </div>
                    <span className="text-[9px] text-muted-foreground/60 shrink-0">
                      {lineup.createdAt ? new Date(lineup.createdAt).toLocaleDateString() : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteLineupMutation.mutate(lineup.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Result Header */}
            <div className="rounded-lg border border-primary/20 p-4" style={{ background: "rgba(212, 168, 67, 0.05)" }}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-sm font-bold text-primary">Recommended Lineup</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.mode}{result.formation ? ` · ${result.formation} Formation` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary" data-testid="text-result-power">{result.totalPower?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Power</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${result.totalElixir > elixirBudget ? "text-destructive" : ""}`} data-testid="text-result-elixir">
                      {result.totalElixir}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Elixir</p>
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={() => {
                      if (!canSave()) {
                        setPaywallTrigger("save");
                        setPaywallOpen(true);
                      } else {
                        saveLineupMutation.mutate();
                      }
                    }}
                    disabled={saveLineupMutation.isPending}
                    data-testid="button-save-lineup"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saveLineupMutation.isPending ? "Saving..." : "Save Lineup"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Enemy Analysis */}
            {result.enemyAnalysis && (
              <Card className="border-red-500/20" style={{ background: "rgba(220, 60, 60, 0.05)" }}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Eye className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-red-400">Enemy Lineup Analysis</p>
                      <p className="text-xs text-muted-foreground">{result.enemyAnalysis.summary}</p>
                      {result.enemyAnalysis.advice && result.enemyAnalysis.advice.length > 0 && (
                        <ul className="space-y-0.5">
                          {result.enemyAnalysis.advice.map((tip: string, i: number) => (
                            <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Counter-pick advice */}
            {result.counterPickAdvice && (
              <Card className="border-blue-500/20" style={{ background: "rgba(59, 142, 165, 0.05)" }}>
                <CardContent className="p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-secondary mb-0.5">Counter-Pick Strategy</p>
                    <p className="text-xs text-muted-foreground">{result.counterPickAdvice}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visual 7x7 Grid */}
            {result.gridPlacements && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Battlefield Layout</h3>
                <div className="battlefield-grid rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-primary/60 uppercase tracking-wider font-semibold">Recommended Positions</span>
                    <span className="text-xs font-medium text-primary">
                      {result.totalElixir}/{elixirBudget}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {Array.from({ length: 7 }, (_, rowIdx) => {
                      const ROW_LABELS = ["Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7"];
                      return (
                        <div key={rowIdx} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground w-10 text-right shrink-0">{ROW_LABELS[rowIdx]}</span>
                          <div className="flex-1 grid grid-cols-7 gap-1">
                            {Array.from({ length: 7 }, (_, colIdx) => {
                              const locked = rowIdx === 6; // Row 7 fully locked until level 999
                              const placed = result.gridPlacements.find((p: any) => p.row === rowIdx && p.col === colIdx);
                              const rarityColor = placed ? (RARITY_COLORS[placed.rarity] || "#95A5A6") : undefined;
                              return (
                                <div
                                  key={colIdx}
                                  className={`grid-cell aspect-square rounded-md flex flex-col items-center justify-center p-0.5 min-h-[44px] ${
                                    placed ? "occupied" : ""
                                  } ${locked ? "opacity-30" : ""}`}
                                  style={placed ? { borderColor: `${rarityColor}40` } : undefined}
                                >
                                  {locked ? (
                                    <Lock className="w-3 h-3 text-muted-foreground/30" />
                                  ) : placed ? (
                                    <>
                                      <span className="text-[8px] font-semibold truncate w-full text-center leading-tight"
                                        style={{ color: rarityColor }}>
                                        {placed.heroName.split(" ").map((w: string) => w[0]).join("")}
                                      </span>
                                      <span className="text-[7px] text-muted-foreground truncate w-full text-center">
                                        {placed.heroName.length > 7 ? placed.heroName.substring(0, 7) + "..." : placed.heroName}
                                      </span>
                                      <span className="text-[7px] text-primary/70">L{placed.level}</span>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/20">·</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/20">
                    <Lock className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-[9px] text-muted-foreground/50">Row 7 unlocks at Commander Level 999 (only columns 3-5 available)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Hero List */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selected Heroes ({result.lineup?.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.reasoning?.map((entry: any, idx: number) => {
                  const hero = heroes?.find(h => h.id === entry.heroId);
                  const lineupEntry = result.lineup?.find((l: any) => l.heroId === entry.heroId);
                  const rarityColor = RARITY_COLORS[lineupEntry?.rarity || hero?.rarity || "Common"];
                  const ClassIcon = classIcons[lineupEntry?.class || hero?.class || "Warrior"] || Swords;
                  return (
                    <Card key={idx} className="border-border/50" style={{ background: "#161924" }}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center border shrink-0"
                            style={{ borderColor: `${rarityColor}30`, background: `${rarityColor}10` }}>
                            <ClassIcon className="w-4 h-4" style={{ color: rarityColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold truncate" data-testid={`text-result-hero-${idx}`}>{entry.heroName}</p>
                              {lineupEntry && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 shrink-0">
                                  L{lineupEntry.level}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {entry.placement} · {lineupEntry?.class || hero?.class} · {lineupEntry?.elixir || hero?.elixir}
                            </p>
                            <p className="text-[10px] text-primary/70 mt-1">{entry.reasons}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold">{Math.round(entry.score)}</p>
                            <p className="text-[9px] text-muted-foreground">score</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Row Breakdown */}
            {result.placements && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Placement Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["Front", "Mid", "Back"] as const).map((pos) => {
                    const posHeroes = result.placements[pos] || [];
                    return (
                      <Card key={pos} className="border-border/50" style={{ background: "#161924" }}>
                        <CardContent className="p-3">
                          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{pos} Row ({posHeroes.length})</h4>
                          {posHeroes.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/50">No heroes</p>
                          ) : (
                            <div className="space-y-1">
                              {posHeroes.map((h: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: RARITY_COLORS[h.hero?.rarity || "Common"] }} />
                                  <span className="text-[10px] truncate">{h.hero?.name}</span>
                                  <span className="text-[9px] text-muted-foreground ml-auto">L{h.level}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Synergies */}
            {result.synergies && result.synergies.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team Synergies</h3>
                <div className="space-y-2">
                  {result.synergies.map((syn: any, idx: number) => (
                    <Card key={idx} className="border-border/50" style={{
                      background: syn.type === "hero_combo" ? "rgba(212, 168, 67, 0.05)" :
                                  syn.type === "attribute" ? "rgba(59, 142, 165, 0.05)" :
                                  "#161924"
                    }}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5" style={{
                            background: syn.type === "hero_combo" ? "rgba(212, 168, 67, 0.15)" :
                                        syn.type === "attribute" ? "rgba(59, 142, 165, 0.15)" :
                                        syn.type === "role_balance" ? "rgba(46, 204, 113, 0.15)" :
                                        "rgba(231, 76, 60, 0.15)"
                          }}>
                            <span className="text-[10px]">
                              {syn.type === "hero_combo" ? "W" :
                               syn.type === "attribute" ? "A" :
                               syn.type === "role_balance" ? "B" : "S"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{
                              color: syn.type === "hero_combo" ? "#D4A843" : "#e0e0e0"
                            }}>{syn.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{syn.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {syn.heroes.map((name: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-[9px] h-4 px-1.5">{name}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} trigger={paywallTrigger} />
    </AppLayout>
  );
}
