import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const heroes = sqliteTable("heroes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(), // Mythic, Legendary, Epic, Rare, Common
  class: text("class").notNull(), // Warrior, Marksman, Mage, Support, etc.
  attribute: text("attribute").notNull(), // Physical, Fire, Water, Wood, Nature, etc.
  weakness: text("weakness"), // nullable
  placement: text("placement").notNull(), // Front, Mid, Back
  damageType: text("damage_type").notNull(), // Single, Area
  defense: text("defense").notNull(), // Low, Medium, High, Very High
  moveSpeed: text("move_speed").notNull(),
  atkSpeed: text("atk_speed"),
  elixir: integer("elixir").notNull(),
  ability: text("ability").notNull(),
  abilityDesc: text("ability_desc").notNull(),
  level6Upgrade: text("level6_upgrade"),
  level7Upgrade: text("level7_upgrade"),
  stats: text("stats").notNull(), // JSON string of {level: {hp, atk}}
  tier: text("tier").notNull(), // S, A, B, C, D
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const rosters = sqliteTable("rosters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  heroId: integer("hero_id").notNull().references(() => heroes.id),
  level: integer("level").notNull().default(1),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const lineups = sqliteTable("lineups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mode: text("mode").notNull(),
  formation: text("formation"),
  heroSelections: text("hero_selections").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
});

// Insert schemas
export const insertHeroSchema = createInsertSchema(heroes).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertRosterSchema = createInsertSchema(rosters).omit({ id: true }).extend({
  level: z.number().min(1).max(9),
});
export const insertLineupSchema = createInsertSchema(lineups).omit({ id: true });

// Types
export type Hero = typeof heroes.$inferSelect;
export type InsertHero = z.infer<typeof insertHeroSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Roster = typeof rosters.$inferSelect;
export type InsertRoster = z.infer<typeof insertRosterSchema>;
export type Lineup = typeof lineups.$inferSelect;
export type InsertLineup = z.infer<typeof insertLineupSchema>;

// Roster with hero data joined
export type RosterWithHero = Roster & { hero: Hero };
