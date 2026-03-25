import {
  type Hero, type InsertHero, heroes,
  type User, users,
  type Session, sessions,
  type Roster, type InsertRoster, rosters,
  type Lineup, type InsertLineup, lineups,
  type RosterWithHero,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";

const dbPath = process.env.DATABASE_PATH || "data.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // Heroes
  getAllHeroes(): Hero[];
  getHeroById(id: number): Hero | undefined;
  getHeroesFiltered(filters: { rarity?: string; role?: string; position?: string; attribute?: string }): Hero[];
  insertHero(hero: InsertHero): Hero;
  getHeroCount(): number;

  // Users
  createUser(username: string, passwordHash: string): User;
  getUserByUsername(username: string): User | undefined;
  getUserById(id: number): User | undefined;

  // Sessions
  createSession(visitorId: string, userId: number): Session;
  getSessionByVisitorId(visitorId: string): Session | undefined;
  deleteSession(visitorId: string): void;

  // Roster
  getRoster(userId: number): RosterWithHero[];
  getRosterEntry(id: number): Roster | undefined;
  addToRoster(entry: InsertRoster): Roster;
  updateRosterEntry(id: number, mergeLevel: number, starLevel: number): Roster | undefined;
  removeFromRoster(id: number): void;
  isHeroInRoster(heroId: number, userId: number): boolean;

  // Lineups
  getLineups(userId: number): Lineup[];
  getLineupById(id: number): Lineup | undefined;
  saveLineup(lineup: InsertLineup): Lineup;
  deleteLineup(id: number): void;

  // Export/Import
  exportUserData(userId: number): { roster: RosterWithHero[]; lineups: Lineup[] };
  importUserData(userId: number, data: { roster: { heroId: number; mergeLevel: number; starLevel: number }[]; lineups: { name: string; mode: string; formation: string | null; heroSelections: string }[] }): void;
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

  // Users
  createUser(username: string, passwordHash: string): User {
    return db.insert(users).values({ username, passwordHash }).returning().get();
  }

  getUserByUsername(username: string): User | undefined {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  getUserById(id: number): User | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  // Sessions
  createSession(visitorId: string, userId: number): Session {
    // Upsert: delete existing session for this visitor, then insert
    db.delete(sessions).where(eq(sessions.visitorId, visitorId)).run();
    return db.insert(sessions).values({ visitorId, userId }).returning().get();
  }

  getSessionByVisitorId(visitorId: string): Session | undefined {
    return db.select().from(sessions).where(eq(sessions.visitorId, visitorId)).get();
  }

  deleteSession(visitorId: string): void {
    db.delete(sessions).where(eq(sessions.visitorId, visitorId)).run();
  }

  // Roster
  getRoster(userId: number): RosterWithHero[] {
    const rosterEntries = db.select().from(rosters).where(eq(rosters.userId, userId)).all();
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

  isHeroInRoster(heroId: number, userId: number): boolean {
    const entry = db.select().from(rosters).where(and(eq(rosters.heroId, heroId), eq(rosters.userId, userId))).get();
    return !!entry;
  }

  // Lineups
  getLineups(userId: number): Lineup[] {
    return db.select().from(lineups).where(eq(lineups.userId, userId)).all();
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

  // Export/Import
  exportUserData(userId: number): { roster: RosterWithHero[]; lineups: Lineup[] } {
    return {
      roster: this.getRoster(userId),
      lineups: this.getLineups(userId),
    };
  }

  importUserData(userId: number, data: { roster: { heroId: number; mergeLevel: number; starLevel: number }[]; lineups: { name: string; mode: string; formation: string | null; heroSelections: string }[] }): void {
    // Clear existing data for this user
    db.delete(rosters).where(eq(rosters.userId, userId)).run();
    db.delete(lineups).where(eq(lineups.userId, userId)).run();

    // Import roster
    for (const entry of data.roster) {
      db.insert(rosters).values({
        heroId: entry.heroId,
        mergeLevel: entry.mergeLevel,
        starLevel: entry.starLevel,
        userId,
      }).run();
    }

    // Import lineups
    for (const lineup of data.lineups) {
      db.insert(lineups).values({
        name: lineup.name,
        mode: lineup.mode,
        formation: lineup.formation,
        heroSelections: lineup.heroSelections,
        userId,
      }).run();
    }
  }
}

export const storage = new DatabaseStorage();
