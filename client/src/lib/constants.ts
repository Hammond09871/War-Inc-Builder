export const RARITY_COLORS: Record<string, string> = {
  Mythic: "#FFD700", // Gold — the gradient is applied via CSS class
  Legendary: "#FFD700",
  Epic: "#9B59B6",
  Rare: "#3498DB",
  Common: "#95A5A6",
};

export const RARITY_BG: Record<string, string> = {
  Mythic: "bg-rarity-mythic",
  Legendary: "bg-rarity-legendary",
  Epic: "bg-rarity-epic",
  Rare: "bg-rarity-rare",
  Common: "bg-rarity-common",
};

export const RARITY_CLASS: Record<string, string> = {
  Mythic: "rarity-mythic",
  Legendary: "rarity-legendary",
  Epic: "rarity-epic",
  Rare: "rarity-rare",
  Common: "rarity-common",
};

export const TIER_CLASS: Record<string, string> = {
  S: "tier-s",
  A: "tier-a",
  B: "tier-b",
  C: "tier-c",
  D: "tier-d",
};

export const PLACEMENTS = ["Front", "Mid", "Back"] as const;
export const CLASSES = ["Warrior", "Marksman", "Mage", "Support", "Tank", "Assassin"] as const;
export const RARITIES = ["Mythic", "Legendary", "Epic", "Rare", "Common"] as const;
export const TIERS = ["S", "A", "B", "C", "D"] as const;
export const ATTRIBUTES = ["Physical", "Fire", "Water", "Wood", "Earth", "Frost", "Holy", "Shadow", "Wind"] as const;
export const GAME_MODES = ["Arena", "Hunting", "Adventure", "Infinite War", "Clan War", "Clan Hunt"] as const;
export const FORMATIONS = ["Dash", "Backstab", "Outflank", "Split"] as const;

export const FORMATION_INFO: Record<string, { description: string; strongAgainst: string; weakAgainst: string; tips: string }> = {
  Dash: {
    description: "Standard baseline formation. Your units directly engage enemies. Strong with aura abilities like Oracle.",
    strongAgainst: "Baseline",
    weakAgainst: "Backstab",
    tips: "Maximizes aura abilities, strong unit synergies. Vulnerable to AoE, predictable positioning."
  },
  Backstab: {
    description: "Most potent offensive formation. Send units to enemy back line to devastate damage dealers.",
    strongAgainst: "Dash",
    weakAgainst: "Split",
    tips: "Best with Bomber units targeting B2-B3 and B5-B6. Destroys back line, pulls enemy aggro."
  },
  Outflank: {
    description: "Send edge units into enemy lines to draw aggro while front line advances.",
    strongAgainst: "Frost Queen, Dash",
    weakAgainst: "Split",
    tips: "Neutralizes Frost Queen. Excellent counter when she's not in Backstab position."
  },
  Split: {
    description: "High-skill formation. Shifts units to create two separate battle fronts.",
    strongAgainst: "Backstab",
    weakAgainst: "Dash",
    tips: "Hardest to predict, excellent disguised defense. High risk, reduced aura effectiveness."
  },
};

export const BUILD_TYPES = ["Mixed", "Melee", "Ranged"] as const;
export const BUILD_TYPE_INFO: Record<string, { description: string }> = {
  Mixed: { description: "Balanced mix of melee and ranged troops." },
  Melee: { description: "Close-combat focused. Warriors, tanks, and frontline fighters." },
  Ranged: { description: "Long-range damage. Archers, mages, and back-row attackers." },
};

export const PLAYSTYLES = ["Balanced", "Aggressive", "Defensive"] as const;
export const PLAYSTYLE_INFO: Record<string, { description: string }> = {
  Balanced: { description: "Even mix of offense and defense. Good all-around team." },
  Aggressive: { description: "Maximum damage output. Overwhelm enemies with firepower." },
  Defensive: { description: "Survive and outlast. Tanks, healers, and control dominate." },
};

export const HUNTING_BOSSES = {
  "Twin-Dragon": {
    name: "Twin-Dragon",
    description: "A cursed twin, one with burning heat, and the other with frost cold.",
    attribute: "Water",
    weakness: "Wind",
    resistances: ["Water", "Fire"],
    hp: "640.1k",
    tips: "Prioritize Wind-attribute troops. Avoid Water and Fire troops — Twin-Dragon has innate resistance to both."
  },
  "Evil Ivy": {
    name: "Evil Ivy",
    description: "Feared by people and monster, this creature can make nearby monsters move faster, and may also bind your weapons.",
    attribute: "Wood",
    weakness: "Fire",
    resistances: ["Wood"],
    hp: "8.54M",
    tips: "Prioritize Fire-attribute troops. Evil Ivy generates an aura that reduces enemy defense, so high-ATK burst damage troops are ideal."
  }
} as const;

export const CLAN_HUNT_BOSSES = {
  "Dragon Knight": {
    name: "Dragon Knight",
    description: "A heavily armored dragon rider guardian found in Clan War territories. Higher tower levels mean stronger Dragon Knights.",
    attribute: "Fire",
    weakness: "Physical",
    resistances: ["Fire"],
    tips: "Use Physical or Wind-attribute troops. Avoid Wood-attribute troops. Single-target DPS is key — focus fire on the knight, not the dragon."
  },
  "Naga Blade Master": {
    name: "Naga Blade Master",
    description: "A swift aquatic warrior wielding dual blades. Deals high single-target melee damage.",
    attribute: "Water",
    weakness: "Fire",
    resistances: ["Water"],
    tips: "Use Fire-attribute troops. Bring tanks to absorb melee attacks. Keep ranged DPS in back row — Naga targets nearest enemies."
  },
  "Venom Beetle": {
    name: "Venom Beetle",
    description: "A flying Wood-element creature with poison attacks. Deals area damage and poisons multiple troops.",
    attribute: "Wood",
    weakness: "Fire",
    resistances: ["Wood"],
    tips: "Use Fire-attribute troops. Spread formation to avoid AoE poison. Healers counter poison DoT."
  }
} as const;

// Helper to get HP+ATK power from stats JSON at a given level
export function getHeroPower(statsJson: string, level: number): number {
  try {
    const stats = JSON.parse(statsJson);
    const lvl = stats[String(level)];
    if (lvl) return (lvl.hp || 0) + (lvl.atk || 0);
  } catch {}
  return 0;
}
