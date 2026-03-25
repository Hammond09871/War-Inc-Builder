import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { HeroCard, HeroDetailDialog } from "@/components/HeroCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { RARITIES, CLASSES, PLACEMENTS, ATTRIBUTES, TIERS } from "@/lib/constants";
import type { Hero } from "@shared/schema";

export default function HeroesDatabase() {
  const [search, setSearch] = useState("");
  const [filterRarity, setFilterRarity] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterPlacement, setFilterPlacement] = useState<string>("all");
  const [filterAttribute, setFilterAttribute] = useState<string>("all");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);

  const { data: heroes, isLoading } = useQuery<Hero[]>({
    queryKey: ["/api/heroes"],
  });

  const filteredHeroes = heroes?.filter((hero) => {
    if (search && !hero.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRarity !== "all" && hero.rarity !== filterRarity) return false;
    if (filterClass !== "all" && hero.class !== filterClass) return false;
    if (filterPlacement !== "all" && hero.placement !== filterPlacement) return false;
    if (filterAttribute !== "all" && hero.attribute !== filterAttribute) return false;
    if (filterTier !== "all" && hero.tier !== filterTier) return false;
    return true;
  }) || [];

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold" data-testid="text-page-title">Heroes Database</h1>
          <p className="text-xs text-muted-foreground mt-1">
            All {heroes?.length || 63} heroes from War Inc Rising
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search heroes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
              style={{ background: "#161924" }}
              data-testid="input-search-heroes"
            />
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-2">
            <Select value={filterRarity} onValueChange={setFilterRarity}>
              <SelectTrigger className="w-[120px] h-8 text-xs" style={{ background: "#161924" }} data-testid="select-rarity">
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                {RARITIES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[110px] h-8 text-xs" style={{ background: "#161924" }} data-testid="select-class">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterPlacement} onValueChange={setFilterPlacement}>
              <SelectTrigger className="w-[110px] h-8 text-xs" style={{ background: "#161924" }} data-testid="select-placement">
                <SelectValue placeholder="Placement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Placements</SelectItem>
                {PLACEMENTS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterAttribute} onValueChange={setFilterAttribute}>
              <SelectTrigger className="w-[120px] h-8 text-xs" style={{ background: "#161924" }} data-testid="select-attribute">
                <SelectValue placeholder="Attribute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Attributes</SelectItem>
                {ATTRIBUTES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[100px] h-8 text-xs" style={{ background: "#161924" }} data-testid="select-tier">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                {TIERS.map((t) => <SelectItem key={t} value={t}>Tier {t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredHeroes.length} hero{filteredHeroes.length !== 1 ? "es" : ""}
          </p>
        </div>

        {/* Hero Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredHeroes.map((hero) => (
              <HeroCard key={hero.id} hero={hero} onClick={() => setSelectedHero(hero)} />
            ))}
          </div>
        )}

        {filteredHeroes.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No heroes match your filters.</p>
          </div>
        )}
      </div>

      {/* Hero Detail Dialog */}
      <Dialog open={!!selectedHero} onOpenChange={() => setSelectedHero(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle className="sr-only">Hero Details</DialogTitle>
          </DialogHeader>
          {selectedHero && <HeroDetailDialog hero={selectedHero} />}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
