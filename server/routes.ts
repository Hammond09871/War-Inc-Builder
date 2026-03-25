import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRosterSchema, insertLineupSchema } from "@shared/schema";
import { z } from "zod";

// Hero data to seed
const heroSeedData = [
  {"name":"Mist Archer","rarity":"Mythic","position":"Back","role":"DPS","attribute":"Physical","elixir":8,"ability":"Misty Domain","abilityDesc":"Deals area of effect damage over time and inflicts reduced attack speed and movement speed","tier":"S"},
  {"name":"Radiant Warrior","rarity":"Mythic","position":"Front","role":"Tank","attribute":"Light","elixir":8,"ability":"Radiant Aegis","abilityDesc":"At the start of the battle, grants a shield to all allies in the team","tier":"S"},
  {"name":"Frost Queen","rarity":"Mythic","position":"Mid","role":"DPS","attribute":"Water","elixir":8,"ability":"Blizzard","abilityDesc":"Summons a blizzard at the start, dealing large area damage over time and slowing enemies","tier":"S"},
  {"name":"Tide Lord","rarity":"Mythic","position":"Mid","role":"Support","attribute":"Water","elixir":8,"ability":"Vortex Eye","abilityDesc":"Prioritizes mages and archer units to deal moderate continuous damage and apply a pull effect in a large area","tier":"S"},
  {"name":"Darkmoon Queen","rarity":"Mythic","position":"Back","role":"Control","attribute":"Shadow","elixir":8,"ability":"Dark Moon Barrier","abilityDesc":"Prioritizes a dark moon barrier at Archer and Mage positions, dealing minor damage and preventing attacks and skills","tier":"S"},
  {"name":"Jungle Ranger","rarity":"Mythic","position":"Back","role":"DPS","attribute":"Nature","elixir":8,"ability":"Arrowstorm","abilityDesc":"Deals moderate damage to enemies in a particular area","tier":"A"},
  {"name":"Goddess of War","rarity":"Mythic","position":"Front","role":"Tank","attribute":"Divine","elixir":8,"ability":"Vanguard Shield","abilityDesc":"Jumps to the friendly warrior with lowest health and provides a shield. In co-op, deals high AoE damage and stuns","tier":"A"},
  {"name":"The Knight King","rarity":"Mythic","position":"Front","role":"Tank","attribute":"Physical","elixir":8,"ability":"Power Infusion","abilityDesc":"Deals high single targeted damage to a particular enemy","tier":"A"},
  {"name":"Starlight Apostle","rarity":"Mythic","position":"Mid","role":"Support","attribute":"Light","elixir":8,"ability":"Stellar Canticle","abilityDesc":"Grants moderate attack bonus to nearby allied units in a large area. In co-op, deals damage and stuns","tier":"A"},
  {"name":"Melody Weaver","rarity":"Mythic","position":"Mid","role":"Support","attribute":"Physical","elixir":8,"ability":"Heroic Anthem","abilityDesc":"Grants moderate attack speed bonus to nearby allied units in a large area","tier":"A"},
  {"name":"Blazeking","rarity":"Mythic","position":"Mid","role":"DPS","attribute":"Fire","elixir":8,"ability":"Eternal Blaze","abilityDesc":"Deals a high amount of continuous damage in a large area","tier":"B"},
  {"name":"Nine-Tailed Fox","rarity":"Mythic","position":"Back","role":"DPS","attribute":"Fire","elixir":8,"ability":"Mystic Foxfire","abilityDesc":"Deals massive damage to the target and ignores a small amount of fire resistance","tier":"B"},
  {"name":"Flame Duelist","rarity":"Mythic","position":"Front","role":"Tank","attribute":"Fire","elixir":8,"ability":"Scorching Slash","abilityDesc":"Deals high single-targeted damage to a particular target","tier":"B"},
  {"name":"Gryphon Knight","rarity":"Mythic","position":"Front","role":"Tank","attribute":"Physical","elixir":8,"ability":"Devastating Charge","abilityDesc":"Devastating charge attacks that deal high damage","tier":"B"},
  {"name":"Geomancer","rarity":"Mythic","position":"Mid","role":"Control","attribute":"Earth","elixir":8,"ability":"Terrain Control","abilityDesc":"Earth-based terrain control abilities that reshape the battlefield","tier":"B"},
  {"name":"Storm Maiden","rarity":"Mythic","position":"Mid","role":"DPS","attribute":"Lightning","elixir":8,"ability":"Chain Lightning","abilityDesc":"Lightning-based chain damage that jumps between enemies","tier":"B"},
  {"name":"Fury Cannoneer","rarity":"Mythic","position":"Back","role":"DPS","attribute":"Fire","elixir":8,"ability":"Explosive Barrage","abilityDesc":"Heavy artillery explosive attacks dealing high area damage","tier":"B"},
  {"name":"Venospore Killer","rarity":"Mythic","position":"Mid","role":"DPS","attribute":"Nature","elixir":8,"ability":"Toxic Spores","abilityDesc":"Poison specialist dealing damage over time","tier":"B"},
  {"name":"Blazewing Lord","rarity":"Mythic","position":"Mid","role":"DPS","attribute":"Fire","elixir":8,"ability":"Dragon Fire","abilityDesc":"Dragon rider with aerial supremacy and fire breath attacks","tier":"B"},
  {"name":"Ripple Wizard","rarity":"Mythic","position":"Mid","role":"Control","attribute":"Water","elixir":8,"ability":"Tidal Wave","abilityDesc":"Water mage with powerful crowd control abilities","tier":"B"},
  {"name":"Firepower Vanguard","rarity":"Mythic","position":"Back","role":"DPS","attribute":"Fire","elixir":8,"ability":"Suppression Fire","abilityDesc":"Heavy gunner with suppression fire abilities","tier":"B"},
  {"name":"Woodland Guardian","rarity":"Mythic","position":"Front","role":"Tank","attribute":"Nature","elixir":8,"ability":"Nature Shield","abilityDesc":"Nature tank with regeneration abilities","tier":"B"},
  {"name":"Night Scion","rarity":"Mythic","position":"Front","role":"DPS","attribute":"Shadow","elixir":8,"ability":"Shadow Drain","abilityDesc":"Dark knight with life steal abilities","tier":"B"},
  {"name":"The Blade of Earth","rarity":"Mythic","position":"Front","role":"Tank","attribute":"Earth","elixir":8,"ability":"Earthquake","abilityDesc":"Stone warrior with earthquake attacks","tier":"B"},
  {"name":"Seraph","rarity":"Mythic","position":"Mid","role":"Support","attribute":"Light","elixir":8,"ability":"Divine Revival","abilityDesc":"Angelic healer with resurrection ability","tier":"A"},
  {"name":"Bone Marksman","rarity":"Mythic","position":"Back","role":"DPS","attribute":"Shadow","elixir":8,"ability":"Piercing Shot","abilityDesc":"Undead archer with piercing shots","tier":"B"},
  {"name":"Barbarian Tyrant","rarity":"Mythic","position":"Front","role":"DPS","attribute":"Physical","elixir":8,"ability":"Berserker Rage","abilityDesc":"Berserker with rage mechanics that increase damage","tier":"B"},
  {"name":"Ursa Champion","rarity":"Legendary","position":"Front","role":"Tank","attribute":"Physical","elixir":7,"ability":"Bear Slam","abilityDesc":"Bear warrior with stunning attacks","tier":"B"},
  {"name":"Elven Archer","rarity":"Legendary","position":"Back","role":"DPS","attribute":"Nature","elixir":7,"ability":"Rapid Fire","abilityDesc":"Precision marksman with rapid fire attacks","tier":"B"},
  {"name":"Sakura Ronin","rarity":"Legendary","position":"Front","role":"DPS","attribute":"Physical","elixir":7,"ability":"Blade Mastery","abilityDesc":"Samurai with blade mastery techniques","tier":"B"},
  {"name":"Ghost Assassin","rarity":"Legendary","position":"Back","role":"DPS","attribute":"Shadow","elixir":7,"ability":"Phantom Strike","abilityDesc":"Phantom killer with invisibility and burst damage","tier":"A"},
  {"name":"Wind Apostle","rarity":"Legendary","position":"Mid","role":"Support","attribute":"Wind","elixir":7,"ability":"Gale Blessing","abilityDesc":"Air support with speed buffs for allies","tier":"B"},
  {"name":"Ashen Arcanist","rarity":"Legendary","position":"Mid","role":"DPS","attribute":"Fire","elixir":7,"ability":"Burning Spells","abilityDesc":"Fire mage with burning spell damage","tier":"B"},
  {"name":"Blast Dwarf","rarity":"Legendary","position":"Mid","role":"DPS","attribute":"Fire","elixir":7,"ability":"Bomb Toss","abilityDesc":"Explosive expert with bomb attacks","tier":"B"},
  {"name":"Great Axe Warrior","rarity":"Legendary","position":"Front","role":"DPS","attribute":"Physical","elixir":7,"ability":"Cleave","abilityDesc":"Heavy melee with cleave damage hitting multiple enemies","tier":"B"},
  {"name":"Windlord","rarity":"Legendary","position":"Mid","role":"Control","attribute":"Wind","elixir":7,"ability":"Tornado","abilityDesc":"Storm summoner with tornado attacks","tier":"B"},
  {"name":"Ironguard","rarity":"Legendary","position":"Front","role":"Tank","attribute":"Physical","elixir":7,"ability":"Iron Wall","abilityDesc":"Armored defender with shield abilities","tier":"B"},
  {"name":"Rock Thrower","rarity":"Epic","position":"Back","role":"DPS","attribute":"Earth","elixir":6,"ability":"Boulder Hurl","abilityDesc":"Siege unit with ranged boulder attacks, high area damage","tier":"B"},
  {"name":"Poison Master","rarity":"Epic","position":"Mid","role":"DPS","attribute":"Nature","elixir":6,"ability":"Toxic Cloud","abilityDesc":"Toxin specialist with debuffs and damage over time","tier":"B"},
  {"name":"Oracle","rarity":"Epic","position":"Mid","role":"Support","attribute":"Light","elixir":6,"ability":"Aura Vision","abilityDesc":"Support with vision and buff abilities, excellent aura range at level 7 covering large battlefield area","tier":"A"},
  {"name":"Snowman Warrior","rarity":"Epic","position":"Front","role":"Tank","attribute":"Water","elixir":6,"ability":"Frost Armor","abilityDesc":"Frost tank with slow effects on enemies","tier":"B"},
  {"name":"Flame Mage","rarity":"Epic","position":"Mid","role":"DPS","attribute":"Fire","elixir":6,"ability":"Fire Storm","abilityDesc":"Fire mage with area damage spells","tier":"B"},
  {"name":"Pumpkin Guard","rarity":"Epic","position":"Front","role":"Tank","attribute":"Wood","elixir":6,"ability":"Precision Strike","abilityDesc":"Taunts enemies within small area. Level 6 reduces cooldown, Level 7 increases taunt range. Weak to Fire","tier":"B"},
  {"name":"Wooden Wizard","rarity":"Epic","position":"Mid","role":"Support","attribute":"Wood","elixir":5,"ability":"Roots of Life","abilityDesc":"Restores moderate health to all allies in small area. Level 6 extends healing, Level 7 increases range. Weak to Fire","tier":"B"},
  {"name":"Royal Archer","rarity":"Epic","position":"Back","role":"DPS","attribute":"Physical","elixir":6,"ability":"Precision Strike","abilityDesc":"Self-buff applying stackable attack speed buff. Level 6 gives bonus damage against Boss enemies, Level 7 increases stack limit","tier":"A"},
  {"name":"Dwarf Berserker","rarity":"Epic","position":"Front","role":"DPS","attribute":"Physical","elixir":6,"ability":"Frenzy","abilityDesc":"Frenzied fighter with attack speed buffs","tier":"B"},
  {"name":"Forest Scout","rarity":"Rare","position":"Back","role":"DPS","attribute":"Physical","elixir":3,"ability":"Cyclone Spin","abilityDesc":"Each attack has chance to fire multiple high-damage projectiles. Level 7 increases trigger chance","tier":"B"},
  {"name":"Berserker","rarity":"Rare","position":"Front","role":"Tank","attribute":"Water","elixir":3,"ability":"Whirlwind Axe","abilityDesc":"Each attack has chance to deal area damage and apply slow","tier":"C"},
  {"name":"Goblin Warrior","rarity":"Rare","position":"Front","role":"DPS","attribute":"Physical","elixir":3,"ability":"Battle Spirit","abilityDesc":"Each attack has chance to grant attack power bonus. High movement speed","tier":"C"},
  {"name":"Flail Warden","rarity":"Rare","position":"Front","role":"Tank","attribute":"Physical","elixir":4,"ability":"Shockwave Slam","abilityDesc":"Each attack has chance to deal moderate damage in medium area","tier":"C"},
  {"name":"Apprentice Mage","rarity":"Rare","position":"Mid","role":"DPS","attribute":"Fire","elixir":3,"ability":"Arcane Scatter","abilityDesc":"Each attack has chance to launch multiple magic orbs. Weak to Water","tier":"C"},
  {"name":"Bomber","rarity":"Rare","position":"Mid","role":"DPS","attribute":"Fire","elixir":4,"ability":"Self-Destruct","abilityDesc":"Deals medium-range AoE damage upon death. Level 7 adds brief stun. Essential for Backstab formation","tier":"A"},
  {"name":"Gale Wolf","rarity":"Rare","position":"Front","role":"DPS","attribute":"Physical","elixir":3,"ability":"Bloodlust","abilityDesc":"Gains temporary attack speed boost when at low health. Level 7 extends buff duration. High movement speed","tier":"C"},
  {"name":"Paladin","rarity":"Rare","position":"Front","role":"Tank","attribute":"Physical","elixir":3,"ability":"Divine Shield","abilityDesc":"Generates shield absorbing small amount of damage. Level 7 increases shield absorption","tier":"C"},
  {"name":"Goblin Chef","rarity":"Rare","position":"Front","role":"Tank","attribute":"Physical","elixir":4,"ability":"Ladle Smash","abilityDesc":"Causes small-area stun effect. Level 7 increases trigger chance. High HP pool","tier":"C"},
  {"name":"Goblin Shaman","rarity":"Rare","position":"Mid","role":"Support","attribute":"Wood","elixir":3,"ability":"Arcane Regeneration","abilityDesc":"Randomly restores small health to allies in area. Level 7 increases number of allies healed. Weak to Fire","tier":"C"},
  {"name":"Cannon Chariot","rarity":"Rare","position":"Back","role":"DPS","attribute":"Physical","elixir":4,"ability":"Artillery Fire","abilityDesc":"Mobile artillery platform with ranged attacks","tier":"C"},
  {"name":"Snowball Thrower","rarity":"Common","position":"Back","role":"Support","attribute":"Water","elixir":2,"ability":"Snowball Impact","abilityDesc":"Each attack has chance to apply moderate slow. Control unit","tier":"D"},
  {"name":"Swordsman","rarity":"Common","position":"Front","role":"DPS","attribute":"Physical","elixir":2,"ability":"Slash","abilityDesc":"Each attack has chance to deal moderate damage to nearby enemies in medium range. High movement speed","tier":"D"},
  {"name":"Archer","rarity":"Common","position":"Back","role":"DPS","attribute":"Physical","elixir":2,"ability":"Split Arrow","abilityDesc":"Each attack has chance to fire multiple arrows. Single-target DPS","tier":"D"},
  {"name":"Gunner","rarity":"Common","position":"Back","role":"DPS","attribute":"Fire","elixir":3,"ability":"Multishot Barrage","abilityDesc":"Each attack has chance to fire multiple bullets. Weak to Water","tier":"D"},
  {"name":"Demoman","rarity":"Common","position":"Front","role":"Support","attribute":"Physical","elixir":2,"ability":"Spark Burst","abilityDesc":"Each attack has chance to apply brief stun. Front row control unit","tier":"D"},
  {"name":"Scudiero","rarity":"Common","position":"Front","role":"Tank","attribute":"Physical","elixir":2,"ability":"Iron Hammer Strike","abilityDesc":"Attack has small chance to briefly stun single enemy. High HP front row tank","tier":"D"}
];

