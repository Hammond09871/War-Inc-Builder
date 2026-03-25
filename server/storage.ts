import {
  type Hero, type InsertHero, heroes,
  type Roster, type InsertRoster, rosters,
  type Lineup, type InsertLineup, lineups,
  type RosterWithHero,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, like } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Heroes
  getAllHeroes(): Hero[];
  getHeroById(id: number): Hero | undefined;
  getHeroesFiltered(filters: { rarity?: string; role?: string; position?: string; attribute?: string }): Hero[];
  insertHero(hero: InsertHero): Hero;
  getHeroCount(): number;

  // Roster
  getRoster(): RosterWithHero[];
  getRosterEntry(id: number): Roster | undefined;
  addToRoster(entry: InsertRoster): Roster;
  updateRosterEntry(id: number, mergeLevel: number, starLevel: number): Roster | undefined;
  removeFromRoster(id: number): void;
  isHeroInRoster(heroId: number): boolean;

  // Lineups
  getLineups(): Lineup[];
  getLineupById(id: number): Lineup | undefined;
  saveLineup(lineup: InsertLineup): Lineup;
  deleteLineup(id: number): void;
}

export class DatabaseStorage implements IStorage {
  // Heroes
  getAllHeroes(): Hero[] {
    return db.select().from(heroes).all();
  }

  getHeroById(id: number): Hero | undefined {
    return db.select().from(heroes).where(eq(heroes.id, id)).get();
  }

  getHeroesFiltered(filters: { rarity?: string; role?: string; position?: string; attribute?: string }): Hero[] {
    let query = db.select().from(heroes);
    const conditions: any[] = [];

    if (filters.rarity) conditions.push(eq(heroes.rarity, filters.rarity));
    if (filters.role) conditions.push(eq(heroes.role, filters.role));
    if (filters.position) conditions.push(eq(heroes.position, filters.position));
    if (filters.attribute) conditions.push(eq(heroes.attribute, filters.attribute));

    if (conditions.length > 0) {
      return query.where(and(...conditions)).all();
    }
    return query.all();
  }

  insertHero(hero: InsertHero): Hero {
    return db.insert(heroes).values(hero).returning().get();
  }

  getHeroCount(): number {
    const result = db.select().from(heroes).all();
    return result.length;
  }

  // Roster
  getRoster(): RosterWithHero[] {
    const rosterEntries = db.select().from(rosters).all();
    return rosterEntries.map((entry) => {
      const hero = db.select().from(heroes).where(eq(heroes.id, entry.heroId)).get();
      return { ...entry, hero: hero! };
    }).filter(e => e.hero);
  }

  getRosterEntry(id: number): Roster | undefined {
    return db.select().from(rosters).where(eq(rosters.id, id)).get();
  }

  addToRoster(entry: InsertRoster): Roster {
    return db.insert(rosters).values(entry).returning().get();
  }

  updateRosterEntry(id: number, mergeLevel: number, starLevel: number): Roster | undefined {
    return db.update(rosters)
      .set({ mergeLevel, starLevel })
      .where(eq(rosters.id, id))
      .returning()
      .get();
  }

  removeFromRoster(id: number): void {
    db.delete(rosters).where(eq(rosters.id, id)).run();
  }

  isHeroInRoster(heroId: number): boolean {
    const entry = db.select().from(rosters).where(eq(rosters.heroId, heroId)).get();
    return !!entry;
  }

  // Lineups
  getLineups(): Lineup[] {
    return db.select().from(lineups).all();
  }

  getLineupById(id: number): Lineup | undefined {
    return db.select().from(lineups).where(eq(lineups.id, id)).get();
  }

  saveLineup(lineup: InsertLineup): Lineup {
    return db.insert(lineups).values(lineup).returning().get();
  }

  deleteLineup(id: number): void {
    db.delete(lineups).where(eq(lineups.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
