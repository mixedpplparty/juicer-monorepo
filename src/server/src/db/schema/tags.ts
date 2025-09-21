import { bigint, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { servers } from "./servers.js";

export const tags = pgTable("tags", {
	tagId: serial("tag_id").primaryKey(),
	serverId: bigint("server_id", { mode: "number" })
		.notNull()
		.references(() => servers.serverId, { onDelete: "cascade" }),
	name: varchar("name", { length: 50 }).notNull(),
});
