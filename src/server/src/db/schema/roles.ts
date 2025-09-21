import { bigint, integer, pgTable } from "drizzle-orm/pg-core";
import { roleCategories } from "./role-categories.ts";
import { servers } from "./servers.ts";

export const roles = pgTable("roles", {
	roleId: bigint("role_id", { mode: "number" }).notNull().primaryKey(),
	serverId: bigint("server_id", { mode: "number" })
		.notNull()
		.references(() => servers.serverId, { onDelete: "cascade" }),
	roleCategoryId: integer("role_category_id").references(
		() => roleCategories.roleCategoryId,
		{ onDelete: "set null" },
	),
});
