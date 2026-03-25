import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRosterSchema, insertLineupSchema, type User } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Hero data to seed
const heroSeedData: any[] = [
  {"name": "Swordsman", "rarity": "Common", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 2, "ability": "Slash", "abilityDesc": "Each attack has a chance to deal moderate damage to nearby enemies within a medium range.", "level6Upgrade": null, "level7Upgrade": "Trigger Master (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":780,\"atk\":24},\"2\":{\"hp\":940,\"atk\":30},\"3\":{\"hp\":1130,\"atk\":40},\"4\":{\"hp\":1360,\"atk\":50},\"5\":{\"hp\":1630,\"atk\":60},\"6\":{\"hp\":1960,\"atk\":70},\"7\":{\"hp\":2550,\"atk\":90},\"8\":{\"hp\":3320,\"atk\":120},\"9\":{\"hp\":4320,\"atk\":160}}", "tier": "D"},
  {"name": "Archer", "rarity": "Common", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 2, "ability": "Split Arrow", "abilityDesc": "Each attack has a chance to fire multiple bullets.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":530,\"atk\":42},\"2\":{\"hp\":640,\"atk\":50},\"3\":{\"hp\":770,\"atk\":60},\"4\":{\"hp\":920,\"atk\":70},\"5\":{\"hp\":1100,\"atk\":80},\"6\":{\"hp\":1320,\"atk\":100},\"7\":{\"hp\":1720,\"atk\":130},\"8\":{\"hp\":2240,\"atk\":170},\"9\":{\"hp\":2910,\"atk\":220}}", "tier": "D"},
  {"name": "Gunner", "rarity": "Common", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Multishot Barrage", "abilityDesc": "Each attack has a chance to fire multiple bullets.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":620,\"atk\":30},\"2\":{\"hp\":740,\"atk\":40},\"3\":{\"hp\":890,\"atk\":50},\"4\":{\"hp\":1070,\"atk\":60},\"5\":{\"hp\":1280,\"atk\":70},\"6\":{\"hp\":1540,\"atk\":80},\"7\":{\"hp\":2000,\"atk\":100},\"8\":{\"hp\":2600,\"atk\":130},\"9\":{\"hp\":3380,\"atk\":170}}", "tier": "D"},
  {"name": "Demoman", "rarity": "Common", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Spark Burst", "abilityDesc": "Each attack has a chance to apply a brief stun.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":770,\"atk\":30},\"2\":{\"hp\":920,\"atk\":40},\"3\":{\"hp\":1100,\"atk\":50},\"4\":{\"hp\":1320,\"atk\":60},\"5\":{\"hp\":1580,\"atk\":70},\"6\":{\"hp\":1900,\"atk\":80},\"7\":{\"hp\":2470,\"atk\":100},\"8\":{\"hp\":3210,\"atk\":130},\"9\":{\"hp\":4170,\"atk\":170}}", "tier": "D"},
  {"name": "Snowball Thrower", "rarity": "Common", "class": "Support", "attribute": "Water", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Snowball Impact", "abilityDesc": "Each attack has a chance to apply moderate slow.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":610,\"atk\":34},\"2\":{\"hp\":730,\"atk\":40},\"3\":{\"hp\":880,\"atk\":50},\"4\":{\"hp\":1060,\"atk\":60},\"5\":{\"hp\":1270,\"atk\":70},\"6\":{\"hp\":1520,\"atk\":80},\"7\":{\"hp\":1980,\"atk\":100},\"8\":{\"hp\":2570,\"atk\":130},\"9\":{\"hp\":3340,\"atk\":170}}", "tier": "D"},
  {"name": "Woodshield Guard", "rarity": "Common", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 2, "ability": "Iron Hammer Strike", "abilityDesc": "Attack has a small chance to briefly stun a single enemy.", "level6Upgrade": null, "level7Upgrade": "Trigger Master (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":2020,\"atk\":98},\"2\":{\"hp\":2420,\"atk\":120},\"3\":{\"hp\":2900,\"atk\":140},\"4\":{\"hp\":3480,\"atk\":170},\"5\":{\"hp\":4180,\"atk\":200},\"6\":{\"hp\":5020,\"atk\":240},\"7\":{\"hp\":6530,\"atk\":310},\"8\":{\"hp\":8490,\"atk\":400},\"9\":{\"hp\":11040,\"atk\":520}}", "tier": "D"},
  {"name": "Forest Scout", "rarity": "Rare", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Cyclone Spin", "abilityDesc": "Each attack has a chance to fire multiple high-damage projectiles.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance for skill.", "stats": "{\"1\":{\"hp\":940,\"atk\":105},\"2\":{\"hp\":1130,\"atk\":130},\"3\":{\"hp\":1360,\"atk\":160},\"4\":{\"hp\":1630,\"atk\":190},\"5\":{\"hp\":1960,\"atk\":230},\"6\":{\"hp\":2350,\"atk\":280},\"7\":{\"hp\":3060,\"atk\":360},\"8\":{\"hp\":3980,\"atk\":470},\"9\":{\"hp\":5170,\"atk\":610}}", "tier": "C"},
  {"name": "Berserker", "rarity": "Rare", "class": "Warrior", "attribute": "Water", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Whirlwind Axe", "abilityDesc": "Each attack has a chance to deal minor damage in a small area and apply slow.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance for skill.", "stats": "{\"1\":{\"hp\":1220,\"atk\":40},\"2\":{\"hp\":1460,\"atk\":50},\"3\":{\"hp\":1750,\"atk\":60},\"4\":{\"hp\":2100,\"atk\":70},\"5\":{\"hp\":2520,\"atk\":80},\"6\":{\"hp\":3020,\"atk\":100},\"7\":{\"hp\":3390,\"atk\":130},\"8\":{\"hp\":5110,\"atk\":170},\"9\":{\"hp\":6640,\"atk\":220}}", "tier": "C"},
  {"name": "Goblin Warrior", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 3, "ability": "Battle Spirit Soars", "abilityDesc": "Each attack has a chance to grant an attack power bonus.", "level6Upgrade": null, "level7Upgrade": "Power Strike (Passive) \u2013 Enhanced effects from skill.", "stats": "{\"1\":{\"hp\":1440,\"atk\":60},\"2\":{\"hp\":1730,\"atk\":70},\"3\":{\"hp\":2080,\"atk\":80},\"4\":{\"hp\":2500,\"atk\":100},\"5\":{\"hp\":3000,\"atk\":120},\"6\":{\"hp\":3600,\"atk\":140},\"7\":{\"hp\":4680,\"atk\":180},\"8\":{\"hp\":6080,\"atk\":230},\"9\":{\"hp\":7900,\"atk\":300}}", "tier": "C"},
  {"name": "Flail Warden", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Shockwave Slam", "abilityDesc": "Each attack has a chance to deal moderate damage in a medium area.", "level6Upgrade": null, "level7Upgrade": "Trigger Master (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":1250,\"atk\":42},\"2\":{\"hp\":1500,\"atk\":50},\"3\":{\"hp\":1800,\"atk\":60},\"4\":{\"hp\":2160,\"atk\":70},\"5\":{\"hp\":2590,\"atk\":80},\"6\":{\"hp\":3110,\"atk\":100},\"7\":{\"hp\":4040,\"atk\":130},\"8\":{\"hp\":5250,\"atk\":170},\"9\":{\"hp\":6830,\"atk\":220}}", "tier": "C"},
  {"name": "Apprentice Mage", "rarity": "Rare", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Arcane Scatter", "abilityDesc": "Each attack has a chance to launch multiple magic orbs.", "level6Upgrade": null, "level7Upgrade": "Trigger Mastery (Passive) \u2013 Increased trigger chance for skill.", "stats": "{\"1\":{\"hp\":980,\"atk\":90},\"2\":{\"hp\":1180,\"atk\":110},\"3\":{\"hp\":1420,\"atk\":130},\"4\":{\"hp\":1700,\"atk\":160},\"5\":{\"hp\":2040,\"atk\":190},\"6\":{\"hp\":2450,\"atk\":230},\"7\":{\"hp\":3190,\"atk\":300},\"8\":{\"hp\":4150,\"atk\":390},\"9\":{\"hp\":5400,\"atk\":510}}", "tier": "C"},
  {"name": "Bomber", "rarity": "Rare", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Front", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Self-Destruct!", "abilityDesc": "Deal a medium-range damage upon death.", "level6Upgrade": null, "level7Upgrade": "Echoing Stun (Passive) \u2013 Explosion briefly stuns nearby enemy.", "stats": "{\"1\":{\"hp\":960,\"atk\":260},\"2\":{\"hp\":1300,\"atk\":350},\"3\":{\"hp\":1690,\"atk\":460},\"4\":{\"hp\":2110,\"atk\":580},\"5\":{\"hp\":2640,\"atk\":730},\"6\":{\"hp\":3300,\"atk\":910},\"7\":{\"hp\":4130,\"atk\":1140},\"8\":{\"hp\":5160,\"atk\":1430},\"9\":{\"hp\":6190,\"atk\":1720}}", "tier": "C"},
  {"name": "Gale Wolf", "rarity": "Rare", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Low", "moveSpeed": "High", "atkSpeed": "Medium", "elixir": 3, "ability": "Bloodlust", "abilityDesc": "Gain a temporary attack speed boost when at low health.", "level6Upgrade": null, "level7Upgrade": "Hunter's Instinct (Passive) \u2013 Extended duration of skill buffs.", "stats": "{\"1\":{\"hp\":1180,\"atk\":80},\"2\":{\"hp\":1420,\"atk\":100},\"3\":{\"hp\":1700,\"atk\":120},\"4\":{\"hp\":2040,\"atk\":140},\"5\":{\"hp\":2450,\"atk\":170},\"6\":{\"hp\":2940,\"atk\":200},\"7\":{\"hp\":3820,\"atk\":260},\"8\":{\"hp\":4970,\"atk\":340},\"9\":{\"hp\":6460,\"atk\":440}}", "tier": "C"},
  {"name": "Paladin", "rarity": "Rare", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Divine Shield Protection", "abilityDesc": "Generate a shield for self that absorbs a small amount of damage (10s cooldown).", "level6Upgrade": null, "level7Upgrade": "Shield Enhancement (Passive) \u2013 Increased shield absorption from skills.", "stats": "{\"1\":{\"hp\":1630,\"atk\":72},\"2\":{\"hp\":1960,\"atk\":90},\"3\":{\"hp\":2350,\"atk\":110},\"4\":{\"hp\":2820,\"atk\":130},\"5\":{\"hp\":3380,\"atk\":160},\"6\":{\"hp\":4059,\"atk\":190},\"7\":{\"hp\":5280,\"atk\":250},\"8\":{\"hp\":6860,\"atk\":330},\"9\":{\"hp\":8920,\"atk\":430}}", "tier": "C"},
  {"name": "Goblin Chef", "rarity": "Rare", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 4, "ability": "Ladle Smash", "abilityDesc": "Cause a small-area stun effect.", "level6Upgrade": null, "level7Upgrade": "Trigger Master (Passive) \u2013 Increased trigger chance of skill.", "stats": "{\"1\":{\"hp\":3560,\"atk\":188},\"2\":{\"hp\":5520,\"atk\":290},\"3\":{\"hp\":8280,\"atk\":440},\"4\":{\"hp\":12010,\"atk\":640},\"5\":{\"hp\":16800,\"atk\":900},\"6\":{\"hp\":23530,\"atk\":1260},\"7\":{\"hp\":32930,\"atk\":1760},\"8\":{\"hp\":44470,\"atk\":2380},\"9\":{\"hp\":57810,\"atk\":3090}}", "tier": "C"},
  {"name": "Goblin Shaman", "rarity": "Rare", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 3, "ability": "Arcane Regeneration", "abilityDesc": "Randomly restore a small amount of health to allies within a small area around self (10s cooldown).", "level6Upgrade": null, "level7Upgrade": "Healing Expansion (Passive) \u2013 Increased number of allies healed by the skill.", "stats": "{\"1\":{\"hp\":1150,\"atk\":102},\"2\":{\"hp\":1380,\"atk\":120},\"3\":{\"hp\":1660,\"atk\":140},\"4\":{\"hp\":1990,\"atk\":170},\"5\":{\"hp\":2390,\"atk\":200},\"6\":{\"hp\":2870,\"atk\":240},\"7\":{\"hp\":3730,\"atk\":310},\"8\":{\"hp\":4850,\"atk\":400},\"9\":{\"hp\":6310,\"atk\":520}}", "tier": "C"},
  {"name": "Cannon Chariot", "rarity": "Rare", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 3, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 1000, \"atk\": 60}, \"2\": {\"hp\": 1300, \"atk\": 78}, \"3\": {\"hp\": 1600, \"atk\": 96}, \"4\": {\"hp\": 1900, \"atk\": 114}, \"5\": {\"hp\": 2200, \"atk\": 132}, \"6\": {\"hp\": 2500, \"atk\": 150}, \"7\": {\"hp\": 2800, \"atk\": 168}, \"8\": {\"hp\": 3100, \"atk\": 186}, \"9\": {\"hp\": 3400, \"atk\": 204}}", "tier": "C"},
  {"name": "Pumpkin Guard", "rarity": "Epic", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Precision Strike", "abilityDesc": "Taunt enemies within a small area around self (Charge: Time 6s).", "level6Upgrade": "Quick Taunt (Passive) \u2013 Skill cooldown reduced.", "level7Upgrade": "Intimidate Boost (Passive) \u2013 The taunt range of the skill is increased.", "stats": "{\"1\":{\"hp\":5160,\"atk\":188},\"2\":{\"hp\":8000,\"atk\":290},\"3\":{\"hp\":12000,\"atk\":440},\"4\":{\"hp\":17390,\"atk\":640},\"5\":{\"hp\":24360,\"atk\":900},\"6\":{\"hp\":34090,\"atk\":1260},\"7\":{\"hp\":47740,\"atk\":1760},\"8\":{\"hp\":64440,\"atk\":2380},\"9\":{\"hp\":83790,\"atk\":3090}}", "tier": "B"},
  {"name": "Wooden Wizard", "rarity": "Epic", "class": "Support", "attribute": "Wood", "weakness": "Fire", "placement": "Mid", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 5, "ability": "Roots of Life", "abilityDesc": "Restore a moderate amount of health to all allies within a small area around self (Charge: Time 10s).", "level6Upgrade": "Heart of Nature (Passive) \u2013 The duration of healing skill is extended.", "level7Upgrade": "Zone Extension (Passive) \u2013 Skill range increased.", "stats": "{\"1\":{\"hp\":2360,\"atk\":220},\"2\":{\"hp\":3660,\"atk\":340},\"3\":{\"hp\":5490,\"atk\":510},\"4\":{\"hp\":7960,\"atk\":740},\"5\":{\"hp\":11140,\"atk\":1040},\"6\":{\"hp\":15600,\"atk\":1460},\"7\":{\"hp\":21840,\"atk\":2040},\"8\":{\"hp\":29470,\"atk\":2750},\"9\":{\"hp\":38310,\"atk\":3580}}", "tier": "B"},
  {"name": "Royal Archer", "rarity": "Epic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Precision Strike", "abilityDesc": "Apply a stackable attack speed buff to self (Charge: Time 4s).", "level6Upgrade": "Hunter's Instinct (Passive) \u2013 Inflicts bonus damage against Boss enemies.", "level7Upgrade": "Swift Arrow (Passive) \u2013 The number of stackable layers for the skill is increased.", "stats": "{\"1\":{\"hp\":1150,\"atk\":98},\"2\":{\"hp\":1380,\"atk\":120},\"3\":{\"hp\":1660,\"atk\":140},\"4\":{\"hp\":1990,\"atk\":170},\"5\":{\"hp\":2390,\"atk\":200},\"6\":{\"hp\":2870,\"atk\":240},\"7\":{\"hp\":3730,\"atk\":310},\"8\":{\"hp\":4850,\"atk\":400},\"9\":{\"hp\":6310,\"atk\":520}}", "tier": "B"},
  {"name": "Rock Thrower", "rarity": "Epic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2000, \"atk\": 120}, \"2\": {\"hp\": 2600, \"atk\": 156}, \"3\": {\"hp\": 3200, \"atk\": 192}, \"4\": {\"hp\": 3800, \"atk\": 228}, \"5\": {\"hp\": 4400, \"atk\": 264}, \"6\": {\"hp\": 5000, \"atk\": 300}, \"7\": {\"hp\": 5600, \"atk\": 336}, \"8\": {\"hp\": 6200, \"atk\": 372}, \"9\": {\"hp\": 6800, \"atk\": 408}}", "tier": "B"},
  {"name": "Poison Master", "rarity": "Epic", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2000, \"atk\": 120}, \"2\": {\"hp\": 2600, \"atk\": 156}, \"3\": {\"hp\": 3200, \"atk\": 192}, \"4\": {\"hp\": 3800, \"atk\": 228}, \"5\": {\"hp\": 4400, \"atk\": 264}, \"6\": {\"hp\": 5000, \"atk\": 300}, \"7\": {\"hp\": 5600, \"atk\": 336}, \"8\": {\"hp\": 6200, \"atk\": 372}, \"9\": {\"hp\": 6800, \"atk\": 408}}", "tier": "B"},
  {"name": "Oracle", "rarity": "Epic", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Mid", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2000, \"atk\": 120}, \"2\": {\"hp\": 2600, \"atk\": 156}, \"3\": {\"hp\": 3200, \"atk\": 192}, \"4\": {\"hp\": 3800, \"atk\": 228}, \"5\": {\"hp\": 4400, \"atk\": 264}, \"6\": {\"hp\": 5000, \"atk\": 300}, \"7\": {\"hp\": 5600, \"atk\": 336}, \"8\": {\"hp\": 6200, \"atk\": 372}, \"9\": {\"hp\": 6800, \"atk\": 408}}", "tier": "B"},
  {"name": "Snowman Warrior", "rarity": "Epic", "class": "Tank", "attribute": "Water", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2000, \"atk\": 120}, \"2\": {\"hp\": 2600, \"atk\": 156}, \"3\": {\"hp\": 3200, \"atk\": 192}, \"4\": {\"hp\": 3800, \"atk\": 228}, \"5\": {\"hp\": 4400, \"atk\": 264}, \"6\": {\"hp\": 5000, \"atk\": 300}, \"7\": {\"hp\": 5600, \"atk\": 336}, \"8\": {\"hp\": 6200, \"atk\": 372}, \"9\": {\"hp\": 6800, \"atk\": 408}}", "tier": "B"},
  {"name": "Flame Mage", "rarity": "Epic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2000, \"atk\": 120}, \"2\": {\"hp\": 2600, \"atk\": 156}, \"3\": {\"hp\": 3200, \"atk\": 192}, \"4\": {\"hp\": 3800, \"atk\": 228}, \"5\": {\"hp\": 4400, \"atk\": 264}, \"6\": {\"hp\": 5000, \"atk\": 300}, \"7\": {\"hp\": 5600, \"atk\": 336}, \"8\": {\"hp\": 6200, \"atk\": 372}, \"9\": {\"hp\": 6800, \"atk\": 408}}", "tier": "B"},
  {"name": "Dwarf Berserker", "rarity": "Epic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 6, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 2000, \"atk\": 120}, \"2\": {\"hp\": 2600, \"atk\": 156}, \"3\": {\"hp\": 3200, \"atk\": 192}, \"4\": {\"hp\": 3800, \"atk\": 228}, \"5\": {\"hp\": 4400, \"atk\": 264}, \"6\": {\"hp\": 5000, \"atk\": 300}, \"7\": {\"hp\": 5600, \"atk\": 336}, \"8\": {\"hp\": 6200, \"atk\": 372}, \"9\": {\"hp\": 6800, \"atk\": 408}}", "tier": "B"},
  {"name": "Ursa Champion", "rarity": "Legendary", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Elven Archer", "rarity": "Legendary", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Sakura Ronin", "rarity": "Legendary", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Ghost Assassin", "rarity": "Legendary", "class": "Assassin", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Wind Apostle", "rarity": "Legendary", "class": "Support", "attribute": "Wind", "weakness": null, "placement": "Mid", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Ashen Arcanist", "rarity": "Legendary", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Blast Dwarf", "rarity": "Legendary", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Great Axe Warrior", "rarity": "Legendary", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Windlord", "rarity": "Legendary", "class": "Support", "attribute": "Wind", "weakness": null, "placement": "Mid", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Ironguard", "rarity": "Legendary", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 4000, \"atk\": 180}, \"2\": {\"hp\": 5200, \"atk\": 234}, \"3\": {\"hp\": 6400, \"atk\": 288}, \"4\": {\"hp\": 7600, \"atk\": 342}, \"5\": {\"hp\": 8800, \"atk\": 396}, \"6\": {\"hp\": 10000, \"atk\": 450}, \"7\": {\"hp\": 11200, \"atk\": 503}, \"8\": {\"hp\": 12400, \"atk\": 558}, \"9\": {\"hp\": 13600, \"atk\": 612}}", "tier": "A"},
  {"name": "Gryphon Knight", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Geomancer", "rarity": "Mythic", "class": "Mage", "attribute": "Earth", "weakness": null, "placement": "Mid", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "The Knight King", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "King's Decree", "abilityDesc": "Inspires nearby allies, increasing their attack and defense for a moderate duration.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":7820,\"atk\":132},\"2\":{\"hp\":12120,\"atk\":200},\"3\":{\"hp\":18180,\"atk\":310},\"4\":{\"hp\":26360,\"atk\":450},\"5\":{\"hp\":36910,\"atk\":630},\"6\":{\"hp\":51670,\"atk\":880},\"7\":{\"hp\":72340,\"atk\":1230}}", "tier": "S"},
  {"name": "Frost Queen", "rarity": "Mythic", "class": "Mage", "attribute": "Frost", "weakness": "Fire", "placement": "Mid", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 9, "ability": "Eternal Winter", "abilityDesc": "Summons a blizzard that deals continuous frost damage and slows enemies in a large area.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":3820,\"atk\":240},\"2\":{\"hp\":5920,\"atk\":370},\"3\":{\"hp\":8880,\"atk\":560},\"4\":{\"hp\":12880,\"atk\":810},\"5\":{\"hp\":18030,\"atk\":1130},\"6\":{\"hp\":25240,\"atk\":1580},\"7\":{\"hp\":35340,\"atk\":2210}}", "tier": "S"},
  {"name": "Storm Maiden", "rarity": "Mythic", "class": "Mage", "attribute": "Wind", "weakness": null, "placement": "Mid", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Starlight Apostle", "rarity": "Mythic", "class": "Support", "attribute": "Holy", "weakness": null, "placement": "Mid", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Stellar Canticle", "abilityDesc": "Grants moderate attack bonus to nearby allied units in a large area.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Nine-Tailed Fox", "rarity": "Mythic", "class": "Assassin", "attribute": "Fire", "weakness": "Water", "placement": "Front", "damageType": "Single", "defense": "Low", "moveSpeed": "Very High", "atkSpeed": "High", "elixir": 8, "ability": "Fox Fire", "abilityDesc": "Releases several fireballs that target the nearest enemies, dealing high fire damage.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":5120,\"atk\":210},\"2\":{\"hp\":7940,\"atk\":330},\"3\":{\"hp\":11900,\"atk\":490},\"4\":{\"hp\":17260,\"atk\":710},\"5\":{\"hp\":24160,\"atk\":1000},\"6\":{\"hp\":33820,\"atk\":1400},\"7\":{\"hp\":47350,\"atk\":1960}}", "tier": "S"},
  {"name": "Fury Cannoneer", "rarity": "Mythic", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Mist Archer", "rarity": "Mythic", "class": "Marksman", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Area", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 7, "ability": "Mist Volley", "abilityDesc": "Fires a barrage of arrows at a target area, slowing enemies.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":3520,\"atk\":234},\"2\":{\"hp\":5460,\"atk\":360},\"3\":{\"hp\":8189,\"atk\":540},\"4\":{\"hp\":11870,\"atk\":780},\"5\":{\"hp\":16620,\"atk\":1090},\"6\":{\"hp\":23270,\"atk\":1530},\"7\":{\"hp\":32580,\"atk\":2140}}", "tier": "S"},
  {"name": "Jungle Ranger", "rarity": "Mythic", "class": "Marksman", "attribute": "Wood", "weakness": "Fire", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 7, "ability": "Nature's Bind", "abilityDesc": "Roots the nearest 3 enemies for 3 seconds and deals moderate wood damage.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":3800,\"atk\":215},\"2\":{\"hp\":5890,\"atk\":330},\"3\":{\"hp\":8840,\"atk\":500},\"4\":{\"hp\":12820,\"atk\":720},\"5\":{\"hp\":17950,\"atk\":1010},\"6\":{\"hp\":25130,\"atk\":1410},\"7\":{\"hp\":35180,\"atk\":1970}}", "tier": "S"},
  {"name": "Flame Duelist", "rarity": "Mythic", "class": "Warrior", "attribute": "Fire", "weakness": "Water", "placement": "Front", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Scorching Slash", "abilityDesc": "Deals high amount of single-targeted damage to a particular target.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Venospore Killer", "rarity": "Mythic", "class": "Assassin", "attribute": "Wood", "weakness": "Fire", "placement": "Front", "damageType": "Single", "defense": "Low", "moveSpeed": "High", "atkSpeed": "High", "elixir": 8, "ability": "Venomous Strike", "abilityDesc": "Blinks to the enemy with the lowest HP and deals high physical damage.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":5250,\"atk\":200},\"2\":{\"hp\":8140,\"atk\":310},\"3\":{\"hp\":12210,\"atk\":460},\"4\":{\"hp\":17700,\"atk\":670},\"5\":{\"hp\":24780,\"atk\":940},\"6\":{\"hp\":34690,\"atk\":1320},\"7\":{\"hp\":48570,\"atk\":1850}}", "tier": "S"},
  {"name": "Tide Lord", "rarity": "Mythic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Low", "elixir": 10, "ability": "Vortex Eye", "abilityDesc": "Prioritizes Mage and Archer units to deal moderate-amount continuous damage and apply a pull effect in a large area (Charge: 10s).", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":4040,\"atk\":298},\"2\":{\"hp\":6260,\"atk\":460},\"3\":{\"hp\":9390,\"atk\":690},\"4\":{\"hp\":13620,\"atk\":1000},\"5\":{\"hp\":19070,\"atk\":1400},\"6\":{\"hp\":26700,\"atk\":1960},\"7\":{\"hp\":37380,\"atk\":2740}}", "tier": "S"},
  {"name": "Blazeking", "rarity": "Mythic", "class": "Mage", "attribute": "Fire", "weakness": "Water", "placement": "Mid", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Eternal Blaze", "abilityDesc": "Deals a high amount of continuous damage in a large area.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Blazewing Lord", "rarity": "Mythic", "class": "Warrior", "attribute": "Fire", "weakness": "Water", "placement": "Front", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Melody Weaver", "rarity": "Mythic", "class": "Support", "attribute": "Physical", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Low", "moveSpeed": "Medium", "atkSpeed": "High", "elixir": 8, "ability": "Healing Melody", "abilityDesc": "Plays a song that continuously restores HP for all nearby friendly units.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":3650,\"atk\":185},\"2\":{\"hp\":5660,\"atk\":280},\"3\":{\"hp\":8490,\"atk\":430},\"4\":{\"hp\":12310,\"atk\":620},\"5\":{\"hp\":17230,\"atk\":870},\"6\":{\"hp\":24130,\"atk\":1220},\"7\":{\"hp\":33780,\"atk\":1710}}", "tier": "S"},
  {"name": "Ripple Wizard", "rarity": "Mythic", "class": "Mage", "attribute": "Water", "weakness": "Earth", "placement": "Mid", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 9, "ability": "Tidal Wave", "abilityDesc": "Summons a large wave that pushes back enemies and deals water damage.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":3920,\"atk\":254},\"2\":{\"hp\":6080,\"atk\":390},\"3\":{\"hp\":9120,\"atk\":590},\"4\":{\"hp\":13220,\"atk\":860},\"5\":{\"hp\":18510,\"atk\":1200},\"6\":{\"hp\":25910,\"atk\":1680},\"7\":{\"hp\":36270,\"atk\":2350}}", "tier": "S"},
  {"name": "Radiant Warrior", "rarity": "Mythic", "class": "Warrior", "attribute": "Holy", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Radiant Strike", "abilityDesc": "Deals a heavy holy blow to the target and nearby enemies, reducing their defense.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":7220,\"atk\":145},\"2\":{\"hp\":11190,\"atk\":220},\"3\":{\"hp\":16790,\"atk\":340},\"4\":{\"hp\":24340,\"atk\":490},\"5\":{\"hp\":34080,\"atk\":690},\"6\":{\"hp\":47710,\"atk\":970},\"7\":{\"hp\":66800,\"atk\":1350}}", "tier": "S"},
  {"name": "Darkmoon Queen", "rarity": "Mythic", "class": "Assassin", "attribute": "Shadow", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Dark Moon Barrier", "abilityDesc": "Prioritizes a dark moon barrier at the Archer and Mage positions, dealing minor damage and preventing the use of attacks and skills.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Firepower Vanguard", "rarity": "Mythic", "class": "Marksman", "attribute": "Fire", "weakness": "Water", "placement": "Back", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Woodland Guardian", "rarity": "Mythic", "class": "Tank", "attribute": "Wood", "weakness": "Fire", "placement": "Front", "damageType": "Single", "defense": "Very High", "moveSpeed": "Low", "atkSpeed": "Low", "elixir": 10, "ability": "Iron Bark", "abilityDesc": "Greatly increases own defense and gains a shield for a moderate duration.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":8119,\"atk\":115},\"2\":{\"hp\":12590,\"atk\":180},\"3\":{\"hp\":18880,\"atk\":270},\"4\":{\"hp\":27380,\"atk\":390},\"5\":{\"hp\":38330,\"atk\":550},\"6\":{\"hp\":53660,\"atk\":770},\"7\":{\"hp\":75120,\"atk\":1080}}", "tier": "S"},
  {"name": "Night Scion", "rarity": "Mythic", "class": "Warrior", "attribute": "Shadow", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "The Blade of Earth", "rarity": "Mythic", "class": "Warrior", "attribute": "Earth", "weakness": null, "placement": "Front", "damageType": "Area", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Seraph", "rarity": "Mythic", "class": "Support", "attribute": "Holy", "weakness": null, "placement": "Mid", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Bone Marksman", "rarity": "Mythic", "class": "Marksman", "attribute": "Shadow", "weakness": null, "placement": "Back", "damageType": "Single", "defense": "Medium", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Unknown", "abilityDesc": "Ability data pending.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\": {\"hp\": 5000, \"atk\": 200}, \"2\": {\"hp\": 6500, \"atk\": 260}, \"3\": {\"hp\": 8000, \"atk\": 320}, \"4\": {\"hp\": 9500, \"atk\": 380}, \"5\": {\"hp\": 11000, \"atk\": 440}, \"6\": {\"hp\": 12500, \"atk\": 500}, \"7\": {\"hp\": 14000, \"atk\": 560}, \"8\": {\"hp\": 15500, \"atk\": 620}, \"9\": {\"hp\": 17000, \"atk\": 680}}", "tier": "S"},
  {"name": "Barbarian Tyrant", "rarity": "Mythic", "class": "Tank", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Tyrant's Taunt", "abilityDesc": "Leap towards enemy archers and mages, providing yourself with physical defense and taunting surrounding enemies (Charge: 6s).", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":7640,\"atk\":128},\"2\":{\"hp\":11840,\"atk\":200},\"3\":{\"hp\":17760,\"atk\":300},\"4\":{\"hp\":25750,\"atk\":440},\"5\":{\"hp\":36050,\"atk\":620},\"6\":{\"hp\":50470,\"atk\":870},\"7\":{\"hp\":70660,\"atk\":1220}}", "tier": "S"},
  {"name": "Goddess of War", "rarity": "Mythic", "class": "Warrior", "attribute": "Physical", "weakness": null, "placement": "Front", "damageType": "Single", "defense": "High", "moveSpeed": "Medium", "atkSpeed": "Medium", "elixir": 8, "ability": "Vanguard Shield", "abilityDesc": "Jump to the friendly warrior with the lowest health and provide a shield.", "level6Upgrade": null, "level7Upgrade": null, "stats": "{\"1\":{\"hp\":7480,\"atk\":124},\"2\":{\"hp\":11590,\"atk\":190},\"3\":{\"hp\":17390,\"atk\":290},\"4\":{\"hp\":25220,\"atk\":420},\"5\":{\"hp\":35310,\"atk\":590},\"6\":{\"hp\":49430,\"atk\":830},\"7\":{\"hp\":69200,\"atk\":1160}}", "tier": "S"}
]
;

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

  // POST /api/auth/register
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

  // POST /api/auth/login
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

  // POST /api/auth/logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const visitorId = getVisitorId(req);
    storage.deleteSession(visitorId);
    res.json({ success: true });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: { id: user.id, username: user.username } });
  });

  // --- Hero Routes (public) ---

  // GET /api/heroes - list all heroes with optional filters
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

  // GET /api/heroes/:id
  app.get("/api/heroes/:id", (req, res) => {
    const hero = storage.getHeroById(Number(req.params.id));
    if (!hero) return res.status(404).json({ message: "Hero not found" });
    res.json(hero);
  });

  // --- Protected Routes (require auth) ---

  // GET /api/roster - get user's roster
  app.get("/api/roster", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const roster = storage.getRoster(user.id);
    res.json(roster);
  });

  // POST /api/roster - add hero to roster (duplicates allowed)
  app.post("/api/roster", (req, res) => {
    try {
      const user = getUserFromRequest(req);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const { heroId, level } = req.body;

      // Check if hero exists
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

  // PATCH /api/roster/:id - update level
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

  // DELETE /api/roster/:id
  app.delete("/api/roster/:id", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const id = Number(req.params.id);
    storage.removeFromRoster(id);
    res.json({ success: true });
  });

  // GET /api/lineups
  app.get("/api/lineups", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const result = storage.getLineups(user.id);
    res.json(result);
  });

  // POST /api/lineups
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

  // DELETE /api/lineups/:id
  app.delete("/api/lineups/:id", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const id = Number(req.params.id);
    storage.deleteLineup(id);
    res.json({ success: true });
  });

  // GET /api/export - export user's data
  app.get("/api/export", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const data = storage.exportUserData(user.id);
    res.json(data);
  });

  // POST /api/import - import user's data
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

  // POST /api/optimize
  app.post("/api/optimize", (req, res) => {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    const { mode, formation, enemyFormation, enemyHeroIds } = req.body;
    const roster = storage.getRoster(user.id);
    const allHeroes = storage.getAllHeroes();

    if (roster.length === 0) {
      return res.status(400).json({ message: "Add heroes to your roster first" });
    }

    const result = optimizeLineup(roster, allHeroes, mode, formation, enemyFormation, enemyHeroIds);
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
  const tierScore: Record<string, number> = {
    S: 10, A: 8, B: 6, C: 4, D: 2
  };

  // Score each hero in roster
  const scoredHeroes = roster.map(entry => {
    const hero = entry.hero;
    let score = 0;

    // Level is the most important factor — power from stats
    const power = getHeroPower(hero.stats, entry.level);
    score += power / 100;

    // Level bonus
    score += entry.level * 10;

    // Tier bonus
    score += (tierScore[hero.tier] || 2) * 2;

    // Mode-specific bonuses
    switch (mode) {
      case "Arena":
        if (formation === "Backstab" && hero.name === "Bomber") score += 20;
        if (formation === "Dash" && hero.name === "Oracle") score += 20;
        if (formation === "Dash" && hero.class === "Support") score += 5;
        if (hero.class === "Tank") score += 3;
        break;
      case "Co-op":
        if (hero.class === "Marksman" || hero.class === "Mage" || hero.class === "Assassin") score += 8;
        if (hero.class === "Support") score += 10;
        if (hero.name === "Oracle") score += 15;
        if (hero.name === "Starlight Apostle") score += 10;
        if (hero.name === "Goddess of War") score += 10;
        break;
      case "Infinity War":
        if (hero.class === "Support") score += 10;
        if (hero.class === "Tank") score += 8;
        if (hero.name === "Seraph") score += 15;
        if (hero.name === "Wooden Wizard") score += 10;
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

  // First pass: ensure role balance
  const bestTank = scoredHeroes.find(h => h.hero.class === "Tank" && h.hero.placement === "Front");
  if (bestTank && totalElixir + bestTank.hero.elixir <= ELIXIR_BUDGET) {
    selected.push(bestTank);
    totalElixir += bestTank.hero.elixir;
  }

  const bestSupport = scoredHeroes.find(h => h.hero.class === "Support" && !selected.includes(h));
  if (bestSupport && totalElixir + bestSupport.hero.elixir <= ELIXIR_BUDGET) {
    selected.push(bestSupport);
    totalElixir += bestSupport.hero.elixir;
  }

  // Fill remaining with top scored heroes
  for (const hero of scoredHeroes) {
    if (selected.length >= 12) break;
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

  // Build placement (assign to rows based on placement)
  const placements: Record<string, any[]> = { Front: [], Mid: [], Back: [] };
  for (const entry of selected) {
    const pos = entry.hero.placement;
    if (placements[pos]) {
      placements[pos].push(entry);
    }
  }

  // Generate reasoning
  const reasoning = selected.map(entry => {
    const reasons: string[] = [];
    if (entry.level >= 7) reasons.push("High level (" + entry.level + ")");
    if (entry.hero.tier === "S") reasons.push("S-tier hero");
    if (entry.hero.tier === "A") reasons.push("A-tier hero");
    if (mode === "Co-op" && entry.hero.name === "Oracle") reasons.push("Oracle's aura is essential for Co-op");
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

  // Calculate total power from stats
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
