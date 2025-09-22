import { relations } from "drizzle-orm";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { gamesTags } from "./games.ts";
import { servers } from "./servers.ts";

export const tags = pgTable("tags", {
	tagId: serial("tag_id").primaryKey(),
	serverId: text("server_id")
		.notNull()
		.references(() => servers.serverId, { onDelete: "cascade" }),
	name: varchar("name", { length: 50 }).notNull(),
});

// tags -> games
export const tagsRelations = relations(tags, ({ one, many }) => ({
	server: one(servers, {
		fields: [tags.serverId],
		references: [servers.serverId],
	}),
	gamesTags: many(gamesTags),
}));
