import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRosterSchema, insertLineupSchema, type User } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Hero data to seed
const heroSeedData: any[] = [
  {"name": "Archer", "rarity": "Common", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 2, "ability": "Split Arrow", "abilityDesc": "Each attack has a chance to fire multiple bullets.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 530, \"atk\": 42}, \"2\": {\"hp\": 640, \"atk\": 50}, \"3\": {\"hp\": 770, \"atk\": 60}, \"4\": {\"hp\": 920, \"atk\": 70}, \"5\": {\"hp\": 1100, \"atk\": 80}, \"6\": {\"hp\": 1320, \"atk\": 100}, \"7\": {\"hp\": 1720, \"atk\": 130}, \"8\": {\"hp\": 2240, \"atk\": 170}, \"9\": {\"hp\": 2910, \"atk\": 220}}", "tier": "D"},
  {"name": "Demoman", "rarity": "Common", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Spark Burst", "abilityDesc": "Each attack has a chance to apply a brief stun.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 770, \"atk\": 30}, \"2\": {\"hp\": 920, \"atk\": 40}, \"3\": {\"hp\": 1100, \"atk\": 50}, \"4\": {\"hp\": 1320, \"atk\": 60}, \"5\": {\"hp\": 1580, \"atk\": 70}, \"6\": {\"hp\": 1900, \"atk\": 80}, \"7\": {\"hp\": 2470, \"atk\": 100}, \"8\": {\"hp\": 3210, \"atk\": 130}, \"9\": {\"hp\": 4170, \"atk\": 170}}", "tier": "D"},
  {"name": "Gunner", "rarity": "Common", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Multishot Barrage", "abilityDesc": "Each attack has a chance to fire multiple bullets.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 620, \"atk\": 30}, \"2\": {\"hp\": 740, \"atk\": 40}, \"3\": {\"hp\": 890, \"atk\": 50}, \"4\": {\"hp\": 1070, \"atk\": 60}, \"5\": {\"hp\": 1280, \"atk\": 70}, \"6\": {\"hp\": 1540, \"atk\": 80}, \"7\": {\"hp\": 2000, \"atk\": 100}, \"8\": {\"hp\": 2600, \"atk\": 130}, \"9\": {\"hp\": 3380, \"atk\": 170}}", "tier": "D"},
  {"name": "Snowball Thrower", "rarity": "Common", "class": "Support", "attribute": "Water", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Snowball Impact", "abilityDesc": "Each attack has a chance to apply moderate slow.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\": {\"hp\": 610, \"atk\": 34}, \"2\": {\"hp\": 730, \"atk\": 40}, \"3\": {\"hp\": 880, \"atk\": 50}, \"4\": {\"hp\": 1060, \"atk\": 60}, \"5\": {\"hp\": 1270, \"atk\": 70}, \"6\": {\"hp\": 1520, \"atk\": 80}, \"7\": {\"hp\": 1980, \"atk\": 100}, \"8\": {\"hp\": 2570, \"atk\": 130}, \"9\": {\"hp\": 3340, \"atk\": 170}}", "tier": "D"},
  {"name": "Swordsman", "rarity": "Common", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Short", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Slash", "abilityDesc": "Each attack has a chance to deal moderate damage to nearby enemies within a medium range.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 600, \"atk\": 30}, \"2\": {\"hp\": 780, \"atk\": 39}, \"3\": {\"hp\": 960, \"atk\": 48}, \"4\": {\"hp\": 1140, \"atk\": 57}, \"5\": {\"hp\": 1320, \"atk\": 66}, \"6\": {\"hp\": 1500, \"atk\": 75}, \"7\": {\"hp\": 1680, \"atk\": 84}, \"8\": {\"hp\": 1860, \"atk\": 93}, \"9\": {\"hp\": 2040, \"atk\": 102}}", "tier": "B"},
  {"name": "Woodshield Guard", "rarity": "Common", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Control", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 2, "ability": "Iron Hammer Strike", "abilityDesc": "Attack has a small chance to briefly stun a single enemy.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2020, \"atk\": 98}, \"2\": {\"hp\": 2420, \"atk\": 120}, \"3\": {\"hp\": 2900, \"atk\": 140}, \"4\": {\"hp\": 3480, \"atk\": 170}, \"5\": {\"hp\": 4180, \"atk\": 200}, \"6\": {\"hp\": 5020, \"atk\": 240}, \"7\": {\"hp\": 6530, \"atk\": 310}, \"8\": {\"hp\": 8490, \"atk\": 400}, \"9\": {\"hp\": 11040, \"atk\": 520}}", "tier": "B"},
  {"name": "Apprentice Mage", "rarity": "Rare", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Damage", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Arcane Scatter", "abilityDesc": "Each attack has a chance to launch multiple magic orbs.", "level6Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1000, \"atk\": 100}, \"2\": {\"hp\": 1200, \"atk\": 120}, \"3\": {\"hp\": 1690, \"atk\": 130}, \"4\": {\"hp\": 2200, \"atk\": 160}, \"5\": {\"hp\": 2840, \"atk\": 190}, \"6\": {\"hp\": 3720, \"atk\": 230}, \"7\": {\"hp\": 4840, \"atk\": 300}, \"8\": {\"hp\": 6290, \"atk\": 390}, \"9\": {\"hp\": 8180, \"atk\": 510}}", "tier": "B"},
  {"name": "Berserker", "rarity": "Rare", "class": "Warrior", "attribute": "Water", "weakness": "Earth", "placement": "Front Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Whirlwind Axe", "abilityDesc": "Each attack has a chance to deal minor duration in a small area and apply slow.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1460, \"atk\": 40}, \"2\": {\"hp\": 1760, \"atk\": 50}, \"3\": {\"hp\": 2110, \"atk\": 60}, \"4\": {\"hp\": 2740, \"atk\": 70}, \"5\": {\"hp\": 3560, \"atk\": 80}, \"6\": {\"hp\": 4630, \"atk\": 100}, \"7\": {\"hp\": 6020, \"atk\": 130}, \"8\": {\"hp\": 7830, \"atk\": 170}, \"9\": {\"hp\": 10180, \"atk\": 220}}", "tier": "B"},
  {"name": "Bomber", "rarity": "Rare", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Front Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Self-Destruct", "abilityDesc": "Deal medium-range damage upon death.", "level6Upgrade": "Echoing Stun: Explosion briefly stuns nearby enemy units.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 960, \"atk\": 260}, \"2\": {\"hp\": 1300, \"atk\": 350}, \"3\": {\"hp\": 1690, \"atk\": 460}, \"4\": {\"hp\": 2110, \"atk\": 580}, \"5\": {\"hp\": 2640, \"atk\": 730}, \"6\": {\"hp\": 3300, \"atk\": 910}, \"7\": {\"hp\": 4130, \"atk\": 1140}}", "tier": "B"},
  {"name": "Cannon Chariot", "rarity": "Rare", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Cannon Chariot", "abilityDesc": "Attack has a small chance to deal area damage.", "level6Upgrade": "Trigger Master: Increased trigger chance for skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 980, \"atk\": 105}, \"2\": {\"hp\": 1180, \"atk\": 120}, \"3\": {\"hp\": 2280, \"atk\": 240}, \"4\": {\"hp\": 3110, \"atk\": 350}, \"5\": {\"hp\": 4630, \"atk\": 490}, \"6\": {\"hp\": 6480, \"atk\": 690}, \"7\": {\"hp\": 9070, \"atk\": 970}, \"8\": {\"hp\": 12240, \"atk\": 1310}, \"9\": {\"hp\": 15910, \"atk\": 1700}}", "tier": "B"},
  {"name": "Flail Warden", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Shockwave Slam", "abilityDesc": "Each attack has a chance to deal moderate damage in a medium area.", "level6Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1500, \"atk\": 42}, \"2\": {\"hp\": 1800, \"atk\": 50}, \"3\": {\"hp\": 2160, \"atk\": 60}, \"4\": {\"hp\": 2810, \"atk\": 70}, \"5\": {\"hp\": 3650, \"atk\": 80}, \"6\": {\"hp\": 4750, \"atk\": 100}, \"7\": {\"hp\": 6180, \"atk\": 130}}", "tier": "B"},
  {"name": "Forest Scout", "rarity": "Rare", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Cyclone Spin", "abilityDesc": "Each attack has a chance to fire multiple high-damage projectiles.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1130, \"atk\": 105}, \"2\": {\"hp\": 1350, \"atk\": 130}, \"3\": {\"hp\": 1620, \"atk\": 160}, \"4\": {\"hp\": 2110, \"atk\": 190}, \"5\": {\"hp\": 2740, \"atk\": 230}, \"6\": {\"hp\": 3560, \"atk\": 280}, \"7\": {\"hp\": 4630, \"atk\": 360}, \"8\": {\"hp\": 6020, \"atk\": 470}, \"9\": {\"hp\": 7830, \"atk\": 610}}", "tier": "B"},
  {"name": "Frost Skeleton", "rarity": "Rare", "class": "Warrior", "attribute": "Water", "weakness": "Earth", "placement": "Front Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Glacial Rupture", "abilityDesc": "Upon death, continuously reduces the attack speed of nearby enemies. Stacks up to 100 times.", "level6Upgrade": "Cold Mastery: The skill can reduce attack speed further.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1460, \"atk\": 40}, \"2\": {\"hp\": 1760, \"atk\": 50}, \"3\": {\"hp\": 2110, \"atk\": 60}, \"4\": {\"hp\": 2740, \"atk\": 70}, \"5\": {\"hp\": 3560, \"atk\": 80}, \"6\": {\"hp\": 4630, \"atk\": 100}, \"7\": {\"hp\": 6020, \"atk\": 130}}", "tier": "C"},
  {"name": "Gale Wolf", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 1, "ability": "Bloodlust", "abilityDesc": "Gain a temporary attack speed boost when at low health.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1420, \"atk\": 80}, \"2\": {\"hp\": 1700, \"atk\": 100}, \"3\": {\"hp\": 2040, \"atk\": 120}, \"4\": {\"hp\": 2650, \"atk\": 140}, \"5\": {\"hp\": 3450, \"atk\": 170}, \"6\": {\"hp\": 4490, \"atk\": 200}, \"7\": {\"hp\": 5840, \"atk\": 260}, \"8\": {\"hp\": 7590, \"atk\": 340}, \"9\": {\"hp\": 9870, \"atk\": 440}}", "tier": "B"},
  {"name": "Goblin Chef", "rarity": "Rare", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3560, \"atk\": 188}, \"2\": {\"hp\": 5520, \"atk\": 290}, \"3\": {\"hp\": 8280, \"atk\": 440}, \"4\": {\"hp\": 12010, \"atk\": 640}, \"5\": {\"hp\": 16810, \"atk\": 900}, \"6\": {\"hp\": 23530, \"atk\": 1260}, \"7\": {\"hp\": 32940, \"atk\": 1760}, \"8\": {\"hp\": 44470, \"atk\": 2380}, \"9\": {\"hp\": 57810, \"atk\": 3090}}", "tier": "B"},
  {"name": "Goblin Shaman", "rarity": "Rare", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Arcane Regeneration", "abilityDesc": "Randomly restore a small amount of health to allies within a small area around self (10s cooldown).", "level6Upgrade": null, "level7Upgrade": "Healing Expansion (Passive) \u2013 Increased number of allies healed by the skill.", "stats": "{\"1\": {\"hp\": 1150, \"atk\": 102}, \"2\": {\"hp\": 1380, \"atk\": 120}, \"3\": {\"hp\": 1660, \"atk\": 140}, \"4\": {\"hp\": 1990, \"atk\": 170}, \"5\": {\"hp\": 2390, \"atk\": 200}, \"6\": {\"hp\": 2870, \"atk\": 240}, \"7\": {\"hp\": 3730, \"atk\": 310}, \"8\": {\"hp\": 4850, \"atk\": 400}, \"9\": {\"hp\": 6310, \"atk\": 520}}", "tier": "C"},
  {"name": "Goblin Warrior", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 3, "ability": "Battle Sprinstorm", "abilityDesc": "Each attack has a chance to grant an attack power bonus.", "level6Upgrade": "Power Strike: Enhanced effects from skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1730, \"atk\": 60}, \"2\": {\"hp\": 2070, \"atk\": 70}, \"3\": {\"hp\": 2480, \"atk\": 80}, \"4\": {\"hp\": 3220, \"atk\": 100}, \"5\": {\"hp\": 4190, \"atk\": 120}, \"6\": {\"hp\": 5450, \"atk\": 140}, \"7\": {\"hp\": 7090, \"atk\": 180}}", "tier": "B"},
  {"name": "Paladin", "rarity": "Rare", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Shield", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Divine Shield Protection", "abilityDesc": "Generate a shield for self that absorbs a small amount of damage.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2000, \"atk\": 70}, \"2\": {\"hp\": 2400, \"atk\": 90}, \"3\": {\"hp\": 2820, \"atk\": 110}, \"4\": {\"hp\": 3670, \"atk\": 130}, \"5\": {\"hp\": 4770, \"atk\": 160}, \"6\": {\"hp\": 6200, \"atk\": 190}, \"7\": {\"hp\": 8060, \"atk\": 250}, \"8\": {\"hp\": 10480, \"atk\": 330}, \"9\": {\"hp\": 13620, \"atk\": 430}}", "tier": "B"},
  {"name": "Bone Warlock", "rarity": "Epic", "class": "Support", "attribute": "Wind", "weakness": "Wood", "placement": "Back Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Grasp of Aveness", "abilityDesc": "Prioritizes Marksmen. Deals AoE damage and reduces attack speed (stacks up to 3 times). If the enemy's attack speed is low, restores extra Energy.", "level6Upgrade": "Deceptive Trick - The skill can deal more damage.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2360, \"atk\": 192}, \"2\": {\"hp\": 3460, \"atk\": 300}, \"3\": {\"hp\": 5490, \"atk\": 450}, \"4\": {\"hp\": 7960, \"atk\": 650}, \"5\": {\"hp\": 11140, \"atk\": 910}, \"6\": {\"hp\": 15600, \"atk\": 1270}, \"7\": {\"hp\": 21840, \"atk\": 1780}, \"8\": {\"hp\": 29480, \"atk\": 2400}, \"9\": {\"hp\": 38320, \"atk\": 3120}}", "tier": "B"},
  {"name": "Dwarf Berserker", "rarity": "Epic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Heavy Hammer Sweep", "abilityDesc": "Deal damage to enemies within a small area around self.", "level6Upgrade": "Warhammer Blessing - The damage of the skill is increased.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2420, \"atk\": 92}, \"2\": {\"hp\": 2910, \"atk\": 110}, \"3\": {\"hp\": 3490, \"atk\": 130}, \"4\": {\"hp\": 4540, \"atk\": 160}, \"5\": {\"hp\": 5900, \"atk\": 190}, \"6\": {\"hp\": 7670, \"atk\": 230}, \"7\": {\"hp\": 9970, \"atk\": 300}}", "tier": "B"},
  {"name": "Flame Mage", "rarity": "Epic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Mid Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Fireball Arcana", "abilityDesc": "Each attack has a chance to deal heavy damage to a single enemy.", "level6Upgrade": "Blazing Combo: Skill deals extra damage to low-HP units.", "level7Upgrade": "Trigger Mastery: Increased trigger chance for skill.", "stats": "{\"1\": {\"hp\": 1440, \"atk\": 145}, \"2\": {\"hp\": 1730, \"atk\": 170}, \"3\": {\"hp\": 2080, \"atk\": 200}, \"4\": {\"hp\": 2700, \"atk\": 240}, \"5\": {\"hp\": 3510, \"atk\": 290}, \"6\": {\"hp\": 4560, \"atk\": 350}, \"7\": {\"hp\": 5930, \"atk\": 460}}", "tier": "B"},
  {"name": "Oracle", "rarity": "Epic", "class": "Support", "attribute": "Fire", "weakness": "Water", "placement": "Mid Row", "damageType": "Buff", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Divine Blessing", "abilityDesc": "Grants minor attack buffs to nearby allies, which can be stacked up to 20 layers.", "level6Upgrade": "Sacred Amplification: Enhanced effects from skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1440, \"atk\": 128}, \"2\": {\"hp\": 1730, \"atk\": 150}, \"3\": {\"hp\": 2080, \"atk\": 180}, \"4\": {\"hp\": 2700, \"atk\": 220}, \"5\": {\"hp\": 3510, \"atk\": 260}, \"6\": {\"hp\": 4560, \"atk\": 310}, \"7\": {\"hp\": 5930, \"atk\": 400}, \"8\": {\"hp\": 7710, \"atk\": 520}, \"9\": {\"hp\": 10020, \"atk\": 680}}", "tier": "B"},
  {"name": "Poison Master", "rarity": "Epic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Toxic Field", "abilityDesc": "Each attack has a chance to deal moderate duration damage in a small area.", "level6Upgrade": "Toxic Spread (Passive): Increased duration of Toxic Field effects.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": null, \"atk\": null}, \"2\": {\"hp\": null, \"atk\": null}, \"3\": {\"hp\": null, \"atk\": null}, \"4\": {\"hp\": 2260, \"atk\": 140}, \"5\": {\"hp\": 2940, \"atk\": 170}, \"6\": {\"hp\": 3820, \"atk\": 200}, \"7\": {\"hp\": 4970, \"atk\": 260}, \"8\": {\"hp\": 6440, \"atk\": 340}, \"9\": {\"hp\": 8400, \"atk\": 440}}", "tier": "B"},
  {"name": "Pumpkin Guard", "rarity": "Epic", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Provoke", "abilityDesc": "Taunt enemies within a small area around self.", "level6Upgrade": "Intimidator Boost: The taunt range of the skill is increased.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5160, \"atk\": 188}, \"2\": {\"hp\": 8000, \"atk\": 250}, \"3\": {\"hp\": 12000, \"atk\": 440}, \"4\": {\"hp\": 17400, \"atk\": 640}, \"5\": {\"hp\": 24360, \"atk\": 900}, \"6\": {\"hp\": 34100, \"atk\": 1260}, \"7\": {\"hp\": 47740, \"atk\": 1760}}", "tier": "B"},
  {"name": "Rock Thrower", "rarity": "Epic", "class": "Warrior", "attribute": "Earth", "weakness": "Wind", "placement": "Front Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Firestone Barrage", "abilityDesc": "Each attack has a chance to deal moderate damage in a medium area and stun briefly.", "level6Upgrade": "Falling Meteorite (Passive): Increased damage of skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2300, \"atk\": 50}, \"2\": {\"hp\": 2760, \"atk\": 60}, \"3\": {\"hp\": 3310, \"atk\": 70}, \"4\": {\"hp\": 4300, \"atk\": 80}, \"5\": {\"hp\": 5590, \"atk\": 100}, \"6\": {\"hp\": 7270, \"atk\": 120}, \"7\": {\"hp\": 9450, \"atk\": 160}, \"8\": {\"hp\": 12290, \"atk\": 210}, \"9\": {\"hp\": 15980, \"atk\": 270}}", "tier": "B"},
  {"name": "Royal Archer", "rarity": "Epic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Precision Strike", "abilityDesc": "Apply an attack speed buff to yourself that can stack up to 3 times.", "level6Upgrade": "Hunter's Instinct: Inflicts bonus damage against Boss enemies.", "level7Upgrade": "Swift Arrow: The number of skill stacks has been increased to 5.", "stats": "{\"1\": {\"hp\": 1440, \"atk\": 98}, \"2\": {\"hp\": 1730, \"atk\": 120}, \"3\": {\"hp\": 2080, \"atk\": 140}, \"4\": {\"hp\": 2700, \"atk\": 170}, \"5\": {\"hp\": 3510, \"atk\": 200}, \"6\": {\"hp\": 4560, \"atk\": 240}, \"7\": {\"hp\": 5930, \"atk\": 310}}", "tier": "B"},
  {"name": "Snowman Warrior", "rarity": "Epic", "class": "Support", "attribute": "Water", "weakness": null, "placement": "Mid Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Snowball Bombardment", "abilityDesc": "Each attack has a chance to launch multiple snowballs, dealing moderate damage and briefly reducing the target's attack speed and movement speed.", "level6Upgrade": "Scatter Snowballs: Increased snowball count in skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1240, \"atk\": 85}, \"2\": {\"hp\": 1480, \"atk\": 100}, \"3\": {\"hp\": 1780, \"atk\": 120}, \"4\": {\"hp\": 2310, \"atk\": 140}, \"5\": {\"hp\": 3000, \"atk\": 170}, \"6\": {\"hp\": 3900, \"atk\": 200}, \"7\": {\"hp\": 5070, \"atk\": 260}}", "tier": "B"},
  {"name": "Soul Usher", "rarity": "Epic", "class": "Support", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Control", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Lantern's Folly", "abilityDesc": "Upon death, deals single-target damage to a random enemy and reduces their attack speed. Stacks up to 6 times.", "level6Upgrade": "Soul-Reaping Coronation: The skill can deal more damage.", "level7Upgrade": "Ethereal Embers: The skill can reduce attack speed further.", "stats": "{\"1\": {\"hp\": 1440, \"atk\": 128}, \"2\": {\"hp\": 1730, \"atk\": 150}, \"3\": {\"hp\": 2080, \"atk\": 180}, \"4\": {\"hp\": 2700, \"atk\": 220}, \"5\": {\"hp\": 3510, \"atk\": 260}, \"6\": {\"hp\": 4560, \"atk\": 310}, \"7\": {\"hp\": 5930, \"atk\": 400}}", "tier": "B"},
  {"name": "Wooden Wizard", "rarity": "Epic", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid Row", "damageType": "Area Heal", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "House of Life", "abilityDesc": "Restore a moderate amount of health to all allies within a small area around self.", "level6Upgrade": "Heart of Nature: The duration of the healing skill is extended.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2360, \"atk\": 220}, \"2\": {\"hp\": 3660, \"atk\": 340}, \"3\": {\"hp\": 5490, \"atk\": 510}, \"4\": {\"hp\": 7980, \"atk\": 740}, \"5\": {\"hp\": 11140, \"atk\": 1040}, \"6\": {\"hp\": 15600, \"atk\": 1460}, \"7\": {\"hp\": 21840, \"atk\": 2040}}", "tier": "B"},
  {"name": "Ashen Arcanist", "rarity": "Legendary", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Blast Dwarf", "rarity": "Legendary", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Bone Gunner", "rarity": "Legendary", "class": "Marksman", "attribute": "Water", "weakness": "Earth", "placement": "Back Row", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Execution Barrage", "abilityDesc": "Prioritizes enemies with attack speed below a certain threshold and deals AoE damage.", "level6Upgrade": "Saturation Fire - The skill can fire 1 additional bullet.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3020, \"atk\": 220}, \"2\": {\"hp\": 4680, \"atk\": 340}, \"3\": {\"hp\": 7020, \"atk\": 510}, \"4\": {\"hp\": 10180, \"atk\": 740}, \"5\": {\"hp\": 14250, \"atk\": 1040}, \"6\": {\"hp\": 19950, \"atk\": 1460}}", "tier": "B"},
  {"name": "Elven Archer", "rarity": "Legendary", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Ghost Assassin", "rarity": "Legendary", "class": "Assassin", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Grace Priest", "rarity": "Legendary", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Single Heal", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Divine Heal", "abilityDesc": "Heal multiple random allies within a large area.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3620, \"atk\": 130}, \"2\": {\"hp\": 5420, \"atk\": 200}, \"3\": {\"hp\": 8430, \"atk\": 300}, \"4\": {\"hp\": 12220, \"atk\": 440}, \"5\": {\"hp\": 17110, \"atk\": 620}, \"6\": {\"hp\": 23950, \"atk\": 870}, \"7\": {\"hp\": 33530, \"atk\": 1220}, \"8\": {\"hp\": 45270, \"atk\": 1650}, \"9\": {\"hp\": 58850, \"atk\": 2150}}", "tier": "B"},
  {"name": "Great Axe Warrior", "rarity": "Legendary", "class": "Warrior", "attribute": "Earth", "weakness": "Wind", "placement": "Front Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Earthquake Strike", "abilityDesc": "Prioritizes jumping to support units, causing area damage and stun. [Co-op]: Deals small-area damage and stuns the target.", "level6Upgrade": "Power of the Great Axe - Increases skill radius and stun duration.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4370, \"atk\": 110}, \"2\": {\"hp\": 6780, \"atk\": 170}, \"3\": {\"hp\": 10170, \"atk\": 260}, \"4\": {\"hp\": 14750, \"atk\": 380}, \"5\": {\"hp\": 20650, \"atk\": 530}, \"6\": {\"hp\": 28910, \"atk\": 740}, \"7\": {\"hp\": 40470, \"atk\": 1040}, \"8\": {\"hp\": 54630, \"atk\": 1400}, \"9\": {\"hp\": 71020, \"atk\": 1820}}", "tier": "B"},
  {"name": "Ironguard", "rarity": "Legendary", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Toughness", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 7, "ability": "Vital Shining", "abilityDesc": "Applies a shield to self that absorbs incoming damage.", "level6Upgrade": "Emergency Guard - Skill cooldown is reduced.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4860, \"atk\": 108}, \"2\": {\"hp\": 7530, \"atk\": 170}, \"3\": {\"hp\": 11300, \"atk\": 260}, \"4\": {\"hp\": 16390, \"atk\": 380}, \"5\": {\"hp\": 22950, \"atk\": 530}, \"6\": {\"hp\": 32130, \"atk\": 740}, \"7\": {\"hp\": 44980, \"atk\": 1040}}", "tier": "B"},
  {"name": "Sakura Ronin", "rarity": "Legendary", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 5, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4860, \"atk\": 108}, \"2\": {\"hp\": 7530, \"atk\": 170}, \"3\": {\"hp\": 11300, \"atk\": 260}, \"4\": {\"hp\": 16390, \"atk\": 380}, \"5\": {\"hp\": 22950, \"atk\": 530}, \"6\": {\"hp\": 32130, \"atk\": 740}, \"7\": {\"hp\": 44980, \"atk\": 1040}, \"8\": {\"hp\": 60720, \"atk\": 1400}, \"9\": {\"hp\": 78940, \"atk\": 1820}}", "tier": "B"},
  {"name": "Ursa Champion", "rarity": "Legendary", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 6, "ability": "Rolling Barrage", "abilityDesc": "Increased stake count in skill.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3760, \"atk\": 108}, \"2\": {\"hp\": 5830, \"atk\": 170}, \"3\": {\"hp\": 8750, \"atk\": 260}, \"4\": {\"hp\": 12690, \"atk\": 380}, \"5\": {\"hp\": 17770, \"atk\": 530}, \"6\": {\"hp\": 24880, \"atk\": 740}, \"7\": {\"hp\": 34830, \"atk\": 1040}, \"8\": {\"hp\": 47020, \"atk\": 1400}, \"9\": {\"hp\": 61130, \"atk\": 1820}}", "tier": "B"},
  {"name": "Wind Apostle", "rarity": "Legendary", "class": "Mage", "attribute": "Wind", "weakness": "Wood", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Wind Surge", "abilityDesc": "Deals area damage over time and applies a pull effect. [Co-op]: Deals area damage over time and applies a slow effect.", "level6Upgrade": "Gale Prison (Passive): Increases skill duration. [Co-op]: Increases skill duration.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2560, \"atk\": 142}, \"2\": {\"hp\": 3970, \"atk\": 220}, \"3\": {\"hp\": 5960, \"atk\": 330}, \"4\": {\"hp\": 8640, \"atk\": 480}, \"5\": {\"hp\": 12100, \"atk\": 670}, \"6\": {\"hp\": 16940, \"atk\": 940}, \"7\": {\"hp\": 23720, \"atk\": 1320}, \"8\": {\"hp\": 32020, \"atk\": 1780}, \"9\": {\"hp\": 41630, \"atk\": 2310}}", "tier": "B"},
  {"name": "Windlord", "rarity": "Legendary", "class": "Mage", "attribute": "Wind", "weakness": "Wood", "placement": "Back Row", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 3, "ability": "Whirlwind Orb", "abilityDesc": "Deals high single-target damage and reduces the target's Wind Resistance. The resistance reduction effect can stack up to 3 times.", "level6Upgrade": "Tempest Buildup (Passive): The resistance reduction effect can be stacked up to 6 times.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3020, \"atk\": 217}, \"2\": {\"hp\": 4680, \"atk\": 340}, \"3\": {\"hp\": 7020, \"atk\": 510}, \"4\": {\"hp\": 10180, \"atk\": 740}, \"5\": {\"hp\": 14250, \"atk\": 1040}, \"6\": {\"hp\": 19950, \"atk\": 1460}, \"7\": {\"hp\": 27930, \"atk\": 2040}, \"8\": {\"hp\": null, \"atk\": null}, \"9\": {\"hp\": null, \"atk\": null}}", "tier": "B"},
  {"name": "Barbarian Tyrant", "rarity": "Mythic", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Tyrant's Taunt", "abilityDesc": "Leap towards enemy archers and mages, providing yourself with physical defense and taunting surrounding enemies (Charge: 6s).", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 7640, \"atk\": 128}, \"2\": {\"hp\": 11840, \"atk\": 200}, \"3\": {\"hp\": 17760, \"atk\": 300}, \"4\": {\"hp\": 25750, \"atk\": 440}, \"5\": {\"hp\": 36050, \"atk\": 620}, \"6\": {\"hp\": 50470, \"atk\": 870}, \"7\": {\"hp\": 70660, \"atk\": 1220}}", "tier": "S"},
  {"name": "Blazeking", "rarity": "Mythic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 8, "ability": "Eternal Blaze", "abilityDesc": "Deal high-amount continuous damage in a large area.", "level6Upgrade": "Ignite Boost - Skill damage is increased.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4160, \"atk\": 138}, \"2\": {\"hp\": 6450, \"atk\": 210}, \"3\": {\"hp\": 9680, \"atk\": 320}, \"4\": {\"hp\": 14040, \"atk\": 460}, \"5\": {\"hp\": 19660, \"atk\": 640}, \"6\": {\"hp\": 27520, \"atk\": 900}, \"7\": {\"hp\": 38530, \"atk\": 1260}, \"8\": {\"hp\": 52020, \"atk\": 1700}, \"9\": {\"hp\": 67630, \"atk\": 2210}}", "tier": "B"},
  {"name": "Blazewing Lord", "rarity": "Mythic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Ignite", "abilityDesc": "Launch a fireball that ignites the target, dealing damage over time.", "level6Upgrade": "Embers Everlasting - Skill duration increased.", "level7Upgrade": "Flammable Status - Reduces fire resistance of ignited targets.", "stats": "{\"1\": {\"hp\": 3840, \"atk\": 298}, \"2\": {\"hp\": 5950, \"atk\": 460}, \"3\": {\"hp\": 8930, \"atk\": 690}, \"4\": {\"hp\": 12950, \"atk\": 1000}, \"5\": {\"hp\": 18130, \"atk\": 1400}, \"6\": {\"hp\": 25380, \"atk\": 1960}, \"7\": {\"hp\": 35530, \"atk\": 2740}, \"8\": {\"hp\": 47970, \"atk\": 3700}, \"9\": {\"hp\": 62360, \"atk\": 4810}}", "tier": "B"},
  {"name": "Bone Marksman", "rarity": "Mythic", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Bone Shot", "abilityDesc": "Prioritize marksman and mages to fire 1 bullets that can penetrate the path of enemies.", "level6Upgrade": "Flaw Exploit - If skill target has low Attack Speed, fire 1 extra shot.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4040, \"atk\": 288}, \"2\": {\"hp\": 8080, \"atk\": 580}, \"3\": {\"hp\": 16160, \"atk\": 1160}, \"4\": {\"hp\": 32320, \"atk\": 2320}, \"5\": {\"hp\": 38780, \"atk\": 2780}, \"6\": {\"hp\": 46540, \"atk\": 3340}}", "tier": "B"},
  {"name": "Darkmoon Queen", "rarity": "Mythic", "class": "Support", "attribute": "Water", "weakness": "Earth", "placement": "Back Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Dark Moon Barrier", "abilityDesc": "Prioritize summoning a Dark Moon Barrier at the Archer and Mage positions, dealing minor damage and preventing the use of attacks and skills.", "level6Upgrade": "Dark Moon Persistence - Dark Moon Barrier duration increased.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3730, \"atk\": 288}, \"2\": {\"hp\": 5780, \"atk\": 450}, \"3\": {\"hp\": 8670, \"atk\": 680}, \"4\": {\"hp\": 12570, \"atk\": 990}, \"5\": {\"hp\": 17600, \"atk\": 1390}, \"6\": {\"hp\": 24640, \"atk\": 1950}, \"7\": {\"hp\": 34500, \"atk\": 2730}, \"8\": {\"hp\": 46580, \"atk\": 3690}, \"9\": {\"hp\": 60550, \"atk\": 4800}}", "tier": "B"},
  {"name": "Firepower Vanguard", "rarity": "Mythic", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Flame Duelist", "rarity": "Mythic", "class": "Tank", "attribute": "Fire", "weakness": "Water", "placement": "Front Row", "damageType": "Single", "defense": "High", "moveSpeed": "High", "atkSpeed": "High", "elixir": 4, "ability": "Furious Blood", "abilityDesc": "Attacks have a chance to restore the user's health on hit. [Co-op]: Increases skill damage.", "level6Upgrade": "Bloodfire Edge (Passive): Restores a huge amount of energy to self after killing an enemy.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 7200, \"atk\": 175}, \"2\": {\"hp\": 11160, \"atk\": 270}, \"3\": {\"hp\": 16740, \"atk\": 410}, \"4\": {\"hp\": 24270, \"atk\": 590}, \"5\": {\"hp\": 33980, \"atk\": 830}, \"6\": {\"hp\": 47570, \"atk\": 1160}, \"7\": {\"hp\": 66600, \"atk\": 1620}, \"8\": {\"hp\": 89910, \"atk\": 2190}, \"9\": {\"hp\": 116800, \"atk\": 2850}}", "tier": "B"},
  {"name": "Frost Queen", "rarity": "Mythic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 2, "ability": "Blizzard", "abilityDesc": "Summon a blizzard at the start, dealing large area damage over time and slowing enemies.", "level6Upgrade": "Lingering Chill (Passive): Skill duration increased.", "level7Upgrade": "Freezing Strike (Passive): Also reduces enemy attack speed.", "stats": "{\"1\": {\"hp\": null, \"atk\": null}, \"2\": {\"hp\": null, \"atk\": null}, \"3\": {\"hp\": 7160, \"atk\": 330}, \"4\": {\"hp\": 10380, \"atk\": 480}, \"5\": {\"hp\": 14530, \"atk\": 670}, \"6\": {\"hp\": 20340, \"atk\": 940}, \"7\": {\"hp\": 28480, \"atk\": 1320}, \"8\": {\"hp\": 38450, \"atk\": 1780}, \"9\": {\"hp\": 49990, \"atk\": 2310}}", "tier": "B"},
  {"name": "Fury Cannoneer", "rarity": "Mythic", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Geomancer", "rarity": "Mythic", "class": "Mage", "attribute": "Earth", "weakness": "Wind", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Infernal Wind", "abilityDesc": "Dealing high damage in a large area. [Co-op]: Deals area damage to enemies and inflicts reduced physical resistance and slow.", "level6Upgrade": "Arcane Pulse (Passive): Skill damage is increased. [Co-op]: Skill debuff durations are extended.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": null, \"atk\": null}, \"2\": {\"hp\": null, \"atk\": null}, \"3\": {\"hp\": 8840, \"atk\": 320}, \"4\": {\"hp\": 12820, \"atk\": 460}, \"5\": {\"hp\": 17950, \"atk\": 640}, \"6\": {\"hp\": 25130, \"atk\": 900}, \"7\": {\"hp\": 35180, \"atk\": 1260}, \"8\": {\"hp\": 47490, \"atk\": 1700}, \"9\": {\"hp\": 61740, \"atk\": 2210}}", "tier": "B"},
  {"name": "Goddess of War", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Shield Fortify", "abilityDesc": "Increase the amount of shield provided. [Co-op]: Increases own attack speed slightly after killing an enemy.", "level6Upgrade": "Charge Race Up (Passive): Reduce the energy required to charge skills. [Co-op]: Increases stun duration of skill.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": null, \"atk\": null}, \"2\": {\"hp\": null, \"atk\": null}, \"3\": {\"hp\": 17390, \"atk\": 290}, \"4\": {\"hp\": 25220, \"atk\": 420}, \"5\": {\"hp\": 35310, \"atk\": 590}, \"6\": {\"hp\": 49430, \"atk\": 830}, \"7\": {\"hp\": 69200, \"atk\": 1160}, \"8\": {\"hp\": 93420, \"atk\": 1570}, \"9\": {\"hp\": 121400, \"atk\": 2040}}", "tier": "B"},
  {"name": "Gryphon Knight", "rarity": "Mythic", "class": "Warrior", "attribute": "Wind", "weakness": "Wood", "placement": "Front Row", "damageType": "Area", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 3, "ability": "Tempest Call", "abilityDesc": "Deals area damage to enemies, applying knockback and slow. [Co-op]: Deals area damage to enemies and applies stun.", "level6Upgrade": "Thunder Smash (Passive): Increases skill stun duration. [Co-op]: Increases skill stun duration.", "level7Upgrade": "Lightning Fury (Passive): Increases skill damage. [Co-op]: Increases skill damage.", "stats": "{\"1\": {\"hp\": 7380, \"atk\": 162}, \"2\": {\"hp\": 11440, \"atk\": 250}, \"3\": {\"hp\": 17160, \"atk\": 380}, \"4\": {\"hp\": 24880, \"atk\": 550}, \"5\": {\"hp\": 34830, \"atk\": 770}, \"6\": {\"hp\": 48760, \"atk\": 1080}, \"7\": {\"hp\": 68260, \"atk\": 1510}, \"8\": {\"hp\": null, \"atk\": null}, \"9\": {\"hp\": null, \"atk\": null}}", "tier": "B"},
  {"name": "Jungle Ranger", "rarity": "Mythic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Arrowstorm", "abilityDesc": "Deals moderate damage to enemies in a small area.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4040, \"atk\": 288}, \"2\": {\"hp\": 6260, \"atk\": 450}, \"3\": {\"hp\": 9390, \"atk\": 680}, \"4\": {\"hp\": 13620, \"atk\": 990}, \"5\": {\"hp\": 19070, \"atk\": 1390}, \"6\": {\"hp\": 26700, \"atk\": 1950}, \"7\": {\"hp\": 37380, \"atk\": 2730}, \"8\": {\"hp\": 50460, \"atk\": 3690}, \"9\": {\"hp\": 65600, \"atk\": 4800}}", "tier": "B"},
  {"name": "Melody Weaver", "rarity": "Mythic", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 8, "ability": "Healing Melody", "abilityDesc": "Plays a song that continuously restores HP for all nearby friendly units.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3650, \"atk\": 185}, \"2\": {\"hp\": 5660, \"atk\": 280}, \"3\": {\"hp\": 8490, \"atk\": 430}, \"4\": {\"hp\": 12310, \"atk\": 620}, \"5\": {\"hp\": 17230, \"atk\": 870}, \"6\": {\"hp\": 24130, \"atk\": 1220}, \"7\": {\"hp\": 33780, \"atk\": 1710}}", "tier": "S"},
  {"name": "Mist Archer", "rarity": "Mythic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 1, "ability": "Misty Domain", "abilityDesc": "Deals area-of-effect damage over time and inflicts reduced attack speed and movement speed.", "level6Upgrade": "Endless Tide (Passive): The skill's duration is increased.", "level7Upgrade": "Binding Waters (Passive): The skill's slow effect is increased.", "stats": "{\"1\": {\"hp\": 3840, \"atk\": 298}, \"2\": {\"hp\": 5950, \"atk\": 460}, \"3\": {\"hp\": 8930, \"atk\": 690}, \"4\": {\"hp\": 12950, \"atk\": 1000}, \"5\": {\"hp\": 18130, \"atk\": 1400}, \"6\": {\"hp\": 25380, \"atk\": 1960}, \"7\": {\"hp\": 35530, \"atk\": 2740}, \"8\": {\"hp\": 47970, \"atk\": 3700}, \"9\": {\"hp\": 62360, \"atk\": 4810}}", "tier": "B"},
  {"name": "Night Scion", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Shadow Pounce", "abilityDesc": "Blinks to the lowest-HP Mage unit, dealing AoE damage.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 7850, \"atk\": 192}, \"2\": {\"hp\": 12170, \"atk\": 300}, \"3\": {\"hp\": 18260, \"atk\": 450}, \"4\": {\"hp\": 26480, \"atk\": 650}, \"5\": {\"hp\": 37070, \"atk\": 910}, \"6\": {\"hp\": 51900, \"atk\": 1270}, \"7\": {\"hp\": 72660, \"atk\": 1780}}", "tier": "B"},
  {"name": "Nine-Tailed Fox", "rarity": "Mythic", "class": "Assassin", "attribute": "Fire", "weakness": "Water", "placement": "Front", "damageType": "Single", "defense": "Low", "moveSpeed": "Very High", "atkSpeed": "High", "elixir": 8, "ability": "Fox Fire", "abilityDesc": "Releases several fireballs that target the nearest enemies, dealing high fire damage.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5120, \"atk\": 210}, \"2\": {\"hp\": 7940, \"atk\": 330}, \"3\": {\"hp\": 11900, \"atk\": 490}, \"4\": {\"hp\": 17260, \"atk\": 710}, \"5\": {\"hp\": 24160, \"atk\": 1000}, \"6\": {\"hp\": 33820, \"atk\": 1400}, \"7\": {\"hp\": 47350, \"atk\": 1960}}", "tier": "S"},
  {"name": "Radiant Warrior", "rarity": "Mythic", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Toughness", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Radiant Aegis", "abilityDesc": "At battle start, grant shields to nearby allies.", "level6Upgrade": "Eternal Radiance - Also increase allies' all-element resistance.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 9840, \"atk\": 144}, \"2\": {\"hp\": 15250, \"atk\": 220}, \"3\": {\"hp\": 22880, \"atk\": 330}, \"4\": {\"hp\": 33180, \"atk\": 480}, \"5\": {\"hp\": 46450, \"atk\": 670}, \"6\": {\"hp\": 65030, \"atk\": 940}, \"7\": {\"hp\": 91040, \"atk\": 1320}, \"8\": {\"hp\": 122900, \"atk\": 1780}, \"9\": {\"hp\": 159700, \"atk\": 2310}}", "tier": "B"},
  {"name": "Red Blade", "rarity": "Mythic", "class": "Warrior", "attribute": "Wind", "weakness": "Wood", "placement": "Back Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 3, "ability": "Blitz Bolt", "abilityDesc": "Prioritize targeting archers and mages, then teleport to their side to deal continuous area damage.", "level6Upgrade": "Damage Boost (Passive): Increase skill damage.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": null, \"atk\": null}, \"2\": {\"hp\": null, \"atk\": null}, \"3\": {\"hp\": 12470, \"atk\": 360}, \"4\": {\"hp\": 18080, \"atk\": 520}, \"5\": {\"hp\": 25310, \"atk\": 730}, \"6\": {\"hp\": 35430, \"atk\": 1020}, \"7\": {\"hp\": 49600, \"atk\": 1430}, \"8\": {\"hp\": 66960, \"atk\": 1930}, \"9\": {\"hp\": 87050, \"atk\": 2510}}", "tier": "B"},
  {"name": "Ripple Wizard", "rarity": "Mythic", "class": "Support", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Buff", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Aqua Revival", "abilityDesc": "Grants moderate energy to nearby allies in a large area.", "level6Upgrade": "Wave Nourishment (Passive): When skill is triggered, grants a small amount of bonus energy to allies in range.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4160, \"atk\": 282}, \"2\": {\"hp\": 6450, \"atk\": 440}, \"3\": {\"hp\": 9680, \"atk\": 660}, \"4\": {\"hp\": 14040, \"atk\": 960}, \"5\": {\"hp\": 19640, \"atk\": 1340}, \"6\": {\"hp\": 27520, \"atk\": 1880}, \"7\": {\"hp\": 38530, \"atk\": 2630}, \"8\": {\"hp\": 52020, \"atk\": 3550}, \"9\": {\"hp\": 67630, \"atk\": 4620}}", "tier": "B"},
  {"name": "Seraph", "rarity": "Mythic", "class": "Warrior", "attribute": "Fire", "weakness": "Water", "placement": "Front Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Judgment Blade", "abilityDesc": "Summon a sword array, causing large-scale damage.", "level6Upgrade": "Blade Aura - Increase skill damage.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 7480, \"atk\": 210}, \"2\": {\"hp\": 11590, \"atk\": 330}, \"3\": {\"hp\": 17390, \"atk\": 500}, \"4\": {\"hp\": 25220, \"atk\": 730}, \"5\": {\"hp\": 35310, \"atk\": 1020}, \"6\": {\"hp\": 49430, \"atk\": 1430}, \"7\": {\"hp\": 69200, \"atk\": 2000}, \"8\": {\"hp\": 93420, \"atk\": 2700}, \"9\": {\"hp\": 121400, \"atk\": 3510}}", "tier": "B"},
  {"name": "Starlight Apostle", "rarity": "Mythic", "class": "Support", "attribute": "Wind", "weakness": "Wood", "placement": "Mid Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Divine Grace", "abilityDesc": "The attack power bonus of the skill can be stacked up to 3 times. [Co-op]: Attacks have a 15% chance to grant nearby allies 30% attack power for 2 seconds, stacking up to 5 times.", "level6Upgrade": "Stellar Bind - Each attack has a chance to stun the target. [Co-op]: Recharges own energy at regular intervals.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4040, \"atk\": 268}, \"2\": {\"hp\": 6260, \"atk\": 420}, \"3\": {\"hp\": 9390, \"atk\": 630}, \"4\": {\"hp\": 13620, \"atk\": 910}, \"5\": {\"hp\": 19070, \"atk\": 1270}, \"6\": {\"hp\": 26700, \"atk\": 1780}, \"7\": {\"hp\": 37380, \"atk\": 2490}, \"8\": {\"hp\": 50460, \"atk\": 3360}, \"9\": {\"hp\": 65600, \"atk\": 4370}}", "tier": "B"},
  {"name": "Storm Maiden", "rarity": "Mythic", "class": "Mage", "attribute": "Wind", "weakness": "Wood", "placement": "Mid Row", "damageType": "Area", "defense": "Medium", "moveSpeed": "Low", "atkSpeed": "Low", "elixir": 8, "ability": "Storm Verdict", "abilityDesc": "Normal attacks deal bonus damage to low-health enemies. [Co-op]: Normal attacks deal bonus damage to low-health enemies.", "level6Upgrade": "Hurricane Force - Permanently grants a small attack bonus to self. [Co-op]: Permanently grants a small attack bonus to self.", "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 3080, \"atk\": 142}, \"2\": {\"hp\": 4770, \"atk\": 220}, \"3\": {\"hp\": 7160, \"atk\": 330}, \"4\": {\"hp\": 10380, \"atk\": 480}, \"5\": {\"hp\": 14530, \"atk\": 670}, \"6\": {\"hp\": 20340, \"atk\": 940}, \"7\": {\"hp\": 28480, \"atk\": 1320}, \"8\": {\"hp\": 38450, \"atk\": 1780}, \"9\": {\"hp\": 49990, \"atk\": 2310}}", "tier": "B"},
  {"name": "The Blade of Earth", "rarity": "Mythic", "class": "Tank", "attribute": "Earth", "weakness": "Wind", "placement": "Front Row", "damageType": "Toughness", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 8, "ability": "Earth Force", "abilityDesc": "Summon a rock shield to gain short-term damage reduction.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 8200, \"atk\": 120}, \"2\": {\"hp\": 12710, \"atk\": 190}, \"3\": {\"hp\": 19070, \"atk\": 290}, \"4\": {\"hp\": 27650, \"atk\": 420}, \"5\": {\"hp\": 38710, \"atk\": 590}, \"6\": {\"hp\": 54190, \"atk\": 830}, \"7\": {\"hp\": 75870, \"atk\": 1160}, \"8\": {\"hp\": 102400, \"atk\": 1570}, \"9\": {\"hp\": 133100, \"atk\": 2040}}", "tier": "B"},
  {"name": "The Knight King", "rarity": "Mythic", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front Row", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Power Infusion", "abilityDesc": "Deals high damage to the target.", "level6Upgrade": "Tempered Reforge (Passive): Each attack has a chance to deal high damage to the target.", "level7Upgrade": "Battle Hardened (Passive): Greatly increases own attack speed after killing an enemy.", "stats": "{\"1\": {\"hp\": 9840, \"atk\": 120}, \"2\": {\"hp\": 15250, \"atk\": 190}, \"3\": {\"hp\": 22880, \"atk\": 290}, \"4\": {\"hp\": 33180, \"atk\": 420}, \"5\": {\"hp\": 46450, \"atk\": 590}, \"6\": {\"hp\": 65030, \"atk\": 830}, \"7\": {\"hp\": 91040, \"atk\": 1160}, \"8\": {\"hp\": 122900, \"atk\": 1570}, \"9\": {\"hp\": 159700, \"atk\": 2040}}", "tier": "B"},
  {"name": "Tide Lord", "rarity": "Mythic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid Row", "damageType": "Control", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 8, "ability": "Vortex Eye", "abilityDesc": "Prioritize Mage and Archer units to deal moderate-amount continuous damage and apply a pull effect in a large area.", "level6Upgrade": "Tide Aura - Provide moderate attack speed increase for nearby allies.", "level7Upgrade": "Tidal Flow - Skill cooldown reduced.", "stats": "{\"1\": {\"hp\": 4040, \"atk\": 298}, \"2\": {\"hp\": null, \"atk\": null}, \"3\": {\"hp\": 9390, \"atk\": 690}, \"4\": {\"hp\": 13620, \"atk\": 1000}, \"5\": {\"hp\": 19070, \"atk\": 1400}, \"6\": {\"hp\": 26700, \"atk\": 1960}, \"7\": {\"hp\": 37380, \"atk\": 2740}, \"8\": {\"hp\": 50460, \"atk\": 3700}, \"9\": {\"hp\": 65600, \"atk\": 4810}}", "tier": "B"},
  {"name": "Venospore Killer", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Mid Row", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 2, "ability": "Piercing Blow", "abilityDesc": "Flash to the high-health mage first, causing heavy single target damage and silence. [Co-op]: Deals high damage to low HP enemies.", "level6Upgrade": "Spirit Drain (Passive): Increases own attack speed slightly after killing an enemy.", "level7Upgrade": "Relentless Pursuit (Passive): Stuns enemies in a small area for a long duration after killing an enemy.", "stats": "{\"1\": {\"hp\": null, \"atk\": null}, \"2\": {\"hp\": null, \"atk\": null}, \"3\": {\"hp\": 13400, \"atk\": 540}, \"4\": {\"hp\": 19430, \"atk\": 780}, \"5\": {\"hp\": 27200, \"atk\": 1090}, \"6\": {\"hp\": 38080, \"atk\": 1530}, \"7\": {\"hp\": 53310, \"atk\": 2140}, \"8\": {\"hp\": 71970, \"atk\": 2890}, \"9\": {\"hp\": 93560, \"atk\": 3760}}", "tier": "B"},
  {"name": "Woodland Guardian", "rarity": "Mythic", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front", "damageType": "Single", "defense": "Very High", "moveSpeed": "Low", "atkSpeed": "Low", "elixir": 10, "ability": "Iron Bark", "abilityDesc": "Greatly increases own defense and gains a shield for a moderate duration.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 8119, \"atk\": 115}, \"2\": {\"hp\": 12590, \"atk\": 180}, \"3\": {\"hp\": 18880, \"atk\": 270}, \"4\": {\"hp\": 27380, \"atk\": 390}, \"5\": {\"hp\": 38330, \"atk\": 550}, \"6\": {\"hp\": 53660, \"atk\": 770}, \"7\": {\"hp\": 75120, \"atk\": 1080}}", "tier": "S"}
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
      const user = storage.createUser(username.trim().toLowerCase(), passwordHash);
      const visitorId = getVisitorId(req);
      storage.createSession(visitorId, user.id);
      res.json({ user: { id: user.id, username: user.username } });
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
      res.json({ user: { id: user.id, username: user.username } });
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
    res.json({ user: { id: user.id, username: user.username } });
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
