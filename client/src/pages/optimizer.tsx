import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Zap, Shield, Swords, Heart, Wand2, Info, Crosshair } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { GAME_MODES, FORMATIONS, HUNTING_BOSSES, RARITY_COLORS, getHeroPower } from "@/lib/constants";
import type { Hero, RosterWithHero } from "@shared/schema";

const classIcons: Record<string, any> = { Warrior: Swords, Marksman: Crosshair, Mage: Wand2, Support: Heart, Tank: Shield, Assassin: Zap };

export default function Optimizer() {
  const [mode, setMode] = useState("Arena");
  const [enemyFormation, setEnemyFormation] = useState<string>("none");
  const [huntingBoss, setHuntingBoss] = useState<string>("Twin-Dragon");
  const [elixirBudget, setElixirBudget] = useState(100);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const { data: roster, isLoading: rosterLoading } = useQuery<RosterWithHero[]>({
    queryKey: ["/api/roster"],
  });

  const { data: heroes } = useQuery<Hero[]>({
    queryKey: ["/api/heroes"],
  });

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const body: any = { mode, elixirBudget };
      if (mode === "Arena" && enemyFormation !== "none") {
        body.enemyFormation = enemyFormation;
      }
      if (mode === "Hunting") {
        body.huntingBoss = huntingBoss;
      }
      const res = await apiRequest("POST", "/api/optimize", body);
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const modeDescriptions: Record<string, string> = {
    Arena: "PvP battles where formation and counter-picks matter most",
    Hunting: "Boss encounters (Evil Ivy, Twin-Dragon) prioritizing single-target DPS",
    Adventure: "PvE content needing balanced teams with strong front line",
    "Infinite War": "Endurance mode valuing sustainability and healing",
    "Clan War": "Competitive clan battles requiring balanced, versatile teams",
    "Clan Hunt": "Boss damage mode prioritizing single-target DPS",
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold" data-testid="text-page-title">Lineup Optimizer</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Get AI-powered lineup recommendations based on your roster
          </p>
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
                {mode === "Arena" ? "Enemy Formation" : mode === "Hunting" ? "Hunting Boss" : "Options"}
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
                </div>
              </div>
            </div>

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

            {/* Hero List */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selected Heroes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.reasoning?.map((entry: any, idx: number) => {
                  const hero = heroes?.find(h => h.id === entry.heroId);
                  const ClassIcon = classIcons[hero?.class || "Warrior"] || Swords;
                  const rarityColor = RARITY_COLORS[hero?.rarity || "Common"];
                  const lineupEntry = result.lineup?.find((l: any) => l.heroId === entry.heroId);
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
                              {hero?.placement} · {hero?.class} · {hero?.elixir}⚡
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
                          <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{pos} Row</h4>
                          {posHeroes.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/50">No heroes</p>
                          ) : (
                            <div className="space-y-1">
                              {posHeroes.map((h: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: RARITY_COLORS[h.hero?.rarity || "Common"] }} />
                                  <span className="text-[10px] truncate">{h.hero?.name}</span>
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
          </div>
        )}
      </div>
    </AppLayout>
  );
}