function seedHeroes() {
  const count = storage.getHeroCount();
  if (count === 0) {
    console.log("Seeding hero database with", heroSeedData.length, "heroes...");
    for (const hero of heroSeedData) {
      storage.insertHero(hero);
    }
    console.log("Hero database seeded successfully.");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed heroes on startup
  seedHeroes();

  // GET /api/heroes - list all heroes with optional filters
  app.get("/api/heroes", (_req, res) => {
    const { rarity, role, position, attribute } = _req.query;
    const filters: any = {};
    if (rarity) filters.rarity = rarity as string;
    if (role) filters.role = role as string;
    if (position) filters.position = position as string;
    if (attribute) filters.attribute = attribute as string;

    const hasFilters = Object.keys(filters).length > 0;
    const result = hasFilters ? storage.getHeroesFiltered(filters) : storage.getAllHeroes();
    res.json(result);
  });

  // GET /api/heroes/:id
  app.get("/api/heroes/:id", (req, res) => {
    const hero = storage.getHeroById(Number(req.params.id));
    if (!hero) return res.status(404).json({ message: "Hero not found" });
    res.json(hero);
  });

  // GET /api/roster - get user's roster
  app.get("/api/roster", (_req, res) => {
    const roster = storage.getRoster();
    res.json(roster);
  });

  // POST /api/roster - add/update hero in roster
  app.post("/api/roster", (req, res) => {
    try {
      const { heroId, mergeLevel, starLevel } = req.body;
      
      // Check if hero exists
      const hero = storage.getHeroById(heroId);
      if (!hero) return res.status(404).json({ message: "Hero not found" });

      // Check if already in roster
      if (storage.isHeroInRoster(heroId)) {
        // Find and update
        const roster = storage.getRoster();
        const existing = roster.find(r => r.heroId === heroId);
        if (existing) {
          const updated = storage.updateRosterEntry(existing.id, mergeLevel || 1, starLevel || 1);
          return res.json(updated);
        }
      }

      const parsed = insertRosterSchema.parse({
        heroId,
        mergeLevel: mergeLevel || 1,
        starLevel: starLevel || 1,
      });

      const entry = storage.addToRoster(parsed);
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // PATCH /api/roster/:id - update merge/star level
  app.patch("/api/roster/:id", (req, res) => {
    const id = Number(req.params.id);
    const entry = storage.getRosterEntry(id);
    if (!entry) return res.status(404).json({ message: "Roster entry not found" });

    const { mergeLevel, starLevel } = req.body;
    const updated = storage.updateRosterEntry(
      id,
      mergeLevel ?? entry.mergeLevel,
      starLevel ?? entry.starLevel
    );
    res.json(updated);
  });

  // DELETE /api/roster/:id
  app.delete("/api/roster/:id", (req, res) => {
    const id = Number(req.params.id);
    storage.removeFromRoster(id);
    res.json({ success: true });
  });

  // GET /api/lineups
  app.get("/api/lineups", (_req, res) => {
    const result = storage.getLineups();
    res.json(result);
  });

  // POST /api/lineups
  app.post("/api/lineups", (req, res) => {
    try {
      const parsed = insertLineupSchema.parse(req.body);
      const lineup = storage.saveLineup(parsed);
      res.json(lineup);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // DELETE /api/lineups/:id
  app.delete("/api/lineups/:id", (req, res) => {
    const id = Number(req.params.id);
    storage.deleteLineup(id);
    res.json({ success: true });
  });

  // POST /api/optimize
  app.post("/api/optimize", (req, res) => {
    const { mode, formation, enemyFormation, enemyHeroIds } = req.body;
    const roster = storage.getRoster();
    const allHeroes = storage.getAllHeroes();

    if (roster.length === 0) {
      return res.status(400).json({ message: "Add heroes to your roster first" });
    }

    // Run optimization logic
    const result = optimizeLineup(roster, allHeroes, mode, formation, enemyFormation, enemyHeroIds);
    res.json(result);
  });

  return httpServer;
}

// Optimization engine
function optimizeLineup(
  roster: any[],
  allHeroes: any[],
  mode: string,
  formation?: string,
  enemyFormation?: string,
  enemyHeroIds?: number[]
) {
  const ELIXIR_BUDGET = 100;
  const rarityMultiplier: Record<string, number> = {
    Mythic: 5, Legendary: 4, Epic: 3, Rare: 2, Common: 1
  };
  const tierScore: Record<string, number> = {
    S: 10, A: 8, B: 6, C: 4, D: 2
  };

  // Score each hero in roster
  const scoredHeroes = roster.map(entry => {
    const hero = entry.hero;
    let score = 0;

    // Merge level is THE most important factor
    score += entry.mergeLevel * 10;

    // Star level bonus
    score += entry.starLevel * 3;

    // Rarity multiplier
    score += (rarityMultiplier[hero.rarity] || 1) * 5;

    // Tier bonus
    score += (tierScore[hero.tier] || 2) * 2;

    // Mode-specific bonuses
    switch (mode) {
      case "Arena":
        // Formation-specific bonuses
        if (formation === "Backstab" && hero.name === "Bomber") score += 20;
        if (formation === "Dash" && hero.name === "Oracle") score += 20;
        if (formation === "Dash" && hero.role === "Support") score += 5;
        if (hero.role === "Tank") score += 3;
        break;
      case "Co-op":
        if (hero.role === "DPS") score += 8;
        if (hero.role === "Support") score += 10;
        if (hero.name === "Oracle") score += 15;
        if (hero.name === "Starlight Apostle") score += 10;
        if (hero.name === "Goddess of War") score += 10;
        break;
      case "Infinity War":
        if (hero.role === "Support") score += 10;
        if (hero.role === "Tank") score += 8;
        if (hero.name === "Seraph") score += 15;
        if (hero.name === "Wooden Wizard") score += 10;
        break;
      case "Clan Hunt":
        if (hero.role === "DPS") score += 12;
        if (hero.name === "Royal Archer") score += 15;
        if (hero.name === "Nine-Tailed Fox") score += 10;
        if (hero.name === "Mist Archer") score += 10;
        break;
      case "Adventure":
        if (hero.role === "Tank" && hero.position === "Front") score += 8;
        if (hero.role === "Support") score += 5;
        if (hero.role === "DPS") score += 5;
        break;
    }

    // Counter-pick bonus for PvP
    if (mode === "Arena" && enemyFormation) {
      if (enemyFormation === "Backstab" && formation === "Split") score += 5;
      if (enemyFormation === "Dash" && formation === "Backstab") score += 5;
      if (enemyFormation === "Split" && formation === "Dash") score += 5;
    }

    return { ...entry, score, hero };
  });

  // Sort by score descending
  scoredHeroes.sort((a, b) => b.score - a.score);

  // Greedy selection with constraints
  const selected: any[] = [];
  let totalElixir = 0;
  let hasTank = false;
  let hasDPS = false;
  let hasSupport = false;

  // First pass: ensure role balance
  // Pick best tank
  const bestTank = scoredHeroes.find(h => h.hero.role === "Tank" && h.hero.position === "Front");
  if (bestTank && totalElixir + bestTank.hero.elixir <= ELIXIR_BUDGET) {
    selected.push(bestTank);
    totalElixir += bestTank.hero.elixir;
    hasTank = true;
  }

  // Pick best support
  const bestSupport = scoredHeroes.find(h => h.hero.role === "Support" && !selected.includes(h));
  if (bestSupport && totalElixir + bestSupport.hero.elixir <= ELIXIR_BUDGET) {
    selected.push(bestSupport);
    totalElixir += bestSupport.hero.elixir;
    hasSupport = true;
  }

  // Fill remaining with top scored heroes
  for (const hero of scoredHeroes) {
    if (selected.length >= 12) break; // max 12 heroes on grid (could vary, but ~12 is typical)
    if (selected.includes(hero)) continue;
    if (totalElixir + hero.hero.elixir > ELIXIR_BUDGET) continue;

    selected.push(hero);
    totalElixir += hero.hero.elixir;
  }

  // Generate formation suggestion for Arena
  let suggestedFormation = formation;
  if (mode === "Arena" && !formation) {
    if (enemyFormation === "Dash") suggestedFormation = "Backstab";
    else if (enemyFormation === "Backstab") suggestedFormation = "Split";
    else if (enemyFormation === "Split") suggestedFormation = "Dash";
    else if (enemyFormation === "Outflank") suggestedFormation = "Split";
    else suggestedFormation = "Dash";
  }

  // Build placement (assign to rows based on position)
  const placements: Record<string, any[]> = { Front: [], Mid: [], Back: [] };
  for (const entry of selected) {
    const pos = entry.hero.position;
    if (placements[pos]) {
      placements[pos].push(entry);
    }
  }

  // Generate reasoning
  const reasoning = selected.map(entry => {
    const reasons: string[] = [];
    if (entry.mergeLevel >= 10) reasons.push(`High merge level (${entry.mergeLevel})`);
    if (entry.hero.tier === "S") reasons.push("S-tier hero");
    if (entry.hero.tier === "A") reasons.push("A-tier hero");
    if (mode === "Co-op" && entry.hero.name === "Oracle") reasons.push("Oracle's aura is essential for Co-op");
    if (mode === "Arena" && formation === "Backstab" && entry.hero.name === "Bomber") reasons.push("Bomber is essential for Backstab formation");
    if (mode === "Clan Hunt" && entry.hero.role === "DPS") reasons.push("DPS priority for single-target boss damage");
    if (reasons.length === 0) reasons.push(`Best available ${entry.hero.role} (score: ${entry.score})`);
    return {
      heroId: entry.hero.id,
      heroName: entry.hero.name,
      position: entry.hero.position,
      reasons: reasons.join("; "),
      score: entry.score,
    };
  });

  // Counter-pick analysis
  let counterPickAdvice = "";
  if (mode === "Arena" && enemyFormation) {
    const counterMap: Record<string, string> = {
      "Dash": "Use Backstab to bypass their front line and devastate their back line DPS.",
      "Backstab": "Use Split formation to divide your forces and avoid their backstab targets.",
      "Outflank": "Use Split to counter their flanking maneuver, or Backstab for aggressive play.",
      "Split": "Use Dash formation — their split forces will have weakened aura synergies."
    };
    counterPickAdvice = counterMap[enemyFormation] || "Standard formation recommended.";
  }

  // Calculate total power
  const totalPower = selected.reduce((sum, entry) => {
    return sum + (entry.mergeLevel * (rarityMultiplier[entry.hero.rarity] || 1) * 100) + (entry.starLevel * 50);
  }, 0);

  return {
    lineup: selected.map(e => ({
      rosterId: e.id,
      heroId: e.hero.id,
      heroName: e.hero.name,
      mergeLevel: e.mergeLevel,
      starLevel: e.starLevel,
      position: e.hero.position,
      role: e.hero.role,
      elixir: e.hero.elixir,
    })),
    formation: suggestedFormation,
    totalElixir,
    totalPower,
    reasoning,
    counterPickAdvice,
    placements,
    mode,
  };
}
