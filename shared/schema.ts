import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const heroes = sqliteTable("heroes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  rarity: text("rarity").notNull(), // Mythic, Legendary, Epic, Rare, Common
  position: text("position").notNull(), // Front, Mid, Back
  role: text("role").notNull(), // Tank, DPS, Support, Control
  attribute: text("attribute").notNull(), // Physical, Fire, Water, Wood, Nature, etc.
  elixir: integer("elixir").notNull(),
  ability: text("ability").notNull(),
  abilityDesc: text("ability_desc").notNull(),
  tier: text("tier").notNull(), // S, A, B, C, D
});

export const rosters = sqliteTable("rosters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  heroId: integer("hero_id").notNull().references(() => heroes.id),
  mergeLevel: integer("merge_level").notNull().default(1),
  starLevel: integer("star_level").notNull().default(1),
});

export const lineups = sqliteTable("lineups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mode: text("mode").notNull(), // Arena, Co-op, Adventure, Infinity War, Clan Hunt
  formation: text("formation"), // Dash, Backstab, Outflank, Split (for Arena)
  heroSelections: text("hero_selections").notNull(), // JSON string of placement data
});

// Insert schemas
export const insertHeroSchema = createInsertSchema(heroes).omit({ id: true });
export const insertRosterSchema = createInsertSchema(rosters).omit({ id: true }).extend({
  mergeLevel: z.number().min(1).max(15),
  starLevel: z.number().min(1).max(5),
});
export const insertLineupSchema = createInsertSchema(lineups).omit({ id: true });

// Types
export type Hero = typeof heroes.$inferSelect;
export type InsertHero = z.infer<typeof insertHeroSchema>;
export type Roster = typeof rosters.$inferSelect;
export type InsertRoster = z.infer<typeof insertRosterSchema>;
export type Lineup = typeof lineups.$inferSelect;
export type InsertLineup = z.infer<typeof insertLineupSchema>;

// Roster with hero data joined
export type RosterWithHero = Roster & { hero: Hero };
