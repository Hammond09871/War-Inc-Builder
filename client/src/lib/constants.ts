export const RARITY_COLORS: Record<string, string> = {
  Mythic: "#FFD700",
  Legendary: "#9B59B6",
  Epic: "#3498DB",
  Rare: "#2ECC71",
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

export const POSITIONS = ["Front", "Mid", "Back"] as const;
export const ROLES = ["Tank", "DPS", "Support", "Control"] as const;
export const RARITIES = ["Mythic", "Legendary", "Epic", "Rare", "Common"] as const;
export const TIERS = ["S", "A", "B", "C", "D"] as const;
export const ATTRIBUTES = ["Physical", "Fire", "Water", "Wood", "Nature", "Earth", "Lightning", "Light", "Shadow", "Wind", "Divine"] as const;
export const GAME_MODES = ["Arena", "Co-op", "Adventure", "Infinity War", "Clan Hunt"] as const;
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

export const RARITY_POWER_MULTIPLIER: Record<string, number> = {
  Mythic: 5,
  Legendary: 4,
  Epic: 3,
  Rare: 2,
  Common: 1,
};
