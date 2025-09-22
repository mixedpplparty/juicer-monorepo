import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { categories } from "./categories.ts";
import { games } from "./games.ts";
import { roleCategories, roles } from "./roles.ts";
import { tags } from "./tags.ts";

export const servers = pgTable("servers", {
	serverId: text("server_id").notNull().primaryKey(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// server -> games, categories, tags, roles, role categories
export const serversRelations = relations(servers, ({ many }) => ({
	games: many(games),
	categories: many(categories),
	tags: many(tags),
	roles: many(roles),
	roleCategories: many(roleCategories),
}));
