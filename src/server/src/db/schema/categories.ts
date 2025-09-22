import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { servers } from "./servers.ts";

export const categories = pgTable("categories", {
	categoryId: serial("category_id").primaryKey(),
	serverId: text("server_id")
		.notNull()
		.references(() => servers.serverId, { onDelete: "cascade" }),
	name: varchar("name", { length: 100 }).notNull(),
});
