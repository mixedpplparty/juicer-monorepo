import { bigint, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { servers } from "./servers.ts";

export const categories = pgTable("categories", {
	categoryId: serial("category_id").primaryKey(),
	serverId: bigint("server_id", { mode: "number" })
		.notNull()
		.references(() => servers.serverId, { onDelete: "cascade" }),
	name: varchar("name", { length: 100 }).notNull(),
});
