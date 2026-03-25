import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { HeroCard } from "@/components/HeroCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Camera, Search, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RARITY_COLORS, getHeroPower } from "@/lib/constants";
import type { Hero, RosterWithHero } from "@shared/schema";

export default function MyRoster() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [heroSearch, setHeroSearch] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: heroes } = useQuery<Hero[]>({
    queryKey: ["/api/heroes"],
  });

  const { data: roster, isLoading } = useQuery<RosterWithHero[]>({
    queryKey: ["/api/roster"],
  });

  const addMutation = useMutation({
    mutationFn: async (heroId: number) => {
      const res = await apiRequest("POST", "/api/roster", { heroId, level: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      toast({ title: "Hero added to roster!" });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, level }: { id: number; level: number }) => {
      const res = await apiRequest("PATCH", `/api/roster/${id}`, { level });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/roster/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      toast({ title: "Hero removed from roster" });
    },
  });

  const totalPower = roster?.reduce((sum, entry) => {
    return sum + getHeroPower(entry.hero?.stats || "{}", entry.level);
  }, 0) || 0;

  // Allow all heroes (duplicates allowed)
  const filteredAvailable = heroes?.filter(h =>
    !heroSearch || h.name.toLowerCase().includes(heroSearch.toLowerCase())
  ) || [];

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold" data-testid="text-page-title">My Roster</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {roster?.length || 0} troops · {totalPower.toLocaleString()} power
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setImportDialogOpen(true)}
              data-testid="button-import-screenshot"
            >
              <Camera className="w-3.5 h-3.5" />
              Import
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs gap-1.5" data-testid="button-add-hero">
                  <Plus className="w-3.5 h-3.5" />
                  Add Troop
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[80vh] border-border/50" style={{ background: "#161924" }}>
                <DialogHeader>
                  <DialogTitle>Add Troop to Roster</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search heroes..."
                      value={heroSearch}
                      onChange={(e) => setHeroSearch(e.target.value)}
                      className="pl-9 h-9 text-sm"
                      style={{ background: "#1E2233" }}
                      data-testid="input-search-add-hero"
                    />
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto space-y-1.5 pr-1">
                    {filteredAvailable.map((hero) => (
                      <HeroCard
                        key={hero.id}
                        hero={hero}
                        compact
                        onClick={() => {
                          addMutation.mutate(hero.id);
                          setAddDialogOpen(false);
                          setHeroSearch("");
                        }}
                      />
                    ))}
                    {filteredAvailable.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No heroes match your search
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Roster Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : roster && roster.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {roster.map((entry) => {
              const rarityColor = RARITY_COLORS[entry.hero?.rarity] || "#95A5A6";
              const power = getHeroPower(entry.hero?.stats || "{}", entry.level);
              return (
                <Card key={entry.id} className="border-border/50 overflow-hidden" style={{ background: "#161924" }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center border"
                          style={{ borderColor: `${rarityColor}30`, background: `${rarityColor}10` }}>
                          <span className="text-xs font-bold" style={{ color: rarityColor }}>
                            {entry.hero?.rarity?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold" data-testid={`text-roster-name-${entry.id}`}>{entry.hero?.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px]" style={{ color: rarityColor }}>{entry.hero?.rarity}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{entry.hero?.placement} {entry.hero?.class}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        data-testid={`button-remove-${entry.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Level */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</span>
                        <span className="text-xs font-bold text-primary" data-testid={`text-level-${entry.id}`}>{entry.level}</span>
                      </div>
                      <Slider
                        value={[entry.level]}
                        min={1}
                        max={9}
                        step={1}
                        onValueChange={([v]) => updateMutation.mutate({ id: entry.id, level: v })}
                        className="w-full"
                        data-testid={`slider-level-${entry.id}`}
                      />
                    </div>

                    {/* Power */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border/30">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-[10px] text-muted-foreground">Power:</span>
                      <span className="text-xs font-semibold" data-testid={`text-power-${entry.id}`}>{power.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(212, 168, 67, 0.1)" }}>
              <Plus className="w-8 h-8 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">Your roster is empty</p>
            <Button size="sm" onClick={() => setAddDialogOpen(true)} data-testid="button-add-first-hero">
              <Plus className="w-4 h-4 mr-1" /> Add Your First Troop
            </Button>
          </div>
        )}
      </div>

      {/* Import Screenshot Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-md border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle>Import from Screenshot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-dashed border-border/50 p-8 text-center" style={{ background: "#1E2233" }}>
              <Camera className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground mb-1">Coming Soon</p>
              <p className="text-xs text-muted-foreground/60">
                Screenshot OCR import will automatically detect and add heroes from your in-game roster screenshots.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
