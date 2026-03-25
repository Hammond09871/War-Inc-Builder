import { type Hero } from "@shared/schema";
import { RARITY_COLORS, TIER_CLASS } from "@/lib/constants";
import { Shield, Swords, Heart, Wand2, Flame, Droplets, TreePine, Zap, Sun, Moon, Wind, Mountain, Sparkles, Target, ArrowUpRight, Crosshair } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const classIcons: Record<string, any> = {
  Warrior: Swords,
  Marksman: Crosshair,
  Mage: Wand2,
  Support: Heart,
  Tank: Shield,
  Assassin: Zap,
};

const attributeIcons: Record<string, any> = {
  Physical: Target,
  Fire: Flame,
  Water: Droplets,
  Wood: TreePine,
  Earth: Mountain,
  Frost: Droplets,
  Holy: Sun,
  Shadow: Moon,
  Wind: Wind,
};

const placementLabels: Record<string, string> = {
  Front: "F",
  Mid: "M",
  Back: "B",
};

function getMythicGradientStyle(rarity: string) {
  if (rarity === "Mythic") {
    return {
      background: "linear-gradient(135deg, #FFD700, #FF6B35, #FF1493, #9B59B6, #3498DB, #FFD700)",
      backgroundSize: "200% 200%",
      WebkitBackgroundClip: "text" as const,
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    };
  }
  return {};
}

