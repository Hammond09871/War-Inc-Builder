import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Pencil, Trash2, ShieldCheck, ScrollText, ListChecks } from "lucide-react";
import { RARITIES, CLASSES, ATTRIBUTES, TIERS } from "@/lib/constants";
import type { Hero } from "@shared/schema";

type Changelog = { id: number; title: string; description: string; createdAt: string };

const DEFENSE_OPTIONS = ["Low", "Medium", "High", "Very High"];
const SPEED_OPTIONS = ["Low", "Medium", "High", "Very High"];

function emptyHeroForm() {
  return {
    name: "", rarity: "Common", class: "Warrior", attribute: "Physical",
    weakness: "", placement: "Front Row", damageType: "Single",
    defense: "Medium", moveSpeed: "Medium", atkSpeed: "Medium",
    elixir: 3, ability: "", abilityDesc: "",
    level6Upgrade: "", level7Upgrade: "", tier: "C",
    stats: Object.fromEntries(
      Array.from({ length: 9 }, (_, i) => [String(i + 1), { hp: 0, atk: 0 }])
    ),
  };
}

function parseStatsToGrid(statsJson: string): Record<string, { hp: number; atk: number }> {
  try {
    const parsed = JSON.parse(statsJson);
    const grid: Record<string, { hp: number; atk: number }> = {};
    for (let i = 1; i <= 9; i++) {
      const lvl = parsed[String(i)];
      grid[String(i)] = { hp: lvl?.hp || 0, atk: lvl?.atk || 0 };
    }
    return grid;
  } catch {
    return emptyHeroForm().stats;
  }
}

function statsGridToJson(grid: Record<string, { hp: number; atk: number }>): string {
  const obj: Record<string, { hp: number; atk: number }> = {};
  for (let i = 1; i <= 9; i++) {
    const lvl = grid[String(i)];
    if (lvl && (lvl.hp > 0 || lvl.atk > 0)) {
      obj[String(i)] = { hp: lvl.hp, atk: lvl.atk };
    }
  }
  return JSON.stringify(obj);
}

// ────────────────────────────── Troop Manager Tab ──────────────────────────────

