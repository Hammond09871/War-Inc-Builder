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

// Check if schema migration is needed (old schema had 'role' column, new has 'class')
try {
  const heroesInfo = sqlite.prepare("PRAGMA table_info(heroes)").all() as any[];
  const hasOldSchema = heroesInfo.some((col: any) => col.name === 'role');
  const hasNewSchema = heroesInfo.some((col: any) => col.name === 'class');
  
  if (heroesInfo.length > 0 && hasOldSchema && !hasNewSchema) {
    console.log("Detected old schema, migrating database...");
    sqlite.exec(`
      DROP TABLE IF EXISTS lineups;
      DROP TABLE IF EXISTS rosters;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS heroes;
    `);
    console.log("Old tables dropped, will recreate with new schema.");
  }
} catch (e) {
  console.log("Schema check skipped (fresh database)");
}

// Create tables if they don't exist (replaces drizzle-kit push for production)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS heroes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    rarity TEXT NOT NULL,
    class TEXT NOT NULL,
    attribute TEXT NOT NULL,
    weakness TEXT,
    placement TEXT NOT NULL,
    damage_type TEXT NOT NULL,
    defense TEXT NOT NULL,
    move_speed TEXT NOT NULL,
    atk_speed TEXT,
    elixir INTEGER NOT NULL,
    ability TEXT NOT NULL,
    ability_desc TEXT NOT NULL,
    level6_upgrade TEXT,
    level7_upgrade TEXT,
    stats TEXT NOT NULL,
    tier TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS rosters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hero_id INTEGER NOT NULL REFERENCES heroes(id),
    level INTEGER NOT NULL DEFAULT 1,
    user_id INTEGER NOT NULL REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS lineups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mode TEXT NOT NULL,
    formation TEXT,
    hero_selections TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id)
  );
`);

export const db = drizzle(sqlite);

export interface IStorage {
  // Heroes
  getAllHeroes(): Hero[];
  getHeroById(id: number): Hero | undefined;
  getHeroesFiltered(filters: { rarity?: string; class?: string; placement?: string; attribute?: string }): Hero[];
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
  updateRosterLevel(id: number, level: number): Roster | undefined;
  removeFromRoster(id: number): void;

  // Lineups
  getLineups(userId: number): Lineup[];
  getLineupById(id: number): Lineup | undefined;
  saveLineup(lineup: InsertLineup): Lineup;
  deleteLineup(id: number): void;

  // Export/Import
  exportUserData(userId: number): { roster: RosterWithHero[]; lineups: Lineup[] };
  importUserData(userId: number, data: { roster: { heroId: number; level: number }[]; lineups: { name: string; mode: string; formation: string | null; heroSelections: string }[] }): void;
}

export class DatabaseStorage implements IStorage {
  // Heroes
  getAllHeroes(): Hero[] {
    return db.select().from(heroes).all();
  }

  getHeroById(id: number): Hero | undefined {
    return db.select().from(heroes).where(eq(heroes.id, id)).get();
  }

  getHeroesFiltered(filters: { rarity?: string; class?: string; placement?: string; attribute?: string }): Hero[] {
    let query = db.select().from(heroes);
    const conditions: any[] = [];

    if (filters.rarity) conditions.push(eq(heroes.rarity, filters.rarity));
    if (filters.class) conditions.push(eq(heroes.class, filters.class));
    if (filters.placement) conditions.push(eq(heroes.placement, filters.placement));
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

  updateRosterLevel(id: number, level: number): Roster | undefined {
    return db.update(rosters)
      .set({ level })
      .where(eq(rosters.id, id))
      .returning()
      .get();
  }

  removeFromRoster(id: number): void {
    db.delete(rosters).where(eq(rosters.id, id)).run();
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

  importUserData(userId: number, data: { roster: { heroId: number; level: number }[]; lineups: { name: string; mode: string; formation: string | null; heroSelections: string }[] }): void {
    db.delete(rosters).where(eq(rosters.userId, userId)).run();
    db.delete(lineups).where(eq(lineups.userId, userId)).run();

    for (const entry of data.roster) {
      db.insert(rosters).values({
        heroId: entry.heroId,
        level: entry.level,
        userId,
      }).run();
    }

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
