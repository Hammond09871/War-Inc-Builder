import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Minus, X, Search, Zap, ChevronDown, ChevronRight, Merge, Camera } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RARITY_COLORS, getHeroPower } from "@/lib/constants";
import type { Hero, RosterWithHero } from "@shared/schema";

type GroupedTroop = {
  heroId: number;
  hero: Hero;
  copies: RosterWithHero[];
};

type BulkEntry = {
  heroId: number;
  quantity: number;
  level: number;
};

export default function MyRoster() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [rosterSearch, setRosterSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [expandedHeroId, setExpandedHeroId] = useState<number | null>(null);
  const [bulkEntries, setBulkEntries] = useState<Record<number, BulkEntry>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: heroes } = useQuery<Hero[]>({ queryKey: ["/api/heroes"] });
  const { data: roster, isLoading } = useQuery<RosterWithHero[]>({ queryKey: ["/api/roster"] });

  // Group roster by heroId
  const grouped = useMemo<GroupedTroop[]>(() => {
    if (!roster) return [];
    const map = new Map<number, GroupedTroop>();
    for (const entry of roster) {
      if (!entry.hero) continue;
      const existing = map.get(entry.heroId);
      if (existing) {
        existing.copies.push(entry);
      } else {
        map.set(entry.heroId, { heroId: entry.heroId, hero: entry.hero, copies: [entry] });
      }
    }
    // Sort copies by level descending within each group
    for (const group of map.values()) {
      group.copies.sort((a, b) => b.level - a.level);
    }
    // Sort groups: by rarity rank then name
    const rarityRank: Record<string, number> = { Mythic: 0, Legendary: 1, Epic: 2, Rare: 3, Common: 4 };
    return Array.from(map.values()).sort((a, b) => {
      const ra = rarityRank[a.hero.rarity] ?? 5;
      const rb = rarityRank[b.hero.rarity] ?? 5;
      if (ra !== rb) return ra - rb;
      return a.hero.name.localeCompare(b.hero.name);
    });
  }, [roster]);

  // Filter grouped roster by search
  const filteredGrouped = useMemo(() => {
    if (!rosterSearch) return grouped;
    const q = rosterSearch.toLowerCase();
    return grouped.filter(g =>
      g.hero.name.toLowerCase().includes(q) ||
      g.hero.class.toLowerCase().includes(q) ||
      g.hero.attribute.toLowerCase().includes(q) ||
      g.hero.rarity.toLowerCase().includes(q)
    );
  }, [grouped, rosterSearch]);

  const addOneMutation = useMutation({
    mutationFn: async (heroId: number) => {
      const res = await apiRequest("POST", "/api/roster", { heroId, level: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
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
    },
  });

  const bulkAddMutation = useMutation({
    mutationFn: async (troops: { heroId: number; level: number; quantity: number }[]) => {
      const res = await apiRequest("POST", "/api/roster/bulk", { troops });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/roster"] });
      setAddDialogOpen(false);
      setBulkEntries({});
      setAddSearch("");
      toast({ title: `Added ${data.added} troops to roster!` });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  // Merge: remove one copy at same level, level up another
  const handleMerge = (group: GroupedTroop, copyId: number, copyLevel: number) => {
    if (copyLevel >= 9) {
      toast({ title: "Already max level", variant: "destructive" });
      return;
    }
    // Find another copy at the same level (not this one)
    const mergeTarget = group.copies.find(c => c.id !== copyId && c.level === copyLevel);
    if (!mergeTarget) {
      toast({ title: "No matching copy to merge", description: `Need another Lv.${copyLevel} ${group.hero.name}`, variant: "destructive" });
      return;
    }
    // Delete the merge target, then level up this one
    deleteMutation.mutate(mergeTarget.id, {
      onSuccess: () => {
        updateMutation.mutate({ id: copyId, level: copyLevel + 1 }, {
          onSuccess: () => {
            toast({ title: `Merged! ${group.hero.name} → Lv.${copyLevel + 1}` });
          },
        });
      },
    });
  };

  const totalPower = roster?.reduce((sum, e) => sum + getHeroPower(e.hero?.stats || "{}", e.level), 0) || 0;
  const totalTroops = roster?.length || 0;
  const uniqueTroops = grouped.length;

  // Bulk add dialog helpers
  const updateBulk = (heroId: number, field: "quantity" | "level", delta: number) => {
    setBulkEntries(prev => {
      const existing = prev[heroId] || { heroId, quantity: 0, level: 1 };
      if (field === "quantity") {
        const newQty = Math.max(0, Math.min(20, existing.quantity + delta));
        if (newQty === 0) {
          const { [heroId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [heroId]: { ...existing, quantity: newQty } };
      } else {
        const newLevel = Math.max(1, Math.min(9, existing.level + delta));
        return { ...prev, [heroId]: { ...existing, quantity: existing.quantity || 1, level: newLevel } };
      }
    });
  };

  const setBulkLevel = (heroId: number, level: number) => {
    setBulkEntries(prev => {
      const existing = prev[heroId] || { heroId, quantity: 1, level: 1 };
      return { ...prev, [heroId]: { ...existing, quantity: existing.quantity || 1, level } };
    });
  };

  const bulkTotal = Object.values(bulkEntries).reduce((s, e) => s + e.quantity, 0);

  const filteredAddHeroes = useMemo(() => {
    if (!heroes) return [];
    const q = addSearch.toLowerCase();
    return heroes.filter(h => !q || h.name.toLowerCase().includes(q) || h.class.toLowerCase().includes(q) || h.rarity.toLowerCase().includes(q));
  }, [heroes, addSearch]);

  // Sort add heroes by rarity
  const sortedAddHeroes = useMemo(() => {
    const rarityRank: Record<string, number> = { Mythic: 0, Legendary: 1, Epic: 2, Rare: 3, Common: 4 };
    return [...filteredAddHeroes].sort((a, b) => {
      const ra = rarityRank[a.rarity] ?? 5;
      const rb = rarityRank[b.rarity] ?? 5;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [filteredAddHeroes]);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold" data-testid="text-page-title">My Roster</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {totalTroops} troops · {uniqueTroops} unique · {totalPower.toLocaleString()} power
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5"
              onClick={() => setImportDialogOpen(true)} data-testid="button-import-screenshot">
              <Camera className="w-3.5 h-3.5" /> Import
            </Button>
            <Button size="sm" className="text-xs gap-1.5" onClick={() => setAddDialogOpen(true)} data-testid="button-add-hero">
              <Plus className="w-3.5 h-3.5" /> Add Troops
            </Button>
          </div>
        </div>

        {/* Search bar */}
        {grouped.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search roster (name, class, attribute, rarity)..."
              value={rosterSearch}
              onChange={(e) => setRosterSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
              style={{ background: "#1E2233" }}
              data-testid="input-search-roster"
            />
          </div>
        )}

        {/* Roster Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : filteredGrouped.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGrouped.map((group) => {
              const { hero, copies } = group;
              const rarityColor = RARITY_COLORS[hero.rarity] || "#95A5A6";
              const isExpanded = expandedHeroId === hero.id;
              const highestLevel = Math.max(...copies.map(c => c.level));
              const groupPower = copies.reduce((s, c) => s + getHeroPower(hero.stats, c.level), 0);

              return (
                <Card key={hero.id} className="border-border/50 overflow-hidden" style={{ background: "#161924" }}>
                  <CardContent className="p-0">
                    {/* Collapsed header — always visible */}
                    <div
                      className="flex items-center gap-2.5 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpandedHeroId(isExpanded ? null : hero.id)}
                      data-testid={`troop-card-${hero.id}`}
                    >
                      {/* Rarity icon */}
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center border shrink-0"
                        style={{ borderColor: `${rarityColor}30`, background: `${rarityColor}10` }}>
                        <span className="text-xs font-bold" style={{ color: rarityColor }}>{hero.rarity[0]}</span>
                      </div>

                      {/* Name + info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold truncate">{hero.name}</p>
                          {/* Quantity badge */}
                          <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                            style={{ background: "rgba(212, 168, 67, 0.2)", color: "#D4A843" }}>
                            x{copies.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]" style={{ color: rarityColor }}>{hero.rarity}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{hero.class}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{hero.attribute}</span>
                        </div>
                      </div>

                      {/* Right side: level + power + expand */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Lv.{highestLevel}</p>
                          <div className="flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-primary" />
                            <span className="text-[10px] font-semibold">{groupPower.toLocaleString()}</span>
                          </div>
                        </div>
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                          : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        }
                      </div>
                    </div>

                    {/* Quick actions row */}
                    <div className="flex items-center gap-1.5 px-3 pb-2">
                      <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1"
                        onClick={(e) => { e.stopPropagation(); addOneMutation.mutate(hero.id); }}
                        disabled={addOneMutation.isPending}
                        data-testid={`button-add-one-${hero.id}`}>
                        <Plus className="w-2.5 h-2.5" /> +1
                      </Button>
                      {copies.length > 0 && (
                        <Button variant="outline" size="sm"
                          className="h-6 text-[10px] px-2 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Remove the lowest-level copy
                            const lowest = [...copies].sort((a, b) => a.level - b.level)[0];
                            deleteMutation.mutate(lowest.id);
                          }}
                          data-testid={`button-remove-one-${hero.id}`}>
                          <Minus className="w-2.5 h-2.5" /> -1
                        </Button>
                      )}
                    </div>

                    {/* Expanded: individual copies */}
                    {isExpanded && (
                      <div className="border-t border-border/30">
                        {copies.map((copy, idx) => {
                          const copyPower = getHeroPower(hero.stats, copy.level);
                          const hasMergePartner = copies.some(c => c.id !== copy.id && c.level === copy.level);
                          return (
                            <div key={copy.id}
                              className="flex items-center gap-2 px-3 py-2 border-b border-border/20 last:border-b-0"
                              style={{ background: idx % 2 === 0 ? "rgba(30,34,51,0.5)" : "transparent" }}>
                              {/* Copy indicator */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border border-border/40"
                                  style={{ background: "#1E2233" }}>
                                  {idx + 1}
                                </span>
                              </div>

                              {/* Level dropdown */}
                              <Select
                                value={String(copy.level)}
                                onValueChange={(v) => updateMutation.mutate({ id: copy.id, level: parseInt(v) })}
                              >
                                <SelectTrigger className="w-[72px] h-7 text-xs" style={{ background: "#1E2233" }}
                                  data-testid={`select-level-${copy.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5,6,7,8,9].map(lv => (
                                    <SelectItem key={lv} value={String(lv)}>Lv. {lv}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Power */}
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <Zap className="w-2.5 h-2.5 text-primary shrink-0" />
                                <span className="text-[10px] text-muted-foreground">{copyPower.toLocaleString()}</span>
                              </div>

                              {/* Merge button */}
                              {copy.level < 9 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-6 text-[10px] px-2 gap-1 shrink-0 ${
                                    hasMergePartner
                                      ? "text-green-400 border-green-500/30 hover:bg-green-500/10"
                                      : "text-muted-foreground/40 border-border/30 cursor-not-allowed"
                                  }`}
                                  disabled={!hasMergePartner || deleteMutation.isPending || updateMutation.isPending}
                                  onClick={() => handleMerge(group, copy.id, copy.level)}
                                  data-testid={`button-merge-${copy.id}`}
                                >
                                  <Merge className="w-2.5 h-2.5" /> Merge
                                </Button>
                              )}

                              {/* Delete copy */}
                              <Button variant="ghost" size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => deleteMutation.mutate(copy.id)}
                                data-testid={`button-delete-copy-${copy.id}`}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : roster && roster.length > 0 && rosterSearch ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No troops match "{rosterSearch}"</p>
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

      {/* Bulk Add Troops Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        setAddDialogOpen(open);
        if (!open) { setBulkEntries({}); setAddSearch(""); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Add Troops</span>
              {bulkTotal > 0 && (
                <Badge className="text-xs" style={{ background: "rgba(212, 168, 67, 0.2)", color: "#D4A843" }}>
                  {bulkTotal} selected
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search troops..."
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
                style={{ background: "#1E2233" }}
                data-testid="input-search-add-hero"
              />
            </div>
            <div className="max-h-[55vh] overflow-y-auto space-y-1 pr-1">
              {sortedAddHeroes.map((hero) => {
                const entry = bulkEntries[hero.id];
                const qty = entry?.quantity || 0;
                const level = entry?.level || 1;
                const rarityColor = RARITY_COLORS[hero.rarity] || "#95A5A6";
                return (
                  <div key={hero.id}
                    className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                      qty > 0 ? "border-primary/30" : "border-border/30"
                    }`}
                    style={{ background: qty > 0 ? "rgba(212, 168, 67, 0.03)" : "rgba(22, 25, 36, 0.8)" }}>
                    {/* Hero info */}
                    <div className="w-7 h-7 rounded flex items-center justify-center border shrink-0"
                      style={{ borderColor: `${rarityColor}30`, background: `${rarityColor}10` }}>
                      <span className="text-[9px] font-bold" style={{ color: rarityColor }}>{hero.rarity[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium truncate">{hero.name}</p>
                      <p className="text-[9px] text-muted-foreground">{hero.class} · {hero.attribute} · {hero.elixir}⚡</p>
                    </div>

                    {/* Level dropdown */}
                    <Select value={String(level)} onValueChange={(v) => setBulkLevel(hero.id, parseInt(v))}>
                      <SelectTrigger className="w-[62px] h-6 text-[10px]" style={{ background: "#1E2233" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9].map(lv => (
                          <SelectItem key={lv} value={String(lv)}>Lv.{lv}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Quantity stepper */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                        disabled={qty === 0}
                        onClick={() => updateBulk(hero.id, "quantity", -1)}>
                        <Minus className="w-2.5 h-2.5" />
                      </Button>
                      <span className="w-6 text-center text-xs font-semibold" style={{ color: qty > 0 ? "#D4A843" : undefined }}>
                        {qty}
                      </span>
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0"
                        onClick={() => updateBulk(hero.id, "quantity", 1)}>
                        <Plus className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {sortedAddHeroes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No heroes match your search</p>
              )}
            </div>

            {/* Add All button */}
            <Button
              className="w-full"
              size="sm"
              disabled={bulkTotal === 0 || bulkAddMutation.isPending}
              onClick={() => {
                const troops = Object.values(bulkEntries).filter(e => e.quantity > 0);
                bulkAddMutation.mutate(troops);
              }}
              data-testid="button-bulk-add"
            >
              {bulkAddMutation.isPending ? "Adding..." : `Add ${bulkTotal} Troop${bulkTotal !== 1 ? "s" : ""} to Roster`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