export function HeroCard({ hero, onClick, compact }: { hero: Hero; onClick?: () => void; compact?: boolean }) {
  const ClassIcon = classIcons[hero.class] || Swords;
  const AttrIcon = attributeIcons[hero.attribute] || Sparkles;
  const rarityColor = RARITY_COLORS[hero.rarity] || "#95A5A6";
  const tierClass = TIER_CLASS[hero.tier] || "tier-b";
  const isMythic = hero.rarity === "Mythic";

  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex items-center gap-2 p-2 rounded-md border border-border/50 hover:border-primary/30 cursor-pointer transition-all"
        style={{ background: "rgba(22, 25, 36, 0.8)" }}
        data-testid={`hero-card-compact-${hero.id}`}
      >
        <div className="w-8 h-8 rounded-md flex items-center justify-center border"
          style={{
            borderColor: isMythic ? undefined : `${rarityColor}40`,
            background: isMythic ? undefined : `${rarityColor}15`,
            ...(isMythic ? { borderImage: "linear-gradient(135deg, #FFD700, #FF6B35, #FF1493, #9B59B6, #3498DB) 1" } : {}),
          }}>
          <ClassIcon className="w-4 h-4" style={{ color: rarityColor }} />
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
      style={{
        background: "#161924",
        ...(isMythic ? { borderImage: "linear-gradient(135deg, #FFD700, #FF6B35, #FF1493, #9B59B6, #3498DB) 1" } : {}),
      }}
      data-testid={`hero-card-${hero.id}`}
    >
      {/* Tier badge */}
      <div className="absolute top-2 right-2">
        <span className={`text-xs font-bold ${tierClass}`}>{hero.tier}</span>
      </div>

      {/* Hero icon / class */}
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 border" style={{ borderColor: `${rarityColor}30`, background: `${rarityColor}10` }}>
        <ClassIcon className="w-6 h-6" style={{ color: rarityColor }} />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold mb-1 truncate pr-6" style={isMythic ? getMythicGradientStyle("Mythic") : {}}>
        {hero.name}
      </h3>

      {/* Rarity badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border" style={{ color: rarityColor, borderColor: `${rarityColor}40` }}>
          {hero.rarity}
        </Badge>
        <span className="text-[10px] text-muted-foreground">{hero.elixir} ⚡</span>
      </div>

      {/* Placement / Class / Attribute */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" />
          {hero.placement}
        </span>
        <span className="flex items-center gap-0.5">
          <ClassIcon className="w-3 h-3" />
          {hero.class}
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
  const ClassIcon = classIcons[hero.class] || Swords;
  const AttrIcon = attributeIcons[hero.attribute] || Sparkles;
  const rarityColor = RARITY_COLORS[hero.rarity] || "#95A5A6";
  const tierClass = TIER_CLASS[hero.tier] || "tier-b";
  const isMythic = hero.rarity === "Mythic";

  // Parse stats
  let statsData: Record<string, { hp: number; atk: number }> = {};
  try { statsData = JSON.parse(hero.stats); } catch {}

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg flex items-center justify-center border" style={{ borderColor: `${rarityColor}40`, background: `${rarityColor}15` }}>
          <ClassIcon className="w-8 h-8" style={{ color: rarityColor }} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold" style={isMythic ? getMythicGradientStyle("Mythic") : {}}>{hero.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs border" style={{ color: rarityColor, borderColor: `${rarityColor}40` }}>
              {hero.rarity}
            </Badge>
            <span className={`text-sm font-bold ${tierClass}`}>Tier {hero.tier}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md p-2.5 text-center border border-border/50" style={{ background: "#1E2233" }}>
          <ArrowUpRight className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Placement</p>
          <p className="text-sm font-semibold">{hero.placement}</p>
        </div>
        <div className="rounded-md p-2.5 text-center border border-border/50" style={{ background: "#1E2233" }}>
          <ClassIcon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Class</p>
          <p className="text-sm font-semibold">{hero.class}</p>
        </div>
        <div className="rounded-md p-2.5 text-center border border-border/50" style={{ background: "#1E2233" }}>
          <AttrIcon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Attribute</p>
          <p className="text-sm font-semibold">{hero.attribute}</p>
        </div>
      </div>

      {/* Combat Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md p-2.5 border border-border/50 flex items-center justify-between" style={{ background: "#1E2233" }}>
          <span className="text-[10px] text-muted-foreground">Damage</span>
          <span className="text-xs font-semibold">{hero.damageType}</span>
        </div>
        <div className="rounded-md p-2.5 border border-border/50 flex items-center justify-between" style={{ background: "#1E2233" }}>
          <span className="text-[10px] text-muted-foreground">Defense</span>
          <span className="text-xs font-semibold">{hero.defense}</span>
        </div>
        <div className="rounded-md p-2.5 border border-border/50 flex items-center justify-between" style={{ background: "#1E2233" }}>
          <span className="text-[10px] text-muted-foreground">Move Spd</span>
          <span className="text-xs font-semibold">{hero.moveSpeed}</span>
        </div>
        <div className="rounded-md p-2.5 border border-border/50 flex items-center justify-between" style={{ background: "#1E2233" }}>
          <span className="text-[10px] text-muted-foreground">Atk Spd</span>
          <span className="text-xs font-semibold">{hero.atkSpeed || "—"}</span>
        </div>
      </div>

      {hero.weakness && (
        <div className="rounded-md p-2.5 border border-red-500/20 flex items-center justify-between" style={{ background: "rgba(231, 76, 60, 0.05)" }}>
          <span className="text-[10px] text-red-400">Weakness</span>
          <span className="text-xs font-semibold text-red-400">{hero.weakness}</span>
        </div>
      )}

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

      {/* Level Upgrades */}
      {(hero.level6Upgrade || hero.level7Upgrade) && (
        <div className="space-y-2">
          {hero.level6Upgrade && (
            <div className="rounded-md p-2.5 border border-border/50" style={{ background: "#1E2233" }}>
              <span className="text-[10px] text-primary font-semibold">Lv.6: </span>
              <span className="text-[10px] text-muted-foreground">{hero.level6Upgrade}</span>
            </div>
          )}
          {hero.level7Upgrade && (
            <div className="rounded-md p-2.5 border border-border/50" style={{ background: "#1E2233" }}>
              <span className="text-[10px] text-primary font-semibold">Lv.7: </span>
              <span className="text-[10px] text-muted-foreground">{hero.level7Upgrade}</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Table */}
      {Object.keys(statsData).length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Stats by Level</h3>
          <div className="rounded-md border border-border/50 overflow-hidden" style={{ background: "#1E2233" }}>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="p-1.5 text-left text-muted-foreground">Lv</th>
                  <th className="p-1.5 text-right text-muted-foreground">HP</th>
                  <th className="p-1.5 text-right text-muted-foreground">ATK</th>
                  <th className="p-1.5 text-right text-muted-foreground">Power</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(statsData).map(([lv, s]) => (
                  <tr key={lv} className="border-b border-border/10">
                    <td className="p-1.5 font-semibold">{lv}</td>
                    <td className="p-1.5 text-right">{s.hp?.toLocaleString()}</td>
                    <td className="p-1.5 text-right">{s.atk?.toLocaleString()}</td>
                    <td className="p-1.5 text-right text-primary font-medium">{((s.hp || 0) + (s.atk || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
