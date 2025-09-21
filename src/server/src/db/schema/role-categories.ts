import { bigint, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { servers } from "./servers.js";

export const roleCategories = pgTable("role_categories", {
	roleCategoryId: serial("role_category_id").primaryKey(),
	serverId: bigint("server_id", { mode: "number" })
		.notNull()
		.references(() => servers.serverId),
	name: varchar("name", { length: 100 }).notNull(),
});