function TroopManager({ heroes }: { heroes: Hero[] }) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterRarity, setFilterRarity] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [editHero, setEditHero] = useState<Hero | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Hero | null>(null);
  const [form, setForm] = useState(emptyHeroForm());
  const [statsGrid, setStatsGrid] = useState(emptyHeroForm().stats);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/heroes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heroes"] });
      setEditHero(null);
      toast({ title: "Hero updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/heroes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heroes"] });
      setAddOpen(false);
      toast({ title: "Hero created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/heroes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heroes"] });
      setDeleteTarget(null);
      toast({ title: "Hero deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = heroes.filter((h) => {
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRarity !== "all" && h.rarity !== filterRarity) return false;
    if (filterClass !== "all" && h.class !== filterClass) return false;
    return true;
  });

  const openEdit = (hero: Hero) => {
    setEditHero(hero);
    setForm({
      name: hero.name, rarity: hero.rarity, class: hero.class,
      attribute: hero.attribute, weakness: hero.weakness || "",
      placement: hero.placement, damageType: hero.damageType,
      defense: hero.defense, moveSpeed: hero.moveSpeed,
      atkSpeed: hero.atkSpeed || "Medium", elixir: hero.elixir,
      ability: hero.ability, abilityDesc: hero.abilityDesc,
      level6Upgrade: hero.level6Upgrade || "",
      level7Upgrade: hero.level7Upgrade || "",
      tier: hero.tier,
      stats: parseStatsToGrid(hero.stats),
    });
    setStatsGrid(parseStatsToGrid(hero.stats));
  };

  const openAdd = () => {
    setAddOpen(true);
    const fresh = emptyHeroForm();
    setForm(fresh);
    setStatsGrid(fresh.stats);
  };

  const handleSubmit = () => {
    const data = {
      name: form.name, rarity: form.rarity, class: form.class,
      attribute: form.attribute, weakness: form.weakness || null,
      placement: form.placement, damageType: form.damageType,
      defense: form.defense, moveSpeed: form.moveSpeed,
      atkSpeed: form.atkSpeed || null, elixir: form.elixir,
      ability: form.ability, abilityDesc: form.abilityDesc,
      level6Upgrade: form.level6Upgrade || null,
      level7Upgrade: form.level7Upgrade || null,
      tier: form.tier,
      stats: statsGridToJson(statsGrid),
    };
    if (editHero) {
      updateMutation.mutate({ id: editHero.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const updateStat = (level: string, field: "hp" | "atk", value: number) => {
    setStatsGrid((prev) => ({
      ...prev,
      [level]: { ...prev[level], [field]: value },
    }));
  };

  const formDialog = (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto border-border/50" style={{ background: "#161924" }}>
      <DialogHeader>
        <DialogTitle>{editHero ? "Edit Hero" : "Add Hero"}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Name</Label>
          <Input className="h-8 text-sm" style={{ background: "#1E2233" }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Rarity</Label>
          <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>{RARITIES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Class</Label>
          <Select value={form.class} onValueChange={(v) => setForm({ ...form, class: v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Attribute</Label>
          <Select value={form.attribute} onValueChange={(v) => setForm({ ...form, attribute: v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>{ATTRIBUTES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Weakness</Label>
          <Select value={form.weakness || "none"} onValueChange={(v) => setForm({ ...form, weakness: v === "none" ? "" : v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {ATTRIBUTES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Placement</Label>
          <Input className="h-8 text-sm" style={{ background: "#1E2233" }} value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Damage Type</Label>
          <Input className="h-8 text-sm" style={{ background: "#1E2233" }} value={form.damageType} onChange={(e) => setForm({ ...form, damageType: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Defense</Label>
          <Select value={form.defense} onValueChange={(v) => setForm({ ...form, defense: v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>{DEFENSE_OPTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Move Speed</Label>
          <Select value={form.moveSpeed} onValueChange={(v) => setForm({ ...form, moveSpeed: v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>{SPEED_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Atk Speed</Label>
          <Select value={form.atkSpeed || "Medium"} onValueChange={(v) => setForm({ ...form, atkSpeed: v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>{SPEED_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Elixir</Label>
          <Input type="number" className="h-8 text-sm" style={{ background: "#1E2233" }} value={form.elixir} onChange={(e) => setForm({ ...form, elixir: Number(e.target.value) })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tier</Label>
          <Select value={form.tier} onValueChange={(v) => setForm({ ...form, tier: v })}>
            <SelectTrigger className="h-8 text-sm" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
            <SelectContent>{TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Ability</Label>
          <Input className="h-8 text-sm" style={{ background: "#1E2233" }} value={form.ability} onChange={(e) => setForm({ ...form, ability: e.target.value })} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Ability Description</Label>
          <Textarea className="text-sm min-h-[60px]" style={{ background: "#1E2233" }} value={form.abilityDesc} onChange={(e) => setForm({ ...form, abilityDesc: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Level 6 Upgrade</Label>
          <Input className="h-8 text-sm" style={{ background: "#1E2233" }} value={form.level6Upgrade} onChange={(e) => setForm({ ...form, level6Upgrade: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Level 7/9 Upgrade</Label>
          <Input className="h-8 text-sm" style={{ background: "#1E2233" }} value={form.level7Upgrade} onChange={(e) => setForm({ ...form, level7Upgrade: e.target.value })} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2 mt-2">
        <Label className="text-xs font-semibold">Stats (HP / ATK per level)</Label>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => String(i + 1)).map((level) => (
            <div key={level} className="flex items-center gap-1.5 rounded-md p-1.5" style={{ background: "#1E2233" }}>
              <span className="text-[10px] text-muted-foreground w-5 shrink-0">L{level}</span>
              <Input
                type="number" placeholder="HP" className="h-7 text-xs px-1.5 flex-1"
                style={{ background: "#161924" }}
                value={statsGrid[level]?.hp || ""}
                onChange={(e) => updateStat(level, "hp", Number(e.target.value))}
              />
              <Input
                type="number" placeholder="ATK" className="h-7 text-xs px-1.5 flex-1"
                style={{ background: "#161924" }}
                value={statsGrid[level]?.atk || ""}
                onChange={(e) => updateStat(level, "atk", Number(e.target.value))}
              />
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" size="sm" onClick={() => { setEditHero(null); setAddOpen(false); }}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={updateMutation.isPending || createMutation.isPending}>
          {editHero ? "Save Changes" : "Create Hero"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  const rarityColor: Record<string, string> = { Mythic: "#FFD700", Legendary: "#FFD700", Epic: "#9B59B6", Rare: "#3498DB", Common: "#95A5A6" };
  const tierColor: Record<string, string> = { S: "#FFD700", A: "#FF8C00", B: "#9B59B6", C: "#3498DB", D: "#95A5A6" };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search troops..." className="h-8 text-sm pl-8" style={{ background: "#1E2233" }}
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterRarity} onValueChange={setFilterRarity}>
          <SelectTrigger className="h-8 w-32 text-xs" style={{ background: "#1E2233" }}><SelectValue placeholder="Rarity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            {RARITIES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="h-8 w-32 text-xs" style={{ background: "#1E2233" }}><SelectValue placeholder="Class" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="text-xs gap-1.5 h-8" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5" /> Add Troop
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 overflow-hidden" style={{ background: "#161924" }}>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="text-xs">Name</TableHead>
              <TableHead className="text-xs">Rarity</TableHead>
              <TableHead className="text-xs">Class</TableHead>
              <TableHead className="text-xs text-center">Elixir</TableHead>
              <TableHead className="text-xs text-center">Tier</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((hero) => (
              <TableRow key={hero.id} className="border-border/30">
                <TableCell className="text-xs font-medium">{hero.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] px-1.5" style={{ borderColor: `${rarityColor[hero.rarity]}60`, color: rarityColor[hero.rarity] }}>
                    {hero.rarity}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{hero.class}</TableCell>
                <TableCell className="text-xs text-center">{hero.elixir}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-[10px] px-1.5 font-bold" style={{ borderColor: `${tierColor[hero.tier]}60`, color: tierColor[hero.tier] }}>
                    {hero.tier}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(hero)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(hero)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No troops found</p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editHero} onOpenChange={() => setEditHero(null)}>
        {formDialog}
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        {formDialog}
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent style={{ background: "#161924" }} className="border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this hero from the database.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ────────────────────────────── Tier Editor Tab ──────────────────────────────

function TierEditor({ heroes }: { heroes: Hero[] }) {
  const { toast } = useToast();

  const tierMutation = useMutation({
    mutationFn: async ({ id, tier }: { id: number; tier: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/heroes/${id}/tier`, { tier });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heroes"] });
      toast({ title: "Tier updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const tierColor: Record<string, string> = { S: "#FFD700", A: "#FF8C00", B: "#9B59B6", C: "#3498DB", D: "#95A5A6" };
  const rarityColor: Record<string, string> = { Mythic: "#FFD700", Legendary: "#FFD700", Epic: "#9B59B6", Rare: "#3498DB", Common: "#95A5A6" };

  const heroesByTier: Record<string, Hero[]> = {};
  for (const t of TIERS) heroesByTier[t] = [];
  for (const h of heroes) {
    if (heroesByTier[h.tier]) heroesByTier[h.tier].push(h);
    else heroesByTier["C"].push(h);
  }

  return (
    <div className="space-y-6">
      {TIERS.map((tier) => (
        <div key={tier}>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="text-sm font-bold px-3 py-0.5" style={{ background: `${tierColor[tier]}20`, color: tierColor[tier], border: `1px solid ${tierColor[tier]}40` }}>
              Tier {tier}
            </Badge>
            <span className="text-xs text-muted-foreground">{heroesByTier[tier].length} troops</span>
          </div>
          {heroesByTier[tier].length === 0 ? (
            <p className="text-xs text-muted-foreground pl-2 pb-2">No troops in this tier</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {heroesByTier[tier].map((hero) => (
                <div key={hero.id} className="flex items-center gap-2 p-2.5 rounded-md border border-border/50" style={{ background: "#161924" }}>
                  <Badge variant="outline" className="text-[9px] px-1 shrink-0" style={{ borderColor: `${rarityColor[hero.rarity]}60`, color: rarityColor[hero.rarity] }}>
                    {hero.rarity[0]}
                  </Badge>
                  <span className="text-xs font-medium flex-1 min-w-0 truncate">{hero.name}</span>
                  <Select value={hero.tier} onValueChange={(v) => tierMutation.mutate({ id: hero.id, tier: v })}>
                    <SelectTrigger className="h-7 w-16 text-xs px-2" style={{ background: "#1E2233" }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────── Update Log Tab ──────────────────────────────

function UpdateLog({ changelog }: { changelog: Changelog[] }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Changelog | null>(null);

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/changelog", { title, description });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changelog"] });
      setAddOpen(false);
      setTitle("");
      setDescription("");
      toast({ title: "Update logged" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/changelog/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/changelog"] });
      setDeleteTarget(null);
      toast({ title: "Entry deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <Button size="sm" className="text-xs gap-1.5" onClick={() => setAddOpen(true)}>
        <Plus className="w-3.5 h-3.5" /> Add Update
      </Button>

      {changelog.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No update entries yet</p>
      ) : (
        <div className="space-y-2">
          {changelog.map((entry) => (
            <Card key={entry.id} className="border-border/50" style={{ background: "#161924" }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#D4A843" }}>{entry.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{entry.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setDeleteTarget(entry)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md border-border/50" style={{ background: "#161924" }}>
          <DialogHeader>
            <DialogTitle>Log Game Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input className="h-8 text-sm" style={{ background: "#1E2233" }} placeholder="e.g. March 26: Fixed Geomancer stats" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea className="text-sm min-h-[80px]" style={{ background: "#1E2233" }} placeholder="Details about the update..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={() => addMutation.mutate()} disabled={!title.trim() || !description.trim() || addMutation.isPending}>
              {addMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent style={{ background: "#161924" }} className="border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>"{deleteTarget?.title}" will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ────────────────────────────── Main Admin Page ──────────────────────────────

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !user.isAdmin) setLocation("/");
  }, [user, setLocation]);

  const { data: heroes } = useQuery<Hero[]>({ queryKey: ["/api/heroes"] });
  const { data: changelog } = useQuery<Changelog[]>({ queryKey: ["/api/changelog"] });

  if (!user?.isAdmin) return null;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="relative rounded-xl overflow-hidden border border-border/30" style={{ background: "linear-gradient(135deg, #161924 0%, #1E2233 50%, #161924 100%)" }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #D4A843 0%, transparent 70%)" }} />
          <div className="relative p-6 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6" style={{ color: "#D4A843" }} />
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#D4A843" }}>Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Manage troops, tiers, and game updates</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="troops">
          <TabsList className="h-9" style={{ background: "#1E2233" }}>
            <TabsTrigger value="troops" className="text-xs px-4 gap-1.5">
              <ListChecks className="w-3.5 h-3.5" /> Troops
            </TabsTrigger>
            <TabsTrigger value="tiers" className="text-xs px-4 gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Tiers
            </TabsTrigger>
            <TabsTrigger value="updates" className="text-xs px-4 gap-1.5">
              <ScrollText className="w-3.5 h-3.5" /> Updates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="troops" className="mt-4">
            <TroopManager heroes={heroes || []} />
          </TabsContent>

          <TabsContent value="tiers" className="mt-4">
            <TierEditor heroes={heroes || []} />
          </TabsContent>

          <TabsContent value="updates" className="mt-4">
            <UpdateLog changelog={changelog || []} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
