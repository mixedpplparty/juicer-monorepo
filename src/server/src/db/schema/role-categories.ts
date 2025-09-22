import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { servers } from "./servers.ts";

export const roleCategories = pgTable("role_categories", {
	roleCategoryId: serial("role_category_id").primaryKey(),
	serverId: text("server_id")
		.notNull()
		.references(() => servers.serverId),
	name: varchar("name", { length: 100 }).notNull(),
});
