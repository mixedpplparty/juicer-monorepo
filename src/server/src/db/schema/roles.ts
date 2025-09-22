import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { gamesRoles } from "./games.ts";
import { servers } from "./servers.ts";

export const roles = pgTable("roles", {
	roleId: text("role_id").notNull().primaryKey(),
	serverId: text("server_id")
		.notNull()
		.references(() => servers.serverId, { onDelete: "cascade" }),
	roleCategoryId: integer("role_category_id").references(
		() => roleCategories.roleCategoryId,
		{ onDelete: "set null" },
	),
});

// Category for roles. One role can have one category.
export const roleCategories = pgTable("roles_categories", {
	roleCategoryId: serial("role_category_id").primaryKey(),
	serverId: text("server_id")
		.notNull()
		.references(() => servers.serverId),
	name: varchar("name", { length: 100 }).notNull(),
});

// roles -> server, role category, games
export const rolesRelations = relations(roles, ({ one, many }) => ({
	server: one(servers, {
		fields: [roles.serverId],
		references: [servers.serverId],
	}),
	roleCategory: one(roleCategories, {
		fields: [roles.roleCategoryId],
		references: [roleCategories.roleCategoryId],
	}),
	gamesRoles: many(gamesRoles),
}));

// role categories -> server, roles
export const roleCategoriesRelations = relations(
	roleCategories,
	({ one, many }) => ({
		server: one(servers, {
			fields: [roleCategories.serverId],
			references: [servers.serverId],
		}),
		roles: many(roles),
	}),
);
