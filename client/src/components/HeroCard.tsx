import { type Hero } from "@shared/schema";
import { RARITY_COLORS, TIER_CLASS, RARITY_BG } from "@/lib/constants";
import { Shield, Swords, Heart, Wand2, Flame, Droplets, TreePine, Zap, Sun, Moon, Wind, Mountain, Sparkles, Crown, Target, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const roleIcons: Record<string, any> = {
  Tank: Shield,
  DPS: Swords,
  Support: Heart,
  Control: Wand2,
};

const attributeIcons: Record<string, any> = {
  Physical: Target,
  Fire: Flame,
  Water: Droplets,
  Wood: TreePine,
  Nature: TreePine,
  Earth: Mountain,
  Lightning: Zap,
  Light: Sun,
  Shadow: Moon,
  Wind: Wind,
  Divine: Sparkles,
};

const positionLabels: Record<string, string> = {
  Front: "F",
  Mid: "M",
  Back: "B",
};

export function HeroCard({ hero, onClick, compact }: { hero: Hero; onClick?: () => void; compact?: boolean }) {
  const RoleIcon = roleIcons[hero.role] || Swords;
  const AttrIcon = attributeIcons[hero.attribute] || Sparkles;
  const rarityColor = RARITY_COLORS[hero.rarity] || "#95A5A6";
  const tierClass = TIER_CLASS[hero.tier] || "tier-b";

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-2 p-2 rounded-md border border-border/50 hover:border-primary/30 cursor-pointer transition-all"
        style={{ background: "rgba(22, 25, 36, 0.8)" }}
        data-testid={`hero-card-compact-${hero.id}`}
      >
        <div className="w-8 h-8 rounded-md flex items-center justify-center border" style={{ borderColor: `${rarityColor}40`, background: `${rarityColor}15` }}>
          <RoleIcon className="w-4 h-4" style={{ color: rarityColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{hero.name}</p>
          <p className="text-[10px] text-muted-foreground">{hero.rarity} · {hero.elixir}⚡</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-lg border border-border/50 p-3 cursor-pointer transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5`}
      style={{ background: "#161924" }}
      data-testid={`hero-card-${hero.id}`}
    >
      {/* Tier badge */}
      <div className="absolute top-2 right-2">
        <span className={`text-xs font-bold ${tierClass}`}>{hero.tier}</span>
      </div>

      {/* Hero icon / role */}
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border" style={{ borderColor: `${rarityColor}30`, background: `${rarityColor}10` }}>
        <RoleIcon className="w-6 h-6" style={{ color: rarityColor }} />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold mb-1 truncate pr-6">{hero.name}</h3>

      {/* Rarity badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border" style={{ color: rarityColor, borderColor: `${rarityColor}40` }}>
          {hero.rarity}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{hero.elixir} ⚡</span>
      </div>

      {/* Position / Role / Attribute */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" />
          {hero.position}
        </span>
        <span className="flex items-center gap-0.5">
          <RoleIcon className="w-3 h-3" />
          {hero.role}
        </span>
        <span className="flex items-center gap-0.5">
          <AttrIcon className="w-3 h-3" />
          {hero.attribute}
        </span>
      </div>

      {/* Ability */}
      <div className="mt-2 pt-2 border-t border-border/30">
        <p className="text-[10px] font-medium text-primary/80">{hero.ability}</p>
      </div>
    </div>
  );
}

export function HeroDetailDialog({ hero }: { hero: Hero }) {
  const RoleIcon = roleIcons[hero.role] || Swords;
  const AttrIcon = attributeIcons[hero.attribute] || Sparkles;
  const rarityColor = RARITY_COLORS[hero.rarity] || "#95A5A6";
  const tierClass = TIER_CLASS[hero.tier] || "tier-b";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center border" style={{ borderColor: `${rarityColor}40`, background: `${rarityColor}15` }}>
          <RoleIcon className="w-8 h-8" style={{ color: rarityColor }} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{hero.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs border" style={{ color: rarityColor, borderColor: `${rarityColor}40` }}>
              {hero.rarity}
            </Badge>
            <span className={`text-sm font-bold ${tierClass}`}>Tier {hero.tier}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md p-2.5 text-center border border-border/50" style={{ background: "#1E2233" }}>
          <ArrowUpRight className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Position</p>
          <p className="text-sm font-semibold">{hero.position}</p>
        </div>
        <div className="rounded-md p-2.5 text-center border border-border/50" style={{ background: "#1E2233" }}>
          <RoleIcon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Role</p>
          <p className="text-sm font-semibold">{hero.role}</p>
        </div>
        <div className="rounded-md p-2.5 text-center border border-border/50" style={{ background: "#1E2233" }}>
          <AttrIcon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Attribute</p>
          <p className="text-sm font-semibold">{hero.attribute}</p>
        </div>
      </div>

      {/* Elixir */}
      <div className="rounded-md p-3 border border-border/50 flex items-center justify-between" style={{ background: "#1E2233" }}>
        <span className="text-sm text-muted-foreground">Elixir Cost</span>
        <span className="text-lg font-bold text-primary">{hero.elixir} ⚡</span>
      </div>

      {/* Ability */}
      <div className="rounded-md p-3 border border-primary/20" style={{ background: "rgba(212, 168, 67, 0.05)" }}>
        <p className="text-xs font-semibold text-primary mb-1">{hero.ability}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{hero.abilityDesc}</p>
      </div>
    </div>
  );
}
