import { relations, sql } from "drizzle-orm";
import {
	check,
	customType,
	integer,
	pgTable,
	primaryKey,
	serial,
	text,
	varchar,
} from "drizzle-orm/pg-core";
import { categories } from "./categories.js";
import { roles } from "./roles.js";
import { servers } from "./servers.js";
import { tags } from "./tags.js";

const bytea = customType<{
	data: Buffer;
	default: false;
}>({
	dataType() {
		return "bytea";
	},
});

// channels are embedded in the games table, no relations required as channel info is in the Discord API
export const games = pgTable(
	"games",
	{
		gameId: serial("game_id").primaryKey(),
		serverId: text("server_id")
			.notNull()
			.references(() => servers.serverId, { onDelete: "cascade" }),
		categoryId: integer("category_id").references(() => categories.categoryId, {
			onDelete: "set null",
		}),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		thumbnail: bytea("thumbnail"),
		channels: text("channels").array(),
	},
	(table) => [
		check("thumbnail_size", sql`octet_length(${table.thumbnail}) <= 1048576`),
	],
);

// Junction table for games(many) - roles(many)
export const gamesRoles = pgTable(
	"games_roles",
	{
		gameId: integer("game_id")
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		roleId: text("role_id")
			.notNull()
			.references(() => roles.roleId, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.roleId] })],
);

// Junction table for games(many) - tags(many)
export const gamesTags = pgTable(
	"games_tags",
	{
		gameId: integer("game_id")
			.notNull()
			.references(() => games.gameId, { onDelete: "cascade" }),
		tagId: integer("tag_id")
			.notNull()
			.references(() => tags.tagId, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.gameId, table.tagId] })],
);

// Relations for games table
export const gamesRelations = relations(games, ({ one, many }) => ({
	server: one(servers, {
		fields: [games.serverId],
		references: [servers.serverId],
	}),
	category: one(categories, {
		fields: [games.categoryId],
		references: [categories.categoryId],
	}),
	gamesRoles: many(gamesRoles),
	gamesTags: many(gamesTags),
}));

// one game - many roles
export const gamesRolesRelations = relations(gamesRoles, ({ one, many }) => ({
	game: one(games, {
		fields: [gamesRoles.gameId],
		references: [games.gameId],
	}),
	roles: many(roles),
}));

// one game - many tags
export const gamesTagsRelations = relations(gamesTags, ({ one, many }) => ({
	game: one(games, {
		fields: [gamesTags.gameId],
		references: [games.gameId],
	}),
	tags: many(tags),
}));
