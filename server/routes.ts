import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRosterSchema, insertLineupSchema, insertHeroSchema, type User } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Hero data to seed
const heroSeedData: any[] = [
  {"name": "Archer", "rarity": "Common", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 2, "ability": "Split Arrow", "abilityDesc": "Each attack has a chance to fire multiple bullets.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) – Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 636,\"atk\": 42},\"2\": {\"hp\": 760,\"atk\": 50},\"3\": {\"hp\": 910,\"atk\": 60},\"4\": {\"hp\": 1180,\"atk\": 70},\"5\": {\"hp\": 1530,\"atk\": 80},\"6\": {\"hp\": 1990,\"atk\": 100},\"7\": {\"hp\": 2590,\"atk\": 130},\"8\": {\"hp\": 3370,\"atk\": 170},\"9\": {\"hp\": 4380,\"atk\": 220}}", "tier": "D"},
  {"name": "Demoman", "rarity": "Common", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Control", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 2, "ability": "Spark Burst", "abilityDesc": "Each attack has a chance to apply a brief stun.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) – Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 924,\"atk\": 30},\"2\": {\"hp\": 1110,\"atk\": 40},\"3\": {\"hp\": 1330,\"atk\": 50},\"4\": {\"hp\": 1730,\"atk\": 60},\"5\": {\"hp\": 2250,\"atk\": 70},\"6\": {\"hp\": 2930,\"atk\": 80},\"7\": {\"hp\": 3810,\"atk\": 100},\"8\": {\"hp\": 4950,\"atk\": 130},\"9\": {\"hp\": 6440,\"atk\": 170}}", "tier": "D"},
  {"name": "Gunner", "rarity": "Common", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Multishot Barrage", "abilityDesc": "Each attack has a chance to fire multiple bullets.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) – Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 744,\"atk\": 36},\"2\": {\"hp\": 890,\"atk\": 40},\"3\": {\"hp\": 1070,\"atk\": 50},\"4\": {\"hp\": 1390,\"atk\": 60},\"5\": {\"hp\": 1810,\"atk\": 70},\"6\": {\"hp\": 2350,\"atk\": 80},\"7\": {\"hp\": 3060,\"atk\": 100},\"8\": {\"hp\": 3980,\"atk\": 130},\"9\": {\"hp\": 5170,\"atk\": 170}}", "tier": "D"},
  {"name": "Snowball Thrower", "rarity": "Common", "class": "Support", "attribute": "Water", "weakness": null, "placement": "Back Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 2, "ability": "Snowball Impact", "abilityDesc": "Each attack has a chance to apply moderate slow.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) – Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 732,\"atk\": 34},\"2\": {\"hp\": 880,\"atk\": 40},\"3\": {\"hp\": 1060,\"atk\": 50},\"4\": {\"hp\": 1380,\"atk\": 60},\"5\": {\"hp\": 1790,\"atk\": 70},\"6\": {\"hp\": 2330,\"atk\": 80},\"7\": {\"hp\": 3030,\"atk\": 100},\"8\": {\"hp\": 3940,\"atk\": 130},\"9\": {\"hp\": 5120,\"atk\": 170}}", "tier": "D"},
  {"name": "Swordsman", "rarity": "Common", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 2, "ability": "Slash", "abilityDesc": "Each attack has a chance to deal moderate damage to nearby enemies within a medium range.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 936,\"atk\": 24},\"2\": {\"hp\": 1120,\"atk\": 30},\"3\": {\"hp\": 1340,\"atk\": 40},\"4\": {\"hp\": 1740,\"atk\": 50},\"5\": {\"hp\": 2260,\"atk\": 60},\"6\": {\"hp\": 2940,\"atk\": 70},\"7\": {\"hp\": 3820,\"atk\": 90},\"8\": {\"hp\": 4970,\"atk\": 120},\"9\": {\"hp\": 6460,\"atk\": 160}}", "tier": "D"},
  {"name": "Woodshield Guard", "rarity": "Common", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Control", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 2, "ability": "Iron Hammer Strike", "abilityDesc": "Attack has a small chance to briefly stun a single enemy.", "level6Upgrade": null, "level7Upgrade": "Trigger Master (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 2020,\"atk\": 98},\"2\": {\"hp\": 2420,\"atk\": 120},\"3\": {\"hp\": 2900,\"atk\": 140},\"4\": {\"hp\": 3480,\"atk\": 170},\"5\": {\"hp\": 4180,\"atk\": 200},\"6\": {\"hp\": 5020,\"atk\": 240},\"7\": {\"hp\": 6530,\"atk\": 310},\"8\": {\"hp\": 8490,\"atk\": 400},\"9\": {\"hp\": 11040,\"atk\": 520}}", "tier": "D"},
  {"name": "Apprentice Mage", "rarity": "Rare", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Damage", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Arcane Scatter", "abilityDesc": "Each attack has a chance to launch multiple magic orbs.", "level6Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "level7Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1180,\"atk\": 90},\"2\": {\"hp\": 1410,\"atk\": 110},\"3\": {\"hp\": 1690,\"atk\": 130},\"4\": {\"hp\": 2200,\"atk\": 160},\"5\": {\"hp\": 2860,\"atk\": 190},\"6\": {\"hp\": 3720,\"atk\": 230},\"7\": {\"hp\": 4840,\"atk\": 300},\"8\": {\"hp\": 6290,\"atk\": 390},\"9\": {\"hp\": 8180,\"atk\": 510}}", "tier": "C"},
  {"name": "Berserker", "rarity": "Rare", "class": "Warrior", "attribute": "Water", "weakness": "Earth", "placement": "Front Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Whirlwind Axe", "abilityDesc": "Each attack has a chance to deal minor duration in a small area and apply slow.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1460,\"atk\": 40},\"2\": {\"hp\": 1760,\"atk\": 50},\"3\": {\"hp\": 2110,\"atk\": 60},\"4\": {\"hp\": 2740,\"atk\": 70},\"5\": {\"hp\": 3560,\"atk\": 80},\"6\": {\"hp\": 4630,\"atk\": 100},\"7\": {\"hp\": 6020,\"atk\": 130},\"8\": {\"hp\": 7830,\"atk\": 170},\"9\": {\"hp\": 10180,\"atk\": 220}}", "tier": "C"},
  {"name": "Bomber", "rarity": "Rare", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Front Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Self-Destruct", "abilityDesc": "Deal medium-range damage upon death.", "level6Upgrade": "Echoing Stun: Explosion briefly stuns nearby enemy units.", "level7Upgrade": "Echoing Stun: Explosion briefly stuns nearby enemy units.", "stats": "{\"1\": {\"hp\": 960,\"atk\": 260},\"2\": {\"hp\": 1300,\"atk\": 350},\"3\": {\"hp\": 1690,\"atk\": 460},\"4\": {\"hp\": 2110,\"atk\": 580},\"5\": {\"hp\": 2640,\"atk\": 730},\"6\": {\"hp\": 3300,\"atk\": 910},\"7\": {\"hp\": 4130,\"atk\": 1140},\"8\": {\"hp\": 5160,\"atk\": 1430},\"9\": {\"hp\": 6190,\"atk\": 1720}}", "tier": "C"},
  {"name": "Cannon Chariot", "rarity": "Rare", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Cannon Chariot", "abilityDesc": "Attack has a small chance to deal area damage.", "level6Upgrade": "Trigger Master: Increased trigger chance for skill.", "level7Upgrade": "Trigger Master: Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 980,\"atk\": 105},\"2\": {\"hp\": 1520,\"atk\": 160},\"3\": {\"hp\": 2280,\"atk\": 240},\"4\": {\"hp\": 3110,\"atk\": 350},\"5\": {\"hp\": 4630,\"atk\": 490},\"6\": {\"hp\": 6480,\"atk\": 690},\"7\": {\"hp\": 9070,\"atk\": 970},\"8\": {\"hp\": 12240,\"atk\": 1310},\"9\": {\"hp\": 15910,\"atk\": 1700}}", "tier": "C"},
  {"name": "Flail Warden", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Shockwave Slam", "abilityDesc": "Each attack has a chance to deal moderate damage in a medium area.", "level6Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "level7Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1500,\"atk\": 42},\"2\": {\"hp\": 1800,\"atk\": 50},\"3\": {\"hp\": 2160,\"atk\": 60},\"4\": {\"hp\": 2810,\"atk\": 70},\"5\": {\"hp\": 3650,\"atk\": 80},\"6\": {\"hp\": 4750,\"atk\": 100},\"7\": {\"hp\": 6180,\"atk\": 130},\"8\": {\"hp\": 8030,\"atk\": 170},\"9\": {\"hp\": 10440,\"atk\": 220}}", "tier": "C"},
  {"name": "Forest Scout", "rarity": "Rare", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Cyclone Spin", "abilityDesc": "Each attack has a chance to fire multiple high-damage projectiles.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1130,\"atk\": 105},\"2\": {\"hp\": 1350,\"atk\": 130},\"3\": {\"hp\": 1620,\"atk\": 160},\"4\": {\"hp\": 2110,\"atk\": 190},\"5\": {\"hp\": 2740,\"atk\": 230},\"6\": {\"hp\": 3560,\"atk\": 280},\"7\": {\"hp\": 4630,\"atk\": 360},\"8\": {\"hp\": 6020,\"atk\": 470},\"9\": {\"hp\": 7830,\"atk\": 610}}", "tier": "C"},
  {"name": "Frost Skeleton", "rarity": "Rare", "class": "Warrior", "attribute": "Water", "weakness": "Earth", "placement": "Front Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Glacial Rupture", "abilityDesc": "Upon death, continuously reduces the attack speed of nearby enemies. Stacks up to 100 times.", "level6Upgrade": "Cold Mastery: The skill can reduce attack speed further.", "level7Upgrade": "Cold Mastery: The skill can reduce attack speed further.", "stats": "{\"1\": {\"hp\": 1460,\"atk\": 40},\"2\": {\"hp\": 1760,\"atk\": 50},\"3\": {\"hp\": 2110,\"atk\": 60},\"4\": {\"hp\": 2740,\"atk\": 70},\"5\": {\"hp\": 3560,\"atk\": 80},\"6\": {\"hp\": 4630,\"atk\": 100},\"7\": {\"hp\": 6020,\"atk\": 130},\"8\": {\"hp\": 7830,\"atk\": 170},\"9\": {\"hp\": 10180,\"atk\": 220}}", "tier": "C"},
  {"name": "Gale Wolf", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 3, "ability": "Bloodlust", "abilityDesc": "Gain a temporary attack speed boost when at low health.", "level6Upgrade": null, "level7Upgrade": "Hunter's Instinct (Passive): Extended duration of skill buffs.", "stats": "{\"1\": {\"hp\": 1420,\"atk\": 80},\"2\": {\"hp\": 1700,\"atk\": 100},\"3\": {\"hp\": 2040,\"atk\": 120},\"4\": {\"hp\": 2650,\"atk\": 140},\"5\": {\"hp\": 3450,\"atk\": 170},\"6\": {\"hp\": 4490,\"atk\": 200},\"7\": {\"hp\": 5840,\"atk\": 260},\"8\": {\"hp\": 7590,\"atk\": 340},\"9\": {\"hp\": 9870,\"atk\": 440}}", "tier": "C"},
  {"name": "Goblin Chef", "rarity": "Rare", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Ladle Smash", "abilityDesc": "Ladle Smash (Probability): Cause a small-area stun effect.", "level6Upgrade": null, "level7Upgrade": "Trigger Master (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 3560,\"atk\": 188},\"2\": {\"hp\": 5520,\"atk\": 290},\"3\": {\"hp\": 8280,\"atk\": 440},\"4\": {\"hp\": 12010,\"atk\": 640},\"5\": {\"hp\": 16810,\"atk\": 900},\"6\": {\"hp\": 23530,\"atk\": 1260},\"7\": {\"hp\": 32940,\"atk\": 1760},\"8\": {\"hp\": 44470,\"atk\": 2380},\"9\": {\"hp\": 57810,\"atk\": 3090}}", "tier": "C"},
  {"name": "Goblin Shaman", "rarity": "Rare", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Arcane Regeneration", "abilityDesc": "Randomly restore a small amount of health to allies within a small area around self (10s cooldown).", "level6Upgrade": null, "level7Upgrade": "Healing Expansion (Passive) – Increased number of allies healed by the skill.", "stats": "{\"1\": {\"hp\": 1380,\"atk\": 102},\"2\": {\"hp\": 1660,\"atk\": 120},\"3\": {\"hp\": 1990,\"atk\": 140},\"4\": {\"hp\": 2590,\"atk\": 170},\"5\": {\"hp\": 3370,\"atk\": 200},\"6\": {\"hp\": 4380,\"atk\": 240},\"7\": {\"hp\": 5690,\"atk\": 310},\"8\": {\"hp\": 7400,\"atk\": 400},\"9\": {\"hp\": 9620,\"atk\": 520}}", "tier": "C"},
  {"name": "Goblin Warrior", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 3, "ability": "Battle Sprinstorm", "abilityDesc": "Each attack has a chance to grant an attack power bonus.", "level6Upgrade": "Power Strike: Enhanced effects from skill.", "level7Upgrade": "Power Strike: Enhanced effects from skill.", "stats": "{\"1\": {\"hp\": 1730,\"atk\": 60},\"2\": {\"hp\": 2070,\"atk\": 70},\"3\": {\"hp\": 2480,\"atk\": 80},\"4\": {\"hp\": 3220,\"atk\": 100},\"5\": {\"hp\": 4190,\"atk\": 120},\"6\": {\"hp\": 5450,\"atk\": 140},\"7\": {\"hp\": 7090,\"atk\": 180},\"8\": {\"hp\": 9220,\"atk\": 230},\"9\": {\"hp\": 11990,\"atk\": 300}}", "tier": "C"},
  {"name": "Paladin", "rarity": "Rare", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Shield", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Divine Shield Protection", "abilityDesc": "Generate a shield for self that absorbs a small amount of damage.", "level6Upgrade": null, "level7Upgrade": "Shield Enhancement (Passive): Increased shield absorption from skills.", "stats": "{\"1\": {\"hp\": 1960,\"atk\": 72},\"2\": {\"hp\": 2350,\"atk\": 90},\"3\": {\"hp\": 2820,\"atk\": 110},\"4\": {\"hp\": 3670,\"atk\": 130},\"5\": {\"hp\": 4770,\"atk\": 160},\"6\": {\"hp\": 6200,\"atk\": 190},\"7\": {\"hp\": 8060,\"atk\": 250},\"8\": {\"hp\": 10480,\"atk\": 330},\"9\": {\"hp\": 13620,\"atk\": 430}}", "tier": "C"},
  {"name": "Bone Warlock", "rarity": "Epic", "class": "Support", "attribute": "Wind", "weakness": "Wood", "placement": "Back Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Grasp of Aveness", "abilityDesc": "Prioritizes Marksmen. Deals AoE damage and reduces attack speed (stacks up to 3 times). If the enemy's attack speed is low, restores extra Energy.", "level6Upgrade": "Deceptive Trick - The skill can deal more damage.", "level7Upgrade": "Mana Resonance (Passive): The skill can restore more energy.", "stats": "{\"1\": {\"hp\": 2360,\"atk\": 192},\"2\": {\"hp\": 3660,\"atk\": null},\"3\": {\"hp\": 5490,\"atk\": 450},\"4\": {\"hp\": 7960,\"atk\": 650},\"5\": {\"hp\": 11140,\"atk\": 910},\"6\": {\"hp\": 15600,\"atk\": 1270},\"7\": {\"hp\": 21840,\"atk\": 1780},\"8\": {\"hp\": 29480,\"atk\": 2400},\"9\": {\"hp\": 38320,\"atk\": 3120}}", "tier": "B"},
  {"name": "Dwarf Berserker", "rarity": "Epic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Heavy Hammer Sweep", "abilityDesc": "Deal damage to enemies within a small area around self.", "level6Upgrade": "Warhammer Blessing - The damage of the skill is increased.", "level7Upgrade": "Hunter's Instinct (Passive): Gain a small attack speed boost for a short time after killing an enemy.", "stats": "{\"1\": {\"hp\": 2420,\"atk\": 92},\"2\": {\"hp\": 2910,\"atk\": 110},\"3\": {\"hp\": 3490,\"atk\": 130},\"4\": {\"hp\": 4540,\"atk\": 160},\"5\": {\"hp\": 5900,\"atk\": 190},\"6\": {\"hp\": 7670,\"atk\": 230},\"7\": {\"hp\": 9970,\"atk\": 300},\"8\": {\"hp\": 12960,\"atk\": 390},\"9\": {\"hp\": 16850,\"atk\": 510}}", "tier": "B"},
  {"name": "Flame Mage", "rarity": "Epic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Mid Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Fireball Arcana", "abilityDesc": "Each attack has a chance to deal heavy damage to a single enemy.", "level6Upgrade": "Blazing Combo: Skill deals extra damage to low-HP units.", "level7Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1440,\"atk\": 145},\"2\": {\"hp\": 1730,\"atk\": 170},\"3\": {\"hp\": 2080,\"atk\": 200},\"4\": {\"hp\": 2700,\"atk\": 240},\"5\": {\"hp\": 3510,\"atk\": 290},\"6\": {\"hp\": 4560,\"atk\": 350},\"7\": {\"hp\": 5930,\"atk\": 460},\"8\": {\"hp\": 7710,\"atk\": 600},\"9\": {\"hp\": 10020,\"atk\": 780}}", "tier": "B"},
  {"name": "Oracle", "rarity": "Epic", "class": "Support", "attribute": "Fire", "weakness": "Water", "placement": "Mid Row", "damageType": "Buff", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Divine Blessing", "abilityDesc": "Grants minor attack buffs to nearby allies, which can be stacked up to 20 layers.", "level6Upgrade": "Sacred Amplification: Enhanced effects from skill.", "level7Upgrade": "Zone Extension (Passive): Increased buff range of skill.", "stats": "{\"1\": {\"hp\": 1440,\"atk\": 128},\"2\": {\"hp\": 1730,\"atk\": 150},\"3\": {\"hp\": 2080,\"atk\": 180},\"4\": {\"hp\": 2700,\"atk\": 220},\"5\": {\"hp\": 3510,\"atk\": 260},\"6\": {\"hp\": 4560,\"atk\": 310},\"7\": {\"hp\": 5930,\"atk\": 400},\"8\": {\"hp\": 7710,\"atk\": 520},\"9\": {\"hp\": 10020,\"atk\": 680}}", "tier": "B"},
  {"name": "Poison Master", "rarity": "Epic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Toxic Field", "abilityDesc": "Each attack has a chance to deal moderate duration damage in a small area.", "level6Upgrade": "Toxic Spread (Passive): Increased duration of Toxic Field effects.", "level7Upgrade": "Trigger Mastery (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1210,\"atk\": 83},\"2\": {\"hp\": 1450,\"atk\": 100},\"3\": {\"hp\": 1740,\"atk\": 120},\"4\": {\"hp\": 2260,\"atk\": 140},\"5\": {\"hp\": 2940,\"atk\": 170},\"6\": {\"hp\": 3820,\"atk\": 200},\"7\": {\"hp\": 4970,\"atk\": 260},\"8\": {\"hp\": 6460,\"atk\": 340},\"9\": {\"hp\": 8400,\"atk\": 440}}", "tier": "B"},
  {"name": "Pumpkin Guard", "rarity": "Epic", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Provoke", "abilityDesc": "Taunt enemies within a small area around self.", "level6Upgrade": "Intimidator Boost: The taunt range of the skill is increased.", "level7Upgrade": "Intimidate Boost (Passive): The taunt range of the skill is increased.", "stats": "{\"1\": {\"hp\": 5160,\"atk\": 188},\"2\": {\"hp\": 8000,\"atk\": 250},\"3\": {\"hp\": 12000,\"atk\": 440},\"4\": {\"hp\": 17400,\"atk\": 640},\"5\": {\"hp\": 24360,\"atk\": 900},\"6\": {\"hp\": 34100,\"atk\": 1260},\"7\": {\"hp\": 47740,\"atk\": 1760},\"8\": {\"hp\": 64450,\"atk\": 2380},\"9\": {\"hp\": 83790,\"atk\": 3090}}", "tier": "B"},
  {"name": "Rock Thrower", "rarity": "Epic", "class": "Warrior", "attribute": "Earth", "weakness": "Wind", "placement": "Front Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Firestone Barrage", "abilityDesc": "Each attack has a chance to deal moderate damage in a medium area and stun briefly.", "level6Upgrade": "Falling Meteorite (Passive): Increased damage of skill.", "level7Upgrade": "Trigger Mastery (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 2300,\"atk\": 50},\"2\": {\"hp\": 2760,\"atk\": 60},\"3\": {\"hp\": 3310,\"atk\": 70},\"4\": {\"hp\": 4300,\"atk\": 80},\"5\": {\"hp\": 5590,\"atk\": 100},\"6\": {\"hp\": 7270,\"atk\": 120},\"7\": {\"hp\": 9450,\"atk\": 160},\"8\": {\"hp\": 12290,\"atk\": 210},\"9\": {\"hp\": 15980,\"atk\": 270}}", "tier": "B"},
  {"name": "Royal Archer", "rarity": "Epic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Precision Strike", "abilityDesc": "Apply an attack speed buff to yourself that can stack up to 3 times.", "level6Upgrade": "Hunter's Instinct: Inflicts bonus damage against Boss enemies.", "level7Upgrade": "Swift Arrow: The number of skill stacks has been increased to 5.", "stats": "{\"1\": {\"hp\": 1440,\"atk\": 98},\"2\": {\"hp\": 1730,\"atk\": 120},\"3\": {\"hp\": 2080,\"atk\": 140},\"4\": {\"hp\": 2700,\"atk\": 170},\"5\": {\"hp\": 3510,\"atk\": 200},\"6\": {\"hp\": 4560,\"atk\": 240},\"7\": {\"hp\": 5930,\"atk\": 310},\"8\": {\"hp\": 7710,\"atk\": 400},\"9\": {\"hp\": 10020,\"atk\": 520}}", "tier": "B"},
  {"name": "Snowman Warrior", "rarity": "Epic", "class": "Support", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Snowball Bombardment", "abilityDesc": "Each attack has a chance to launch multiple snowballs, dealing moderate damage and briefly reducing the target's attack speed and movement speed.", "level6Upgrade": "Scatter Snowballs: Increased snowball count in skill.", "level7Upgrade": "Trigger Mastery (Passive): Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1240,\"atk\": 85},\"2\": {\"hp\": 1480,\"atk\": 100},\"3\": {\"hp\": 1780,\"atk\": 120},\"4\": {\"hp\": 2310,\"atk\": 140},\"5\": {\"hp\": 3000,\"atk\": 170},\"6\": {\"hp\": 3900,\"atk\": 200},\"7\": {\"hp\": 5070,\"atk\": 260},\"8\": {\"hp\": 6590,\"atk\": 340},\"9\": {\"hp\": 8570,\"atk\": 440}}", "tier": "B"},
  {"name": "Soul Usher", "rarity": "Epic", "class": "Support", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Lantern's Folly", "abilityDesc": "Upon death, deals single-target damage to a random enemy and reduces their attack speed. Stacks up to 6 times.", "level6Upgrade": "Soul-Reaping Coronation: The skill can deal more damage.", "level7Upgrade": "Ethereal Embers: The skill can reduce attack speed further.", "stats": "{\"1\": {\"hp\": 1440,\"atk\": 128},\"2\": {\"hp\": 1730,\"atk\": 150},\"3\": {\"hp\": 2080,\"atk\": 180},\"4\": {\"hp\": 2700,\"atk\": 220},\"5\": {\"hp\": 3510,\"atk\": 260},\"6\": {\"hp\": 4560,\"atk\": 310},\"7\": {\"hp\": 5930,\"atk\": 400},\"8\": {\"hp\": 7710,\"atk\": 520},\"9\": {\"hp\": 10020,\"atk\": 680}}", "tier": "B"},
  {"name": "Wooden Wizard", "rarity": "Epic", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid Row", "damageType": "Area Heal", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "House of Life", "abilityDesc": "Restore a moderate amount of health to all allies within a small area around self.", "level6Upgrade": "Heart of Nature: The duration of the healing skill is extended.", "level7Upgrade": "Zone Extension (Passive): Skill range increased.", "stats": "{\"1\": {\"hp\": 2360,\"atk\": 220},\"2\": {\"hp\": 3660,\"atk\": 340},\"3\": {\"hp\": 5490,\"atk\": 510},\"4\": {\"hp\": 7980,\"atk\": 740},\"5\": {\"hp\": 11140,\"atk\": 1040},\"6\": {\"hp\": 15600,\"atk\": 1460},\"7\": {\"hp\": 21840,\"atk\": 2040},\"8\": {\"hp\": 29480,\"atk\": 2750},\"9\": {\"hp\": 38320,\"atk\": 3580}}", "tier": "B"},
  {"name": "Ashen Arcanist", "rarity": "Legendary", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Flame Vortex", "abilityDesc": "Flame Vortex (Probability): Each attack has a chance to deal continuous moderate damage in a small area around the target.", "level6Upgrade": "Crimson Tempest (Passive): Extended duration of skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2720,\"atk\": 158},\"2\": {\"hp\": 4220,\"atk\": 240},\"3\": {\"hp\": 6330,\"atk\": 360},\"4\": {\"hp\": 9180,\"atk\": 520},\"5\": {\"hp\": 12850,\"atk\": 730},\"6\": {\"hp\": 17990,\"atk\": 1020},\"7\": {\"hp\": 25190,\"atk\": 1430},\"8\": {\"hp\": 34010,\"atk\": 1930},\"9\": {\"hp\": 44210,\"atk\": 2510}}", "tier": "A"},
  {"name": "Blast Dwarf", "rarity": "Legendary", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Explosive Slam", "abilityDesc": "Explosive Slam (Probability): Grants increased Attack Power to self.", "level6Upgrade": "Full Firepower (Passive): Increased skill activation chance.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2560,\"atk\": 91},\"2\": {\"hp\": 3970,\"atk\": 140},\"3\": {\"hp\": 5960,\"atk\": 210},\"4\": {\"hp\": 8640,\"atk\": 300},\"5\": {\"hp\": 12100,\"atk\": 420},\"6\": {\"hp\": 16940,\"atk\": 590},\"7\": {\"hp\": 23720,\"atk\": 830},\"8\": {\"hp\": 32020,\"atk\": 1120},\"9\": {\"hp\": 41630,\"atk\": 1460}}", "tier": "A"},
  {"name": "Bone Gunner", "rarity": "Legendary", "class": "Marksman", "attribute": "Water", "weakness": "Earth", "placement": "Back Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Execution Barrage", "abilityDesc": "Prioritizes enemies with attack speed below a certain threshold and deals AoE damage.", "level6Upgrade": "Saturation Fire - The skill can fire 1 additional bullet.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3020,\"atk\": 220},\"2\": {\"hp\": 4680,\"atk\": 340},\"3\": {\"hp\": 7020,\"atk\": 510},\"4\": {\"hp\": 10180,\"atk\": 740},\"5\": {\"hp\": 14250,\"atk\": 1040},\"6\": {\"hp\": 19950,\"atk\": 1460},\"7\": {\"hp\": 27930,\"atk\": 2040},\"8\": {\"hp\": 37710,\"atk\": 2750},\"9\": {\"hp\": 49020,\"atk\": 3580}}", "tier": "A"},
  {"name": "Elven Archer", "rarity": "Legendary", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Shadow Split-Arrow", "abilityDesc": "Shadow Split-Arrow (Probability): Each attack has a chance to fire multiple arrows, dealing minor damage.", "level6Upgrade": "Shadow Breaker (Passive): Shadow Arrow Split additionally reduces the target unit's physical resistance by a small amount.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3020,\"atk\": 272},\"2\": {\"hp\": 4680,\"atk\": 420},\"3\": {\"hp\": 7020,\"atk\": 630},\"4\": {\"hp\": 10180,\"atk\": 910},\"5\": {\"hp\": 14250,\"atk\": 1270},\"6\": {\"hp\": 19950,\"atk\": 1780},\"7\": {\"hp\": 27930,\"atk\": 2490},\"8\": {\"hp\": 37710,\"atk\": 3360},\"9\": {\"hp\": 49020,\"atk\": 4370}}", "tier": "A"},
  {"name": "Ghost Assassin", "rarity": "Legendary", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Blade Tempest", "abilityDesc": "Blade Tempest (Active): At the beginning of the battle, flash to the archer first to cause area damage. [Co-op]: Each attack has a chance to deal moderate damage to a large area.", "level6Upgrade": "Lethal Dagger (Passive): Increased damage of skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4560,\"atk\": 98},\"2\": {\"hp\": 7070,\"atk\": 150},\"3\": {\"hp\": 10610,\"atk\": 230},\"4\": {\"hp\": 15380,\"atk\": 330},\"5\": {\"hp\": 21530,\"atk\": 460},\"6\": {\"hp\": 30140,\"atk\": 640},\"7\": {\"hp\": 42200,\"atk\": 900},\"8\": {\"hp\": 56970,\"atk\": 1220},\"9\": {\"hp\": 74060,\"atk\": 1590}}", "tier": "A"},
  {"name": "Grace Priest", "rarity": "Legendary", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Single Heal", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Divine Heal", "abilityDesc": "Heal multiple random allies within a large area.", "level6Upgrade": "Sacred Focus (Passive): Increase healing ratio", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3620,\"atk\": 130},\"2\": {\"hp\": 5620,\"atk\": null},\"3\": {\"hp\": 8430,\"atk\": 300},\"4\": {\"hp\": 12220,\"atk\": 440},\"5\": {\"hp\": 17110,\"atk\": 620},\"6\": {\"hp\": 23950,\"atk\": 870},\"7\": {\"hp\": 33530,\"atk\": 1220},\"8\": {\"hp\": 45270,\"atk\": 1650},\"9\": {\"hp\": 58850,\"atk\": 2150}}", "tier": "A"},
  {"name": "Great Axe Warrior", "rarity": "Legendary", "class": "Warrior", "attribute": "Earth", "weakness": "Wind", "placement": "Front Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Earthquake Strike", "abilityDesc": "Prioritizes jumping to support units, causing area damage and stun. [Co-op]: Deals small-area damage and stuns the target.", "level6Upgrade": "Power of the Great Axe - Increases skill radius and stun duration.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4370,\"atk\": 110},\"2\": {\"hp\": 6780,\"atk\": 170},\"3\": {\"hp\": 10170,\"atk\": 260},\"4\": {\"hp\": 14750,\"atk\": 380},\"5\": {\"hp\": 20650,\"atk\": 530},\"6\": {\"hp\": 28910,\"atk\": 740},\"7\": {\"hp\": 40470,\"atk\": 1040},\"8\": {\"hp\": 54630,\"atk\": 1400},\"9\": {\"hp\": 71020,\"atk\": 1820}}", "tier": "A"},
  {"name": "Iron Bulwark", "rarity": "Legendary", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Suppression Chain", "abilityDesc": "Suppression Chain (Passive): Deals priority damage and slows to Supports on death; low-speed targets trigger additional AoE damage and slows.", "level6Upgrade": "Heavy Impact (Passive): The skill can deal more damage.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4860,\"atk\": 98},\"2\": {\"hp\": 7530,\"atk\": 150},\"3\": {\"hp\": 11300,\"atk\": 230},\"4\": {\"hp\": 16390,\"atk\": 330},\"5\": {\"hp\": 22950,\"atk\": 460},\"6\": {\"hp\": 32130,\"atk\": 640},\"7\": {\"hp\": 44980,\"atk\": 900},\"8\": {\"hp\": 60720,\"atk\": 1220},\"9\": {\"hp\": 78940,\"atk\": 1590}}", "tier": "A"},
  {"name": "Ironguard", "rarity": "Legendary", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Shield", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Vital Shining", "abilityDesc": "Applies a shield to self that absorbs incoming damage.", "level6Upgrade": "Emergency Guard - Skill cooldown is reduced.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4860,\"atk\": 108},\"2\": {\"hp\": 7530,\"atk\": 170},\"3\": {\"hp\": 11300,\"atk\": 260},\"4\": {\"hp\": 16390,\"atk\": 380},\"5\": {\"hp\": 22950,\"atk\": 530},\"6\": {\"hp\": 32130,\"atk\": 740},\"7\": {\"hp\": 44980,\"atk\": 1040},\"8\": {\"hp\": 60720,\"atk\": 1400},\"9\": {\"hp\": 78940,\"atk\": 1820}}", "tier": "A"},
  {"name": "Sakura Ronin", "rarity": "Legendary", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Draw Slash: Sakura", "abilityDesc": "Draw Slash: Sakura (Probability): Each attack has a chance to deal moderate damage to a wide area of nearby enemies.", "level6Upgrade": "Concentrate: Blade (Passive): Increased damage dealt by skills.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4860,\"atk\": 108},\"2\": {\"hp\": 7530,\"atk\": 170},\"3\": {\"hp\": 11300,\"atk\": 260},\"4\": {\"hp\": 16390,\"atk\": 380},\"5\": {\"hp\": 22950,\"atk\": 530},\"6\": {\"hp\": 32130,\"atk\": 740},\"7\": {\"hp\": 44980,\"atk\": 1040},\"8\": {\"hp\": 60720,\"atk\": 1400},\"9\": {\"hp\": 78940,\"atk\": 1820}}", "tier": "A"},
  {"name": "Ursa Champion", "rarity": "Legendary", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Timber Crash", "abilityDesc": "Timber Crash (Probability): Each attack has a chance to toss multiple stakes that briefly stun enemies around the target", "level6Upgrade": "Rolling Barrage (Passive): Increased stake count in skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3760,\"atk\": 108},\"2\": {\"hp\": 5830,\"atk\": 170},\"3\": {\"hp\": 8750,\"atk\": 260},\"4\": {\"hp\": 12690,\"atk\": 380},\"5\": {\"hp\": 17770,\"atk\": 530},\"6\": {\"hp\": 24880,\"atk\": 740},\"7\": {\"hp\": 34830,\"atk\": 1040},\"8\": {\"hp\": 47020,\"atk\": 1400},\"9\": {\"hp\": 61130,\"atk\": 1820}}", "tier": "A"},
  {"name": "Wind Apostle", "rarity": "Legendary", "class": "Mage", "attribute": "Wind", "weakness": "Wood", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Wind Surge", "abilityDesc": "Deals area damage over time and applies a pull effect. [Co-op]: Deals area damage over time and applies a slow effect.", "level6Upgrade": "Gale Prison (Passive): Increases skill duration. [Co-op]: Increases skill duration.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2560,\"atk\": 142},\"2\": {\"hp\": 3970,\"atk\": 220},\"3\": {\"hp\": 5960,\"atk\": 330},\"4\": {\"hp\": 8640,\"atk\": 480},\"5\": {\"hp\": 12100,\"atk\": 670},\"6\": {\"hp\": 16940,\"atk\": 940},\"7\": {\"hp\": 23720,\"atk\": 1320},\"8\": {\"hp\": 32020,\"atk\": 1780},\"9\": {\"hp\": 41630,\"atk\": 2310}}", "tier": "A"},
  {"name": "Windlord", "rarity": "Legendary", "class": "Mage", "attribute": "Wind", "weakness": "Wood", "placement": "Back Row", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Whirlwind Orb", "abilityDesc": "Deals high single-target damage and reduces the target's Wind Resistance. The resistance reduction effect can stack up to 3 times.", "level6Upgrade": "Tempest Buildup (Passive): The resistance reduction effect can be stacked up to 6 times.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3020,\"atk\": 217},\"2\": {\"hp\": 4680,\"atk\": 340},\"3\": {\"hp\": 7020,\"atk\": 510},\"4\": {\"hp\": 10180,\"atk\": 740},\"5\": {\"hp\": 14250,\"atk\": 1040},\"6\": {\"hp\": 19950,\"atk\": 1460},\"7\": {\"hp\": 27930,\"atk\": 2040},\"8\": {\"hp\": 37710,\"atk\": 2750},\"9\": {\"hp\": 49020,\"atk\": 3580}}", "tier": "A"},
  {"name": "Barbarian Tyrant", "rarity": "Mythic", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Control", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Tyrant's Taunt", "abilityDesc": "Leap towards enemy archers and mages, providing yourself with physical defense and taunting surrounding enemies (Charge: 6s). [Co-op]: Deals heavy damage to enemies in a medium area", "level6Upgrade": "Taunt Duration (Passive): Extend the taunting time. [Co-op]: Attacks deal bonus moderate damage to low-HP enemies", "level7Upgrade": "Lv.9: Resistance Up (Passive): Increases the physical defense provided by skills. [Co-op]: When skill is triggered, reduces own attack slightly and increases attack speed moderately", "stats": "{\"1\": {\"hp\": 7640,\"atk\": 128},\"2\": {\"hp\": 11840,\"atk\": 200},\"3\": {\"hp\": 17760,\"atk\": 300},\"4\": {\"hp\": 25750,\"atk\": 440},\"5\": {\"hp\": 36050,\"atk\": 620},\"6\": {\"hp\": 50470,\"atk\": 870},\"7\": {\"hp\": 70660,\"atk\": 1220},\"8\": {\"hp\": 95390,\"atk\": 1650},\"9\": {\"hp\": 124000,\"atk\": 2150}}", "tier": "S"},
  {"name": "Blazeking", "rarity": "Mythic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 10, "ability": "Eternal Blaze", "abilityDesc": "Deal high-amount continuous damage in a large area.", "level6Upgrade": "Flame Aura (Passive): Grants moderate attack buffs to nearby allies.", "level7Upgrade": "Lv.9: Ignite Boost - Skill damage is increased.", "stats": "{\"1\": {\"hp\": 4160,\"atk\": 138},\"2\": {\"hp\": 6450,\"atk\": 210},\"3\": {\"hp\": 9680,\"atk\": 320},\"4\": {\"hp\": 14040,\"atk\": 460},\"5\": {\"hp\": 19660,\"atk\": 640},\"6\": {\"hp\": 27520,\"atk\": 900},\"7\": {\"hp\": 38530,\"atk\": 1260},\"8\": {\"hp\": 52020,\"atk\": 1700},\"9\": {\"hp\": 67630,\"atk\": 2210}}", "tier": "S"},
  {"name": "Blazewing Lord", "rarity": "Mythic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 15, "ability": "Ignite", "abilityDesc": "Launch a fireball that ignites the target, dealing damage over time.", "level6Upgrade": "Embers Everlasting - Skill duration increased.", "level7Upgrade": "Flammable Status - Reduces fire resistance of ignited targets.", "stats": "{\"1\": {\"hp\": 3840,\"atk\": 298},\"2\": {\"hp\": 5950,\"atk\": 460},\"3\": {\"hp\": 8930,\"atk\": 690},\"4\": {\"hp\": 12950,\"atk\": 1000},\"5\": {\"hp\": 18130,\"atk\": 1400},\"6\": {\"hp\": 25380,\"atk\": 1960},\"7\": {\"hp\": 35530,\"atk\": 2740},\"8\": {\"hp\": 47970,\"atk\": 3700},\"9\": {\"hp\": 62360,\"atk\": 4810}}", "tier": "S"},
  {"name": "Bone Marksman", "rarity": "Mythic", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 15, "ability": "Bone Shot", "abilityDesc": "Prioritize marksman and mages to fire 1 bullets that can penetrate the path of enemies.", "level6Upgrade": "Flaw Exploit - If skill target has low Attack Speed, fire 1 extra shot.", "level7Upgrade": "Lv.9: Rapid Shot (Passive): Cooldown reduced", "stats": "{\"1\": {\"hp\": 4040,\"atk\": 288},\"2\": {\"hp\": 8080,\"atk\": 580},\"3\": {\"hp\": 16160,\"atk\": 1160},\"4\": {\"hp\": 32320,\"atk\": 2320},\"5\": {\"hp\": 38780,\"atk\": 2780},\"6\": {\"hp\": 46540,\"atk\": 3340},\"7\": {\"hp\": 55850,\"atk\": 4010},\"8\": {\"hp\": 61440,\"atk\": 4410},\"9\": {\"hp\": 67580,\"atk\": 4850}}", "tier": "S"},
  {"name": "Darkmoon Queen", "rarity": "Mythic", "class": "Support", "attribute": "Water", "weakness": "Earth", "placement": "Back Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 15, "ability": "Dark Moon Barrier", "abilityDesc": "Prioritize summoning a Dark Moon Barrier at the Archer and Mage positions, dealing minor damage and preventing the use of attacks and skills.", "level6Upgrade": "Spirit Surge (Passive): Cooldown reduced.", "level7Upgrade": "Lv.9: Dark Moon Persistence (Passive): Dark Moon Barrier duration increased.", "stats": "{\"1\": {\"hp\": 3730,\"atk\": 288},\"2\": {\"hp\": 5780,\"atk\": 450},\"3\": {\"hp\": 8670,\"atk\": 680},\"4\": {\"hp\": 12570,\"atk\": 990},\"5\": {\"hp\": 17600,\"atk\": 1390},\"6\": {\"hp\": 24640,\"atk\": 1950},\"7\": {\"hp\": 34500,\"atk\": 2730},\"8\": {\"hp\": 46580,\"atk\": 3690},\"9\": {\"hp\": 60550,\"atk\": 4800}}", "tier": "S"},
  {"name": "Firepower Vanguard", "rarity": "Mythic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 15, "ability": "Rain of Bullets", "abilityDesc": "Rain of Bullets (Active): At the start of the battle, fire a high-damage bullet at the Warrior first, dealing high single-target damage", "level6Upgrade": "Skybane (Passive): Skill damage increased.", "level7Upgrade": "Lv.9: Firepower Verdict (Passive): Fires two bullets instead", "stats": "{\"1\": {\"hp\": 3950,\"atk\": 312},\"2\": {\"hp\": 6120,\"atk\": 480},\"3\": {\"hp\": 9180,\"atk\": 720},\"4\": {\"hp\": 13310,\"atk\": 1040},\"5\": {\"hp\": 18630,\"atk\": 1460},\"6\": {\"hp\": 26080,\"atk\": 2040},\"7\": {\"hp\": 36510,\"atk\": 2860},\"8\": {\"hp\": 49290,\"atk\": 3860},\"9\": {\"hp\": 64080,\"atk\": 5020}}", "tier": "S"},
  {"name": "Flame Duelist", "rarity": "Mythic", "class": "Tank", "attribute": "Fire", "weakness": "Water", "placement": "Front Row", "damageType": "Single", "defense": "High", "moveSpeed": "High", "atkSpeed": "High", "elixir": 8, "ability": "Furious Blood", "abilityDesc": "Attacks have a chance to restore the user's health on hit. [Co-op]: Increases skill damage.", "level6Upgrade": "Bloodfire Edge (Passive): Restores a huge amount of energy to self after killing an enemy.", "level7Upgrade": "Lv.9: Bloodfire Edge (Passive): Restores a huge amount of energy to self after killing an enemy", "stats": "{\"1\": {\"hp\": 7200,\"atk\": 175},\"2\": {\"hp\": 11160,\"atk\": 270},\"3\": {\"hp\": 16740,\"atk\": 410},\"4\": {\"hp\": 24270,\"atk\": 590},\"5\": {\"hp\": 33980,\"atk\": 830},\"6\": {\"hp\": 47570,\"atk\": 1160},\"7\": {\"hp\": 66600,\"atk\": 1620},\"8\": {\"hp\": 89910,\"atk\": 2190},\"9\": {\"hp\": 116800,\"atk\": 2850}}", "tier": "S"},
  {"name": "Frost Queen", "rarity": "Mythic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 8, "ability": "Blizzard", "abilityDesc": "Summon a blizzard at the start, dealing large area damage over time and slowing enemies.", "level6Upgrade": "Lingering Chill (Passive): Skill duration increased.", "level7Upgrade": "Lv.9: Freezing Strike (Passive): Also reduces enemy attack speed.", "stats": "{\"1\": {\"hp\": 3080,\"atk\": 142},\"2\": {\"hp\": 4770,\"atk\": 220},\"3\": {\"hp\": 7160,\"atk\": 330},\"4\": {\"hp\": 10380,\"atk\": 480},\"5\": {\"hp\": 14530,\"atk\": 670},\"6\": {\"hp\": 20340,\"atk\": 940},\"7\": {\"hp\": 28480,\"atk\": 1320},\"8\": {\"hp\": 38450,\"atk\": 1780},\"9\": {\"hp\": 49990,\"atk\": 2310}}", "tier": "S"},
  {"name": "Fury Cannoneer", "rarity": "Mythic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 15, "ability": "Overload!", "abilityDesc": "Overload! (Probability): Attacks have a chance to grant a self-buff to Attack and Attack Speed, stacking up to 3 times.", "level6Upgrade": "Ultimate Bombard (Passive): Deals a small amount of bonus damage to low-HP units", "level7Upgrade": "Lv.9: Iron Deterrence (Passive): Each attack has a chance to apply a long-duration stun effect to the target", "stats": "{\"1\": {\"hp\": 3580,\"atk\": 128},\"2\": {\"hp\": 5550,\"atk\": 200},\"3\": {\"hp\": 8330,\"atk\": 300},\"4\": {\"hp\": 12080,\"atk\": 440},\"5\": {\"hp\": 16910,\"atk\": 620},\"6\": {\"hp\": 23670,\"atk\": 870},\"7\": {\"hp\": 33140,\"atk\": 1220},\"8\": {\"hp\": 44740,\"atk\": 1650},\"9\": {\"hp\": 58160,\"atk\": 2150}}", "tier": "S"},
  {"name": "Geomancer", "rarity": "Mythic", "class": "Mage", "attribute": "Earth", "weakness": "Wind", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 8, "ability": "Infernal Trial", "abilityDesc": "Dealing high damage in a large area. [Co-op]: Deals area damage to enemies and inflicts reduced physical resistance and slow.", "level6Upgrade": "Arcane Pulse (Passive): Skill damage is increased. [Co-op]: Skill debuff durations are extended.", "level7Upgrade": "Lv.9: Mystic Amplification (Passive): Reduces skill cooldown. [Co-op]: Increases skill damage.", "stats": "{\"1\": {\"hp\": 3800,\"atk\": 138},\"2\": {\"hp\": 5890,\"atk\": 210},\"3\": {\"hp\": 8840,\"atk\": 320},\"4\": {\"hp\": 12820,\"atk\": 460},\"5\": {\"hp\": 17950,\"atk\": 640},\"6\": {\"hp\": 25130,\"atk\": 900},\"7\": {\"hp\": 35180,\"atk\": 1260},\"8\": {\"hp\": 47490,\"atk\": 1700},\"9\": {\"hp\": 61740,\"atk\": 2210}}", "tier": "S"},
  {"name": "Goddess of War", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Shield Fortify", "abilityDesc": "Increase the amount of shield provided. [Co-op]: Increases own attack speed slightly after killing an enemy.", "level6Upgrade": "Charge Race Up (Passive): Reduce the energy required to charge skills. [Co-op]: Increases stun duration of skill.", "level7Upgrade": "Lv.9: Charge Rate Up (Passive): Reduce the energy required to charge skills. [Co-op]: Increases stun duration of skill.", "stats": "{\"1\": {\"hp\": 7480,\"atk\": 124},\"2\": {\"hp\": 11590,\"atk\": 190},\"3\": {\"hp\": 17390,\"atk\": 290},\"4\": {\"hp\": 25220,\"atk\": 420},\"5\": {\"hp\": 35310,\"atk\": 590},\"6\": {\"hp\": 49430,\"atk\": 830},\"7\": {\"hp\": 69200,\"atk\": 1160},\"8\": {\"hp\": 93420,\"atk\": 1570},\"9\": {\"hp\": 121400,\"atk\": 2040}}", "tier": "S"},
  {"name": "Gryphon Knight", "rarity": "Mythic", "class": "Warrior", "attribute": "Wind", "weakness": "Wood", "placement": "Front Row", "damageType": "Area", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Tempest Call", "abilityDesc": "Deals area damage to enemies, applying knockback and slow. [Co-op]: Deals area damage to enemies and applies stun.", "level6Upgrade": "Thunder Smash (Passive): Increases skill stun duration. [Co-op]: Increases skill stun duration.", "level7Upgrade": "Lv.9: Lightning Fury (Passive): Increases skill damage. [Co-op]: Increases skill damage.", "stats": "{\"1\": {\"hp\": 7380,\"atk\": 162},\"2\": {\"hp\": 11440,\"atk\": 250},\"3\": {\"hp\": 17160,\"atk\": 380},\"4\": {\"hp\": 24880,\"atk\": 550},\"5\": {\"hp\": 34830,\"atk\": 770},\"6\": {\"hp\": 48760,\"atk\": 1080},\"7\": {\"hp\": 68260,\"atk\": 1510},\"8\": {\"hp\": 92150,\"atk\": 2040},\"9\": {\"hp\": 119800,\"atk\": 2650}}", "tier": "S"},
  {"name": "Jungle Ranger", "rarity": "Mythic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Arrowstorm", "abilityDesc": "Deals moderate damage to enemies in a small area.", "level6Upgrade": "Energized Shot (Passive): Skill deals bonus moderate damage to high-HP units.", "level7Upgrade": "Lv.9: Focused Precision (Charge/Time) (10 Secs): Gradually grants self stacking attack buffs over time.", "stats": "{\"1\": {\"hp\": 4040,\"atk\": 288},\"2\": {\"hp\": 6260,\"atk\": 450},\"3\": {\"hp\": 9390,\"atk\": 680},\"4\": {\"hp\": 13620,\"atk\": 990},\"5\": {\"hp\": 19070,\"atk\": 1390},\"6\": {\"hp\": 26700,\"atk\": 1950},\"7\": {\"hp\": 37380,\"atk\": 2730},\"8\": {\"hp\": 50460,\"atk\": 3690},\"9\": {\"hp\": 65600,\"atk\": 4800}}", "tier": "S"},
  {"name": "Melody Weaver", "rarity": "Mythic", "class": "Support", "attribute": "Wind", "weakness": "Wood", "placement": "Mid Row", "damageType": "Buff", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Heroic Anthem", "abilityDesc": "Heroic Anthem (Charge: Time 10 Secs): Grants moderate attack speed bonus to nearby allied units in a large area", "level6Upgrade": "Swift Sonata (Passive): Grants allies sustained attack speed bonus", "level7Upgrade": "Lv.9: Vitality Overture (Passive): When skill is activated, grants moderate energy to allied units in a large area", "stats": "{\"1\": {\"hp\": 3730,\"atk\": 288},\"2\": {\"hp\": 5780,\"atk\": 450},\"3\": {\"hp\": 8670,\"atk\": 680},\"4\": {\"hp\": 12570,\"atk\": 990},\"5\": {\"hp\": 17600,\"atk\": 1390},\"6\": {\"hp\": 24640,\"atk\": 1950},\"7\": {\"hp\": 34500,\"atk\": 2730},\"8\": {\"hp\": 46580,\"atk\": 3690},\"9\": {\"hp\": 60550,\"atk\": 4800}}", "tier": "S"},
  {"name": "Mist Archer", "rarity": "Mythic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 8, "ability": "Misty Domain", "abilityDesc": "Deals area-of-effect damage over time and inflicts reduced attack speed and movement speed.", "level6Upgrade": "Endless Tide (Passive): The skill's duration is increased.", "level7Upgrade": "Binding Waters (Passive): The skill's slow effect is increased.", "stats": "{\"1\": {\"hp\": 3840,\"atk\": 298},\"2\": {\"hp\": 5950,\"atk\": 460},\"3\": {\"hp\": 8930,\"atk\": 690},\"4\": {\"hp\": 12950,\"atk\": 1000},\"5\": {\"hp\": 18130,\"atk\": 1400},\"6\": {\"hp\": 25380,\"atk\": 1960},\"7\": {\"hp\": 35530,\"atk\": 2740},\"8\": {\"hp\": 47970,\"atk\": 3700},\"9\": {\"hp\": 62360,\"atk\": 4810}}", "tier": "S"},
  {"name": "Night Scion", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 15, "ability": "Shadow Pounce", "abilityDesc": "Blinks to the lowest-HP Mage unit, dealing AoE damage.", "level6Upgrade": "Umbral Refill (Passive): Gain 120 energy instantly upon killing an enemy", "level7Upgrade": "Lv.9: Shadow Surge (Passive): Increase skill damage", "stats": "{\"1\": {\"hp\": 7850,\"atk\": 192},\"2\": {\"hp\": 12170,\"atk\": 300},\"3\": {\"hp\": 18260,\"atk\": 450},\"4\": {\"hp\": 26480,\"atk\": 650},\"5\": {\"hp\": 37070,\"atk\": 910},\"6\": {\"hp\": 51900,\"atk\": 1270},\"7\": {\"hp\": 72660,\"atk\": 1780},\"8\": {\"hp\": 98090,\"atk\": 2400},\"9\": {\"hp\": 127500,\"atk\": 3120}}", "tier": "S"},
  {"name": "Nine Tailed Fox", "rarity": "Mythic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Mystic Foxfire", "abilityDesc": "Mystic Foxfire (Charge Time 7 Seconds): Deals massive damage to the target and ignores a small amount of the target's fire resistance.", "level6Upgrade": "Foxfire Augmentation (Passive): Each attack grants a small attack bonus to self, stacking up to 5 times.", "level7Upgrade": "Lv.9: Searing Flames (Passive): Each attack can grant self the ability to partially ignore enemy fire resistance.", "stats": "{\"1\": {\"hp\": 3840,\"atk\": 298},\"2\": {\"hp\": 5950,\"atk\": 460},\"3\": {\"hp\": 8930,\"atk\": 690},\"4\": {\"hp\": 12950,\"atk\": 1000},\"5\": {\"hp\": 18130,\"atk\": 1400},\"6\": {\"hp\": 25380,\"atk\": 1960},\"7\": {\"hp\": 35530,\"atk\": 2740},\"8\": {\"hp\": 47970,\"atk\": 3700},\"9\": {\"hp\": 62360,\"atk\": 4810}}", "tier": "S"},
  {"name": "Radiant Warrior", "rarity": "Mythic", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Toughness", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 15, "ability": "Radiant Aegis", "abilityDesc": "At battle start, grant shields to nearby allies.", "level6Upgrade": "Eternal Radiance - Also increase allies' all-element resistance.", "level7Upgrade": "Lv.9: Divine Guard (Passive): Increase shield amount", "stats": "{\"1\": {\"hp\": 9840,\"atk\": 144},\"2\": {\"hp\": 15250,\"atk\": 220},\"3\": {\"hp\": 22880,\"atk\": 330},\"4\": {\"hp\": 33180,\"atk\": 480},\"5\": {\"hp\": 46450,\"atk\": 670},\"6\": {\"hp\": 65030,\"atk\": 940},\"7\": {\"hp\": 91040,\"atk\": 1320},\"8\": {\"hp\": 122900,\"atk\": 1780},\"9\": {\"hp\": 159700,\"atk\": 2310}}", "tier": "S"},
  {"name": "Red Blade", "rarity": "Mythic", "class": "Warrior", "attribute": "Wind", "weakness": "Wood", "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Blitz Bolt", "abilityDesc": "Prioritize targeting archers and mages, then teleport to their side to deal continuous area damage.", "level6Upgrade": "Damage Boost (Passive): Increase skill damage.", "level7Upgrade": "Lv.9: Damage Boost (Passive): Increase Skill Damage", "stats": "{\"1\": {\"hp\": 5360,\"atk\": 152},\"2\": {\"hp\": 8310,\"atk\": 240},\"3\": {\"hp\": 12470,\"atk\": 360},\"4\": {\"hp\": 18080,\"atk\": 520},\"5\": {\"hp\": 25310,\"atk\": 730},\"6\": {\"hp\": 35430,\"atk\": 1020},\"7\": {\"hp\": 49600,\"atk\": 1430},\"8\": {\"hp\": 66960,\"atk\": 1930},\"9\": {\"hp\": 87050,\"atk\": 2510}}", "tier": "S"},
  {"name": "Ripple Wizard", "rarity": "Mythic", "class": "Support", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Buff", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Aqua Revival", "abilityDesc": "Grants moderate energy to nearby allies in a large area.", "level6Upgrade": "Wave Nourishment (Passive): When skill is triggered, grants a small amount of bonus energy to allies in range.", "level7Upgrade": "Lv.9: Impact Surge (Passive): Each attack has a chance to randomly restore medium energy to a certain number of friendly units within a large range. [Co-op]: Each attack has a chance to briefly stun enemies in a small area.", "stats": "{\"1\": {\"hp\": 4160,\"atk\": 282},\"2\": {\"hp\": 6450,\"atk\": 440},\"3\": {\"hp\": 9680,\"atk\": 660},\"4\": {\"hp\": 14040,\"atk\": 960},\"5\": {\"hp\": 19640,\"atk\": 1340},\"6\": {\"hp\": 27520,\"atk\": 1880},\"7\": {\"hp\": 38530,\"atk\": 2630},\"8\": {\"hp\": 52020,\"atk\": 3550},\"9\": {\"hp\": 67630,\"atk\": 4620}}", "tier": "S"},
  {"name": "Seraph", "rarity": "Mythic", "class": "Warrior", "attribute": "Fire", "weakness": "Water", "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 15, "ability": "Judgment Blade", "abilityDesc": "Summon a sword array, causing large-scale damage.", "level6Upgrade": "Holy Power (Passive): Flame sword wave disables enemy attacks and skills briefly", "level7Upgrade": "Lv.9: Blade Aura - Increase skill damage.", "stats": "{\"1\": {\"hp\": 7480,\"atk\": 210},\"2\": {\"hp\": 11590,\"atk\": 330},\"3\": {\"hp\": 17390,\"atk\": 500},\"4\": {\"hp\": 25220,\"atk\": 730},\"5\": {\"hp\": 35310,\"atk\": 1020},\"6\": {\"hp\": 49430,\"atk\": 1430},\"7\": {\"hp\": 69200,\"atk\": 2000},\"8\": {\"hp\": 93420,\"atk\": 2700},\"9\": {\"hp\": 121400,\"atk\": 3510}}", "tier": "S"},
  {"name": "Starlight Apostle", "rarity": "Mythic", "class": "Support", "attribute": "Wind", "weakness": "Wood", "placement": "Mid Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 15, "ability": "Stellar Canticle", "abilityDesc": "Stellar Canticle (Charge: 20/ATK 140 Energy): Grants moderate attack bonus to nearby allied units in a large area. [Co-op]: Deals damage to the target and stuns them.", "level6Upgrade": "Divine Grace (Passive): The attack power bonus of the skill can be stacked up to 3 times. [Co-op]: Attacks have a 15% chance to grant nearby allies 30% attack power for 2 seconds, stacking up to 5 times.", "level7Upgrade": "Lv.9: Stellar Bind (Passive): Each attack has a chance to stun the target. [Co-op]: Recharges own energy at regular intervals.", "stats": "{\"1\": {\"hp\": 4040,\"atk\": 268},\"2\": {\"hp\": 6260,\"atk\": 420},\"3\": {\"hp\": 9390,\"atk\": 630},\"4\": {\"hp\": 13620,\"atk\": 910},\"5\": {\"hp\": 19070,\"atk\": 1270},\"6\": {\"hp\": 26700,\"atk\": 1780},\"7\": {\"hp\": 37380,\"atk\": 2490},\"8\": {\"hp\": 50460,\"atk\": 3360},\"9\": {\"hp\": 65600,\"atk\": 4370}}", "tier": "S"},
  {"name": "Storm Maiden", "rarity": "Mythic", "class": "Mage", "attribute": "Wind", "weakness": "Wood", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 15, "ability": "Storm Gathering", "abilityDesc": "Storm Gathering (Charge: 20/ATK) (60 Energy): Deals heavy area damage and applies knockback. [Co-op]: Deals heavy area damage.", "level6Upgrade": "Storm Verdict (Passive): Normal attacks deal bonus damage to low-health enemies. [Co-op]: Normal attacks deal bonus damage to low-health enemies.", "level7Upgrade": "Lv.9: Hurricane Force - Permanently grants a small attack bonus to self. [Co-op]: Permanently grants a small attack bonus to self.", "stats": "{\"1\": {\"hp\": 3080,\"atk\": 142},\"2\": {\"hp\": 4770,\"atk\": 220},\"3\": {\"hp\": 7160,\"atk\": 330},\"4\": {\"hp\": 10380,\"atk\": 480},\"5\": {\"hp\": 14530,\"atk\": 670},\"6\": {\"hp\": 20340,\"atk\": 940},\"7\": {\"hp\": 28480,\"atk\": 1320},\"8\": {\"hp\": 38450,\"atk\": 1780},\"9\": {\"hp\": 49990,\"atk\": 2310}}", "tier": "S"},
  {"name": "The Blade of Earth", "rarity": "Mythic", "class": "Tank", "attribute": "Earth", "weakness": "Wind", "placement": "Front Row", "damageType": "Toughness", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 15, "ability": "Earth Force", "abilityDesc": "Summon a rock shield to gain short-term damage reduction.", "level6Upgrade": "Lasting Guard (Passive): Skill duration increased", "level7Upgrade": "Lv.9: Earth Echo (Passive): Skill cooldown reduced", "stats": "{\"1\": {\"hp\": 8200,\"atk\": 120},\"2\": {\"hp\": 12710,\"atk\": 190},\"3\": {\"hp\": 19070,\"atk\": 290},\"4\": {\"hp\": 27650,\"atk\": 420},\"5\": {\"hp\": 38710,\"atk\": 590},\"6\": {\"hp\": 54190,\"atk\": 830},\"7\": {\"hp\": 75870,\"atk\": 1160},\"8\": {\"hp\": 102400,\"atk\": 1570},\"9\": {\"hp\": 133100,\"atk\": 2040}}", "tier": "S"},
  {"name": "The Knight King", "rarity": "Mythic", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 8, "ability": "Power Infusion", "abilityDesc": "Deals high damage to the target.", "level6Upgrade": "Tempered Reforge (Passive): Each attack has a chance to deal high damage to the target.", "level7Upgrade": "Lv.9: Battle Hardened (Passive): Greatly increases own attack speed after killing an enemy.", "stats": "{\"1\": {\"hp\": 9840,\"atk\": 120},\"2\": {\"hp\": 15250,\"atk\": 190},\"3\": {\"hp\": 22880,\"atk\": 290},\"4\": {\"hp\": 33180,\"atk\": 420},\"5\": {\"hp\": 46450,\"atk\": 590},\"6\": {\"hp\": 65030,\"atk\": 830},\"7\": {\"hp\": 91040,\"atk\": 1160},\"8\": {\"hp\": 122900,\"atk\": 1570},\"9\": {\"hp\": 159700,\"atk\": 2040}}", "tier": "S"},
  {"name": "Tide Lord", "rarity": "Mythic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 10, "ability": "Vortex Eye", "abilityDesc": "Prioritize Mage and Archer units to deal moderate-amount continuous damage and apply a pull effect in a large area.", "level6Upgrade": "Tide Aura - Provide moderate attack speed increase for nearby allies.", "level7Upgrade": "Lv.9: Tidal Flow - Skill cooldown reduced.", "stats": "{\"1\": {\"hp\": 4040,\"atk\": 298},\"2\": {\"hp\": 6260,\"atk\": 460},\"3\": {\"hp\": 9390,\"atk\": 690},\"4\": {\"hp\": 13620,\"atk\": 1000},\"5\": {\"hp\": 19070,\"atk\": 1400},\"6\": {\"hp\": 26700,\"atk\": 1960},\"7\": {\"hp\": 37380,\"atk\": 2740},\"8\": {\"hp\": 50460,\"atk\": 3700},\"9\": {\"hp\": 65600,\"atk\": 4810}}", "tier": "S"},
  {"name": "Venospore Killer", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Mid Row", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 8, "ability": "Piercing Blow", "abilityDesc": "Flash to the high-health mage first, causing heavy single target damage and silence. [Co-op]: Deals high damage to low HP enemies.", "level6Upgrade": "Spirit Drain (Passive): Increases own attack speed slightly after killing an enemy.", "level7Upgrade": "Lv.9: Relentless Pursuit (Passive): Stuns enemies in a small area for a long duration after killing an enemy.", "stats": "{\"1\": {\"hp\": 5760,\"atk\": 235},\"2\": {\"hp\": 8930,\"atk\": 360},\"3\": {\"hp\": 13400,\"atk\": 540},\"4\": {\"hp\": 19430,\"atk\": 780},\"5\": {\"hp\": 27200,\"atk\": 1090},\"6\": {\"hp\": 38080,\"atk\": 1530},\"7\": {\"hp\": 53310,\"atk\": 2140},\"8\": {\"hp\": 71970,\"atk\": 2890},\"9\": {\"hp\": 93560,\"atk\": 3760}}", "tier": "S"},
  {"name": "Woodland Guardian", "rarity": "Mythic", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Sylvan Aegis", "abilityDesc": "Sylvan Aegis (Charge: Time 12 Seconds): Heal all allies within a medium area", "level6Upgrade": "Life Bloom (Passive): Increase healing ratio", "level7Upgrade": "Lv.9: Nature's Ward (Passive): Gain brief all-element resistance when healing", "stats": "{\"1\": {\"hp\": 7200,\"atk\": 108},\"2\": {\"hp\": 11160,\"atk\": 170},\"3\": {\"hp\": 16740,\"atk\": 260},\"4\": {\"hp\": 24270,\"atk\": 380},\"5\": {\"hp\": 33980,\"atk\": 530},\"6\": {\"hp\": 47570,\"atk\": 740},\"7\": {\"hp\": 66600,\"atk\": 1040},\"8\": {\"hp\": 89910,\"atk\": 1400},\"9\": {\"hp\": 116800,\"atk\": 1820}}", "tier": "S"},
];;

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

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", heroes: storage.getHeroCount(), timestamp: new Date().toISOString() });
  });

  // Helper to extract visitor ID from request
  function getVisitorId(req: Request): string {
    return (req.headers['x-visitor-id'] as string) || 'dev-local';
  }

  // Helper to get authenticated user from request via visitor session
  function getUserFromRequest(req: Request): User | null {
    const visitorId = getVisitorId(req);
    const session = storage.getSessionByVisitorId(visitorId);
    if (!session) return null;
    const user = storage.getUserById(session.userId);
    return user || null;
  }

  // Helper to require admin access
  function requireAdmin(req: Request, res: Response): User | null {
    const user = getUserFromRequest(req);
    if (!user) { res.status(401).json({ message: "Not authenticated" }); return null; }
    if (!user.isAdmin) { res.status(403).json({ message: "Admin access required" }); return null; }
    return user;
  }

  // --- Auth Routes (public) ---

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = storage.getUserByUsername(username.trim().toLowerCase());
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const normalizedUsername = username.trim().toLowerCase();
      const isAdmin = normalizedUsername === "hamncheese" ? 1 : 0;
      const user = storage.createUser(normalizedUsername, passwordHash, isAdmin);
      const visitorId = getVisitorId(req);
      storage.createSession(visitorId, user.id);
      res.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      const user = storage.getUserByUsername(username.trim().toLowerCase());
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const visitorId = getVisitorId(req);
      storage.createSession(visitorId, user.id);
      res.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const visitorId = getVisitorId(req);
    storage.deleteSession(visitorId);
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
  });

  // --- Hero Routes (public) ---

  app.get("/api/heroes", (_req, res) => {
    const { rarity, class: heroClass, placement, attribute } = _req.query;
    const filters: any = {};
    if (rarity) filters.rarity = rarity as string;
    if (heroClass) filters.class = heroClass as string;
    if (placement) filters.placement = placement as string;
    if (attribute) filters.attribute = attribute as string;
    const hasFilters = Object.keys(filters).length > 0;
    const result = hasFilters ? storage.getHeroesFiltered(filters) : storage.getAllHeroes();
    res.json(result);
  });

  app.get("/api/heroes/:id", (req, res) => {
    const hero = storage.getHeroById(Number(req.params.id));
    if (!hero) return res.status(404).json({ message: "Hero not found" });
    res.json(hero);
  });

  // --- Protected Routes (require auth) ---

  app.get("/api/roster", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const roster = storage.getRoster(user.id);
    res.json(roster);
  });

  app.post("/api/roster", (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const { heroId, level } = req.body;
      const hero = storage.getHeroById(heroId);
      if (!hero) return res.status(404).json({ message: "Hero not found" });
      const parsed = insertRosterSchema.parse({
        heroId,
        level: level || 1,
        userId: user.id,
      });
      const entry = storage.addToRoster(parsed);
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/roster/:id", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const id = Number(req.params.id);
    const entry = storage.getRosterEntry(id);
    if (!entry) return res.status(404).json({ message: "Roster entry not found" });
    const { level } = req.body;
    const newLevel = Math.min(9, Math.max(1, level ?? entry.level));
    const updated = storage.updateRosterLevel(id, newLevel);
    res.json(updated);
  });

  app.delete("/api/roster/:id", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const id = Number(req.params.id);
    storage.removeFromRoster(id);
    res.json({ success: true });
  });

  app.get("/api/lineups", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const result = storage.getLineups(user.id);
    res.json(result);
  });

  app.post("/api/lineups", (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertLineupSchema.parse({ ...req.body, userId: user.id });
      const lineup = storage.saveLineup(parsed);
      res.json(lineup);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/lineups/:id", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const id = Number(req.params.id);
    storage.deleteLineup(id);
    res.json({ success: true });
  });

  app.get("/api/export", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const data = storage.exportUserData(user.id);
    res.json(data);
  });

  app.post("/api/import", (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const { roster, lineups } = req.body;
      if (!Array.isArray(roster) || !Array.isArray(lineups)) {
        return res.status(400).json({ message: "Invalid import data: expected { roster: [...], lineups: [...] }" });
      }
      storage.importUserData(user.id, { roster, lineups });
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  // POST /api/optimize — accepts optional elixirBudget
  app.post("/api/optimize", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const { mode, formation, enemyFormation, enemyHeroIds, elixirBudget, huntingBoss } = req.body;
    const roster = storage.getRoster(user.id);
    const allHeroes = storage.getAllHeroes();

    if (roster.length === 0) {
      return res.status(400).json({ message: "Add heroes to your roster first" });
    }

    const budget = typeof elixirBudget === "number" && elixirBudget > 0 ? elixirBudget : 100;
    const result = optimizeLineup(roster, allHeroes, mode, budget, formation, enemyFormation, enemyHeroIds, huntingBoss);
    res.json(result);
  });

  // --- Admin Routes ---

  app.put("/api/admin/heroes/:id", (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    const hero = storage.getHeroById(id);
    if (!hero) return res.status(404).json({ message: "Hero not found" });
    try {
      const updated = storage.updateHero(id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/admin/heroes", (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    try {
      const parsed = insertHeroSchema.parse(req.body);
      const hero = storage.insertHero(parsed);
      res.json(hero);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/heroes/:id", (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    const hero = storage.getHeroById(id);
    if (!hero) return res.status(404).json({ message: "Hero not found" });
    storage.deleteHero(id);
    res.json({ success: true });
  });

  app.patch("/api/admin/heroes/:id/tier", (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    const { tier } = req.body;
    if (!tier || !["S", "A", "B", "C", "D"].includes(tier)) {
      return res.status(400).json({ message: "Invalid tier. Must be S, A, B, C, or D" });
    }
    const updated = storage.updateHero(id, { tier });
    if (!updated) return res.status(404).json({ message: "Hero not found" });
    res.json(updated);
  });

  // Changelog (GET is public)
  app.get("/api/changelog", (_req, res) => {
    res.json(storage.getChangelog());
  });

  app.post("/api/admin/changelog", (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }
    try {
      const entry = storage.addChangelog(title, description);
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/admin/changelog/:id", (req, res) => {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    storage.deleteChangelog(id);
    res.json({ success: true });
  });

  return httpServer;
}

// Helper to get power from stats JSON
function getHeroPower(statsJson: string, level: number): number {
  try {
    const stats = JSON.parse(statsJson);
    const lvl = stats[String(level)];
    if (lvl) return (lvl.hp || 0) + (lvl.atk || 0);
  } catch {}
  return 0;
}

// Helper to get ATK from stats JSON at a given level
function getHeroAtk(statsJson: string, level: number): number {
  try {
    const stats = JSON.parse(statsJson);
    const lvl = stats[String(level)];
    if (lvl) return lvl.atk || 0;
  } catch {}
  return 0;
}

// Optimization engine
function optimizeLineup(
  roster: any[],
  allHeroes: any[],
  mode: string,
  elixirBudget: number,
  formation?: string,
  enemyFormation?: string,
  enemyHeroIds?: number[],
  huntingBoss?: string
) {
  const tierScore: Record<string, number> = {
    S: 10, A: 8, B: 6, C: 4, D: 2
  };

  const scoredHeroes = roster.map(entry => {
    const hero = entry.hero;
    let score = 0;

    const power = getHeroPower(hero.stats, entry.level);
    score += power / 100;
    score += entry.level * 10;
    score += (tierScore[hero.tier] || 2) * 2;

    switch (mode) {
      case "Arena":
        if (formation === "Backstab" && hero.name === "Bomber") score += 20;
        if (formation === "Dash" && hero.name === "Oracle") score += 20;
        if (formation === "Dash" && hero.class === "Support") score += 5;
        if (hero.class === "Tank") score += 3;
        break;
      case "Hunting":
        // Boss hunting mode — prioritize high single-target DPS and debuffers
        if (hero.class === "Marksman" || hero.class === "Assassin") score += 10;
        if (hero.class === "Mage") score += 6;
        if (hero.class === "Support") score += 8;
        if (hero.name === "Royal Archer") score += 15;
        if (hero.name === "Nine-Tailed Fox") score += 12;

        // Boss-specific scoring
        if (huntingBoss === "Twin-Dragon") {
          // Twin-Dragon: weakness Wind, resists Water & Fire
          if (hero.attribute === "Wind") score += 20;
          if (hero.attribute === "Water") score -= 15;
          if (hero.attribute === "Fire") score -= 15;
          // DPS classes get a bonus (maximize damage)
          if (hero.class === "Marksman" || hero.class === "Assassin" || hero.class === "Mage") score += 10;
        } else if (huntingBoss === "Evil Ivy") {
          // Evil Ivy: weakness Fire, resists Wood
          if (hero.attribute === "Fire") score += 20;
          if (hero.attribute === "Wood") score -= 15;
          // DPS classes get a bonus
          if (hero.class === "Marksman" || hero.class === "Assassin" || hero.class === "Mage") score += 10;
          // Evil Ivy reduces defense, so high ATK matters more
          const heroAtk = getHeroAtk(hero.stats, entry.level);
          if (heroAtk >= 400) score += 5;
        }
        break;
      case "Infinite War":
        if (hero.class === "Support") score += 10;
        if (hero.class === "Tank") score += 8;
        if (hero.name === "Seraph") score += 15;
        if (hero.name === "Wooden Wizard") score += 10;
        break;
      case "Clan War":
        // Similar to Arena but broader — balanced teams matter
        if (hero.class === "Tank") score += 5;
        if (hero.class === "Support") score += 5;
        if (hero.class === "Warrior") score += 3;
        if (hero.tier === "S") score += 5;
        break;
      case "Clan Hunt":
        if (hero.class === "Marksman" || hero.class === "Mage" || hero.class === "Assassin") score += 12;
        if (hero.name === "Royal Archer") score += 15;
        if (hero.name === "Nine-Tailed Fox") score += 10;
        if (hero.name === "Mist Archer") score += 10;
        break;
      case "Adventure":
        if (hero.class === "Tank" && hero.placement === "Front") score += 8;
        if (hero.class === "Support") score += 5;
        if (hero.class === "Marksman" || hero.class === "Mage") score += 5;
        break;
    }

    if (mode === "Arena" && enemyFormation) {
      if (enemyFormation === "Backstab" && formation === "Split") score += 5;
      if (enemyFormation === "Dash" && formation === "Backstab") score += 5;
      if (enemyFormation === "Split" && formation === "Dash") score += 5;
    }

    return { ...entry, score, hero };
  });

  scoredHeroes.sort((a, b) => b.score - a.score);

  const selected: any[] = [];
  let totalElixir = 0;

  const bestTank = scoredHeroes.find(h => h.hero.class === "Tank" && h.hero.placement === "Front");
  if (bestTank && totalElixir + bestTank.hero.elixir <= elixirBudget) {
    selected.push(bestTank);
    totalElixir += bestTank.hero.elixir;
  }

  const bestSupport = scoredHeroes.find(h => h.hero.class === "Support" && !selected.includes(h));
  if (bestSupport && totalElixir + bestSupport.hero.elixir <= elixirBudget) {
    selected.push(bestSupport);
    totalElixir += bestSupport.hero.elixir;
  }

  for (const hero of scoredHeroes) {
    if (selected.length >= 21) break; // 7x3 usable slots
    if (selected.includes(hero)) continue;
    if (totalElixir + hero.hero.elixir > elixirBudget) continue;
    selected.push(hero);
    totalElixir += hero.hero.elixir;
  }

  let suggestedFormation = formation;
  if (mode === "Arena" && !formation) {
    if (enemyFormation === "Dash") suggestedFormation = "Backstab";
    else if (enemyFormation === "Backstab") suggestedFormation = "Split";
    else if (enemyFormation === "Split") suggestedFormation = "Dash";
    else if (enemyFormation === "Outflank") suggestedFormation = "Split";
    else suggestedFormation = "Dash";
  }

  const placements: Record<string, any[]> = { Front: [], Mid: [], Back: [] };
  for (const entry of selected) {
    const pos = entry.hero.placement;
    if (placements[pos]) {
      placements[pos].push(entry);
    }
  }

  const reasoning = selected.map(entry => {
    const reasons: string[] = [];
    if (entry.level >= 7) reasons.push("High level (" + entry.level + ")");
    if (entry.hero.tier === "S") reasons.push("S-tier hero");
    if (entry.hero.tier === "A") reasons.push("A-tier hero");
    if (mode === "Arena" && formation === "Backstab" && entry.hero.name === "Bomber") reasons.push("Bomber is essential for Backstab formation");
    if (mode === "Clan Hunt" && (entry.hero.class === "Marksman" || entry.hero.class === "Assassin")) reasons.push("DPS priority for single-target boss damage");
    if (reasons.length === 0) reasons.push("Best available " + entry.hero.class + " (score: " + entry.score.toFixed(0) + ")");
    return {
      heroId: entry.hero.id,
      heroName: entry.hero.name,
      placement: entry.hero.placement,
      reasons: reasons.join("; "),
      score: entry.score,
    };
  });

  let counterPickAdvice = "";
  if (mode === "Arena" && enemyFormation) {
    const counterMap: Record<string, string> = {
      "Dash": "Use Backstab to bypass their front line and devastate their back line DPS.",
      "Backstab": "Use Split formation to divide your forces and avoid their backstab targets.",
      "Outflank": "Use Split to counter their flanking maneuver, or Backstab for aggressive play.",
      "Split": "Use Dash formation \u2014 their split forces will have weakened aura synergies."
    };
    counterPickAdvice = counterMap[enemyFormation] || "Standard formation recommended.";
  }

  const totalPower = selected.reduce((sum, entry) => {
    return sum + getHeroPower(entry.hero.stats, entry.level);
  }, 0);

  return {
    lineup: selected.map(e => ({
      rosterId: e.id,
      heroId: e.hero.id,
      heroName: e.hero.name,
      level: e.level,
      placement: e.hero.placement,
      class: e.hero.class,
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
