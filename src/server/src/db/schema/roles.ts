import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { roleCategories } from "./role-categories.ts";
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
