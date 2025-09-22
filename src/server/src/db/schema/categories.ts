import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { games } from "./games.ts";
import { servers } from "./servers.ts";

export const categories = pgTable("categories", {
	categoryId: serial("category_id").primaryKey(),
	serverId: text("server_id")
		.notNull()
		.references(() => servers.serverId, { onDelete: "cascade" }),
	name: varchar("name", { length: 100 }).notNull(),
});

// categories -> server, games
export const categoriesRelations = relations(categories, ({ one, many }) => ({
	server: one(servers, {
		fields: [categories.serverId],
		references: [servers.serverId],
	}),
	games: many(games),
}));
